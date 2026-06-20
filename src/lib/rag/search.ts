import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "./embeddings";

export interface SearchResult {
  content: string;
  documentTitle: string;
  score: number;
}

export async function searchKnowledge(
  officeId: string,
  query: string,
  topK = 5,
  openaiApiKey?: string
): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(query, openaiApiKey);
  const vectorStr = `[${embedding.join(",")}]`;

  const results = await prisma.$queryRawUnsafe<
    { content: string; title: string; score: number }[]
  >(
    `SELECT kc.content, kd.title,
     1 - (kc.embedding <=> $1::vector) as score
     FROM knowledge_chunks kc
     JOIN knowledge_documents kd ON kd.id = kc.document_id
     WHERE kd.office_id = $2
     AND kc.embedding IS NOT NULL
     ORDER BY kc.embedding <=> $1::vector
     LIMIT $3`,
    vectorStr,
    officeId,
    topK
  );

  return results.map((r) => ({
    content: r.content,
    documentTitle: r.title,
    score: r.score,
  }));
}

export function buildRagContext(results: SearchResult[]): string {
  if (results.length === 0) return "";

  const contextParts = results.map(
    (r) =>
      `[Documento: ${r.documentTitle}]\n${r.content}`
  );

  return `\n\nCONTEXTO DA BASE DE CONHECIMENTO DO ESCRITÓRIO:\nUse as informações abaixo para embasar suas respostas quando relevante:\n\n${contextParts.join("\n\n---\n\n")}`;
}
