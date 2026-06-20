"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";

export function NewConversationDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (conversationId: string) => void;
}) {
  const personas = trpc.persona.list.useQuery();
  const startNew = trpc.conversation.startNew.useMutation({
    onSuccess: (data) => onSuccess(data.id),
    onError: (err) => setError(err.message),
  });

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const personaList = personas.data ?? [];
  const selectedPersona = personaList.find((p) => p.id === personaId);

  function handleSend() {
    if (!phone.trim() || !personaId || !content.trim()) return;
    setError(null);
    startNew.mutate({
      phone: phone.trim(),
      name: name.trim() || undefined,
      content: content.trim(),
      personaId,
    });
  }

  function handleReset() {
    setPhone("");
    setName("");
    setPersonaId("");
    setContent("");
    setError(null);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) handleReset();
        onOpenChange(o);
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nova Conversa</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Telefone *</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5511999999999"
              type="tel"
            />
            <p className="text-xs text-muted-foreground">
              Número com código do país (55) + DDD + número
            </p>
          </div>

          <div className="space-y-2">
            <Label>Nome do contato (opcional)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do destinatário"
            />
          </div>

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

          <div className="space-y-2">
            <Label>Mensagem *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite a primeira mensagem..."
              className="min-h-[100px]"
            />
          </div>

          {selectedPersona && content.trim() && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Prévia</p>
              <p className="text-sm whitespace-pre-wrap">{content}</p>
              <p className="text-sm mt-1 italic">
                — <strong>{selectedPersona.name}</strong>, {selectedPersona.role}
              </p>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            onClick={handleSend}
            disabled={!phone.trim() || !personaId || !content.trim() || startNew.isPending}
            className="w-full"
          >
            <Send className="mr-1.5 h-4 w-4" />
            {startNew.isPending ? "Enviando..." : "Enviar mensagem"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
