import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { heightAt, VILLAGE } from '../game/terrain'
import { clockState } from '../game/state'
import { houses, type House as HouseData } from '../game/worldData'

const roofGeo = new THREE.ConeGeometry(0.85, 1, 4).rotateY(Math.PI / 4)
const windowMaterial = new THREE.MeshLambertMaterial({
  color: '#2b2b2f',
  emissive: '#ffc671',
  emissiveIntensity: 0,
})

const wallPalette = [new THREE.Color('#c3a682'), new THREE.Color('#b3946f'), new THREE.Color('#a98d70')]
const roofPalette = [new THREE.Color('#6d4a3a'), new THREE.Color('#51604f'), new THREE.Color('#5f4d3d')]

function House({ data }: { data: HouseData }) {
  const y = heightAt(data.x, data.z)
  const roofH = Math.min(2.8, data.w * 0.33)
  const wallColor = wallPalette[data.tone % wallPalette.length]
  const roofColor = roofPalette[data.tone % roofPalette.length]

  return (
    <group position={[data.x, y, data.z]} rotation={[0, data.rot, 0]}>
      <mesh position={[0, data.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[data.w, data.h, data.d]} />
        <meshLambertMaterial color={wallColor} flatShading />
      </mesh>

      <mesh
        position={[0, data.h + roofH / 2, 0]}
        scale={[data.w * 1.06, roofH, data.d * 1.06]}
        geometry={roofGeo}
        castShadow
        receiveShadow
      >
        <meshLambertMaterial color={roofColor} flatShading />
      </mesh>

      {/* door */}
      <mesh position={[0, 1, data.d / 2 + 0.06]} castShadow>
        <boxGeometry args={[1.1, 2, 0.14]} />
        <meshLambertMaterial color="#4b3527" flatShading />
      </mesh>

      {/* windows */}
      <mesh position={[-data.w * 0.28, data.h * 0.62, data.d / 2 + 0.07]} material={windowMaterial}>
        <boxGeometry args={[0.72, 0.8, 0.1]} />
      </mesh>
      <mesh position={[data.w * 0.28, data.h * 0.62, data.d / 2 + 0.07]} material={windowMaterial}>
        <boxGeometry args={[0.72, 0.8, 0.1]} />
      </mesh>
      <mesh position={[-data.w * 0.28, data.h * 0.62, -data.d / 2 - 0.07]} material={windowMaterial}>
        <boxGeometry args={[0.72, 0.8, 0.1]} />
      </mesh>
      <mesh position={[data.w * 0.28, data.h * 0.62, -data.d / 2 - 0.07]} material={windowMaterial}>
        <boxGeometry args={[0.72, 0.8, 0.1]} />
      </mesh>

      {/* chimney */}
      <mesh position={[data.w * 0.26, data.h + roofH * 0.85, -data.d * 0.18]} castShadow>
        <boxGeometry args={[0.55, 1.5, 0.55]} />
        <meshLambertMaterial color="#7b6d60" flatShading />
      </mesh>
    </group>
  )
}

function Well() {
  const y = heightAt(0, -27)
  return (
    <group position={[0, y, -27]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.5, 1.1, 8]} />
        <meshLambertMaterial color="#8b8378" flatShading />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.12, 8]} />
        <meshLambertMaterial color="#2c3d46" />
      </mesh>
      <mesh position={[-1.1, 2, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 0.2]} />
        <meshLambertMaterial color="#6b5136" flatShading />
      </mesh>
      <mesh position={[1.1, 2, 0]} castShadow>
        <boxGeometry args={[0.2, 2, 0.2]} />
        <meshLambertMaterial color="#6b5136" flatShading />
      </mesh>
      <mesh position={[0, 3.05, 0]} castShadow>
        <boxGeometry args={[2.9, 0.16, 1.9]} />
        <meshLambertMaterial color="#5b4630" flatShading />
      </mesh>
    </group>
  )
}

