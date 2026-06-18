import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, AIMessage, AIResponse, AIOptions } from "../types";

const COST_PER_1K_INPUT = 0.00125;
const COST_PER_1K_OUTPUT = 0.005;

export class GoogleProvider implements AIProvider {
  name = "google";
  private client: GoogleGenerativeAI | null = null;

  isAvailable(): boolean {
    return !!process.env.GOOGLE_AI_API_KEY;
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
    }
    return this.client;
  }

  async chat(messages: AIMessage[], options?: AIOptions): Promise<AIResponse> {
    const client = this.getClient();
    const modelName = options?.model ?? "gemini-1.5-pro";
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    });

    const systemMsg = messages.find((m) => m.role === "system");
    const history = messages
      .filter((m) => m.role !== "system")
      .slice(0, -1)
      .map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({
      history,
      ...(systemMsg ? { systemInstruction: systemMsg.content } : {}),
    });

    const userContent = messages.filter((m) => m.role === "user").pop();
    const result = await chat.sendMessage(userContent?.content ?? "");
    const response = result.response;
    const text = response.text();

    const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
    const totalTokens = inputTokens + outputTokens;
    const cost =
      (inputTokens / 1000) * COST_PER_1K_INPUT +
      (outputTokens / 1000) * COST_PER_1K_OUTPUT;

    return {
      content: text,
      model: modelName,
      provider: this.name,
      tokensUsed: totalTokens,
      cost,
    };
  }
}
