import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { beacon, shards, type ShardDef } from '../game/worldData'
import { useGame } from '../game/store'

function Shard({ data, collected }: { data: ShardDef; collected: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.position.y = data.y + Math.sin(t * 1.5 + data.x * 0.2) * 0.22
    group.current.rotation.y = t * 1.1
    if (ring.current) {
      ring.current.rotation.z = t * 0.9
      ring.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.7) * 0.3
    }
  })

  if (collected) return null

  return (
    <group ref={group} position={[data.x, data.y, data.z]}>
      <mesh castShadow>
        <octahedronGeometry args={[0.46, 0]} />
        <meshLambertMaterial color="#ffd98a" emissive="#ffb545" emissiveIntensity={1.9} />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[1.1, 0.045, 6, 20]} />
        <meshBasicMaterial color="#ffe6a8" transparent opacity={0.75} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Beacon({ active, lit }: { active: boolean; lit: boolean }) {
  const beam = useRef<THREE.Mesh>(null!)
  const flame = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (beam.current) {
      const mat = beam.current.material as THREE.MeshBasicMaterial
      const target = lit ? 0.3 : active ? 0.12 : 0.05
      mat.opacity += (target - mat.opacity) * 0.04
      beam.current.scale.x = 1 + Math.sin(t * 1.3) * 0.08
      beam.current.scale.z = beam.current.scale.x
    }
    if (flame.current) {
      flame.current.scale.y = 1 + Math.sin(t * 6.2) * 0.12
    }
  })

  return (
    <group position={[beacon.x, beacon.y, beacon.z]}>
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[4.2, 4.8, 0.5, 10]} />
        <meshLambertMaterial color="#7d766c" flatShading />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.95, 1.6, 6]} />
        <meshLambertMaterial color="#6a635a" flatShading />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 3.2, 0.9, Math.sin(a) * 3.2]}
            rotation={[0, a, 0.06]}
            castShadow
          >
            <boxGeometry args={[0.55, 1.7, 0.55]} />
            <meshLambertMaterial color="#6f685e" flatShading />
          </mesh>
        )
      })}
      <mesh ref={flame} position={[0, 2, 0]}>
        <coneGeometry args={[0.5, 1.3, 5]} />
        <meshBasicMaterial color="#8fe8ff" transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh ref={beam} position={[0, 22, 0]}>
        <cylinderGeometry args={[0.9, 1.5, 42, 8, 1, true]} />
        <meshBasicMaterial
          color="#8fe8ff"
          transparent
          opacity={0.05}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          fog={false}
        />
      </mesh>
      <pointLight color="#8fe8ff" intensity={lit ? 3 : 1} distance={26} decay={2} />
    </group>
  )
}

export default function QuestObjects() {
  const collected = useGame((s) => s.shards)
  const beaconStatus = useGame((s) => s.quests.beacon.status)

  return (
    <group>
      {shards.map((s) => (
        <Shard key={s.id} data={s} collected={collected.includes(s.id)} />
      ))}
      <Beacon active={beaconStatus === 'active'} lit={beaconStatus === 'ready' || beaconStatus === 'done'} />
    </group>
  )
}
