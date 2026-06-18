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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Briefcase,
  User,
  Scale,
  Calendar,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProcessesPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const processesQuery = trpc.process.list.useQuery(
    search ? { search } : undefined
  );
  const statsQuery = trpc.process.stats.useQuery();
  const processDetail = trpc.process.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const processes = processesQuery.data ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Processos</h1>
          <p className="text-sm text-muted-foreground">
            {statsQuery.data
              ? `${statsQuery.data.total} processos | ${statsQuery.data.active} ativos`
              : "Carregando..."}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, assunto..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      {statsQuery.data && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {statsQuery.data.total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Ativos</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-primary">
                {statsQuery.data.active}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Arquivados
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {statsQuery.data.archived}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Process Table */}
      <Card>
        <CardContent className="p-0">
          {processesQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : processes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                {search
                  ? "Nenhum processo encontrado"
                  : "Nenhum processo cadastrado"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Assunto
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Vara</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    <ArrowUpDown className="inline h-3 w-3" /> Movimentações
                  </TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes.map((proc) => (
                  <TableRow
                    key={proc.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(proc.id)}
                  >
                    <TableCell className="font-mono text-sm">
                      {proc.number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">
                          {proc.contact.name ?? proc.contact.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                      {proc.subject ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {proc.court ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          proc.status === "Arquivado" ? "secondary" : "default"
                        }
                        className="text-xs"
                      >
                        {proc.status ?? "Em andamento"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-center md:table-cell">
                      {proc._count.movements}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Process Detail Sheet */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalhes do Processo</SheetTitle>
          </SheetHeader>
          {processDetail.data && (
            <ProcessDetail process={processDetail.data} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProcessDetail({
  process,
}: {
  process: {
    number: string;
    subject: string | null;
    court: string | null;
    judge: string | null;
    legalArea: string | null;
    status: string | null;
    createdAt: Date;
    contact: { name: string | null; phone: string; email: string | null };
    movements: {
      id: string;
      date: Date;
      title: string;
      description: string | null;
    }[];
  };
}) {
  return (
    <div className="mt-4 space-y-6">
      {/* Process Info */}
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Número do Processo</p>
          <p className="font-mono text-lg font-semibold">{process.number}</p>
        </div>

        {process.subject && (
          <div>
            <p className="text-xs text-muted-foreground">Assunto</p>
            <p className="text-sm">{process.subject}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {process.court && (
            <div>
              <p className="text-xs text-muted-foreground">Vara / Tribunal</p>
              <p className="text-sm">{process.court}</p>
            </div>
          )}
          {process.legalArea && (
            <div>
              <p className="text-xs text-muted-foreground">Área Jurídica</p>
              <p className="text-sm">{process.legalArea}</p>
            </div>
          )}
          {process.status && (
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                variant={
                  process.status === "Arquivado" ? "secondary" : "default"
                }
              >
                {process.status}
              </Badge>
            </div>
          )}
          {process.judge && (
            <div>
              <p className="text-xs text-muted-foreground">Juiz</p>
              <p className="text-sm">{process.judge}</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Client */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium uppercase text-muted-foreground">
          Cliente
        </h4>
        <p className="text-sm font-medium">
          {process.contact.name ?? process.contact.phone}
        </p>
        <p className="text-xs text-muted-foreground">{process.contact.phone}</p>
        {process.contact.email && (
          <p className="text-xs text-muted-foreground">
            {process.contact.email}
          </p>
        )}
      </div>

      <Separator />

      {/* Movements Timeline */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium uppercase text-muted-foreground">
          Movimentações ({process.movements.length})
        </h4>

        {process.movements.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma movimentação registrada
          </p>
        ) : (
          <div className="relative space-y-4 pl-6">
            <div className="absolute bottom-0 left-2 top-0 w-px bg-border" />
            {process.movements.map((mov) => (
              <div key={mov.id} className="relative">
                <div className="absolute -left-[1.15rem] top-1.5 h-2 w-2 rounded-full bg-primary" />
                <div className="flex items-baseline justify-between">
                  <Badge variant="outline" className="text-xs">
                    {mov.title}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(mov.date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                {mov.description && (
                  <p className="mt-1 text-sm">{mov.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
