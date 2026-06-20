"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Smartphone,
  Bot,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  completed: boolean;
}

export function OnboardingChecklist() {
  const whatsapp = trpc.dashboard.whatsappStatus.useQuery();
  const aiConfig = trpc.aiConfig.getDefault.useQuery();
  const knowledge = trpc.knowledge.stats.useQuery();

  const isLoading =
    whatsapp.isLoading || aiConfig.isLoading || knowledge.isLoading;

  if (isLoading) return null;

  const hasWhatsapp =
    (whatsapp.data ?? []).some(
      (i: { status: string }) => i.status === "CONNECTED"
    );
  const hasAiConfig = !!aiConfig.data;
  const hasKnowledge = (knowledge.data?.ready ?? 0) > 0;

  const steps: Step[] = [
    {
      key: "whatsapp",
      label: "Conectar WhatsApp",
      description: "Escaneie o QR Code para conectar seu número",
      href: "/whatsapp",
      icon: Smartphone,
      completed: hasWhatsapp,
    },
    {
      key: "ai",
      label: "Configurar IA",
      description: "Escolha o modelo e personalize o comportamento",
      href: "/settings",
      icon: Bot,
      completed: hasAiConfig,
    },
    {
      key: "knowledge",
      label: "Enviar documentos",
      description: "Suba PDFs para a IA consultar nos atendimentos",
      href: "/knowledge",
      icon: BookOpen,
      completed: hasKnowledge,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Configure seu escritório ({completedCount}/{steps.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step) => {
            return (
              <div
                key={step.key}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2.5",
                  step.completed
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                    : "border-border bg-card"
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {!step.completed && (
                  <Link href={step.href}>
                    <Button variant="outline" size="sm">
                      Configurar
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
