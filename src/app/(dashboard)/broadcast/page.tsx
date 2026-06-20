"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Megaphone, Plus, Send, Trash2, CheckCircle2, XCircle,
  Users, Tag, Filter, Upload, UserCircle,
} from "lucide-react";
import { formatPhone } from "@/lib/utils";
import * as XLSX from "xlsx";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Rascunho", variant: "outline" },
  SENDING: { label: "Enviando", variant: "default" },
  COMPLETED: { label: "Concluído", variant: "secondary" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

const audienceLabels: Record<string, string> = {
  ALL_CONTACTS: "Todos os contatos",
  BY_LABEL: "Por etiqueta",
  BY_GROUP: "Por grupo",
  BY_FUNNEL: "Por fase do funil",
  IMPORT_EXCEL: "Importar planilha",
};

const funnelOptions = [
  { value: "COLD", label: "Frio" },
  { value: "WARM", label: "Morno" },
  { value: "HOT", label: "Quente" },
  { value: "CONVERTED", label: "Convertido" },
  { value: "LOST", label: "Perdido" },
];

export default function BroadcastPage() {
  const [showCreate, setShowCreate] = useState(false);
  const broadcasts = trpc.broadcast.list.useQuery();
  const deleteBroadcast = trpc.broadcast.delete.useMutation({
    onSuccess: () => broadcasts.refetch(),
  });
  const sendBroadcast = trpc.broadcast.send.useMutation({
    onSuccess: () => broadcasts.refetch(),
  });

  const list = broadcasts.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Envio em Massa</h1>
          <p className="text-sm text-muted-foreground">
            Envie mensagens para múltiplos contatos de uma vez
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova campanha
        </Button>
      </div>

      {broadcasts.isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma campanha criada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{b.name}</p>
                    <Badge variant={statusConfig[b.status]?.variant ?? "outline"} className="text-xs">
                      {statusConfig[b.status]?.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {audienceLabels[b.audienceType]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{b.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {b.totalRecipients} destinatários
                    </span>
                    <span className="flex items-center gap-1">
                      <UserCircle className="h-3 w-3" />
                      {b.persona.name}
                    </span>
                    {b.status === "COMPLETED" && (
                      <>
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {b.sentCount} enviados
                        </span>
                        {b.failedCount > 0 && (
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle className="h-3 w-3" />
                            {b.failedCount} falhas
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  {b.status === "DRAFT" && (
                    <Button
                      size="sm"
                      onClick={() => sendBroadcast.mutate({ id: b.id })}
                      disabled={sendBroadcast.isPending}
                    >
                      <Send className="mr-1 h-3.5 w-3.5" />
                      Enviar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteBroadcast.mutate({ id: b.id })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Nova Campanha</SheetTitle>
          </SheetHeader>
          <CreateBroadcast
            onSuccess={() => {
              setShowCreate(false);
              broadcasts.refetch();
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface Recipient {
  phone: string;
  name?: string;
  selected: boolean;
}

function CreateBroadcast({ onSuccess }: { onSuccess: () => void }) {
  const personas = trpc.persona.list.useQuery();
  const labels = trpc.label.list.useQuery();
  const allContacts = trpc.broadcast.allContacts.useQuery();

  const [name, setName] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [content, setContent] = useState("");
  const [audienceType, setAudienceType] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedFunnelStages, setSelectedFunnelStages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"config" | "recipients">("config");

  const contactsByLabel = trpc.broadcast.contactsByLabel.useQuery(
    { labelIds: selectedLabelIds },
    { enabled: audienceType === "BY_LABEL" && selectedLabelIds.length > 0 }
  );
  const contactsByFunnel = trpc.broadcast.contactsByFunnel.useQuery(
    { scores: selectedFunnelStages },
    { enabled: audienceType === "BY_FUNNEL" && selectedFunnelStages.length > 0 }
  );

  const createBroadcast = trpc.broadcast.create.useMutation({
    onSuccess,
    onError: (err) => setError(err.message),
  });

  function loadAllContacts() {
    const contacts = allContacts.data ?? [];
    setRecipients(contacts.map((c) => ({
      phone: c.phone,
      name: c.name ?? undefined,
      selected: true,
    })));
    setStep("recipients");
  }

  function loadByLabel() {
    const contacts = contactsByLabel.data ?? [];
    setRecipients(contacts.map((c) => ({
      phone: c.phone,
      name: c.name ?? undefined,
      selected: true,
    })));
    setStep("recipients");
  }

  function loadByFunnel() {
    const contacts = contactsByFunnel.data ?? [];
    setRecipients(contacts.map((c) => ({
      phone: c.phone,
      name: c.name ?? undefined,
      selected: true,
    })));
    setStep("recipients");
  }

  function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const parsed: Recipient[] = [];
      for (const row of rows) {
        const phone = (row["telefone"] ?? row["Telefone"] ?? row["phone"] ?? row["Phone"] ?? row["TELEFONE"] ?? "").toString().replace(/\D/g, "");
        const rowName = row["nome"] ?? row["Nome"] ?? row["name"] ?? row["Name"] ?? row["NOME"] ?? "";
        if (phone.length >= 10) {
          parsed.push({ phone, name: rowName || undefined, selected: true });
        }
      }

      if (parsed.length === 0) {
        setError("Nenhum contato válido encontrado. A planilha deve ter colunas 'nome' e 'telefone'.");
        return;
      }

      setRecipients(parsed);
      setStep("recipients");
    };
    reader.readAsArrayBuffer(file);
  }

  function toggleRecipient(index: number) {
    setRecipients((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  }

  function toggleAll(selected: boolean) {
    setRecipients((prev) => prev.map((r) => ({ ...r, selected })));
  }

  const selectedRecipients = recipients.filter((r) => r.selected);

  function handleSubmit() {
    if (!name.trim() || !personaId || !content.trim() || selectedRecipients.length === 0) return;
    setError(null);
    createBroadcast.mutate({
      name: name.trim(),
      personaId,
      content: content.trim(),
      audienceType: audienceType as "ALL_CONTACTS" | "BY_LABEL" | "BY_GROUP" | "BY_FUNNEL" | "IMPORT_EXCEL",
      recipients: selectedRecipients.map((r) => ({ phone: r.phone, name: r.name })),
    });
  }

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleFunnel(value: string) {
    setSelectedFunnelStages((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  }

  if (step === "recipients") {
    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedRecipients.length} de {recipients.length} selecionados
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
              Todos
            </Button>
            <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
              Nenhum
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setStep("config")}>
              Voltar
            </Button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-md border">
          {recipients.map((r, i) => (
            <label
              key={i}
              className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={r.selected}
                onCheckedChange={() => toggleRecipient(i)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{r.name || formatPhone(r.phone)}</p>
                <p className="text-xs text-muted-foreground">{formatPhone(r.phone)}</p>
              </div>
            </label>
          ))}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          onClick={handleSubmit}
          disabled={selectedRecipients.length === 0 || createBroadcast.isPending}
          className="w-full"
        >
          <Megaphone className="mr-1.5 h-4 w-4" />
          Criar campanha ({selectedRecipients.length} destinatários)
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Nome da campanha *</Label>
        <Input placeholder="Ex: Promoção Junho" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {/* Persona */}
      <div className="space-y-2">
        <Label>Persona (assinatura) *</Label>
        <Select value={personaId} onValueChange={(v) => v && setPersonaId(v)}>
          <SelectTrigger><SelectValue placeholder="Quem assina..." /></SelectTrigger>
          <SelectContent>
            {(personas.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name} — {p.role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label>Mensagem *</Label>
        <textarea
          className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Texto da mensagem..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* Audience type */}
      <div className="space-y-2">
        <Label>Audiência *</Label>
        <Select value={audienceType} onValueChange={(v) => v && setAudienceType(v)}>
          <SelectTrigger><SelectValue placeholder="Como selecionar os destinatários..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL_CONTACTS">
              <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Todos os contatos</span>
            </SelectItem>
            <SelectItem value="BY_LABEL">
              <span className="flex items-center gap-2"><Tag className="h-3.5 w-3.5" /> Por etiqueta</span>
            </SelectItem>
            <SelectItem value="BY_FUNNEL">
              <span className="flex items-center gap-2"><Filter className="h-3.5 w-3.5" /> Por fase do funil</span>
            </SelectItem>
            <SelectItem value="IMPORT_EXCEL">
              <span className="flex items-center gap-2"><Upload className="h-3.5 w-3.5" /> Importar planilha Excel</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audience filters */}
      {audienceType === "BY_LABEL" && (
        <div className="space-y-2">
          <Label>Selecione as etiquetas</Label>
          <div className="flex flex-wrap gap-2">
            {(labels.data ?? []).map((label) => (
              <button
                key={label.id}
                onClick={() => toggleLabel(label.id)}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity"
                style={{
                  backgroundColor: label.color,
                  opacity: selectedLabelIds.includes(label.id) ? 1 : 0.4,
                }}
              >
                {selectedLabelIds.includes(label.id) && "✓ "}
                {label.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {audienceType === "BY_FUNNEL" && (
        <div className="space-y-2">
          <Label>Selecione as fases</Label>
          <div className="flex flex-wrap gap-2">
            {funnelOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleFunnel(opt.value)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedFunnelStages.includes(opt.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input text-muted-foreground hover:bg-accent"
                }`}
              >
                {selectedFunnelStages.includes(opt.value) && "✓ "}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {audienceType === "IMPORT_EXCEL" && (
        <div className="space-y-2">
          <Label>Planilha Excel (.xlsx, .xls, .csv)</Label>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} />
          <p className="text-xs text-muted-foreground">
            A planilha deve conter colunas &quot;nome&quot; e &quot;telefone&quot;
          </p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Next step button */}
      {audienceType === "ALL_CONTACTS" && (
        <Button
          onClick={loadAllContacts}
          disabled={!name.trim() || !personaId || !content.trim()}
          className="w-full"
        >
          Selecionar contatos →
        </Button>
      )}
      {audienceType === "BY_LABEL" && selectedLabelIds.length > 0 && (
        <Button
          onClick={loadByLabel}
          disabled={!name.trim() || !personaId || !content.trim() || contactsByLabel.isLoading}
          className="w-full"
        >
          {contactsByLabel.isLoading ? "Carregando..." : "Selecionar contatos →"}
        </Button>
      )}
      {audienceType === "BY_FUNNEL" && selectedFunnelStages.length > 0 && (
        <Button
          onClick={loadByFunnel}
          disabled={!name.trim() || !personaId || !content.trim() || contactsByFunnel.isLoading}
          className="w-full"
        >
          {contactsByFunnel.isLoading ? "Carregando..." : "Selecionar contatos →"}
        </Button>
      )}
    </div>
  );
}
