import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WATER_LEVEL, WORLD_HALF } from '../game/terrain'
import { clockState } from '../game/state'

export default function Water() {
  const waterRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!)

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
      receiveShadow
    >
      <planeGeometry args={[WORLD_HALF * 2, WORLD_HALF * 2, 1, 1]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#2f6d82"
        transparent
        opacity={0.86}
        roughness={0.18}
        metalness={0.35}
      />
    </mesh>
  )
}
