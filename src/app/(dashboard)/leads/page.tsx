"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Snowflake,
  ThermometerSun,
  Flame,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
  Tag,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const columns = [
  {
    score: "COLD" as const,
    label: "Frio",
    icon: Snowflake,
    color: "text-blue-500",
    borderColor: "border-t-blue-500",
  },
  {
    score: "WARM" as const,
    label: "Morno",
    icon: ThermometerSun,
    color: "text-amber-500",
    borderColor: "border-t-amber-500",
  },
  {
    score: "HOT" as const,
    label: "Quente",
    icon: Flame,
    color: "text-red-500",
    borderColor: "border-t-red-500",
  },
  {
    score: "CONVERTED" as const,
    label: "Convertido",
    icon: CheckCircle2,
    color: "text-green-500",
    borderColor: "border-t-green-500",
  },
] as const;

type Score = (typeof columns)[number]["score"];

interface LeadContact {
  name: string | null;
  phone: string;
  email: string | null;
  conversations: { id: string; lastMessageAt: Date | null; status: string }[];
}

interface LeadListItem {
  id: string;
  score: string;
  legalArea: string | null;
  problem: string | null;
  urgency: string | null;
  origin: string | null;
  income: string | null;
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  contact: LeadContact;
}

interface LeadDetailData extends Omit<LeadListItem, "contact"> {
  contact: Omit<LeadContact, "conversations"> & {
    conversations: {
      id: string;
      lastMessageAt: Date | null;
      status: string;
      messages: { content: string }[];
    }[];
  };
}

const urgencyLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  LOW: { label: "Baixa", variant: "secondary" },
  MEDIUM: { label: "Média", variant: "outline" },
  HIGH: { label: "Alta", variant: "default" },
  CRITICAL: { label: "Crítica", variant: "destructive" },
};

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const leadsQuery = trpc.lead.list.useQuery(search ? { search } : undefined);
  const statsQuery = trpc.lead.stats.useQuery();
  const selectedLead = trpc.lead.getById.useQuery(
    { id: selectedLeadId! },
    { enabled: !!selectedLeadId }
  );
  const updateScore = trpc.lead.updateScore.useMutation({
    onSuccess: () => {
      leadsQuery.refetch();
      statsQuery.refetch();
      if (selectedLeadId) selectedLead.refetch();
    },
  });

  const leads = (leadsQuery.data ?? []) as unknown as LeadListItem[];

  function getLeadsByScore(score: string) {
    return leads.filter((l) => l.score === score);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {statsQuery.data
              ? `${statsQuery.data.total} leads | ${statsQuery.data.hot} quentes`
              : "Carregando..."}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => {
          const colLeads = getLeadsByScore(col.score);
          const Icon = col.icon;

          return (
            <div key={col.score} className="flex flex-col">
              <Card className={cn("border-t-2", col.borderColor)}>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", col.color)} />
                      {col.label}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {colLeads.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-2">
                  {leadsQuery.isLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-md" />
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[calc(100vh-16rem)]">
                      <div className="space-y-2 p-1">
                        {colLeads.length === 0 ? (
                          <p className="py-8 text-center text-xs text-muted-foreground">
                            Nenhum lead
                          </p>
                        ) : (
                          colLeads.map((lead) => (
                            <LeadCard
                              key={lead.id}
                              lead={lead}
                              colScore={col.score}
                              onSelect={() => setSelectedLeadId(lead.id)}
                              onUpdateScore={(score) =>
                                updateScore.mutate({ id: lead.id, score })
                              }
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <Sheet
        open={!!selectedLeadId}
        onOpenChange={(open) => !open && setSelectedLeadId(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalhes do Lead</SheetTitle>
          </SheetHeader>
          {selectedLead.data && (
            <LeadDetailPanel
              lead={selectedLead.data as unknown as LeadDetailData}
              onUpdateScore={(score) =>
                updateScore.mutate({ id: selectedLead.data!.id, score })
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function LeadCard({
  lead,
  colScore,
  onSelect,
  onUpdateScore,
}: {
  lead: LeadListItem;
  colScore: Score;
  onSelect: () => void;
  onUpdateScore: (score: Score) => void;
}) {
  const name = lead.contact.name ?? lead.contact.phone;
  const lastConv = lead.contact.conversations?.[0];
  const colIdx = columns.findIndex((c) => c.score === colScore);

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-md border bg-card p-3 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium">{name}</p>
        {lead.urgency && urgencyLabels[lead.urgency] && (
          <Badge
            variant={urgencyLabels[lead.urgency].variant}
            className="text-xs"
          >
            {urgencyLabels[lead.urgency].label}
          </Badge>
        )}
      </div>

      {lead.legalArea && (
        <p className="mt-1 text-xs text-muted-foreground">{lead.legalArea}</p>
      )}

      {lead.problem && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {lead.problem}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {lead.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-1.5 py-0 text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
        {lastConv?.lastMessageAt && (
          <span className="text-xs text-muted-foreground/60">
            {formatDistanceToNow(new Date(lastConv.lastMessageAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        )}
      </div>

      <div className="mt-2 flex justify-between">
        {colIdx > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateScore(columns[colIdx - 1].score);
            }}
          >
            ← Resfriar
          </Button>
        ) : (
          <span />
        )}
        {colIdx < columns.length - 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateScore(columns[colIdx + 1].score);
            }}
          >
            Aquecer →
          </Button>
        )}
      </div>
    </div>
  );
}

function LeadDetailPanel({
  lead,
  onUpdateScore,
}: {
  lead: LeadDetailData;
  onUpdateScore: (score: Score) => void;
}) {
  const name = lead.contact.name ?? lead.contact.phone;

  return (
    <div className="mt-4 space-y-6">
      <div className="space-y-2">
        <h4 className="text-xs font-medium uppercase text-muted-foreground">
          Contato
        </h4>
        <p className="text-lg font-semibold">{name}</p>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          {lead.contact.phone}
        </div>
        {lead.contact.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {lead.contact.email}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium uppercase text-muted-foreground">
          Temperatura
        </h4>
        <div className="flex gap-2">
          {columns.map((col) => {
            const Icon = col.icon;
            const isActive = lead.score === col.score;
            return (
              <Button
                key={col.score}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onUpdateScore(col.score)}
                className="flex-1"
              >
                <Icon
                  className={cn("mr-1 h-3.5 w-3.5", !isActive && col.color)}
                />
                {col.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium uppercase text-muted-foreground">
          Qualificação
        </h4>
        {lead.legalArea && (
          <div className="text-sm">
            <span className="text-muted-foreground">Área: </span>
            {lead.legalArea}
          </div>
        )}
        {lead.problem && (
          <div className="text-sm">
            <span className="text-muted-foreground">Problema: </span>
            {lead.problem}
          </div>
        )}
        {lead.urgency && urgencyLabels[lead.urgency] && (
          <div className="text-sm">
            <span className="text-muted-foreground">Urgência: </span>
            <Badge
              variant={urgencyLabels[lead.urgency].variant}
              className="text-xs"
            >
              {urgencyLabels[lead.urgency].label}
            </Badge>
          </div>
        )}
        {lead.origin && (
          <div className="text-sm">
            <span className="text-muted-foreground">Origem: </span>
            {lead.origin}
          </div>
        )}
        {lead.income && (
          <div className="text-sm">
            <span className="text-muted-foreground">Renda: </span>
            {lead.income}
          </div>
        )}
        {lead.tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {lead.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {lead.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notas: </span>
            {lead.notes}
          </div>
        )}
      </div>

      {lead.contact.conversations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">
            <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
            Conversas recentes
          </h4>
          {lead.contact.conversations.map((conv) => (
            <div key={conv.id} className="rounded-md border p-2 text-sm">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {conv.status === "BOT_ACTIVE"
                    ? "IA"
                    : conv.status === "HUMAN_ACTIVE"
                      ? "Humano"
                      : conv.status}
                </Badge>
                {conv.lastMessageAt && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(conv.lastMessageAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                )}
              </div>
              {conv.messages[0] && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {conv.messages[0].content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p>
          Criado:{" "}
          {formatDistanceToNow(new Date(lead.createdAt), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
        <p>
          Atualizado:{" "}
          {formatDistanceToNow(new Date(lead.updatedAt), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>
    </div>
  );
}
