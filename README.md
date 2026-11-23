# PROJECT: LOST HORIZON

A small **3D open-world adventure** that runs in the browser. Built with React, TypeScript,
Three.js and React Three Fiber (drei). No external models, textures or audio files — every
mountain, tree, house and character is generated in code, so the whole game is a few hundred
kilobytes of JavaScript.

Explore the valley of **Hollowmere**: forests, a river, mountain ridges, dirt roads and a
village whose inhabitants have work for a traveller. A day/night cycle runs while you play,
and the horizon holds a beacon worth reaching.

---

## Requirements

- **Node.js 18 or newer** (tested on Node 20+ / 26)
- **npm** (ships with Node)
- A browser with **WebGL** enabled (Chrome, Edge, Firefox, Safari)

## Run the game

```bash
# 1. install dependencies
npm install

# 2. start the dev server
npm run dev
```

The dev server is configured for port **3000** and already listens on all interfaces, so Vite
prints:

```
http://localhost:3000
```

Open that address in your browser, then click **“Enter the horizon”** on the title screen.

Because it binds to `0.0.0.0`, you can also open the “Network” URL Vite prints to play on a
phone or another machine on the same Wi-Fi. If port 3000 is taken, stop whatever is using it
(the config uses `strictPort`) or change `server.port` in `vite.config.ts`.

## Production build

```bash
npm run build     # type-checks with tsc, then bundles with Vite into dist/
npm run preview   # serves the built game locally (default http://localhost:4173)
```

`dist/` is a plain static bundle — you can host it on GitHub Pages, Netlify, Vercel,
Cloudflare Pages, or any static file server. No server-side code is needed.

Other useful script:

```bash
npm run typecheck   # tsc --noEmit only
```

---

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` / arrow keys | Walk (camera-relative) |
| `Shift` (hold) | Sprint |
| `Space` | Jump |
| Mouse drag (hold left button) | Orbit the camera |
| Mouse wheel | Zoom the camera in / out |
| `E` | Talk to a nearby villager · advance dialogue |
| `Esc` | Pause / resume · close dialogue |

The camera pulls itself in automatically when terrain would block your view, and you can wade
through shallow water (slower than walking).

## What's in the game

- **Third-person controller** with acceleration, sprint, jump, wading and world collision
  (houses, props, trees, mountain walls, map boundary).
- **Hand-built valley** — 320 × 320 unit heightfield split into streamed terrain chunks, a
  river carved through the middle, plateaus, ridges and a walkable village.
- **Hollowmere village** — seven houses, a well, a forge, a campfire, lanterns and signposts.
  Windows and lanterns light up after dusk.
- **Day/night cycle** with moving sun and moon, changing sky colours and fog, driving the HUD
  clock and the "Dawn / Daylight / Dusk / Night" label.
- **NPCs with dialogue** — Elder Maeve, the smith, the herbalist and a ferryman, each with
  quest-aware lines that change before, during and after their quest.
- **Quests** — three short tasks tracked in the journal panel: talk to the villagers, recover
  three lost shards hidden around the valley, and reach the beacon on the far ridge.
- **Minimap** drawn from the real heightfield, with roads, houses, quest markers, shard
  markers, the beacon and a rotating player arrow.
- **HUD** — journal with objectives and progress, clock, contextual `E` prompt, toasts,
  dialogue box and pause menu.

## Performance notes

Stutter in a 3D game is almost always a **frame-time spike**, not a triangle count, so the
renderer is tuned against spikes first:

- **Adaptive resolution.** `PerfGuard` samples the average frame time every 1.5 s and steps
  the pixel ratio between **1.25 and 0.6**. A weak GPU (or a browser without hardware
  acceleration) loses resolution instead of dropping frames.
- **Shadows are refreshed lazily.** The shadow map is only re-rendered when the sun or the
  player has actually moved enough to matter (at most a few times per second), never every
  frame. Only tree canopies and buildings cast shadows — trunks, upper cones and rocks do not.
- **Geometry and draw calls.** ~116k triangles in ~160 draw calls: trees, bushes and rocks are
  instanced (one draw call each, ~1750 trees), terrain is 64 frustum-culled 40-unit chunks,
  and all world height comes from an analytic noise function instead of a heightmap image.
- **No textures**, no per-object shadow maps, flat-shaded Lambert materials only.
- ACES tone mapping; only two point lights are active (campfire, beacon).

If it still feels slow, make the browser window smaller (the cost is mostly resolution-bound),
close other GPU-heavy tabs, and check that hardware acceleration is enabled
(`chrome://gpu` should list your GPU as accelerated).

## Project structure

```
index.html
src/
  main.tsx                 React entry point
  App.tsx                  <Canvas>, renderer settings, HUD + title screen
  index.css                all UI styling
  game/
    terrain.ts             world size, height function, river, village plateau
    noise.ts               seeded value noise / fbm
    worldData.ts           houses, roads, shard and NPC placement, colliders
    collision.ts           circle vs box (OBB) collision + map boundary
    state.ts               mutable per-frame state (input, player, camera)
    store.ts               zustand store (quests, dialogue, toasts, pause)
    quests.ts              quest definitions and progression rules
    npcs.ts                NPC metadata and dialogue scripts
  components/
    World.tsx              scene assembly
    WorldLogic.tsx         per-frame game logic (clock, quests, interactions)
    PerfGuard.tsx          adaptive pixel-ratio watchdog
    Terrain.tsx            chunked terrain meshes
    Scenery.tsx            instanced trees, rocks, grass, clouds
    Village.tsx            houses, well, forge, campfire, lanterns
    Water.tsx              river surface
    Atmosphere.tsx         sky dome, sun/moon, fog, lighting
    QuestObjects.tsx       shards and the beacon
    Npcs.tsx               NPC models and idle animation
    Player.tsx             movement, camera, interaction detection
  ui/
    HUD.tsx                journal, clock, dialogue, prompts, pause menu
    Minimap.tsx            canvas minimap
    StartScreen.tsx        title screen
```

## Troubleshooting

- **“Module not found” on start** — dependencies are missing or stale: run `npm install`.
- **Black screen / WebGL error** — the browser or GPU block WebGL; enable hardware
  acceleration, or update the browser.
- **Choppy or stuttering** — most often software rendering. This game needs a hardware GPU;
  running it inside a remote/VM preview (or with hardware acceleration disabled) gives a few
  frames per second no matter what. Run `npm run dev` locally and check `chrome://gpu`.
- **Very low FPS** — see *Performance notes*; the game lowers its own resolution, and a
  smaller window makes the biggest difference.
- **`Port 3000 is already in use`** — another dev server is running; stop it, or edit
  `server.port` in `vite.config.ts`.
- **No sound** — the game has no audio; that is intentional.

## Credits

Design, code and world generation: built as a single self-contained project.
Libraries: [three.js](https://threejs.org), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber),
[drei](https://github.com/pmndrs/drei), [zustand](https://github.com/pmndrs/zustand),
[Vite](https://vitejs.dev). All geometry, colours and text are original and generated in code.
