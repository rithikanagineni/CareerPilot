// ============================================================
// CareerPilot — Amazon Bedrock AI Provider
// Uses @aws-sdk/client-bedrock-runtime
// Requires: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
//           BEDROCK_MODEL_ID (see .env.example)
// ============================================================
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { AIMessage, AIResponse, AIProvider } from './types';

export class BedrockProvider implements AIProvider {
  name = 'Amazon Bedrock';
  private client: BedrockRuntimeClient | null = null;
  private modelId: string;

  constructor() {
    this.modelId =
      process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-haiku-4-5-20251001-v1:0';

    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (region && accessKeyId && secretAccessKey) {
      this.client = new BedrockRuntimeClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  isAvailable(): boolean {
    return (
      this.client !== null &&
      Boolean(process.env.AWS_REGION) &&
      Boolean(process.env.AWS_ACCESS_KEY_ID) &&
      Boolean(process.env.AWS_SECRET_ACCESS_KEY)
    );
  }

  async generateResponse(
    messages: AIMessage[],
    systemPrompt?: string
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Amazon Bedrock client is not configured. Please set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.');
    }

    // Format for Claude (Anthropic Messages API via Bedrock)
    const formattedMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      system: systemPrompt ?? 'You are CareerPilot, an AI career agent helping students and early-career developers find opportunities and build their careers.',
      messages: formattedMessages,
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const content =
      responseBody.content?.[0]?.text ??
      'I apologize, but I could not generate a response.';

    return {
      content,
      provider: 'Amazon Bedrock',
      model: this.modelId,
      usage: {
        inputTokens: responseBody.usage?.input_tokens,
        outputTokens: responseBody.usage?.output_tokens,
      },
    };
  }
}
