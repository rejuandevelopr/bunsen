import 'server-only';

import OpenAI from 'openai';

// Verified against the OpenAI model catalog on 2026-07-20.
export const TUTOR_MODEL = 'gpt-5.6-terra';
export const GENERATOR_MODEL = 'gpt-5.6-sol';

let client: OpenAI | null = null;

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Add it to .env.local or set NEXT_PUBLIC_DEMO_MODE=true.',
    );
  }
  client ??= new OpenAI({ apiKey });
  return client;
}

export function normalizeUsage(
  usage: { input_tokens: number; output_tokens: number; total_tokens: number } | null | undefined,
  demo = false,
) {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
    demo,
  };
}
