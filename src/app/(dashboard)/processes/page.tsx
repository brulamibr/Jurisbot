import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function ProcessesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Processos</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhamento de processos judiciais dos clientes
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4 text-lg">Consulta de Processos</CardTitle>
          <CardDescription className="mt-2 max-w-sm text-center">
            Integração com PJe, Esaj e sistemas de gestão. Busca por CPF ou
            número do processo com alertas de movimentação.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
