# Bunsen Virtual Science Lab

Bunsen is a 3D science-learning center built with Next.js 14, TypeScript, React Three Fiber, Drei, Zustand, and Tailwind. Students can explore the Chemistry Lab, Study Hall, and Greenhouse; run state-machine experiments; and learn with Professor Quill, a Socratic AI tutor.

## Quick start: demo mode

Demo mode runs the complete judge flow without an API key. It streams canned tutor replies with realistic timing and generates a validated, playable experiment about why ice floats.

```powershell
Copy-Item .env.example .env.local
```

Set the environment values:

```dotenv
NEXT_PUBLIC_DEMO_MODE=true
OPENAI_API_KEY=
```

Then run:

```powershell
npm install
npm run dev
```

Open [http://localhost:3200](http://localhost:3200), choose **Begin**, and use `WASD`, `Shift`, `E`, scroll, and `V`.

## Audio

Music begins only after **Begin** is pressed. The pause menu provides master sound, music on/off, and a 0–100% music slider (15% by default). The global track continues across all five zones, uses a 1.5-second tail-to-head overlap for a seamless loop, and ducks during pauses and streamed dialogue. Interaction, footsteps, transition, and objective cues are synthesized with Web Audio.

`public/sfx/music-ambient.mp3` is "Violin Music" by freesound_community via Pixabay, used under the Pixabay Content License.

## Live OpenAI mode

Create `.env.local` at the project root:

```dotenv
OPENAI_API_KEY=your_server_side_key
NEXT_PUBLIC_DEMO_MODE=false
```

Restart the dev server after changing environment variables. The key is read only by Next.js API routes through `src/lib/ai/client.ts`; it is never sent to client components. `.env.local` and all `.env*.local` files are listed in `.gitignore`.

The two runtime roles are:

- `gpt-5.6-terra` — low-latency, streaming Professor Quill responses.
- `gpt-5.6-sol` — validated experiment generation with one automatic repair attempt.

The route logs token usage as `[Bunsen:ai-usage]` on the server. The UI also keeps recent tutor usage and the latest generator usage for the current session.

## AI flows

### Socratic tutor

Walk close to Professor Quill and press `E`. The dialogue panel sends the live experiment state, action history, recent chat, and the learner's message to `/api/tutor`. Replies stream into the panel token by token. Professor Quill asks one guiding question or offers one conceptual nudge; he does not reveal the answer or prescribe the next action.

Failure and surprise outcomes emit an `outcomeReached` event. When the learner is at the active station, Professor Quill responds proactively in a speech bubble for about eight seconds. If the player and professor are in different zones, the comment waits for the next conversation.

### Experiment generator

Visit the **Research Desk** in the Study Hall and press `E`. Ask a question or choose an example. `/api/generate-experiment` requests a strict `Experiment` object, validates it with Zod, and retries once with field-level validation errors if needed. The generated investigation loads at **Experiment Bench** in the Chemistry Lab and uses the same runner as the built-in acid-base titration.

Generation is constrained to 3–5 safe classroom steps, known equipment props, known visual effects, and at least one failure plus one surprise outcome.

## Validation

```powershell
npm run typecheck
npm test
npm run build
```

## API request shapes

`POST /api/tutor`

```json
{
  "experimentState": {},
  "actionHistory": [],
  "chatHistory": [],
  "playerMessage": "The indicator stayed dark pink. What does that tell me?"
}
```

The response is `text/event-stream` with `token`, `usage`, and optional `error` events.

`POST /api/generate-experiment`

```json
{ "question": "Why does ice float?" }
```

The response contains `{ experiment, usage, model, attempts }`.
