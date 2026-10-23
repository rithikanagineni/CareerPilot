// ============================================================
// CareerPilot — AI Provider Factory
// Automatically selects Amazon Bedrock when credentials are
// configured, otherwise falls back to deterministic demo mode.
// ============================================================
import { BedrockProvider } from './bedrock';
import { FallbackProvider } from './fallback';
import type { AIProvider } from './types';

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (providerInstance) return providerInstance;

  const bedrockProvider = new BedrockProvider();

  if (bedrockProvider.isAvailable()) {
    console.log('[AI] Using Amazon Bedrock provider');
    providerInstance = bedrockProvider;
  } else {
    console.log('[AI] Amazon Bedrock not configured — using deterministic fallback provider');
    providerInstance = new FallbackProvider();
  }

  return providerInstance;
}

export type { AIProvider, AIMessage, AIResponse } from './types';
