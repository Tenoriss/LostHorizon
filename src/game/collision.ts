import type * as THREE from 'three'
import { PLAY_RADIUS } from './terrain'
import { collidersNear, houses, npcSpots } from './worldData'

/**
 * Push the player circle out of tree trunks, boulders, house boxes, NPCs
 * and the world boundary. Mutates pos.x / pos.z only.
 */
export function resolveCollisions(pos: THREE.Vector3, radius: number) {
  // scattered circle colliders (trees, boulders)
  for (const c of collidersNear(pos.x, pos.z)) {
    const dx = pos.x - c.x
    const dz = pos.z - c.z
    const rr = c.r + radius
    const d2 = dx * dx + dz * dz
    if (d2 < rr * rr && d2 > 1e-8) {
      const d = Math.sqrt(d2)
      pos.x = c.x + (dx / d) * rr
      pos.z = c.z + (dz / d) * rr
    }
  }

  // village houses (rotated boxes)
  for (const h of houses) {
    const dx = pos.x - h.x
    const dz = pos.z - h.z
    const cos = Math.cos(h.rot)
    const sin = Math.sin(h.rot)
    // world -> local (inverse Y rotation)
    const lx = dx * cos - dz * sin
    const lz = dx * sin + dz * cos
    const hx = h.w / 2 + radius
    const hz = h.d / 2 + radius
    if (Math.abs(lx) < hx && Math.abs(lz) < hz) {
      const penX = hx - Math.abs(lx)
      const penZ = hz - Math.abs(lz)
      let nx = 0
      let nz = 0
      if (penX < penZ) nx = Math.sign(lx || 1) * penX
      else nz = Math.sign(lz || 1) * penZ
      // local -> world (Y rotation)
      pos.x += nx * cos + nz * sin
      pos.z += -nx * sin + nz * cos
    }
  }

  // NPCs
  for (const n of npcSpots) {
    const dx = pos.x - n.x
    const dz = pos.z - n.z
    const rr = radius + 0.5
    const d2 = dx * dx + dz * dz
    if (d2 < rr * rr && d2 > 1e-8) {
      const d = Math.sqrt(d2)
      pos.x = n.x + (dx / d) * rr
      pos.z = n.z + (dz / d) * rr
    }
  }

  // world boundary
  const d = Math.hypot(pos.x, pos.z)
  if (d > PLAY_RADIUS) {
    pos.x = (pos.x / d) * PLAY_RADIUS
    pos.z = (pos.z / d) * PLAY_RADIUS
  }
}
