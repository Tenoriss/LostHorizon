import { fbm, mulberry32 } from './noise'
import { WATER_LEVEL, WORLD_HALF, VILLAGE } from './terrain'
import { distanceToSegment, findLandNear, heightAt, slopeAt } from './terrain'

export interface Vec2 {
  x: number
  z: number
}

export interface TreeInst {
  x: number
  y: number
  z: number
  scale: number
  rot: number
  tint: number
}

export interface RockInst extends TreeInst {}

export interface House {
  x: number
  z: number
  w: number
  d: number
  rot: number
  /** wall height */
  h: number
  tone: number
}

export interface Collider {
  x: number
  z: number
  r: number
}

/** Dirt roads / trails leading out of Hollowmere. */
export const ROADS: Vec2[][] = [
  [
    { x: 16, z: -22 },
    { x: 28, z: -24 },
    { x: 42, z: -29 },
    { x: 56, z: -36 },
    { x: 70, z: -44 },
    { x: 84, z: -52 },
  ],
  [
    { x: -8, z: -42 },
    { x: -13, z: -53 },
    { x: -22, z: -64 },
    { x: -33, z: -76 },
    { x: -44, z: -87 },
  ],
  [
    { x: 2, z: -13 },
    { x: 5, z: -2 },
    { x: 10, z: 11 },
    { x: 16, z: 24 },
    { x: 21, z: 36 },
    { x: 25, z: 45 },
  ],
]

export function distToRoads(x: number, z: number) {
  let best = Infinity
  for (const road of ROADS) {
    for (let i = 0; i < road.length - 1; i++) {
      const d = distanceToSegment(x, z, road[i].x, road[i].z, road[i + 1].x, road[i + 1].z)
      if (d < best) best = d
    }
  }
  return best
}

/** Village houses (axis + rotation, used for rendering and OBB collision). */
export const houses: House[] = [
  { x: -10, z: -22, w: 7, d: 6, rot: 0.3, h: 3.6, tone: 0 },
  { x: 10, z: -21, w: 6.4, d: 5.6, rot: -0.35, h: 3.3, tone: 1 },
  { x: -11, z: -31, w: 6.8, d: 5.8, rot: -0.25, h: 3.9, tone: 2 },
  { x: 10, z: -31.5, w: 6, d: 5.4, rot: 0.25, h: 3.2, tone: 0 },
  { x: -3, z: -36.5, w: 7.4, d: 6.2, rot: 0.05, h: 4.1, tone: 1 },
  { x: 5, z: -36, w: 5.6, d: 5, rot: -0.12, h: 3.0, tone: 2 },
  { x: 16, z: -33, w: 6, d: 5.2, rot: 1.1, h: 3.4, tone: 1 },
]

export const villageCenter = { ...VILLAGE }

export const villageY = heightAt(VILLAGE.x, VILLAGE.z)

/* ------------------------------------------------------------------ */
/* Scatter generation                                                  */
/* ------------------------------------------------------------------ */

export const pines: TreeInst[] = []
export const oaks: TreeInst[] = []
export const bushes: RockInst[] = []
export const rocks: RockInst[] = []

const rand = mulberry32(20261123)

function addTree(x: number, z: number, kind: 0 | 1, scale: number, tint: number) {
  const y = heightAt(x, z) - 0.25
  const inst = { x, y, z, scale, rot: rand() * Math.PI * 2, tint }
  if (kind === 0) pines.push(inst)
  else oaks.push(inst)
}

// A handful of hand-placed trees framing the village.
const villageTrees: [number, number, number][] = [
  [-22, -14, 1.15],
  [21, -12, 1.0],
  [-24, -32, 1.25],
  [24, -34, 0.95],
  [-8, -48, 1.3],
  [14, -45, 1.05],
  [26, -18, 0.9],
  [-20, -42, 1.1],
]
for (const [x, z, s] of villageTrees) addTree(x, z, rand() > 0.45 ? 0 : 1, s, rand() * 0.3)

