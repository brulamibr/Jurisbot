"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Shield, UserPlus } from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  LAWYER: "Advogado",
  ATTENDANT: "Atendente",
};

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  LAWYER: "secondary",
  ATTENDANT: "outline",
};

export default function UsersPage() {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>("");

  const usersQuery = trpc.user.list.useQuery();
  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
      setEditingUser(null);
    },
  });
  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => usersQuery.refetch(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os membros da equipe do escritório
          </p>
        </div>
        <Button disabled>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>
            {usersQuery.data?.length ?? 0} membro(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : usersQuery.data && usersQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant[user.role] ?? "outline"}>
                        <Shield className="mr-1 h-3 w-3" />
                        {roleLabels[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "outline" : "secondary"}>
                        {user.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUser(user.id);
                              setEditRole(user.role);
                            }}
                          >
                            Alterar Permissão
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateUser.mutate({
                                id: user.id,
                                isActive: !user.isActive,
                              })
                            }
                          >
                            {user.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteUser.mutate({ id: user.id })}
                          >
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editingUser !== null}
        onOpenChange={() => setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Permissão</DialogTitle>
            <DialogDescription>
              Selecione o novo nível de permissão para o usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Permissão</Label>
            <div className="flex gap-2">
              {Object.entries(roleLabels).map(([value, label]) => (
                <Button
                  key={value}
                  variant={editRole === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditRole(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (editingUser) {
                  updateUser.mutate({
                    id: editingUser,
                    role: editRole as "ADMIN" | "LAWYER" | "ATTENDANT",
                  });
                }
              }}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
