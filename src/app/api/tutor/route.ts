import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getOpenAIClient,
  isDemoMode,
  normalizeUsage,
  TUTOR_MODEL,
} from '@/lib/ai/client';
import {
  NPC_PERSONA_IDS,
  NPC_PERSONAS,
  type NpcPersonaId,
} from '@/lib/ai/personas';

export const runtime = 'nodejs';

const TutorRequestSchema = z
  .object({
    experimentState: z.unknown(),
    actionHistory: z.array(z.unknown()).max(40),
    chatHistory: z
      .array(
        z.object({
          role: z.enum(['player', 'professor']),
          content: z.string().max(1200),
        }),
      )
      .max(24),
    playerMessage: z.string().min(1).max(1200),
    contextType: z.enum(['chat', 'failure', 'surprise', 'queued']).optional(),
    personaId: z.enum(NPC_PERSONA_IDS).default('professor-quill'),
    currentZone: z.enum(['study', 'chemistry', 'greenhouse', 'instrument', 'discovery']),
    experimentProgress: z
      .object({
        current: z.object({
          id: z.string().max(80),
          title: z.string().max(120),
          status: z.enum(['ready', 'running', 'complete']),
          completedSteps: z.number().int().nonnegative(),
          totalSteps: z.number().int().positive(),
        }),
        completed: z
          .array(
            z.object({
              id: z.string().max(80),
              title: z.string().max(120),
            }),
          )
          .max(12),
      })
      .strict(),
  })
  .strict();

type TutorRequest = z.infer<typeof TutorRequestSchema>;

export async function POST(request: Request) {
  const parsed = TutorRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'That tutor message was not in the expected format.' },
      { status: 400 },
    );
  }

  if (isDemoMode()) return createDemoTutorStream(parsed.data);

  try {
    const client = getOpenAIClient();
    const persona = NPC_PERSONAS[parsed.data.personaId];
    const stream = await client.responses.create(
      {
        model: TUTOR_MODEL,
        reasoning: { effort: 'low' },
        instructions: persona.systemPrompt,
        input: buildTutorInput(parsed.data),
        stream: true,
      },
      { signal: request.signal },
    );

    return createSseResponse(async (send) => {
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          send({ type: 'token', token: event.delta });
        }
        if (event.type === 'response.completed') {
          const usage = normalizeUsage(event.response.usage);
          console.info('[Bunsen:ai-usage] npc-chat', {
            personaId: parsed.data.personaId,
            model: event.response.model,
            ...usage,
          });
          send({ type: 'usage', usage, model: event.response.model });
        }
      }
    });
  } catch (error) {
    console.error('[Bunsen:tutor]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Professor Quill could not connect. Please try again.',
      },
      { status: 503 },
    );
  }
}

function buildTutorInput(body: TutorRequest) {
  return `
LIVE EXPERIMENT STATE
${JSON.stringify(body.experimentState)}

RECENT ACTION HISTORY
${JSON.stringify(body.actionHistory)}

RECENT CHAT
${JSON.stringify(body.chatHistory)}

ACTIVE PERSONA
${JSON.stringify({ id: body.personaId, name: NPC_PERSONAS[body.personaId].name, domain: NPC_PERSONAS[body.personaId].domain })}

CURRENT ZONE
${body.currentZone}

EXPERIMENT PROGRESS SUMMARY
${JSON.stringify(body.experimentProgress)}

CONTEXT TYPE
${body.contextType ?? 'chat'}

LEARNER MESSAGE OR EVENT
${body.playerMessage}
  `.trim();
}

function createDemoTutorStream(body: TutorRequest) {
  const reply = getDemoReply(body);
  const inputTokens = Math.ceil(buildTutorInput(body).length / 4);
  const outputTokens = Math.ceil(reply.length / 4);
  const usage = {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    demo: true,
  };

  return createSseResponse(async (send) => {
    for (const token of reply.match(/\S+\s*/g) ?? [reply]) {
      send({ type: 'token', token });
      await new Promise((resolve) => setTimeout(resolve, 34));
    }
    console.info('[Bunsen:ai-usage] npc-chat-demo', { personaId: body.personaId, ...usage });
    send({ type: 'usage', usage, model: `${TUTOR_MODEL} (demo)` });
  });
}

function getDemoReply(body: TutorRequest) {
  if (body.personaId !== 'professor-quill') {
    return getDemoSpecialistReply(body.personaId, body.playerMessage);
  }
  if (body.contextType === 'failure' || /overshot|failure|too much/i.test(body.playerMessage)) {
    return 'Failures are data: the strong lasting color tells you the pH moved beyond the endpoint. What change in how the base was added would give the indicator time to show the boundary more precisely?';
  }
  if (body.contextType === 'surprise' || /surprise|float|rises|flash/i.test(body.playerMessage)) {
    return 'That result is a useful surprise because it reveals a difference you cannot see from mass alone. What relationship between mass and occupied volume could account for the object settling where it did?';
  }
  if (/answer|tell me|what should i do next/i.test(body.playerMessage)) {
    return 'I will not choose the next action for you, but we can examine the evidence together. Which observation in your latest trial most directly bears on the question you are testing?';
  }
  return 'Look closely at what changed after your last action and what stayed constant. Which single observation would help you distinguish between your two most likely explanations?';
}

