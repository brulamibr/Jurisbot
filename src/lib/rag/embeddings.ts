import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 10;

function getClient(apiKey?: string) {
  return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
}

export async function generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
  const response = await getClient(apiKey).embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: 1536,
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(
  texts: string[],
  apiKey?: string
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await getClient(apiKey).embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: 1536,
    });

    results.push(...response.data.map((d) => d.embedding));
  }

  return results;
}
