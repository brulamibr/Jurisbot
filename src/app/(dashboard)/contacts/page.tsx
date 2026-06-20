"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Search, Phone, Mail, User, Building2, MapPin,
  FileText, DollarSign, Save, Check, UserPlus,
  MessageSquare, Briefcase,
} from "lucide-react";
import { formatPhone } from "@/lib/utils";

const LEGAL_AREAS = [
  "Família", "Sucessões", "Imobiliário", "Trabalhista", "Tributário",
  "Empresarial", "Criminal", "Consumidor", "Previdenciário", "Ambiental",
  "Digital / LGPD", "Contratual", "Administrativo", "Outro",
];

const PROPOSAL_STATUSES = [
  "Não enviada", "Enviada", "Em análise", "Aceita", "Recusada", "Cancelada",
];

const STATES_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const contacts = trpc.contact.list.useQuery(
    search ? { search } : undefined
  );

  const list = contacts.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} contato{list.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone, e-mail..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Novo contato
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {contacts.isLoading ? (
            <div className="space-y-0 divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center">
              <User className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search ? "Nenhum contato encontrado" : "Nenhum contato cadastrado"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {list.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedId(contact.id)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {(contact.name ?? contact.phone)[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {contact.name ?? formatPhone(contact.phone)}
                      </p>
                      <Badge variant={contact.type === "CLIENT" ? "default" : "outline"} className="text-xs">
                        {contact.type === "CLIENT" ? "Cliente" : "Lead"}
                      </Badge>
                      {contact.lead?.score && (
                        <Badge variant="secondary" className="text-xs">
                          {contact.lead.score}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatPhone(contact.phone)}
                      </span>
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {contact._count.conversations}
                      </span>
                      {contact._count.processes > 0 && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {contact._count.processes}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Editar Contato</SheetTitle>
          </SheetHeader>
          {selectedId && (
            <ContactEditForm
              contactId={selectedId}
              onSuccess={() => {
                contacts.refetch();
                setSelectedId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Create sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Novo Contato</SheetTitle>
          </SheetHeader>
          <ContactCreateForm
            onSuccess={() => {
              contacts.refetch();
              setShowCreate(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ContactEditForm({ contactId, onSuccess }: { contactId: string; onSuccess: () => void }) {
  const contact = trpc.contact.getById.useQuery({ id: contactId });
  const updateContact = trpc.contact.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSuccess();
    },
  });

  const [form, setForm] = useState<Record<string, string | null>>({});
  const [saved, setSaved] = useState(false);

  const data = contact.data;

  const contactIdRef = data?.id;
  useEffect(() => {
    // Reset form when switching contacts
    setForm({}); // eslint-disable-line react-hooks/set-state-in-effect
  }, [contactIdRef]);

  if (contact.isLoading) {
    return <div className="mt-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  }

  if (!data) return null;

  function get(field: string): string {
    if (form[field] !== undefined) return form[field] ?? "";
    return (data as Record<string, unknown>)?.[field]?.toString() ?? "";
  }

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  }

  function handleSave() {
    const updates: Record<string, unknown> = { id: contactId };
    for (const [key, value] of Object.entries(form)) {
      if (key === "proposalValue") {
        updates[key] = value ? parseFloat(value) : null;
      } else {
        updates[key] = value;
      }
    }
    updateContact.mutate(updates as Parameters<typeof updateContact.mutate>[0]);
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Basic info */}
      <section className="space-y-3">
        <h4 className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
          <User className="h-3.5 w-3.5" /> Dados pessoais
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Nome</Label>
            <Input value={get("name")} onChange={(e) => set("name", e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Telefone</Label>
            <Input value={get("phone")} onChange={(e) => set("phone", e.target.value)} placeholder="+55..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">E-mail</Label>
            <Input value={get("email")} onChange={(e) => set("email", e.target.value)} placeholder="email@exemplo.com" type="email" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CPF</Label>
            <Input value={get("cpf")} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">RG</Label>
            <Input value={get("rg")} onChange={(e) => set("rg", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Data de nascimento</Label>
            <Input type="date" value={get("birthDate")?.split("T")[0] ?? ""} onChange={(e) => set("birthDate", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={get("type") || "LEAD"} onValueChange={(v) => v && set("type", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="CLIENT">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Professional */}
      <section className="space-y-3">
        <h4 className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" /> Profissional
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Empresa</Label>
            <Input value={get("company")} onChange={(e) => set("company", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Profissão</Label>
            <Input value={get("occupation")} onChange={(e) => set("occupation", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Área de atendimento</Label>
            <Select value={get("legalArea") || ""} onValueChange={(v) => v && set("legalArea", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {LEGAL_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Origem / indicação</Label>
            <Input value={get("referralSource")} onChange={(e) => set("referralSource", e.target.value)} placeholder="WhatsApp, Google, indicação..." />
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-3">
        <h4 className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Endereço
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Endereço</Label>
            <Input value={get("address")} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número, complemento" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cidade</Label>
            <Input value={get("city")} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Estado</Label>
            <Select value={get("state") || ""} onValueChange={(v) => v && set("state", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                {STATES_BR.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CEP</Label>
            <Input value={get("zipCode")} onChange={(e) => set("zipCode", e.target.value)} placeholder="00000-000" />
          </div>
        </div>
      </section>

      {/* Proposal */}
      <section className="space-y-3">
        <h4 className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5" /> Proposta
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Valor da proposta (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={get("proposalValue")}
              onChange={(e) => set("proposalValue", e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status da proposta</Label>
            <Select value={get("proposalStatus") || ""} onValueChange={(v) => v && set("proposalStatus", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {PROPOSAL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-3">
        <h4 className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Notas
        </h4>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={get("notes")}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Anotações sobre o contato..."
        />
      </section>

      {/* Stats */}
      {data && (
        <section className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> {data._count.conversations} conversa{data._count.conversations !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" /> {data.processes.length} processo{data.processes.length !== 1 ? "s" : ""}
          </span>
        </section>
      )}

      <Button
        onClick={handleSave}
        disabled={Object.keys(form).length === 0 || updateContact.isPending}
        className="w-full"
      >
        {saved ? (
          <><Check className="mr-1.5 h-4 w-4" /> Salvo</>
        ) : (
          <><Save className="mr-1.5 h-4 w-4" /> Salvar alterações</>
        )}
      </Button>
    </div>
  );
}

function ContactCreateForm({ onSuccess }: { onSuccess: () => void }) {
  const createContact = trpc.contact.create.useMutation({
    onSuccess,
    onError: (err) => setError(err.message),
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("LEAD");
  const [legalArea, setLegalArea] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
      </div>
      <div className="space-y-2">
        <Label>Telefone *</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5511999999999" />
      </div>
      <div className="space-y-2">
        <Label>E-mail</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" type="email" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LEAD">Lead</SelectItem>
              <SelectItem value="CLIENT">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Área</Label>
          <Select value={legalArea} onValueChange={(v) => v && setLegalArea(v)}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {LEGAL_AREAS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notas</Label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        onClick={() => {
          setError(null);
          createContact.mutate({
            name: name.trim(),
            phone: phone.replace(/\D/g, ""),
            ...(email ? { email } : {}),
            type: type as "LEAD" | "CLIENT",
            ...(legalArea ? { legalArea } : {}),
            ...(notes ? { notes } : {}),
          });
        }}
        disabled={!name.trim() || !phone.trim() || createContact.isPending}
        className="w-full"
      >
        <UserPlus className="mr-1.5 h-4 w-4" />
        Criar contato
      </Button>
    </div>
  );
}
