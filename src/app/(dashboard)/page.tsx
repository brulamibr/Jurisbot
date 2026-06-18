import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Users, Briefcase, Flame } from "lucide-react";

const stats = [
  {
    title: "Conversas Ativas",
    value: "—",
    description: "Atendimentos em andamento",
    icon: MessageSquare,
  },
  {
    title: "Leads Hoje",
    value: "—",
    description: "Novos contatos captados",
    icon: Users,
  },
  {
    title: "Leads Quentes",
    value: "—",
    description: "Prontos para conversão",
    icon: Flame,
    className: "text-warning",
  },
  {
    title: "Processos Ativos",
    value: "—",
    description: "Em acompanhamento",
    icon: Briefcase,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do atendimento do escritório
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon
                className={`h-4 w-4 text-muted-foreground ${stat.className ?? ""}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription className="text-xs">
                {stat.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversas Recentes</CardTitle>
            <CardDescription>
              Últimas interações via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conecte o WhatsApp para ver as conversas aqui.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads por Área</CardTitle>
            <CardDescription>Distribuição por área jurídica</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Os dados aparecerão conforme leads forem captados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
