"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Bot, Save, Check } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu perfil, escritório e configurações de IA
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="office" className="flex-1">
            <Building2 className="mr-1.5 h-3.5 w-3.5" />
            Escritório
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1">
            <Bot className="mr-1.5 h-3.5 w-3.5" />
            IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="office">
          <OfficeSettings />
        </TabsContent>
        <TabsContent value="ai">
          <AISettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileSettings() {
  const me = trpc.user.me.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      me.refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  const user = me.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Seus dados pessoais</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {me.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                defaultValue={user?.name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input defaultValue={user?.email} disabled />
              <p className="text-xs text-muted-foreground">
                O e-mail não pode ser alterado
              </p>
            </div>
            <div className="space-y-2">
              <Label>Permissão</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{user?.role}</Badge>
              </div>
            </div>
            <Button
              onClick={() => updateProfile.mutate({ name: name || user?.name || "" })}
              disabled={updateProfile.isPending || !name}
            >
              {saved ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Salvo
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Salvar perfil
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OfficeSettings() {
  const office = trpc.office.get.useQuery();
  const updateOffice = trpc.office.update.useMutation({
    onSuccess: () => {
      office.refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const data = office.data;

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escritório</CardTitle>
        <CardDescription>Dados do seu escritório jurídico</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {office.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Nome do Escritório</Label>
              <Input
                defaultValue={data?.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                defaultValue={data?.email ?? ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                defaultValue={data?.phone ?? ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            <Button
              onClick={() =>
                updateOffice.mutate({
                  name: form.name || data?.name || "",
                  email: form.email ?? data?.email ?? undefined,
                  phone: form.phone ?? data?.phone ?? undefined,
                })
              }
              disabled={updateOffice.isPending || Object.keys(form).length === 0}
            >
              {saved ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Salvo
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Salvar escritório
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AISettings() {
  const defaultConfig = trpc.aiConfig.getDefault.useQuery();
  const updateConfig = trpc.aiConfig.update.useMutation({
    onSuccess: () => {
      defaultConfig.refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });
  const createConfig = trpc.aiConfig.create.useMutation({
    onSuccess: () => {
      defaultConfig.refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const config = defaultConfig.data;

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    const data = {
      name: form.name || config?.name || "Padrão",
      model: form.model || config?.model || "gpt-4o",
      temperature: form.temperature
        ? parseFloat(form.temperature)
        : config?.temperature ?? 0.7,
      maxTokens: form.maxTokens
        ? parseInt(form.maxTokens)
        : config?.maxTokens ?? 2048,
      systemPrompt: form.systemPrompt || config?.systemPrompt || "",
      isDefault: true,
    };

    if (config) {
      updateConfig.mutate({ id: config.id, ...data });
    } else {
      createConfig.mutate(data);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de IA</CardTitle>
        <CardDescription>
          Configure o modelo de IA usado nas conversas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {defaultConfig.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select
                defaultValue={config?.model ?? "gpt-4o"}
                onValueChange={(v) => v && handleChange("model", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">OpenAI GPT-4o Mini</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Google Gemini 1.5 Pro</SelectItem>
                  <SelectItem value="claude-sonnet-4-6">Anthropic Claude Sonnet</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O sistema tentará o modelo selecionado primeiro e fará fallback automático
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temperatura</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  defaultValue={config?.temperature ?? 0.7}
                  onChange={(e) => handleChange("temperature", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  0 = preciso, 1 = criativo
                </p>
              </div>
              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  step="256"
                  min="256"
                  max="8192"
                  defaultValue={config?.maxTokens ?? 2048}
                  onChange={(e) => handleChange("maxTokens", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prompt do Sistema</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={config?.systemPrompt ?? ""}
                onChange={(e) => handleChange("systemPrompt", e.target.value)}
                placeholder="Instruções personalizadas para o assistente jurídico..."
              />
              <p className="text-xs text-muted-foreground">
                Personaliza o comportamento da IA. Deixe vazio para usar o
                prompt padrão.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={updateConfig.isPending || createConfig.isPending}
            >
              {saved ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Salvo
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Salvar configuração
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
