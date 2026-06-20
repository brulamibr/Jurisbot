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
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  FolderPlus,
  MessageSquareText,
  FileAudio,
  Paperclip,
} from "lucide-react";

export default function QuickMessagesPage() {
  const categories = trpc.quickMessage.listCategories.useQuery();
  const createCategory = trpc.quickMessage.createCategory.useMutation({
    onSuccess: () => {
      categories.refetch();
      setNewCatName("");
    },
  });
  const updateCategory = trpc.quickMessage.updateCategory.useMutation({
    onSuccess: () => {
      categories.refetch();
      setEditCatId(null);
    },
  });
  const deleteCategory = trpc.quickMessage.deleteCategory.useMutation({
    onSuccess: () => categories.refetch(),
  });
  const createMessage = trpc.quickMessage.createMessage.useMutation({
    onSuccess: () => {
      categories.refetch();
      setAddingTo(null);
      setMsgTitle("");
      setMsgContent("");
      setMsgFileUrl("");
      setMsgFileName("");
      setMsgFileType("");
    },
  });
  const deleteMessage = trpc.quickMessage.deleteMessage.useMutation({
    onSuccess: () => categories.refetch(),
  });

  const [newCatName, setNewCatName] = useState("");
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [msgFileUrl, setMsgFileUrl] = useState("");
  const [msgFileName, setMsgFileName] = useState("");
  const [msgFileType, setMsgFileType] = useState("");

  const catList = categories.data ?? [];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsgFileName(file.name);
    setMsgFileType(file.type);
    const url = URL.createObjectURL(file);
    setMsgFileUrl(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mensagens Rápidas</h1>
        <p className="text-sm text-muted-foreground">
          Crie mensagens padrão organizadas por categoria para enviar com um clique nas conversas
        </p>
      </div>

      {/* Create category */}
      <div className="flex gap-2">
        <Input
          placeholder="Nome da nova categoria..."
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newCatName.trim()) {
              createCategory.mutate({ name: newCatName.trim() });
            }
          }}
        />
        <Button
          onClick={() => createCategory.mutate({ name: newCatName.trim() })}
          disabled={!newCatName.trim() || createCategory.isPending}
        >
          <FolderPlus className="mr-1.5 h-4 w-4" />
          Criar categoria
        </Button>
      </div>

      {/* Categories */}
      {categories.isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : catList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquareText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria criada. Comece criando uma categoria acima.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {catList.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {editCatId === cat.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() =>
                          updateCategory.mutate({ id: cat.id, name: editCatName })
                        }
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => setEditCatId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {cat.messages.length} mensagen{cat.messages.length !== 1 ? "s" : ""}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditCatId(cat.id);
                            setEditCatName(cat.name);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteCategory.mutate({ id: cat.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Existing messages */}
                {cat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-start justify-between rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{msg.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {msg.content}
                      </p>
                      {msg.fileName && (
                        <div className="mt-1 flex items-center gap-1">
                          {msg.fileType?.startsWith("audio/") ? (
                            <FileAudio className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground">{msg.fileName}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => deleteMessage.mutate({ id: msg.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                {/* Add message form */}
                {addingTo === cat.id ? (
                  <div className="rounded-md border border-dashed p-3 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Título (uso interno)</Label>
                      <Input
                        placeholder="Ex: Saudação inicial"
                        value={msgTitle}
                        onChange={(e) => setMsgTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Mensagem</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Texto que será enviado ao cliente..."
                        value={msgContent}
                        onChange={(e) => setMsgContent(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Arquivo ou áudio (opcional)</Label>
                      <Input
                        type="file"
                        accept="audio/*,application/pdf,image/*,.doc,.docx"
                        onChange={handleFileSelect}
                      />
                      {msgFileName && (
                        <p className="text-xs text-muted-foreground">
                          {msgFileType?.startsWith("audio/") ? "🎵" : "📎"} {msgFileName}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          createMessage.mutate({
                            categoryId: cat.id,
                            title: msgTitle.trim(),
                            content: msgContent.trim(),
                            ...(msgFileName
                              ? { fileUrl: msgFileUrl, fileName: msgFileName, fileType: msgFileType }
                              : {}),
                          })
                        }
                        disabled={!msgTitle.trim() || !msgContent.trim() || createMessage.isPending}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAddingTo(null);
                          setMsgTitle("");
                          setMsgContent("");
                          setMsgFileUrl("");
                          setMsgFileName("");
                          setMsgFileType("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => setAddingTo(cat.id)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Adicionar mensagem
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
