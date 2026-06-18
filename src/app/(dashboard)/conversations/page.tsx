import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie todos os atendimentos via WhatsApp
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4 text-lg">Inbox de Conversas</CardTitle>
          <CardDescription className="mt-2 max-w-sm text-center">
            Layout em 3 colunas estilo Chatwoot: lista de conversas, chat
            central e painel de dados do contato. Conecte o WhatsApp para
            começar.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
