import type { AIProvider, AIMessage, AIResponse, AIOptions, AIApiKeys } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { GoogleProvider } from "./providers/google";
import { AnthropicProvider } from "./providers/anthropic";

const providers: AIProvider[] = [
  new OpenAIProvider(),
  new GoogleProvider(),
  new AnthropicProvider(),
];

const providerKeyMap: Record<string, keyof AIApiKeys> = {
  openai: "openai",
  google: "google",
  anthropic: "anthropic",
};

function getAvailableProviders(apiKeys?: AIApiKeys): AIProvider[] {
  return providers.filter((p) => p.isAvailable(apiKeys));
}

function getProviderByName(name: string, apiKeys?: AIApiKeys): AIProvider | undefined {
  return providers.find((p) => p.name === name && p.isAvailable(apiKeys));
}

export async function chat(
  messages: AIMessage[],
  options?: AIOptions & { preferredProvider?: string; apiKeys?: AIApiKeys }
): Promise<AIResponse> {
  const apiKeys = options?.apiKeys;
  const available = getAvailableProviders(apiKeys);

  if (available.length === 0) {
    throw new Error(
      "Nenhum provedor de IA configurado. Adicione suas chaves de API em Configurações → IA."
    );
  }

  if (options?.preferredProvider) {
    const preferred = getProviderByName(options.preferredProvider, apiKeys);
    if (preferred) {
      try {
        const key = apiKeys?.[providerKeyMap[preferred.name]];
        return await preferred.chat(messages, options, key);
      } catch (error) {
        console.error(
          `Provider ${options.preferredProvider} failed, trying fallback:`,
          error
        );
      }
    }
  }

  const errors: Error[] = [];
  for (const provider of available) {
    if (provider.name === options?.preferredProvider) continue;
    try {
      const key = apiKeys?.[providerKeyMap[provider.name]];
      return await provider.chat(messages, options, key);
    } catch (error) {
      errors.push(error as Error);
      console.error(`Provider ${provider.name} failed:`, error);
    }
  }

  throw new Error(
    `Todos os provedores de IA falharam: ${errors.map((e) => e.message).join("; ")}`
  );
}

export function listAvailableProviders(apiKeys?: AIApiKeys): string[] {
  return getAvailableProviders(apiKeys).map((p) => p.name);
}
