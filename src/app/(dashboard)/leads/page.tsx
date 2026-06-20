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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Snowflake,
  ThermometerSun,
  Flame,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Clock,
  Tag,
  MessageSquare,
  Circle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatPhone } from "@/lib/utils";

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
  {
    score: "LOST" as const,
    label: "Perdido",
    icon: XCircle,
    color: "text-zinc-400",
    borderColor: "border-t-zinc-400",
  },
] as const;

type Score = (typeof columns)[number]["score"];

interface LeadContact {
  name: string | null;
  phone: string;
  email: string | null;
  conversations: { id: string; lastMessageAt: Date | null; status: string }[];
}

interface LeadLabelItem {
  label: { id: string; name: string; color: string };
}

interface LeadListItem {
  id: string;
  score: string;
  funnelStageId: string | null;
  legalArea: string | null;
  problem: string | null;
  urgency: string | null;
  origin: string | null;
  income: string | null;
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  labels: LeadLabelItem[];
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
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");

  const funnelsQuery = trpc.funnel.list.useQuery();
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
  const moveToStage = trpc.funnel.moveLeadToStage.useMutation({
    onSuccess: () => {
      leadsQuery.refetch();
      if (selectedLeadId) selectedLead.refetch();
    },
  });

  const funnels = funnelsQuery.data ?? [];
  const activeFunnel = funnels.find((f) => f.id === selectedFunnelId) ?? funnels[0];
  const isDefaultFunnel = !activeFunnel || activeFunnel.isDefault;

  const leads = (leadsQuery.data ?? []) as unknown as LeadListItem[];

  function getLeadsByScore(score: string) {
    return leads.filter((l) => l.score === score);
  }

  function getLeadsByStage(stageId: string) {
    return leads.filter((l) => l.funnelStageId === stageId);
  }

  const activeStages = activeFunnel?.stages ?? [];
  const gridCols = activeStages.length <= 4 ? "lg:grid-cols-4" :
    activeStages.length === 5 ? "lg:grid-cols-5" :
    activeStages.length === 6 ? "lg:grid-cols-6" : "lg:grid-cols-5";

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
        <div className="flex items-center gap-3">
          {funnels.length > 1 && (
            <Select
              value={selectedFunnelId || activeFunnel?.id || ""}
              onValueChange={(v) => v && setSelectedFunnelId(v)}
            >
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue placeholder="Funil..." />
              </SelectTrigger>
              <SelectContent>
                {funnels.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} {f.isDefault ? "(padrão)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isDefaultFunnel ? (
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${gridCols}`}>
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
      ) : (
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${gridCols}`}>
        {activeStages.map((stage, idx) => {
          const stageLeads = getLeadsByStage(stage.id);
          return (
            <div key={stage.id} className="flex flex-col">
              <Card className="border-t-2" style={{ borderTopColor: stage.color }}>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4" style={{ color: stage.color }} fill={stage.color} />
                      {stage.name}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stageLeads.length}
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
                        {stageLeads.length === 0 ? (
                          <p className="py-8 text-center text-xs text-muted-foreground">
                            Nenhum lead
                          </p>
                        ) : (
                          stageLeads.map((lead) => (
                            <div
                              key={lead.id}
                              onClick={() => setSelectedLeadId(lead.id)}
                              className="cursor-pointer rounded-md border bg-card p-3 transition-shadow hover:shadow-md"
                            >
                              <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                  {lead.contact.name && (
                                    <p className="text-sm font-medium truncate">{lead.contact.name}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3 shrink-0" />
                                    {formatPhone(lead.contact.phone)}
                                  </p>
                                </div>
                              </div>
                              {lead.legalArea && (
                                <p className="mt-1 text-xs text-muted-foreground">{lead.legalArea}</p>
                              )}
                              <div className="mt-2 flex items-center gap-1 flex-wrap">
                                {lead.labels?.slice(0, 3).map(({ label }) => (
                                  <span
                                    key={label.id}
                                    className="inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium text-white"
                                    style={{ backgroundColor: label.color }}
                                  >
                                    {label.name}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-2 flex justify-between">
                                {idx > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveToStage.mutate({ leadId: lead.id, stageId: activeStages[idx - 1].id });
                                    }}
                                  >
                                    ←
                                  </Button>
                                )}
                                {idx < activeStages.length - 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs ml-auto"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveToStage.mutate({ leadId: lead.id, stageId: activeStages[idx + 1].id });
                                    }}
                                  >
                                    →
                                  </Button>
                                )}
                              </div>
                            </div>
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
      )}

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
              onRefresh={() => {
                leadsQuery.refetch();
                selectedLead.refetch();
              }}
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
  const lastConv = lead.contact.conversations?.[0];
  const colIdx = columns.findIndex((c) => c.score === colScore);

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-md border bg-card p-3 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          {lead.contact.name && (
            <p className="text-sm font-medium truncate">{lead.contact.name}</p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0" />
            {formatPhone(lead.contact.phone)}
          </p>
        </div>
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
        <div className="flex items-center gap-1 flex-wrap">
          {lead.labels?.slice(0, 3).map(({ label }) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
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
        {colScore === "LOST" ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateScore("COLD");
              }}
            >
              ↺ Reativar
            </Button>
            <span />
          </>
        ) : (
          <>
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
            <div className="flex gap-1">
              {colScore !== "CONVERTED" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateScore("LOST");
                  }}
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Perder
                </Button>
              )}
              {colScore !== "CONVERTED" && (
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
          </>
        )}
      </div>
    </div>
  );
}

function LeadDetailPanel({
  lead,
  onUpdateScore,
  onRefresh,
}: {
  lead: LeadDetailData;
  onUpdateScore: (score: Score) => void;
  onRefresh: () => void;
}) {
  const name = lead.contact.name ?? formatPhone(lead.contact.phone);
  const allLabels = trpc.label.list.useQuery();
  const assignLabel = trpc.label.assignToLead.useMutation({ onSuccess: onRefresh });
  const removeLabel = trpc.label.removeFromLead.useMutation({ onSuccess: onRefresh });

  const assignedIds = new Set(lead.labels?.map((l) => l.label.id) ?? []);
  const availableLabels = (allLabels.data ?? []).filter((l) => !assignedIds.has(l.id));

  return (
    <div className="mt-4 space-y-6">
      <div className="space-y-2">
        <h4 className="text-xs font-medium uppercase text-muted-foreground">
          Contato
        </h4>
        <p className="text-lg font-semibold">{name}</p>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          {formatPhone(lead.contact.phone)}
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

      {/* Labels */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium uppercase text-muted-foreground">
          Etiquetas
        </h4>
        <div className="flex flex-wrap gap-1">
          {lead.labels?.map(({ label }) => (
            <button
              key={label.id}
              onClick={() => removeLabel.mutate({ leadId: lead.id, labelId: label.id })}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white hover:opacity-80 transition-opacity"
              style={{ backgroundColor: label.color }}
              title="Clique para remover"
            >
              {label.name}
              <span className="text-white/70">×</span>
            </button>
          ))}
        </div>
        {availableLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {availableLabels.map((label) => (
              <button
                key={label.id}
                onClick={() => assignLabel.mutate({ leadId: lead.id, labelId: label.id })}
                className="inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-xs hover:opacity-80 transition-opacity"
                style={{ borderColor: label.color, color: label.color }}
                title="Clique para adicionar"
              >
                + {label.name}
              </button>
            ))}
          </div>
        )}
        {(allLabels.data ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground">
            Crie etiquetas em Configurações → Etiquetas
          </p>
        )}
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
