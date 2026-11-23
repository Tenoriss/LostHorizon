import { fbm } from './noise'

export const WORLD_HALF = 160
export const CHUNK = 40
export const CHUNKS_PER_SIDE = Math.round((WORLD_HALF * 2) / CHUNK)
export const WATER_LEVEL = 4
export const VILLAGE = { x: 0, z: -25 }
export const PLATEAU_HEIGHT = 7.4
export const PLAY_RADIUS = WORLD_HALF - 8

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Center line of the river that winds east/west across the northern valley. */
export function riverZ(x: number) {
  return 52 + Math.sin(x * 0.017) * 12 + Math.sin(x * 0.061 + 1.7) * 3
}

/** Analytic world height used for rendering, collision and placement. */
export function heightAt(x: number, z: number) {
  // rolling grassland
  let h = 10
  h += (fbm(x * 0.009 + 11.3, z * 0.009 + 4.7, 4) - 0.5) * 21
  h += (fbm(x * 0.031 + 3.1, z * 0.031 + 9.9, 3) - 0.5) * 5.5

  // mountain ring around the valley
  const d = Math.hypot(x, z)
  const mountainMask = smoothstep(92, 176, d)
  const ridge = 1 - Math.abs(fbm(x * 0.012 + 21.4, z * 0.012 + 8.2, 4) * 2 - 1)
  h += mountainMask * (16 + ridge * ridge * 74 + fbm(x * 0.05 + 2, z * 0.05 + 5, 3) * 12)

  // flattened village plateau
  const dv = Math.hypot(x - VILLAGE.x, z - VILLAGE.z)
  const plateau = 1 - smoothstep(24, 48, dv)
  h = h * (1 - plateau) + PLATEAU_HEIGHT * plateau

  // carved river channel
  const riverWidth = 8.5 + fbm(x * 0.05 + 7, 0.5, 2) * 4
  const riverDist = Math.abs(z - riverZ(x))
  if (riverDist < riverWidth * 1.7) {
    const k = 1 - smoothstep(riverWidth * 0.5, riverWidth * 1.7, riverDist)
    const bed = WATER_LEVEL - 3.1 - Math.sin(x * 0.07) * 0.7
    h = h * (1 - k) + bed * k
  }
  return h
}

export function slopeAt(x: number, z: number) {
  const e = 1.5
  const dx = heightAt(x + e, z) - heightAt(x - e, z)
  const dz = heightAt(x, z + e) - heightAt(x, z - e)
  return Math.hypot(dx, dz) / (2 * e)
}

export function isWater(x: number, z: number) {
  return heightAt(x, z) < WATER_LEVEL
}

/** Walk outward in a spiral until we find dry, reasonably flat ground. */
export function findLandNear(x: number, z: number, minHeight: number, maxRadius = 45) {
  if (heightAt(x, z) >= minHeight) return { x, z }
  for (let r = 2; r < maxRadius; r += 1.5) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      const px = x + Math.cos(a) * r
      const pz = z + Math.sin(a) * r
      if (heightAt(px, pz) >= minHeight) return { x: px, z: pz }
    }
  }
  return { x, z }
}

export function distanceToSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
) {
  const abx = bx - ax
  const abz = bz - az
  const len = abx * abx + abz * abz
  let t = len === 0 ? 0 : ((px - ax) * abx + (pz - az) * abz) / len
  t = clamp(t, 0, 1)
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t))
}
