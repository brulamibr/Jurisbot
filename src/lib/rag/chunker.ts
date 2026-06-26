export interface TextChunk {
  content: string;
  index: number;
  metadata: {
    charStart: number;
    charEnd: number;
  };
}

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;

const MAX_CHUNKS = 500;

export function chunkText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_CHUNK_OVERLAP
): TextChunk[] {
  if (!text || typeof text !== "string") return [];

  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length === 0) return [];

  if (cleaned.length <= chunkSize) {
    return [{ content: cleaned, index: 0, metadata: { charStart: 0, charEnd: cleaned.length } }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;
  const minAdvance = Math.max(chunkSize - overlap, 1);

  while (start < cleaned.length && index < MAX_CHUNKS) {
    let end = Math.min(start + chunkSize, cleaned.length);

    if (end < cleaned.length) {
      const lastPeriod = cleaned.lastIndexOf(". ", end);
      const lastNewline = cleaned.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    const content = cleaned.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({
        content,
        index,
        metadata: { charStart: start, charEnd: end },
      });
    }

    const nextStart = Math.max(end - overlap, start + minAdvance);
    if (nextStart <= start) break;
    start = nextStart;
    index++;
  }

  return chunks;
}
