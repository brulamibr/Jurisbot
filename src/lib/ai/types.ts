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
  isAvailable(): boolean;
  chat(messages: AIMessage[], options?: AIOptions): Promise<AIResponse>;
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export type ProviderName = "openai" | "google" | "anthropic";
