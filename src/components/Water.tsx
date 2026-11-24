import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WATER_LEVEL, WORLD_HALF } from '../game/terrain'
import { clockState } from '../game/state'

export default function Water() {
  const waterRef = useRef<THREE.Mesh>(null!)
  // Lambert instead of Standard: the water covers a large part of the screen and
  // a PBR shader there is one of the most expensive per-pixel costs on integrated
  // GPUs. It also does not receive shadows any more (another texture fetch on
  // every water pixel) — nobody can see a shadow on the lake anyway.
  const materialRef = useRef<THREE.MeshLambertMaterial>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (waterRef.current) {
      waterRef.current.position.y = WATER_LEVEL + Math.sin(t * 0.55) * 0.035
    }
    if (materialRef.current) {
      // fog + time-of-day tint
      const hour = clockState.hours
      const daylight = Math.max(0, Math.sin(((hour - 6) / 24) * Math.PI * 2))
      materialRef.current.color.setRGB(
        0.14 + daylight * 0.12,
        0.35 + daylight * 0.16,
        0.44 + daylight * 0.2,
      )
    }
  })

  return (
    <mesh
      ref={waterRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, WATER_LEVEL, 0]}
    >
      <planeGeometry args={[WORLD_HALF * 2, WORLD_HALF * 2, 1, 1]} />
      <meshLambertMaterial ref={materialRef} color="#2f6d82" transparent opacity={0.88} />
    </mesh>
  )
}
