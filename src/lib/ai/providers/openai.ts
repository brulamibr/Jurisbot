import OpenAI from "openai";
import type { AIProvider, AIMessage, AIResponse, AIOptions } from "../types";

const COST_PER_1K_INPUT = 0.0025;
const COST_PER_1K_OUTPUT = 0.01;

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private client: OpenAI | null = null;

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return this.client;
  }

  async chat(messages: AIMessage[], options?: AIOptions): Promise<AIResponse> {
    const client = this.getClient();
    const model = options?.model ?? "gpt-4o";

    const response = await client.chat.completions.create({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    });

    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    const totalTokens = inputTokens + outputTokens;
    const cost =
      (inputTokens / 1000) * COST_PER_1K_INPUT +
      (outputTokens / 1000) * COST_PER_1K_OUTPUT;

    return {
      content: response.choices[0]?.message?.content ?? "",
      model,
      provider: this.name,
      tokensUsed: totalTokens,
      cost,
    };
  }
}
