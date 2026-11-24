import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { playerState } from '../game/state'
import { QUALITY, useSettings } from '../game/quality'
import {
  CHUNK,
  CHUNKS_PER_SIDE,
  VILLAGE,
  WATER_LEVEL,
  WORLD_HALF,
  heightAt,
  smoothstep,
} from '../game/terrain'
import { valueNoise } from '../game/noise'

const SEG = 24
const STEP = CHUNK / SEG

const PALETTE = {
  mud: new THREE.Color('#5c5040'),
  sand: new THREE.Color('#cbb384'),
  grass: new THREE.Color('#5e8b45'),
  grassDark: new THREE.Color('#416a37'),
  grassDry: new THREE.Color('#8b9452'),
  rock: new THREE.Color('#6b665f'),
  rockDark: new THREE.Color('#4d4945'),
  snow: new THREE.Color('#e5edf2'),
}

const tmpColor = new THREE.Color()

function faceColor(h: number, steep: number, x: number, z: number, out: THREE.Color) {
  if (h < WATER_LEVEL - 0.5) {
    out.copy(PALETTE.mud)
  } else if (h < WATER_LEVEL + 1.2) {
    out.copy(PALETTE.sand)
  } else {
    out.copy(PALETTE.grass)
    out.lerp(PALETTE.grassDark, smoothstep(0.35, 0.8, valueNoise(x * 0.05 + 4, z * 0.05 + 8)))
    out.lerp(PALETTE.grassDry, smoothstep(24, 42, h) * 0.55)
  }

  if (h > 26) out.lerp(PALETTE.rock, smoothstep(34, 52, h))
  if (steep > 0.16 && h > WATER_LEVEL + 1) {
    out.lerp(PALETTE.rockDark, smoothstep(0.16, 0.55, steep) * 0.8)
  }
  if (h > 48) out.lerp(PALETTE.snow, smoothstep(48, 64, h))

  // per-facet shade variation for a hand-painted low-poly look
  const shade = (valueNoise(x * 0.6 + 17, z * 0.6 + 5) - 0.5) * 0.1
  out.offsetHSL(0, 0, shade)
  return out
}

interface ChunkGeom {
  key: string
  geometry: THREE.BufferGeometry
  cx: number
  cz: number
}

function buildChunk(ci: number, cj: number): ChunkGeom {
  const ox = -WORLD_HALF + ci * CHUNK
  const oz = -WORLD_HALF + cj * CHUNK
  const size = SEG + 1
  const heights = new Float32Array(size * size)

  for (let i = 0; i <= SEG; i++) {
    for (let j = 0; j <= SEG; j++) {
      const x = ox + i * STEP
      const z = oz + j * STEP
      // flatten the micro-jitter on the village plateau so buildings sit flush
      const villageBlend = smoothstep(22, 32, Math.hypot(x - VILLAGE.x, z - VILLAGE.z))
      const jitter = (valueNoise(x * 0.9 + 5, z * 0.9 + 3) - 0.5) * 0.45 * villageBlend
      heights[i * size + j] = heightAt(x, z) + jitter
    }
  }

  const positions: number[] = []
  const colors: number[] = []

  const pushVertex = (x: number, y: number, z: number, color: THREE.Color) => {
    positions.push(x, y, z)
    colors.push(color.r, color.g, color.b)
  }

  const tri = (
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    cx: number,
    cy: number,
    cz: number,
  ) => {
    const ux = bx - ax
    const uy = by - ay
    const uz = bz - az
    const vx = cx - ax
    const vy = cy - ay
    const vz = cz - az
    const nx = uy * vz - uz * vy
    const ny = uz * vx - ux * vz
    const nz = ux * vy - uy * vx
    const nlen = Math.hypot(nx, ny, nz) || 1
    const steep = 1 - Math.abs(ny / nlen)
    const avgH = (ay + by + cy) / 3
    const avgX = (ax + bx + cx) / 3
    const avgZ = (az + bz + cz) / 3
    faceColor(avgH, steep, avgX, avgZ, tmpColor)
    pushVertex(ax, ay, az, tmpColor)
    pushVertex(bx, by, bz, tmpColor)
    pushVertex(cx, cy, cz, tmpColor)
  }

  for (let i = 0; i < SEG; i++) {
    for (let j = 0; j < SEG; j++) {
      const x0 = ox + i * STEP
      const x1 = x0 + STEP
      const z0 = oz + j * STEP
      const z1 = z0 + STEP
      const h00 = heights[i * size + j]
      const h01 = heights[i * size + j + 1]
      const h10 = heights[(i + 1) * size + j]
      const h11 = heights[(i + 1) * size + j + 1]

      tri(x0, h00, z0, x0, h01, z1, x1, h11, z1)
      tri(x0, h00, z0, x1, h11, z1, x1, h10, z0)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()

  return { key: `${ci}-${cj}`, geometry, cx: ox + CHUNK / 2, cz: oz + CHUNK / 2 }
}

export default function Terrain() {
  const preset = QUALITY[useSettings((s) => s.quality)]
  const viewDistance = preset.viewDistance
  const chunkRefs = useRef<(THREE.Mesh | null)[]>([])
  const cullAcc = useRef(0)

  const chunks = useMemo(() => {
    const out: ChunkGeom[] = []
    for (let ci = 0; ci < CHUNKS_PER_SIDE; ci++) {
      for (let cj = 0; cj < CHUNKS_PER_SIDE; cj++) {
        out.push(buildChunk(ci, cj))
      }
    }
    return out
  }, [])

  const material = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        flatShading: true,
      }),
    [],
  )

  // Beyond the fog horizon nothing is visible, but fully fogged chunks still
  // cost fragments. Hide them, a few times a second instead of every frame.
  useFrame((_, delta) => {
    cullAcc.current += delta
    if (cullAcc.current < 0.3) return
    cullAcc.current = 0
    const p = playerState.position
    const reach = viewDistance + CHUNK
    const reach2 = reach * reach
    for (let i = 0; i < chunks.length; i++) {
      const mesh = chunkRefs.current[i]
      if (!mesh) continue
      const c = chunks[i]
      const dx = p.x - c.cx
      const dz = p.z - c.cz
      mesh.visible = dx * dx + dz * dz < reach2
    }
  })

  return (
    <group>
      {chunks.map((c, i) => (
        <mesh
          key={c.key}
          ref={(m) => {
            chunkRefs.current[i] = m
          }}
          geometry={c.geometry}
          material={material}
          receiveShadow={preset.shadows}
          frustumCulled
        />
      ))}
    </group>
  )
}
