import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { npcSpots } from '../game/worldData'
import { npcMeta } from '../game/npcs'
import { QUEST_LIST } from '../game/quests'
import { useGame } from '../game/store'

function Figure({
  colors,
  offset,
}: {
  colors: { cloak: string; hood: string; pants: string; scarf: string }
  offset: number
}) {
  const body = useRef<THREE.Group>(null!)
  const armL = useRef<THREE.Group>(null!)
  const armR = useRef<THREE.Group>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime + offset
    if (body.current) body.current.position.y = Math.sin(t * 1.5) * 0.02
    if (armL.current) armL.current.rotation.x = Math.sin(t * 1.1) * 0.07 - 0.05
    if (armR.current) armR.current.rotation.x = Math.sin(t * 1.1 + 0.8) * 0.07 - 0.05
  })

  return (
    <group ref={body}>
      <group position={[-0.17, 0.86, 0]}>
        <mesh position={[0, -0.43, 0]} castShadow>
          <boxGeometry args={[0.24, 0.86, 0.26]} />
          <meshLambertMaterial color={colors.pants} flatShading />
        </mesh>
      </group>
      <group position={[0.17, 0.86, 0]}>
        <mesh position={[0, -0.43, 0]} castShadow>
          <boxGeometry args={[0.24, 0.86, 0.26]} />
          <meshLambertMaterial color={colors.pants} flatShading />
        </mesh>
      </group>

      <mesh position={[0, 1.22, 0]} castShadow>
        <boxGeometry args={[0.62, 0.8, 0.38]} />
        <meshLambertMaterial color={colors.cloak} flatShading />
      </mesh>
      <mesh position={[0, 1.02, -0.24]} castShadow>
        <boxGeometry args={[0.72, 0.98, 0.2]} />
        <meshLambertMaterial color={colors.hood} flatShading />
      </mesh>
      <mesh position={[0, 1.5, 0.02]}>
        <boxGeometry args={[0.66, 0.14, 0.42]} />
        <meshLambertMaterial color={colors.scarf} flatShading />
      </mesh>

      <group ref={armL} position={[-0.4, 1.5, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <boxGeometry args={[0.17, 0.68, 0.2]} />
          <meshLambertMaterial color={colors.cloak} flatShading />
        </mesh>
        <mesh position={[0, -0.72, 0]} castShadow>
          <boxGeometry args={[0.16, 0.18, 0.18]} />
          <meshLambertMaterial color="#e6b88a" flatShading />
        </mesh>
      </group>
      <group ref={armR} position={[0.4, 1.5, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <boxGeometry args={[0.17, 0.68, 0.2]} />
          <meshLambertMaterial color={colors.cloak} flatShading />
        </mesh>
        <mesh position={[0, -0.72, 0]} castShadow>
          <boxGeometry args={[0.16, 0.18, 0.18]} />
          <meshLambertMaterial color="#e6b88a" flatShading />
        </mesh>
      </group>

      <group position={[0, 1.78, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.4, 0.38]} />
          <meshLambertMaterial color="#e6b88a" flatShading />
        </mesh>
        <mesh position={[0, 0.07, -0.06]} castShadow>
          <boxGeometry args={[0.48, 0.34, 0.46]} />
          <meshLambertMaterial color={colors.hood} flatShading />
        </mesh>
        <mesh position={[0, 0.26, -0.12]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.4]} />
          <meshLambertMaterial color={colors.hood} flatShading />
        </mesh>
        <mesh position={[-0.1, 0.02, 0.2]}>
          <boxGeometry args={[0.07, 0.07, 0.03]} />
          <meshLambertMaterial color="#23201d" />
        </mesh>
        <mesh position={[0.1, 0.02, 0.2]}>
          <boxGeometry args={[0.07, 0.07, 0.03]} />
          <meshLambertMaterial color="#23201d" />
        </mesh>
      </group>
    </group>
  )
}

function Npc({ id, x, y, z, rot }: { id: string; x: number; y: number; z: number; rot: number }) {
  const meta = npcMeta(id)
  const marker = useRef<THREE.Mesh>(null!)
  const quests = useGame((s) => s.quests)
  const quest = QUEST_LIST.find((q) => q.giverNpc === id)
  const status = quest ? quests[quest.id].status : null
  const showMarker = status === 'available' || status === 'ready'

  useFrame((state) => {
    if (!marker.current) return
    const t = state.clock.elapsedTime
    marker.current.rotation.y = t * 1.4
    marker.current.position.y = 2.55 + Math.sin(t * 2.2) * 0.09
  })

  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <Figure colors={meta.colors} offset={x * 0.3 + z * 0.2} />
      <mesh ref={marker} position={[0, 2.55, 0]} visible={showMarker}>
        <octahedronGeometry args={[0.19, 0]} />
        <meshBasicMaterial color={status === 'ready' ? '#9ef0a8' : '#ffd479'} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function Npcs() {
  return (
    <group>
      {npcSpots.map((n) => (
        <Npc key={n.id} id={n.id} x={n.x} y={n.y} z={n.z} rot={n.rot} />
      ))}
    </group>
  )
}