let attempts = 0
while (attempts < 20000 && pines.length + oaks.length < 1750) {
  attempts++
  const x = (rand() * 2 - 1) * (WORLD_HALF - 8)
  const z = (rand() * 2 - 1) * (WORLD_HALF - 8)
  const h = heightAt(x, z)
  if (h < WATER_LEVEL + 1.4) continue
  if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < 21) continue
  if (distToRoads(x, z) < 5) continue
  if (slopeAt(x, z) > 1.0) continue

  const forest = fbm(x * 0.018 + 31.2, z * 0.018 + 17.4, 3)
  const r = rand()

  if (h > 48) {
    // alpine scree
    if (r < 0.16) rocks.push({ x, y: h - 0.4, z, scale: 0.5 + rand() * 1.6, rot: rand() * 6.28, tint: rand() })
    continue
  }

  if (forest < 0.42) {
    // open meadow: sparse scatter
    if (r < 0.035) addTree(x, z, rand() > 0.6 ? 0 : 1, 0.75 + rand() * 0.6, rand() * 0.35)
    else if (r < 0.075) rocks.push({ x, y: h - 0.25, z, scale: 0.4 + rand() * 0.9, rot: rand() * 6.28, tint: rand() })
    else if (r < 0.16) bushes.push({ x, y: h - 0.1, z, scale: 0.6 + rand() * 0.8, rot: rand() * 6.28, tint: rand() })
    continue
  }

  // deep forest
  if (r < 0.68) addTree(x, z, rand() > 0.35 ? 0 : 1, 0.8 + rand() * 0.75, rand() * 0.35)
  else if (r < 0.82) bushes.push({ x, y: h - 0.1, z, scale: 0.7 + rand() * 0.9, rot: rand() * 6.28, tint: rand() })
  else if (r < 0.9) rocks.push({ x, y: h - 0.25, z, scale: 0.35 + rand() * 0.8, rot: rand() * 6.28, tint: rand() })
}

/* ------------------------------------------------------------------ */
/* Collision grid                                                      */
/* ------------------------------------------------------------------ */

export const COLLIDER_CELL = 10
export const colliderGrid = new Map<string, Collider[]>()

function cellKey(cx: number, cz: number) {
  return `${cx},${cz}`
}

function addCollider(c: Collider) {
  const cx = Math.floor(c.x / COLLIDER_CELL)
  const cz = Math.floor(c.z / COLLIDER_CELL)
  const key = cellKey(cx, cz)
  const list = colliderGrid.get(key)
  if (list) list.push(c)
  else colliderGrid.set(key, [c])
}

for (const t of pines) addCollider({ x: t.x, z: t.z, r: 0.55 * t.scale })
for (const t of oaks) addCollider({ x: t.x, z: t.z, r: 0.62 * t.scale })
for (const r of rocks) if (r.scale > 0.7) addCollider({ x: r.x, z: r.z, r: 0.9 * r.scale })

export function collidersNear(x: number, z: number) {
  const out: Collider[] = []
  const cx = Math.floor(x / COLLIDER_CELL)
  const cz = Math.floor(z / COLLIDER_CELL)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const list = colliderGrid.get(cellKey(cx + dx, cz + dz))
      if (list) out.push(...list)
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Quest objects                                                       */
/* ------------------------------------------------------------------ */

export interface ShardDef {
  id: string
  x: number
  z: number
  y: number
}

function shardAt(id: string, x: number, z: number): ShardDef {
  const p = findLandNear(x, z, WATER_LEVEL + 1.6)
  return { id, x: p.x, z: p.z, y: heightAt(p.x, p.z) + 1.5 }
}

export const shards: ShardDef[] = [
  shardAt('shard-river', 34, 32),
  shardAt('shard-forest', -56, -8),
  shardAt('shard-ridge', 62, -44),
]

const beaconSpot = findLandNear(88, -88, 26)
export const beacon = {
  x: beaconSpot.x,
  z: beaconSpot.z,
  y: heightAt(beaconSpot.x, beaconSpot.z),
  radius: 9,
}

/* ------------------------------------------------------------------ */
/* NPC positions                                                       */
/* ------------------------------------------------------------------ */

export interface NpcPlacement {
  id: string
  x: number
  z: number
  rot: number
}

export const npcPlacements: NpcPlacement[] = [
  { id: 'maeve', x: -3.2, z: -26.6, rot: 2.4 },
  { id: 'bran', x: 13, z: -28.5, rot: -1.2 },
  { id: 'lira', x: -7.6, z: -27.2, rot: 1.4 },
  { id: 'tomas', x: -5.2, z: -20.5, rot: -0.4 },
  { id: 'finn', x: 30, z: 40, rot: 3.0 },
]

// ensure NPCs actually stand on the bank
export const npcSpots = npcPlacements.map((n) => {
  const spot = findLandNear(n.x, n.z, WATER_LEVEL + 1.2, 30)
  return { ...n, x: spot.x, z: spot.z, y: heightAt(spot.x, spot.z) }
})

export function distanceToRoadSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
) {
  return distanceToSegment(px, pz, ax, az, bx, bz)
}
