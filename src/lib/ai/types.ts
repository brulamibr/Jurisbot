export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed: number;
  cost: number;
}

export interface AIProvider {
  name: string;
  isAvailable(apiKeys?: AIApiKeys): boolean;
  chat(messages: AIMessage[], options?: AIOptions, apiKey?: string): Promise<AIResponse>;
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIApiKeys {
  openai?: string;
  google?: string;
  anthropic?: string;
}

export type ProviderName = "openai" | "google" | "anthropic";
