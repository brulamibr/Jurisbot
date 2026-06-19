import { PDFParse } from "pdf-parse";

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
      return buffer.toString("utf-8");
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
