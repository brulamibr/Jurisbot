"use client";

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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const me = trpc.user.me.useQuery();
  const office = trpc.office.get.useQuery();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu perfil e configurações do escritório
        </p>
      </div>

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
                <Input defaultValue={me.data?.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input defaultValue={me.data?.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Permissão</Label>
                <Input defaultValue={me.data?.role} disabled />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escritório</CardTitle>
          <CardDescription>Dados do escritório</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {office.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nome do Escritório</Label>
                <Input defaultValue={office.data?.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input defaultValue={office.data?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input defaultValue={office.data?.phone ?? ""} disabled />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-center text-xs text-muted-foreground">
        Edição completa de perfil e configurações do escritório — Milestone 10
      </p>
    </div>
  );
}
