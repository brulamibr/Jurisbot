"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Smartphone,
  Plus,
  QrCode,
  Loader2,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  CONNECTED: { label: "Conectado", variant: "default" },
  DISCONNECTED: { label: "Desconectado", variant: "outline" },
  CONNECTING: { label: "Conectando...", variant: "secondary" },
  QR_READY: { label: "Aguardando Scan", variant: "secondary" },
};

export default function WhatsappPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [activeQr, setActiveQr] = useState<string | null>(null);

  const instances = trpc.whatsapp.listInstances.useQuery();
  const createInstance = trpc.whatsapp.createInstance.useMutation({
    onSuccess: () => {
      instances.refetch();
      setShowCreate(false);
      setNewName("");
    },
  });
  const connect = trpc.whatsapp.connect.useMutation({
    onSuccess: () => {
      instances.refetch();
    },
  });
  const disconnect = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      instances.refetch();
      setActiveQr(null);
    },
  });
  const deleteInstance = trpc.whatsapp.deleteInstance.useMutation({
    onSuccess: () => instances.refetch(),
  });
  const qrQuery = trpc.whatsapp.getQrCode.useQuery(
    { instanceId: activeQr ?? "" },
    {
      enabled: activeQr !== null,
      refetchInterval: 5000,
    }
  );

  function handleConnect(instanceId: string) {
    setActiveQr(instanceId);
    connect.mutate({ instanceId });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as conexões do WhatsApp do escritório
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Instância
        </Button>
      </div>

      {instances.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : instances.data && instances.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {instances.data.map((inst) => {
            const config =
              statusConfig[inst.status] ?? statusConfig.DISCONNECTED;

            return (
              <Card key={inst.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Smartphone className="h-4 w-4" />
                      {inst.name}
                    </CardTitle>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  {inst.phone && (
                    <CardDescription>{inst.phone}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {(
                      <Button
                        size="sm"
                        onClick={() => handleConnect(inst.id)}
                        disabled={connect.isPending}
                      >
                        {connect.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="mr-2 h-4 w-4" />
                        )}
                        Conectar
                      </Button>
                    )}
                    {inst.status === "QR_READY" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActiveQr(inst.id)}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Ver QR Code
                      </Button>
                    )}
                    {(inst.status === "CONNECTED" ||
                      inst.status === "CONNECTING" ||
                      inst.status === "QR_READY") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          disconnect.mutate({ instanceId: inst.id })
                        }
                        disabled={disconnect.isPending}
                      >
                        <PowerOff className="mr-2 h-4 w-4" />
                        Desconectar
                      </Button>
                    )}
                    {(
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() =>
                          deleteInstance.mutate({ instanceId: inst.id })
                        }
                        disabled={deleteInstance.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4">
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4 text-lg">
              Nenhuma instância configurada
            </CardTitle>
            <CardDescription className="mt-2 max-w-sm text-center">
              Crie uma instância do WhatsApp para conectar o número do
              escritório e começar a receber mensagens.
            </CardDescription>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Instância
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog
        open={activeQr !== null && qrQuery.data?.status === "QR_READY"}
        onOpenChange={() => setActiveQr(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear QR Code</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no celular, vá em Dispositivos Conectados e
              escaneie o código abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            {qrQuery.data?.qrCode ? (
              <img
                src={qrQuery.data.qrCode}
                alt="QR Code WhatsApp"
                className="h-64 w-64 rounded-lg"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            O QR Code atualiza automaticamente a cada 5 segundos.
          </p>
        </DialogContent>
      </Dialog>

      {/* Create Instance Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Instância WhatsApp</DialogTitle>
            <DialogDescription>
              Dê um nome para identificar esta conexão (ex: &quot;Número
              Principal&quot;, &quot;Atendimento&quot;).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nome da Instância</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Número Principal"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createInstance.mutate({ name: newName })}
              disabled={!newName.trim() || createInstance.isPending}
            >
              {createInstance.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
