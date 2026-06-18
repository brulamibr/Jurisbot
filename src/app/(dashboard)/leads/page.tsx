import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Pipeline de qualificação e conversão de leads
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4 text-lg">Pipeline Kanban</CardTitle>
          <CardDescription className="mt-2 max-w-sm text-center">
            Board estilo Pipedrive com colunas Frio / Morno / Quente /
            Convertido. Drag & drop e filtros por área jurídica.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
