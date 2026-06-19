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

export function chunkText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_CHUNK_OVERLAP
): TextChunk[] {
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length <= chunkSize) {
    return [{ content: cleaned, index: 0, metadata: { charStart: 0, charEnd: cleaned.length } }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    if (end < cleaned.length) {
      const lastPeriod = cleaned.lastIndexOf(". ", end);
      const lastNewline = cleaned.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push({
      content: cleaned.slice(start, end).trim(),
      index,
      metadata: { charStart: start, charEnd: end },
    });

    start = end - overlap;
    if (start >= cleaned.length) break;
    index++;
  }

  return chunks;
}
