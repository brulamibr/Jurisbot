import { prisma } from "@/lib/prisma";
import { extractText } from "./extractor";
import { chunkText } from "./chunker";
import { generateEmbeddings } from "./embeddings";

const BATCH_SIZE = 5;

export async function processDocument(documentId: string, openaiApiKey?: string): Promise<void> {
  const doc = await prisma.knowledgeDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) throw new Error(`Document ${documentId} not found`);

  try {
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
    });

    console.log(`[RAG] Processing ${doc.id} (${doc.fileName}, ${doc.fileType})`);

    console.log(`[RAG] Fetching file from ${doc.fileUrl}`);
    const response = await fetch(doc.fileUrl);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`[RAG] File fetched: ${buffer.length} bytes`);

    console.log(`[RAG] Extracting text...`);
    const text = await extractText(buffer, doc.fileType);
    console.log(`[RAG] Text extracted: ${text.length} chars`);

    if (!text || text.trim().length === 0) {
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { status: "ERROR", metadata: { error: "No text extracted" } },
      });
      console.log(`[RAG] No text extracted, marked as ERROR`);
      return;
    }

    const chunks = chunkText(text);
    console.log(`[RAG] Chunked into ${chunks.length} chunks`);

    if (chunks.length === 0) {
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { status: "ERROR", metadata: { error: "No chunks generated" } },
      });
      return;
    }

    await prisma.knowledgeChunk.deleteMany({ where: { documentId } });

    let insertedCount = 0;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      console.log(`[RAG] Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (${batch.length} chunks)`);

      const embeddings = await generateEmbeddings(batch.map((c) => c.content), openaiApiKey);

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const vectorStr = `[${embeddings[j].join(",")}]`;

        await prisma.$executeRawUnsafe(
          `INSERT INTO knowledge_chunks (id, document_id, content, embedding, chunk_index, metadata, created_at)
           VALUES ($1, $2, $3, $4::vector, $5, $6::jsonb, NOW())`,
          `chunk_${documentId}_${i + j}`,
          documentId,
          chunk.content,
          vectorStr,
          chunk.index,
          JSON.stringify(chunk.metadata)
        );
        insertedCount++;
      }
    }

    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: "READY",
        chunkCount: insertedCount,
        metadata: {
          textLength: text.length,
          chunksGenerated: insertedCount,
          processedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`[RAG] Document ${doc.id} READY — ${insertedCount} chunks`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[RAG] Document ${doc.id} FAILED:`, message);
    try {
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { status: "ERROR", metadata: { error: message } },
      });
    } catch (updateError) {
      console.error(`[RAG] Could not update status to ERROR:`, updateError);
    }
  }
}
