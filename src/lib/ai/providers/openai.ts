import OpenAI from "openai";
import type { AIProvider, AIMessage, AIResponse, AIOptions, AIApiKeys } from "../types";

const COST_PER_1K_INPUT = 0.0025;
const COST_PER_1K_OUTPUT = 0.01;

export class OpenAIProvider implements AIProvider {
  name = "openai";

  private resolveKey(apiKeys?: AIApiKeys): string | undefined {
    return apiKeys?.openai || process.env.OPENAI_API_KEY;
  }

  isAvailable(apiKeys?: AIApiKeys): boolean {
    return !!this.resolveKey(apiKeys);
  }

  async chat(messages: AIMessage[], options?: AIOptions, apiKey?: string): Promise<AIResponse> {
    const key = apiKey || process.env.OPENAI_API_KEY;
    const client = new OpenAI({ apiKey: key });
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
