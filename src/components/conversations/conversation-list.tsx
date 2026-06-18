"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Bot, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConversationItem {
  id: string;
  status: string;
  lastMessageAt: Date | null;
  contact: { name: string | null; phone: string; type: string };
  assignedTo: { name: string } | null;
  messages: { content: string }[];
}

const statusIcon: Record<string, React.ElementType> = {
  BOT_ACTIVE: Bot,
  HUMAN_ACTIVE: User,
  WAITING: Clock,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ConversationList({
  conversations,
  isLoading,
  selectedId,
  onSelect,
}: {
  conversations: ConversationItem[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.contact.name?.toLowerCase().includes(q) ||
      c.contact.phone.includes(q)
    );
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 p-1">
            {filtered.map((conv) => {
              const name = conv.contact.name ?? conv.contact.phone;
              const StatusIcon = statusIcon[conv.status] ?? Bot;
              const lastMsg = conv.messages[0]?.content;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-accent",
                    selectedId === conv.id && "bg-accent"
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <StatusIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </div>
                    {lastMsg && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {lastMsg}
                      </p>
                    )}
                    {conv.lastMessageAt && (
                      <p className="mt-0.5 text-xs text-muted-foreground/60">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    )}
                  </div>
                  {conv.contact.type === "LEAD" && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      Lead
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
