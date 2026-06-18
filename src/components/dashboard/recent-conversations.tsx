"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  contactType: string;
  status: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
}

const statusLabels: Record<string, string> = {
  BOT_ACTIVE: "IA",
  HUMAN_ACTIVE: "Humano",
  WAITING: "Aguardando",
  CLOSED: "Fechada",
};

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  BOT_ACTIVE: "default",
  HUMAN_ACTIVE: "secondary",
  WAITING: "outline",
  CLOSED: "outline",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function RecentConversations({
  conversations,
  isLoading,
}: {
  conversations: Conversation[];
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversas Recentes</CardTitle>
        <CardDescription>Últimas interações via WhatsApp</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma conversa ainda.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Conecte o WhatsApp para começar a receber mensagens.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <div key={conv.id} className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">
                    {getInitials(conv.contactName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {conv.contactName}
                    </p>
                    <Badge variant={statusColors[conv.status] ?? "outline"}>
                      {statusLabels[conv.status] ?? conv.status}
                    </Badge>
                  </div>
                  {conv.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {conv.lastMessage}
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
