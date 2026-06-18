import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function KnowledgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Base de Conhecimento
        </h1>
        <p className="text-sm text-muted-foreground">
          Documentos jurídicos indexados para consulta pela IA
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4 text-lg">RAG Jurídico</CardTitle>
          <CardDescription className="mt-2 max-w-sm text-center">
            Upload de PDFs, DOCXs e textos. Indexação semântica via embeddings
            para a IA consultar durante os atendimentos.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
