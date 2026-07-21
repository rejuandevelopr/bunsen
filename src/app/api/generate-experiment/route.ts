import { NextResponse } from 'next/server';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import {
  GENERATOR_MODEL,
  getOpenAIClient,
  isDemoMode,
  normalizeUsage,
} from '@/lib/ai/client';
import { buildGeneratorSystemPrompt } from '@/lib/ai/prompts';
import demoIceData from '@/lib/experiments/demo-ice-density.json';
import {
  ExperimentSchema,
  ExperimentWireSchema,
  type Experiment,
} from '@/lib/experiments/schema';
import titrationData from '@/lib/experiments/titration.json';

export const runtime = 'nodejs';

const GeneratorRequestSchema = z.object({ question: z.string().min(6).max(180) }).strict();
const titrationExample = ExperimentSchema.parse(titrationData);
const demoIceExperiment = ExperimentSchema.parse(demoIceData);

export async function POST(request: Request) {
  const parsed = GeneratorRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please ask a complete science question.' },
      { status: 400 },
    );
  }

  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, demo: true };
    console.info('[Bunsen:ai-usage] generator-demo', usage);
    return NextResponse.json({
      experiment: demoIceExperiment,
      usage,
      model: `${GENERATOR_MODEL} (demo)`,
      attempts: 1,
    });
  }

  try {
    const client = getOpenAIClient();
    const systemPrompt = buildGeneratorSystemPrompt(titrationExample);
    let repairContext = '';
    const totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, demo: false };

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const response = await client.responses.parse({
        model: GENERATOR_MODEL,
        reasoning: { effort: 'medium' },
        instructions: systemPrompt,
        input: `Student question: ${parsed.data.question}${repairContext}`,
        text: {
          format: zodTextFormat(ExperimentWireSchema, 'bunsen_experiment'),
        },
      });

      const callUsage = normalizeUsage(response.usage);
      totalUsage.inputTokens += callUsage.inputTokens;
      totalUsage.outputTokens += callUsage.outputTokens;
      totalUsage.totalTokens += callUsage.totalTokens;
      console.info('[Bunsen:ai-usage] generator', {
        attempt,
        model: response.model,
        ...callUsage,
      });

      const candidate = response.output_parsed as Experiment | null;
      const validated = ExperimentSchema.safeParse(candidate);
      if (validated.success) {
        return NextResponse.json({
          experiment: validated.data,
          usage: totalUsage,
          model: response.model,
          attempts: attempt,
        });
      }

      const validationErrors = validated.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('\n');
      repairContext = `\n\nYour previous response failed local validation. Return a corrected complete object. Validation errors:\n${validationErrors}`;
    }

    return NextResponse.json(
      {
        error:
          'The professor could not turn that question into a valid experiment after two attempts. Try a narrower science question.',
      },
      { status: 422 },
    );
  } catch (error) {
    console.error('[Bunsen:generator]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The experiment generator is unavailable. Please try again.',
      },
      { status: 503 },
    );
  }
}
