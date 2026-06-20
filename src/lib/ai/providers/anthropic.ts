import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIMessage, AIResponse, AIOptions, AIApiKeys } from "../types";

const COST_PER_1K_INPUT = 0.003;
const COST_PER_1K_OUTPUT = 0.015;

export class AnthropicProvider implements AIProvider {
  name = "anthropic";

  private resolveKey(apiKeys?: AIApiKeys): string | undefined {
    return apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY;
  }

  isAvailable(apiKeys?: AIApiKeys): boolean {
    return !!this.resolveKey(apiKeys);
  }

  async chat(messages: AIMessage[], options?: AIOptions, apiKey?: string): Promise<AIResponse> {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    const client = new Anthropic({ apiKey: key });
    const model = options?.model ?? "claude-sonnet-4-6";

    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await client.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 1024,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: chatMessages,
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    const cost =
      (inputTokens / 1000) * COST_PER_1K_INPUT +
      (outputTokens / 1000) * COST_PER_1K_OUTPUT;

    return {
      content: text,
      model,
      provider: this.name,
      tokensUsed: totalTokens,
      cost,
    };
  }
}
