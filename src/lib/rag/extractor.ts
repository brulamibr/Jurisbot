import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  switch (fileType.toLowerCase()) {
    case "pdf":
    case "application/pdf":
      return extractPdfText(buffer);
    case "txt":
    case "text/plain":
    case "md":
    case "text/markdown":
      return buffer.toString("utf-8");
    case "docx":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "doc":
    case "application/msword":
      return extractDocxText(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parser: any = new PDFParse({ data: new Uint8Array(buffer) });
  await parser.load();
  return parser.getText() as string;
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