function Forge() {
  const y = heightAt(15, -26)
  return (
    <group position={[15, y, -26]} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1, 2.2]} />
        <meshLambertMaterial color="#6f665c" flatShading />
      </mesh>
      <mesh position={[0.6, 1.45, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 1.4]} />
        <meshLambertMaterial color="#3f4448" flatShading />
      </mesh>
      <mesh position={[-1, 1.35, 0]}>
        <boxGeometry args={[0.6, 0.7, 0.6]} />
        <meshLambertMaterial color="#ff8a3c" emissive="#ff6a1e" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[-1, 2.2, 0]} castShadow>
        <boxGeometry args={[1.4, 1.2, 1.2]} />
        <meshLambertMaterial color="#59524b" flatShading />
      </mesh>
    </group>
  )
}

function Campfire() {
  const y = heightAt(-1.5, -20.5)
  const lightRef = useRef<THREE.PointLight>(null!)
  const flameRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const dayFactor = Math.max(0.15, Math.sin(((clockState.hours - 6) / 24) * Math.PI * 2) * 0.6 + 0.4)
    if (lightRef.current) {
      lightRef.current.intensity = (1.6 + Math.sin(t * 9) * 0.25) / dayFactor
    }
    if (flameRef.current) {
      const s = 1 + Math.sin(t * 7.3) * 0.08
      flameRef.current.scale.set(s, 1 + Math.sin(t * 5.1) * 0.12, s)
    }
  })

  return (
    <group position={[-1.5, y, -20.5]}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.6, 0.12, 9]} />
        <meshLambertMaterial color="#5f574c" flatShading />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.95, 0.18, Math.sin(a) * 0.95]} castShadow>
            <dodecahedronGeometry args={[0.26, 0]} />
            <meshLambertMaterial color="#6d6559" flatShading />
          </mesh>
        )
      })}
      <mesh ref={flameRef} position={[0, 0.75, 0]}>
        <coneGeometry args={[0.45, 1.3, 5]} />
        <meshBasicMaterial color="#ffa53d" transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.28, 0.7, 4]} />
        <meshBasicMaterial color="#ffd98a" transparent opacity={0.95} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1.4, 0]} color="#ff9a4d" intensity={1.6} distance={16} decay={2} />
    </group>
  )
}

function Lantern({ x, z }: { x: number; z: number }) {
  const y = heightAt(x, z)
  const matRef = useRef<THREE.MeshLambertMaterial>(null!)

  useFrame(() => {
    const night = clockState.hours < 6.6 || clockState.hours > 19.4
    const target = night ? 1 : 0
    if (matRef.current) matRef.current.emissiveIntensity += (target * 1.6 - matRef.current.emissiveIntensity) * 0.05
  })

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.9, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 3.8, 5]} />
        <meshLambertMaterial color="#4a3a2a" flatShading />
      </mesh>
      <mesh position={[0, 3.9, 0]}>
        <boxGeometry args={[0.42, 0.5, 0.42]} />
        <meshLambertMaterial ref={matRef} color="#3a3128" emissive="#ffb95e" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, 4.22, 0]}>
        <coneGeometry args={[0.36, 0.3, 4]} />
        <meshLambertMaterial color="#3c3228" flatShading />
      </mesh>
    </group>
  )
}

export default function Village() {
  useFrame(() => {
    const night = clockState.hours < 6.4 || clockState.hours > 19.6
    const target = night ? 1.25 : 0
    windowMaterial.emissiveIntensity += (target - windowMaterial.emissiveIntensity) * 0.04
  })

  return (
    <group>
      <mesh position={[VILLAGE.x, heightAt(VILLAGE.x, VILLAGE.z) + 0.03, VILLAGE.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[10, 18]} />
        <meshLambertMaterial color="#8a7355" polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>

      {houses.map((h, i) => (
        <House key={i} data={h} />
      ))}

      <Well />
      <Forge />
      <Campfire />

      <Lantern x={4} z={-15} />
      <Lantern x={-9} z={-17} />
      <Lantern x={13} z={-20} />
      <Lantern x={-6} z={-40} />

      {/* signpost */}
      <group position={[3.2, heightAt(3.2, -14.5), -14.5]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.16, 2.4, 0.16]} />
          <meshLambertMaterial color="#5c4632" flatShading />
        </mesh>
        <mesh position={[0.55, 2.1, 0]} castShadow>
          <boxGeometry args={[1.3, 0.45, 0.08]} />
          <meshLambertMaterial color="#7a5c3c" flatShading />
        </mesh>
      </group>
    </group>
  )
}
