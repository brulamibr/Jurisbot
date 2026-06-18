import type { AIProvider, AIMessage, AIResponse, AIOptions } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { GoogleProvider } from "./providers/google";
import { AnthropicProvider } from "./providers/anthropic";

const providers: AIProvider[] = [
  new OpenAIProvider(),
  new GoogleProvider(),
  new AnthropicProvider(),
];

function getAvailableProviders(): AIProvider[] {
  return providers.filter((p) => p.isAvailable());
}

function getProviderByName(name: string): AIProvider | undefined {
  return providers.find((p) => p.name === name && p.isAvailable());
}

export async function chat(
  messages: AIMessage[],
  options?: AIOptions & { preferredProvider?: string }
): Promise<AIResponse> {
  const available = getAvailableProviders();

  if (available.length === 0) {
    throw new Error(
      "Nenhum provedor de IA configurado. Configure OPENAI_API_KEY, GOOGLE_AI_API_KEY ou ANTHROPIC_API_KEY."
    );
  }

  // Try preferred provider first
  if (options?.preferredProvider) {
    const preferred = getProviderByName(options.preferredProvider);
    if (preferred) {
      try {
        return await preferred.chat(messages, options);
      } catch (error) {
        console.error(
          `Provider ${options.preferredProvider} failed, trying fallback:`,
          error
        );
      }
    }
  }

  // Try each available provider with fallback
  const errors: Error[] = [];
  for (const provider of available) {
    if (provider.name === options?.preferredProvider) continue;
    try {
      return await provider.chat(messages, options);
    } catch (error) {
      errors.push(error as Error);
      console.error(`Provider ${provider.name} failed:`, error);
    }
  }

  throw new Error(
    `Todos os provedores de IA falharam: ${errors.map((e) => e.message).join("; ")}`
  );
}

export function listAvailableProviders(): string[] {
  return getAvailableProviders().map((p) => p.name);
}
