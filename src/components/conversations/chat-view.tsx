"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Bot,
  Hand,
  RotateCcw,
  Send,
  PanelRight,
  User,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: string;
  content: string;
  createdAt: Date;
  aiModel: string | null;
  sentByUser: { name: string } | null;
}

interface Conversation {
  id: string;
  status: string;
  humanTakeoverAt: Date | null;
  contact: { name: string | null; phone: string; type: string };
  assignedTo: { name: string } | null;
  whatsappInstance: { name: string; status: string };
}

const statusLabels: Record<string, string> = {
  BOT_ACTIVE: "IA ativa",
  HUMAN_ACTIVE: "Atendimento humano",
  WAITING: "Aguardando",
  CLOSED: "Fechada",
};

export function ChatView({
  conversation,
  messages,
  isLoading,
  onBack,
  onToggleContactPanel,
  onRefresh,
}: {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  onBack: () => void;
  onToggleContactPanel: () => void;
  onRefresh: () => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const takeOver = trpc.conversation.takeOver.useMutation({
    onSuccess: onRefresh,
  });
  const returnToBot = trpc.conversation.returnToBot.useMutation({
    onSuccess: onRefresh,
  });
  const closeConv = trpc.conversation.close.useMutation({
    onSuccess: onRefresh,
  });
  const sendMsg = trpc.conversation.sendMessage.useMutation({
    onSuccess: () => {
      setInput("");
      onRefresh();
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  const contactName = conversation.contact.name ?? conversation.contact.phone;
  const canSend = conversation.status === "HUMAN_ACTIVE";

  function handleSend() {
    if (!input.trim() || !conversation) return;
    sendMsg.mutate({
      conversationId: conversation.id,
      content: input.trim(),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-sm font-medium">{contactName}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {statusLabels[conversation.status]}
              </Badge>
              {conversation.assignedTo && (
                <span className="text-xs text-muted-foreground">
                  {conversation.assignedTo.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {conversation.status === "BOT_ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => takeOver.mutate({ conversationId: conversation.id })}
              disabled={takeOver.isPending}
            >
              <Hand className="mr-1 h-3.5 w-3.5" />
              Assumir
            </Button>
          )}
          {conversation.status === "HUMAN_ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                returnToBot.mutate({ conversationId: conversation.id })
              }
              disabled={returnToBot.isPending}
            >
              <Bot className="mr-1 h-3.5 w-3.5" />
              Devolver à IA
            </Button>
          )}
          {conversation.status !== "CLOSED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                closeConv.mutate({ conversationId: conversation.id })
              }
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Fechar
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onToggleContactPanel}>
            <PanelRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn("flex", i % 2 === 0 ? "justify-end" : "")}
              >
                <Skeleton className="h-16 w-64 rounded-lg" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem ainda
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isContact = msg.sender === "CONTACT";
              const isBot = msg.sender === "BOT";

              return (
                <div
                  key={msg.id}
                  className={cn("flex", !isContact ? "justify-end" : "")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2",
                      isContact
                        ? "bg-muted"
                        : isBot
                          ? "bg-primary/10 text-foreground"
                          : "bg-primary text-primary-foreground"
                    )}
                  >
                    {(isBot || msg.sender === "USER") && (
                      <div className="mb-1 flex items-center gap-1">
                        {isBot ? (
                          <Bot className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        <span className="text-xs opacity-70">
                          {isBot
                            ? `IA${msg.aiModel ? ` (${msg.aiModel})` : ""}`
                            : msg.sentByUser?.name ?? "Atendente"}
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-right text-xs",
                        isContact
                          ? "text-muted-foreground/60"
                          : "opacity-60"
                      )}
                    >
                      {format(new Date(msg.createdAt), "HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      {conversation.status !== "CLOSED" && (
        <div className="border-t p-3">
          {canSend ? (
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="min-h-[2.5rem] max-h-32 resize-none"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sendMsg.isPending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-md bg-muted px-3 py-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                IA está respondendo. Clique em &quot;Assumir&quot; para intervir.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
