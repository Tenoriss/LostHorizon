import * as THREE from 'three'

/** Mutable, frame-rate data that must never trigger React renders. */
export const playerState = {
  position: new THREE.Vector3(0, 0, -18),
  facing: Math.PI,
  velocity: new THREE.Vector3(),
  grounded: true,
  moving: false,
  sprinting: false,
  inWater: false,
  speed: 0,
  phase: 0,
}

export const cameraState = {
  yaw: 0,
  pitch: 0.44,
  distance: 8.8,
  targetDistance: 8.8,
}

export const clockState = {
  hours: 8.6,
  /** in-game hours per real second (full day ~ 7 minutes) */
  speed: 24 / 420,
}

export const keys: Record<string, boolean> = {}

export const interaction = {
  npcId: null as string | null,
}

export const HOURS_PER_DAY = 24
