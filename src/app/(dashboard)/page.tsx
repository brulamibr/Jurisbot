"use client";

import { trpc } from "@/lib/trpc/client";
import { StatCards } from "@/components/dashboard/stat-cards";
import { RecentConversations } from "@/components/dashboard/recent-conversations";
import { LeadsByArea } from "@/components/dashboard/leads-by-area";
import { LeadFunnel } from "@/components/dashboard/lead-funnel";
import { WhatsappStatus } from "@/components/dashboard/whatsapp-status";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";

export default function DashboardPage() {
  const stats = trpc.dashboard.stats.useQuery();
  const whatsapp = trpc.dashboard.whatsappStatus.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do atendimento do escritório
        </p>
      </div>

      <OnboardingChecklist />

      <StatCards
        activeConversations={stats.data?.activeConversations ?? 0}
        leadsToday={stats.data?.leadsToday ?? 0}
        hotLeads={stats.data?.hotLeads ?? 0}
        activeProcesses={stats.data?.activeProcesses ?? 0}
        isLoading={stats.isLoading}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentConversations
            conversations={stats.data?.recentConversations ?? []}
            isLoading={stats.isLoading}
          />
        </div>
        <WhatsappStatus
          instances={whatsapp.data ?? []}
          isLoading={whatsapp.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadFunnel
          data={stats.data?.leadsByScore ?? []}
          totalLeads={stats.data?.totalLeads ?? 0}
          isLoading={stats.isLoading}
        />
        <LeadsByArea
          data={stats.data?.leadsByArea ?? []}
          isLoading={stats.isLoading}
        />
      </div>
    </div>
  );
}
