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
import { User, Building2, Bot, Save, Check, Key, Eye, EyeOff, UserCircle, Plus, Trash2, Pencil, X, Tag, GitBranch } from "lucide-react";

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
          <TabsTrigger value="personas" className="flex-1">
            <UserCircle className="mr-1.5 h-3.5 w-3.5" />
            Personas
          </TabsTrigger>
          <TabsTrigger value="labels" className="flex-1">
            <Tag className="mr-1.5 h-3.5 w-3.5" />
            Etiquetas
          </TabsTrigger>
          <TabsTrigger value="funnels" className="flex-1">
            <GitBranch className="mr-1.5 h-3.5 w-3.5" />
            Funis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="office">
          <OfficeSettings />
        </TabsContent>
        <TabsContent value="ai">
          <div className="space-y-4">
            <ApiKeysSettings />
            <AISettings />
          </div>
        </TabsContent>
        <TabsContent value="personas">
          <PersonasSettings />
        </TabsContent>
        <TabsContent value="labels">
          <LabelsSettings />
        </TabsContent>
        <TabsContent value="funnels">
          <FunnelsSettings />
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

function ApiKeysSettings() {
  const apiKeys = trpc.office.getApiKeys.useQuery();
  const updateKeys = trpc.office.updateApiKeys.useMutation({
    onSuccess: () => {
      apiKeys.refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const keys = apiKeys.data;

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleShow(field: string) {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function handleSave() {
    const data: Record<string, string | undefined> = {};
    if (form.openai !== undefined) data.openaiApiKey = form.openai;
    if (form.google !== undefined) data.googleApiKey = form.google;
    if (form.anthropic !== undefined) data.anthropicApiKey = form.anthropic;
    updateKeys.mutate(data);
  }

  const providers = [
    { key: "openai", label: "OpenAI", placeholder: "sk-proj-...", hint: "Necessária para IA (GPT-4o) e embeddings (Base de Conhecimento)" },
    { key: "google", label: "Google Gemini", placeholder: "AIza...", hint: "Alternativa gratuita para chat" },
    { key: "anthropic", label: "Anthropic Claude", placeholder: "sk-ant-...", hint: "Alternativa premium para chat" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Chaves de API
        </CardTitle>
        <CardDescription>
          Cada escritório usa suas próprias chaves de IA. Você precisa de pelo menos uma chave configurada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiKeys.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            {providers.map(({ key, label, placeholder, hint }) => (
              <div key={key} className="space-y-2">
                <Label className="flex items-center justify-between">
                  {label}
                  {keys?.[key as keyof typeof keys] && (
                    <Badge variant="outline" className="text-xs font-normal text-green-600 dark:text-green-400">
                      Configurada
                    </Badge>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    type={showKeys[key] ? "text" : "password"}
                    placeholder={keys?.[key as keyof typeof keys] || placeholder}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys[key] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            ))}

            <Button
              onClick={handleSave}
              disabled={updateKeys.isPending || Object.keys(form).length === 0}
            >
              {saved ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Salvo
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Salvar chaves
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
        <CardTitle>Configuração do Modelo</CardTitle>
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

function PersonasSettings() {
  const personas = trpc.persona.list.useQuery();
  const [error, setError] = useState<string | null>(null);
  const createPersona = trpc.persona.create.useMutation({
    onSuccess: () => {
      personas.refetch();
      setNewName("");
      setNewRole("");
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });
  const deletePersona = trpc.persona.delete.useMutation({
    onSuccess: () => personas.refetch(),
  });
  const updatePersona = trpc.persona.update.useMutation({
    onSuccess: () => {
      personas.refetch();
      setEditingId(null);
    },
  });

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const list = personas.data ?? [];

  function startEdit(persona: { id: string; name: string; role: string }) {
    setEditingId(persona.id);
    setEditName(persona.name);
    setEditRole(persona.role);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Personas
        </CardTitle>
        <CardDescription>
          Crie identidades para assinar suas mensagens no atendimento humano.
          O cliente verá o nome e cargo da persona escolhida.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3 space-y-3">
          <p className="text-sm font-medium">Nova persona</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome</Label>
              <Input
                placeholder="Ex: Dra. Maria Santos"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cargo</Label>
              <Input
                placeholder="Ex: Advogada Sênior"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => createPersona.mutate({ name: newName, role: newRole })}
            disabled={!newName.trim() || !newRole.trim() || createPersona.isPending}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Criar persona
          </Button>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        {personas.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma persona cadastrada. Crie a primeira acima.
          </p>
        ) : (
          <div className="space-y-2">
            {list.map((persona) => (
              <div
                key={persona.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                {editingId === persona.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() =>
                        updatePersona.mutate({
                          id: persona.id,
                          name: editName,
                          role: editRole,
                        })
                      }
                      disabled={!editName.trim() || !editRole.trim()}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium">{persona.name}</p>
                      <p className="text-xs text-muted-foreground">{persona.role}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEdit(persona)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deletePersona.mutate({ id: persona.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {list.length > 0 && (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Prévia da assinatura
            </p>
            <p className="text-sm">Olá, como posso ajudá-lo?</p>
            <p className="text-sm mt-1">
              — <strong>{list[0].name}</strong>, {list[0].role}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#64748b",
];

function LabelsSettings() {
  const labels = trpc.label.list.useQuery();
  const createLabel = trpc.label.create.useMutation({
    onSuccess: () => {
      labels.refetch();
      setNewName("");
      setNewColor("#6366f1");
    },
  });
  const updateLabel = trpc.label.update.useMutation({
    onSuccess: () => {
      labels.refetch();
      setEditId(null);
    },
  });
  const deleteLabel = trpc.label.delete.useMutation({
    onSuccess: () => labels.refetch(),
  });

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const list = labels.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Etiquetas
        </CardTitle>
        <CardDescription>
          Crie etiquetas coloridas para classificar seus leads. Atribua-as no painel de detalhes do lead.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3 space-y-3">
          <p className="text-sm font-medium">Nova etiqueta</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Nome</Label>
              <Input
                placeholder="Ex: Urgente, VIP, Trabalhista..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cor</Label>
              <div className="flex gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: newColor === c ? "white" : "transparent",
                      boxShadow: newColor === c ? `0 0 0 2px ${c}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => createLabel.mutate({ name: newName.trim(), color: newColor })}
              disabled={!newName.trim() || createLabel.isPending}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Criar etiqueta
            </Button>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: newColor }}
            >
              {newName || "Prévia"}
            </span>
          </div>
        </div>

        {labels.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma etiqueta criada.
          </p>
        ) : (
          <div className="space-y-2">
            {list.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                {editId === label.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-0.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className="h-5 w-5 rounded-full border-2"
                          style={{
                            backgroundColor: c,
                            borderColor: editColor === c ? "white" : "transparent",
                            boxShadow: editColor === c ? `0 0 0 1px ${c}` : "none",
                          }}
                        />
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() =>
                        updateLabel.mutate({ id: label.id, name: editName, color: editColor })
                      }
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => setEditId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditId(label.id);
                          setEditName(label.name);
                          setEditColor(label.color);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteLabel.mutate({ id: label.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelsSettings() {
  const funnels = trpc.funnel.list.useQuery();
  const createFunnel = trpc.funnel.create.useMutation({
    onSuccess: () => {
      funnels.refetch();
      setNewName("");
      setNewStages([
        { name: "", color: "#3b82f6" },
        { name: "", color: "#22c55e" },
      ]);
    },
  });
  const deleteFunnel = trpc.funnel.delete.useMutation({
    onSuccess: () => funnels.refetch(),
  });
  const addStage = trpc.funnel.addStage.useMutation({
    onSuccess: () => funnels.refetch(),
  });
  const deleteStage = trpc.funnel.deleteStage.useMutation({
    onSuccess: () => funnels.refetch(),
  });

  const [newName, setNewName] = useState("");
  const [newStages, setNewStages] = useState([
    { name: "", color: "#3b82f6" },
    { name: "", color: "#22c55e" },
  ]);
  const [addingStageTo, setAddingStageTo] = useState<string | null>(null);
  const [stageName, setStageName] = useState("");
  const [stageColor, setStageColor] = useState("#6366f1");

  const list = funnels.data ?? [];

  function updateNewStage(idx: number, field: "name" | "color", value: string) {
    setNewStages((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function addNewStageRow() {
    setNewStages((prev) => [...prev, { name: "", color: PRESET_COLORS[prev.length % PRESET_COLORS.length] }]);
  }

  function removeNewStageRow(idx: number) {
    if (newStages.length <= 2) return;
    setNewStages((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Funis
        </CardTitle>
        <CardDescription>
          Crie funis personalizados com etapas, nomes e cores diferentes. O funil padrão não pode ser excluído.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create new funnel */}
        <div className="rounded-md border p-3 space-y-3">
          <p className="text-sm font-medium">Novo funil</p>
          <div className="space-y-2">
            <Label className="text-xs">Nome do funil</Label>
            <Input
              placeholder="Ex: Pré-vendas, Contencioso, Consultoria..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Etapas (mín. 2)</Label>
            {newStages.map((stage, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder={`Etapa ${idx + 1}`}
                  value={stage.name}
                  onChange={(e) => updateNewStage(idx, "name", e.target.value)}
                  className="h-8 text-sm"
                />
                <input
                  type="color"
                  value={stage.color}
                  onChange={(e) => updateNewStage(idx, "color", e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border p-0.5"
                />
                {newStages.length > 2 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeNewStageRow(idx)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addNewStageRow}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar etapa
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() =>
              createFunnel.mutate({
                name: newName.trim(),
                stages: newStages.filter((s) => s.name.trim()).map((s) => ({
                  name: s.name.trim(),
                  color: s.color,
                })),
              })
            }
            disabled={!newName.trim() || newStages.filter((s) => s.name.trim()).length < 2 || createFunnel.isPending}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Criar funil
          </Button>
        </div>

        {/* Existing funnels */}
        {funnels.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="space-y-4">
            {list.map((funnel) => (
              <div key={funnel.id} className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{funnel.name}</p>
                    {funnel.isDefault && (
                      <Badge variant="secondary" className="text-xs">Padrão</Badge>
                    )}
                  </div>
                  {!funnel.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteFunnel.mutate({ id: funnel.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Stages */}
                <div className="flex flex-wrap gap-2">
                  {funnel.stages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-1">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: stage.color }}
                      >
                        {stage.name}
                      </span>
                      {!funnel.isDefault && (
                        <button
                          onClick={() => deleteStage.mutate({ id: stage.id })}
                          className="text-muted-foreground hover:text-destructive text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add stage to existing funnel */}
                {!funnel.isDefault && (
                  <>
                    {addingStageTo === funnel.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Nome da etapa"
                          value={stageName}
                          onChange={(e) => setStageName(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <input
                          type="color"
                          value={stageColor}
                          onChange={(e) => setStageColor(e.target.value)}
                          className="h-8 w-10 cursor-pointer rounded border p-0.5"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => {
                            addStage.mutate({
                              funnelId: funnel.id,
                              name: stageName.trim(),
                              color: stageColor,
                            });
                            setStageName("");
                            setAddingStageTo(null);
                          }}
                          disabled={!stageName.trim()}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => setAddingStageTo(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed text-xs"
                        onClick={() => setAddingStageTo(funnel.id)}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Etapa
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
