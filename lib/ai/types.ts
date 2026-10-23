// ============================================================
// CareerPilot — AI Provider Interface
// ============================================================

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface AIProvider {
  name: string;
  generateResponse(
    messages: AIMessage[],
    systemPrompt?: string
  ): Promise<AIResponse>;
  isAvailable(): boolean;
}
