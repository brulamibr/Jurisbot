import { prisma } from "@/lib/prisma";
import { extractText } from "./extractor";
import { chunkText } from "./chunker";
import { generateEmbeddings } from "./embeddings";

export async function processDocument(documentId: string): Promise<void> {
  const doc = await prisma.knowledgeDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) throw new Error(`Document ${documentId} not found`);

  try {
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
    });

    const response = await fetch(doc.fileUrl);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await extractText(buffer, doc.fileType);

    const chunks = chunkText(text);

    if (chunks.length === 0) {
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { status: "ERROR", metadata: { error: "No text extracted" } },
      });
      return;
    }

    const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

    await prisma.knowledgeChunk.deleteMany({
      where: { documentId },
    });

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const vectorStr = `[${embedding.join(",")}]`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO knowledge_chunks (id, document_id, content, embedding, chunk_index, metadata, created_at)
         VALUES ($1, $2, $3, $4::vector, $5, $6::jsonb, NOW())`,
        `chunk_${documentId}_${i}`,
        documentId,
        chunk.content,
        vectorStr,
        chunk.index,
        JSON.stringify(chunk.metadata)
      );
    }

    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: "READY",
        chunkCount: chunks.length,
        metadata: {
          textLength: text.length,
          chunksGenerated: chunks.length,
          processedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: "ERROR",
        metadata: { error: message },
      },
    });
    throw error;
  }
}
