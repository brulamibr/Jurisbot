"use client";

import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  BookOpen,
  FileText,
  Layers,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PROCESSING: { label: "Processando", icon: Loader2, variant: "outline" },
  READY: { label: "Pronto", icon: CheckCircle2, variant: "default" },
  ERROR: { label: "Erro", icon: AlertCircle, variant: "destructive" },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgePage() {
  const [search, setSearch] = useState("");

  const docsQuery = trpc.knowledge.list.useQuery(
    search ? { search } : undefined
  );
  const statsQuery = trpc.knowledge.stats.useQuery();
  const deleteDoc = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      docsQuery.refetch();
      statsQuery.refetch();
    },
  });

  const docs = docsQuery.data ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Base de Conhecimento</h1>
          <p className="text-sm text-muted-foreground">
            Documentos jurídicos indexados para consulta pela IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button disabled>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </div>

      {/* Stats */}
      {statsQuery.data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Documentos
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {statsQuery.data.total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Prontos</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {statsQuery.data.ready}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">
                  Processando
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {statsQuery.data.processing}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Chunks</span>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {statsQuery.data.totalChunks}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {docsQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">Nenhum documento</p>
              <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
                Faça upload de PDFs, DOCXs ou textos para a IA consultar
                durante os atendimentos via WhatsApp.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Adicionado
                  </TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => {
                  const status = statusConfig[doc.status] ?? statusConfig.ERROR;
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.fileName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {doc.fileType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc._count.chunks}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="text-xs">
                          <StatusIcon
                            className={`mr-1 h-3 w-3 ${
                              doc.status === "PROCESSING" ? "animate-spin" : ""
                            }`}
                          />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(doc.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={<Button variant="ghost" size="icon" />}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Excluir documento?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Isso removerá o documento e todos os seus chunks
                                da base de conhecimento. Esta ação não pode ser
                                desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteDoc.mutate({ id: doc.id })}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