function getDemoSpecialistReply(personaId: Exclude<NpcPersonaId, 'professor-quill'>, message: string) {
  const replies: Record<Exclude<NpcPersonaId, 'professor-quill'>, readonly [RegExp, string][]> = {
    'mira-chen': [
      [/magnif|lens/i, 'Magnification makes an image appear larger, but the lens diameter and optical quality determine how much detail the scope can actually resolve. On these floor scopes, careful focus and a stable tripod matter as much as the magnification number.'],
      [/light|color|rainbow/i, 'A lens redirects light by refraction, and different wavelengths bend by slightly different amounts. That is why optical instruments need careful lens design to keep colored edges from appearing around a focused image.'],
      [/./, 'A telescope gathers light and brings rays from a distant object to a focus. The scopes here demonstrate that alignment, stability, and aperture all shape what an observer can distinguish.'],
    ],
    'elias-reed': [
      [/calibrat/i, 'Calibration compares an instrument with a trusted reference so its readings can be corrected or confirmed. The dial panel is useful because a gauge can look precise while still being consistently wrong.'],
      [/unit|measure/i, 'A number without a unit cannot communicate the physical quantity being measured. Recording both the unit and the instrument resolution makes results comparable and exposes the size of the uncertainty.'],
      [/./, 'Scientific instruments extend our senses, but every reading has a range and uncertainty. At this bench, repeat measurements and a zero check are the first defenses against misleading data.'],
    ],
    'lena-ortiz': [
      [/gravity|moon|bounce/i, 'The Moon’s surface gravity is about one-sixth of Earth’s, so an object accelerates downward more slowly there. Its mass stays the same, but its weight changes, which is why the Moon arc beside the astronaut rises higher and lasts longer.'],
      [/suit|astronaut/i, 'A spacesuit is a tiny life-support spacecraft: it supplies pressure and oxygen, removes carbon dioxide and heat, and shields the wearer. Its stiff pressurized joints also change how an astronaut moves.'],
      [/robot|armature|joint/i, 'Robotic joints imitate some functions of bones and muscles using motors, sensors, and control software. The armature display helps compare a mechanical linkage with the ranges and constraints of a human limb.'],
    ],
    'amara-okafor': [
      [/result|data|conclusion/i, 'Start by separating the recorded observation from its explanation: what changed, by how much, and under which conditions? A conclusion is strongest when it cites that evidence and acknowledges uncertainty or alternative explanations.'],
      [/method|hypothesis|variable/i, 'The scientific method is an iterative pattern rather than a rigid checklist: ask, predict, test, inspect evidence, and revise. Keeping one independent variable clear makes it easier to connect a result to a cause.'],
      [/./, 'Good chemistry notes preserve quantities, units, conditions, and unexpected observations. The papers on these tables are arranged so another researcher could reconstruct what happened instead of trusting memory.'],
    ],
    'kai-morgan': [
      [/where|explore|next/i, 'For reactions and substances, visit Chemistry Lab; for plants and light, try Greenhouse Corner. Instrument Hall focuses on measurement and physical demonstrations, while Discovery Room connects gravity, space, and robotics.'],
      [/why|science/i, 'Science builds reliable explanations by testing ideas against observations that others can examine. Different rooms here emphasize different evidence, but the same habit applies: record what happened before deciding why.'],
      [/./, 'Tell me whether you are most curious about matter, living systems, measurement, or space. I can connect that interest to a room and an exhibit already available in the center.'],
    ],
    'rowan-vale': [
      [/safe|safety/i, 'Keep walkways and station rings clear, inspect equipment before use, and treat every simulated procedure as if labels and protective equipment still matter. The extinguisher and wash stations in the facility model where emergency equipment belongs.'],
      [/where|room|find/i, 'Chemistry Lab is central, Study Hall is to one side, and Greenhouse Corner is on the other. Instrument Hall and Discovery Room occupy the expanded wing beyond the broad archways.'],
      [/./, 'I help keep the center safe and point learners toward the right room. Tell me which station or subject you need, and I can describe where it is and what it teaches.'],
    ],
  };
  return replies[personaId].find(([pattern]) => pattern.test(message))?.[1] ?? replies[personaId][2][1];
}

function createSseResponse(
  producer: (send: (event: unknown) => void) => Promise<void>,
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await producer(send);
      } catch (error) {
        send({
          type: 'error',
          error: error instanceof Error ? error.message : 'The tutor stream stopped unexpectedly.',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
