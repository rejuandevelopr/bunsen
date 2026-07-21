# Bunsen Virtual Science Lab

Bunsen is a 3D science-learning center built with Next.js 14, TypeScript, React Three Fiber, Drei, Zustand, and Tailwind. Students can explore the Chemistry Lab, Study Hall, and Greenhouse; run state-machine experiments; and learn with Professor Quill, a Socratic AI tutor.

**Live demo:** https://bunsen-live.vercel.app/ (no setup needed)

## Story Mode

Bunsen is structured as a five-chapter quest chain, not a sandbox:

1. **Welcome to Bunsen** - meet Professor Quill and complete your first titration.
2. **The Measure of Things** - explore the instruments and run the Flame Test.
3. **Eyes on the Sky** - study optics and run Gravity on the Moon.
4. **The Scholar's Path** - learn the scientific method in the Study Hall.
5. **Your Own Question** - ask your own science question at the Research Desk and complete the experiment GPT-5.6 builds for you.

Quests are data-driven (`src/lib/quests/`): JSON definitions with ordered sub-tasks and completion triggers (talk to an NPC, open a station, reach an experiment outcome, read a Field Note). The objective card tracks the active sub-task, the map marks the target zone, and an achievements panel rewards chapter completion plus bonus achievements for curiosity.

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


## How I built this with Codex

I built Bunsen solo in a few days, working with Codex end to end in one main thread ("Build Bunsen 3D lab scene"). My role was product and design direction; Codex turned those decisions into working, tested code.

Where Codex accelerated the work:

- Scaffolded the Next.js 14 + React Three Fiber project and built the five-zone 3D science center, camera rig, and player movement.
- Implemented the data-driven experiment engine (state machines with steps, failure outcomes, and surprise outcomes) and the quest/chapter system in `src/lib/quests/`.
- Built the streaming tutor route (`/api/tutor`) and the experiment generator (`/api/generate-experiment`) with Zod validation and the automatic repair retry.
- Wrote the audio system (Web Audio synthesized cues, music ducking) and the test suite - 32 tests covering experiments, quests, spatial logic, NPC dialogue, and player motion.
- Fast iteration on bugs I found while playtesting, e.g. the V key switching camera while typing in chat - Codex fixed input focus handling across CameraRig, PlayerExperience, and the keyboard lib in minutes.

Key decisions I made:

- The pedagogy: Professor Quill is strictly Socratic - one guiding question or one conceptual nudge, never the answer. This took many prompt iterations.
- The safety model for generated experiments: strict `Experiment` schema, only known equipment props and visual effects, 3-5 classroom-safe steps, one repair attempt with field-level errors.
- The two-model split: `gpt-5.6-terra` for low-latency streamed dialogue, `gpt-5.6-sol` for validated experiment generation.
- The five-chapter story arc (guided practice first, independent inquiry last) and the low-poly art direction.

## Asset credits

3D models used under CC-BY 3.0 via Poly Pizza:

- Astronaut - Poly by Google
- Erlenmeyer Flask - Poly by Google
- Armature - Jeremy Eyring
- Lab Equipment - matt bower
- Lava Lamp - Jarlan Perez
- Microscope - Colonel Cthulu
- Science Tubes - Ryan Donaldson
- Test Tube, Blue Liquid - Jakob Hippe

Furniture pack by Kenney (kenney.nl), CC0.

Music: "Violin Music" by freesound_community via Pixabay, used under the Pixabay Content License.
