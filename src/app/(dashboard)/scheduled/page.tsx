"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CalendarClock,
  Plus,
  Send,
  Trash2,
  XCircle,
  Clock,
  CheckCircle2,
  UserCircle,
  Repeat,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPhone } from "@/lib/utils";

const recurrenceLabels: Record<string, string> = {
  NONE: "Única vez",
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Agendada", variant: "outline" },
  ACTIVE: { label: "Ativa", variant: "default" },
  COMPLETED: { label: "Concluída", variant: "secondary" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
};

export default function ScheduledPage() {
  const [showCreate, setShowCreate] = useState(false);

  const messagesQuery = trpc.scheduledMessage.list.useQuery();
  const cancelMsg = trpc.scheduledMessage.cancel.useMutation({
    onSuccess: () => messagesQuery.refetch(),
  });
  const deleteMsg = trpc.scheduledMessage.delete.useMutation({
    onSuccess: () => messagesQuery.refetch(),
  });

  const messages = messagesQuery.data ?? [];
  const pending = messages.filter((m) => m.status === "PENDING" || m.status === "ACTIVE");
  const history = messages.filter((m) => m.status === "COMPLETED" || m.status === "CANCELLED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mensagens Agendadas</h1>
          <p className="text-sm text-muted-foreground">
            Agende mensagens para envio automático via WhatsApp
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Agendar mensagem
        </Button>
      </div>

      {/* Pending messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Agendadas ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messagesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma mensagem agendada
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((msg) => (
                <div key={msg.id} className="flex items-start justify-between rounded-md border p-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {msg.contact.name ?? formatPhone(msg.contact.phone)}
                      </p>
                      <Badge variant={statusConfig[msg.status]?.variant ?? "outline"} className="text-xs">
                        {statusConfig[msg.status]?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {format(new Date(msg.nextSendAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCircle className="h-3 w-3" />
                        {msg.persona.name}
                      </span>
                      {msg.recurrence !== "NONE" && (
                        <span className="flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          {recurrenceLabels[msg.recurrence]} — {msg.sentCount}/{msg.recurrenceCount}
                        </span>
                      )}
                      {msg.fileName && (
                        <Badge variant="secondary" className="text-xs">
                          📎 {msg.fileName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Cancelar"
                      onClick={() => cancelMsg.mutate({ id: msg.id })}
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" />
              Histórico ({history.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((msg) => (
                <div key={msg.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm truncate">
                        {msg.contact.name ?? formatPhone(msg.contact.phone)}
                      </p>
                      <Badge variant={statusConfig[msg.status]?.variant ?? "outline"} className="text-xs">
                        {statusConfig[msg.status]?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMsg.mutate({ id: msg.id })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Agendar Mensagem</SheetTitle>
          </SheetHeader>
          <CreateScheduledMessage
            onSuccess={() => {
              setShowCreate(false);
              messagesQuery.refetch();
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CreateScheduledMessage({ onSuccess }: { onSuccess: () => void }) {
  const contacts = trpc.scheduledMessage.contacts.useQuery();
  const personas = trpc.persona.list.useQuery();
  const createMsg = trpc.scheduledMessage.create.useMutation({
    onSuccess,
    onError: (err) => setError(err.message),
  });

  const [contactId, setContactId] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recurrence, setRecurrence] = useState("NONE");
  const [recurrenceCount, setRecurrenceCount] = useState("1");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const contactList = contacts.data ?? [];
  const personaList = personas.data ?? [];

  function handleSubmit() {
    if (!contactId || !personaId || !content.trim() || !scheduledAt) return;
    setError(null);
    createMsg.mutate({
      contactId,
      personaId,
      content: content.trim(),
      scheduledAt,
      recurrence: recurrence as "NONE" | "DAILY" | "WEEKLY" | "MONTHLY",
      recurrenceCount: parseInt(recurrenceCount) || 1,
      ...(fileUrl ? { fileUrl, fileName } : {}),
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    setFileName(file.name);
    setFileUrl(`pending:${file.name}`);
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Contact */}
      <div className="space-y-2">
        <Label>Contato *</Label>
        <Select value={contactId} onValueChange={(v) => v && setContactId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o contato..." />
          </SelectTrigger>
          <SelectContent>
            {contactList.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name ?? formatPhone(c.phone)} — {formatPhone(c.phone)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Persona */}
      <div className="space-y-2">
        <Label>Persona (assinatura) *</Label>
        <Select value={personaId} onValueChange={(v) => v && setPersonaId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Quem assina a mensagem..." />
          </SelectTrigger>
          <SelectContent>
            {personaList.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Crie personas em Configurações → Personas
              </div>
            ) : (
              personaList.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {p.role}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label>Mensagem *</Label>
        <textarea
          className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Digite a mensagem a ser enviada..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* File */}
      <div className="space-y-2">
        <Label>Arquivo (opcional)</Label>
        <Input type="file" onChange={handleFileUpload} />
        {fileName && (
          <p className="text-xs text-muted-foreground">📎 {fileName}</p>
        )}
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <Label>Data e hora do envio *</Label>
        <Input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </div>

      {/* Recurrence */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Recorrência</Label>
          <Select value={recurrence} onValueChange={(v) => v && setRecurrence(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Única vez</SelectItem>
              <SelectItem value="DAILY">Diária</SelectItem>
              <SelectItem value="WEEKLY">Semanal</SelectItem>
              <SelectItem value="MONTHLY">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {recurrence !== "NONE" && (
          <div className="space-y-2">
            <Label>Nº de envios</Label>
            <Input
              type="number"
              min="1"
              max="365"
              value={recurrenceCount}
              onChange={(e) => setRecurrenceCount(e.target.value)}
            />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={!contactId || !personaId || !content.trim() || !scheduledAt || createMsg.isPending}
        className="w-full"
      >
        <Send className="mr-1.5 h-4 w-4" />
        Agendar mensagem
      </Button>
    </div>
  );
}
