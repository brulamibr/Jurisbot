"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Users, Flame, Briefcase } from "lucide-react";

interface StatCardsProps {
  activeConversations: number;
  leadsToday: number;
  hotLeads: number;
  activeProcesses: number;
  isLoading?: boolean;
}

const stats = [
  {
    key: "activeConversations" as const,
    title: "Conversas Ativas",
    description: "Atendimentos em andamento",
    icon: MessageSquare,
  },
  {
    key: "leadsToday" as const,
    title: "Leads Hoje",
    description: "Novos contatos captados",
    icon: Users,
  },
  {
    key: "hotLeads" as const,
    title: "Leads Quentes",
    description: "Prontos para conversão",
    icon: Flame,
    iconClass: "text-warning",
  },
  {
    key: "activeProcesses" as const,
    title: "Processos Ativos",
    description: "Em acompanhamento",
    icon: Briefcase,
  },
];

export function StatCards({
  activeConversations,
  leadsToday,
  hotLeads,
  activeProcesses,
  isLoading,
}: StatCardsProps) {
  const values = { activeConversations, leadsToday, hotLeads, activeProcesses };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon
              className={`h-4 w-4 ${stat.iconClass ?? "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{values[stat.key]}</div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
