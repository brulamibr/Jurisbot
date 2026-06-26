"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Link2, UserPlus, Loader2, Copy } from "lucide-react";

export default function GroupsPage() {
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [showAddParticipant, setShowAddParticipant] = useState<string | null>(null);
  const [newParticipant, setNewParticipant] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const instances = trpc.whatsapp.listInstances.useQuery();
  const connectedInstances = instances.data?.filter((i) => i.status === "CONNECTED") ?? [];

  const groups = trpc.whatsappGroup.list.useQuery(
    { instanceId: selectedInstance },
    { enabled: !!selectedInstance }
  );

  const createGroup = trpc.whatsappGroup.create.useMutation({
    onSuccess: () => { groups.refetch(); setShowCreate(false); setGroupName(""); setParticipants([]); },
  });

  const addParticipantsMut = trpc.whatsappGroup.addParticipants.useMutation({
    onSuccess: () => { groups.refetch(); setShowAddParticipant(null); setNewParticipant(""); },
  });

  const inviteCode = trpc.whatsappGroup.inviteCode.useQuery(
    { instanceId: selectedInstance, groupJid: copiedLink ?? "" },
    { enabled: !!copiedLink && !!selectedInstance }
  );

  function addParticipant() {
    const phone = participantInput.replace(/\D/g, "");
    if (phone.length >= 8 && !participants.includes(phone)) {
      setParticipants([...participants, phone]);
      setParticipantInput("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grupos WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie grupos do WhatsApp</p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={!selectedInstance}>
          <Plus className="mr-2 h-4 w-4" />Novo Grupo
        </Button>
      </div>

      <div className="max-w-xs">
        <Label>Instância WhatsApp</Label>
        <Select value={selectedInstance} onValueChange={(v) => { if (v) setSelectedInstance(v); }}>
          <SelectTrigger><SelectValue placeholder="Selecione uma instância conectada" /></SelectTrigger>
          <SelectContent>
            {connectedInstances.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>{inst.name} {inst.phone ? `(${inst.phone})` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedInstance ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-8 w-8 text-muted-foreground opacity-20" />
          <p className="mt-4 text-sm text-muted-foreground">Selecione uma instância conectada para ver os grupos</p>
        </CardContent></Card>
      ) : groups.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (<Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>))}
        </div>
      ) : groups.data && groups.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.data.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />{group.subject}</CardTitle>
                  <Badge variant="secondary">{group.size} membros</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setShowAddParticipant(group.id)}><UserPlus className="mr-1 h-3.5 w-3.5" />Adicionar</Button>
                  <Button size="sm" variant="outline" onClick={() => setCopiedLink(group.id)}><Link2 className="mr-1 h-3.5 w-3.5" />Link</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-8 w-8 text-muted-foreground opacity-20" />
          <CardTitle className="mt-4 text-lg">Nenhum grupo encontrado</CardTitle>
          <CardDescription className="mt-2 max-w-sm text-center">Crie um grupo para começar.</CardDescription>
        </CardContent></Card>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Grupo WhatsApp</DialogTitle>
            <DialogDescription>Defina o nome do grupo e adicione os participantes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Grupo</Label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ex: Clientes VIP" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Participantes</Label>
              <div className="flex gap-2">
                <Input value={participantInput} onChange={(e) => setParticipantInput(e.target.value)} placeholder="Número com DDD (ex: 5511999998888)" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addParticipant(); } }} />
                <Button type="button" variant="outline" onClick={addParticipant}><Plus className="h-4 w-4" /></Button>
              </div>
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {participants.map((p) => (
                    <Badge key={p} variant="secondary" className="gap-1">{p}
                      <button onClick={() => setParticipants(participants.filter((x) => x !== p))} className="ml-1 hover:text-destructive">&times;</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createGroup.mutate({ instanceId: selectedInstance, subject: groupName, participants })} disabled={!groupName.trim() || participants.length === 0 || createGroup.isPending}>
              {createGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAddParticipant} onOpenChange={() => setShowAddParticipant(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Participante</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Número do participante</Label>
            <Input value={newParticipant} onChange={(e) => setNewParticipant(e.target.value)} placeholder="5511999998888" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddParticipant(null)}>Cancelar</Button>
            <Button onClick={() => showAddParticipant && addParticipantsMut.mutate({ instanceId: selectedInstance, groupJid: showAddParticipant, participants: [newParticipant.replace(/\D/g, "")] })} disabled={!newParticipant.trim() || addParticipantsMut.isPending}>
              {addParticipantsMut.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!copiedLink && !!inviteCode.data} onOpenChange={() => setCopiedLink(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Link de Convite</DialogTitle></DialogHeader>
          {inviteCode.data && (
            <div className="flex items-center gap-2">
              <Input value={inviteCode.data.link} readOnly className="text-sm" />
              <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(inviteCode.data!.link)}><Copy className="h-4 w-4" /></Button>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setCopiedLink(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}