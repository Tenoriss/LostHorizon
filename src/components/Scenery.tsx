import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bushes, oaks, pines, rocks, type TreeInst } from '../game/worldData'
import { WORLD_HALF } from '../game/terrain'
import { playerState } from '../game/state'
import { QUALITY, useSettings } from '../game/quality'

/**
 * The forest used to be eight instanced meshes covering the whole map with
 * frustumCulled={false}, so every tree, bush and rock was submitted in every pass
 * (main + shadow) no matter where the camera looked. On an integrated GPU that is
 * a lot of useless vertex work and, in the shadow pass, a lot of useless triangles.
 *
 * Now the scatter is bucketed into world cells. Each cell is its own group of
 * instanced meshes: three.js frustum-culls them per cell, and cells past the
 * quality preset's view distance are hidden outright.
 */
const CELL = 80

const dummy = new THREE.Object3D()
const tintColor = new THREE.Color()

const geos = {
  pineTrunk: new THREE.CylinderGeometry(0.17, 0.3, 2.8, 4).translate(0, 1.4, 0),
  pineLow: new THREE.ConeGeometry(1.85, 4.2, 5).translate(0, 3.5, 0),
  pineHigh: new THREE.ConeGeometry(1.25, 3.1, 5).translate(0, 5.8, 0),
  oakTrunk: new THREE.CylinderGeometry(0.22, 0.36, 2.4, 4).translate(0, 1.2, 0),
  oakCrown: new THREE.IcosahedronGeometry(1.95, 0).translate(0, 3.4, 0),
  oakCrown2: new THREE.IcosahedronGeometry(1.25, 0).translate(0.85, 4.25, 0.35),
  bush: new THREE.IcosahedronGeometry(0.95, 0).translate(0, 0.55, 0),
  rock: new THREE.DodecahedronGeometry(1, 0).translate(0, 0.15, 0),
}

const mats = {
  trunk: new THREE.MeshLambertMaterial({ color: '#5a4433', flatShading: true }),
  pine: new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }),
  oak: new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }),
  bush: new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }),
  rock: new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }),
}

const TRUNK_PALETTE = ['#5a4433']
const OAK_TRUNK_PALETTE = ['#5f4a37']
const PINE_PALETTE = ['#39613a', '#2f5533', '#426b3f', '#35573a']
const OAK_PALETTE = ['#527f3c', '#628c45', '#466f38', '#6d9448']
const BUSH_PALETTE = ['#476b32', '#3c5f2c', '#547a3a']
const ROCK_PALETTE = ['#7a756c', '#69645d', '#847e73', '#5d5952']

interface CellData {
  key: string
  cx: number
  cz: number
  pines: TreeInst[]
  oaks: TreeInst[]
  bushes: TreeInst[]
  rocks: TreeInst[]
}

function buildCells(): CellData[] {
  const cells = new Map<string, CellData>()

  const bucket = (items: TreeInst[], field: 'pines' | 'oaks' | 'bushes' | 'rocks') => {
    for (const item of items) {
      const cx = Math.floor((item.x + WORLD_HALF) / CELL)
      const cz = Math.floor((item.z + WORLD_HALF) / CELL)
      const key = `${cx}:${cz}`
      let cell = cells.get(key)
      if (!cell) {
        cell = {
          key,
          cx: cx * CELL + CELL / 2,
          cz: cz * CELL + CELL / 2,
          pines: [],
          oaks: [],
          bushes: [],
          rocks: [],
        }
        cells.set(key, cell)
      }
      cell[field].push(item)
    }
  }

  bucket(pines, 'pines')
  bucket(oaks, 'oaks')
  bucket(bushes, 'bushes')
  bucket(rocks, 'rocks')
  return [...cells.values()]
}

interface PartProps {
  items: TreeInst[]
  geometry: THREE.BufferGeometry
  material: THREE.Material
  palette: string[]
  castShadow?: boolean
}

function Part({ items, geometry, material, palette, castShadow }: PartProps) {
  const ref = useRef<THREE.InstancedMesh>(null!)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < items.length; i++) {
      const t = items[i]
      dummy.position.set(t.x, t.y, t.z)
      dummy.rotation.set(0, t.rot, 0)
      dummy.scale.setScalar(t.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      tintColor.set(palette[Math.floor(t.tint * palette.length) % palette.length])
      tintColor.offsetHSL(0, 0, (t.tint - 0.5) * 0.08)
      mesh.setColorAt(i, tintColor)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items, palette])

  return (
    <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} />
  )
}

function Cell({ data }: { data: CellData }) {
  return (
    <group>
      {data.pines.length > 0 && (
        <>
          <Part items={data.pines} geometry={geos.pineTrunk} material={mats.trunk} palette={TRUNK_PALETTE} />
          <Part
            items={data.pines}
            geometry={geos.pineLow}
            material={mats.pine}
            palette={PINE_PALETTE}
            castShadow
          />
          <Part items={data.pines} geometry={geos.pineHigh} material={mats.pine} palette={PINE_PALETTE} />
        </>
      )}
      {data.oaks.length > 0 && (
        <>
          <Part
            items={data.oaks}
            geometry={geos.oakTrunk}
            material={mats.trunk}
            palette={OAK_TRUNK_PALETTE}
          />
          <Part
            items={data.oaks}
            geometry={geos.oakCrown}
            material={mats.oak}
            palette={OAK_PALETTE}
            castShadow
          />
          <Part items={data.oaks} geometry={geos.oakCrown2} material={mats.oak} palette={OAK_PALETTE} />
        </>
      )}
      {data.bushes.length > 0 && (
        <Part items={data.bushes} geometry={geos.bush} material={mats.bush} palette={BUSH_PALETTE} />
      )}
      {data.rocks.length > 0 && (
        <Part items={data.rocks} geometry={geos.rock} material={mats.rock} palette={ROCK_PALETTE} />
      )}
    </group>
  )
}

export default function Scenery() {
  const viewDistance = QUALITY[useSettings((s) => s.quality)].viewDistance
  const cells = useMemo(buildCells, [])
  const cellRefs = useRef<(THREE.Group | null)[]>([])
  const cullAcc = useRef(0)

  // Fog hides the far forest, so the cells behind the horizon are skipped a few
  // times a second rather than uploaded for nothing every frame.
  useFrame((_, delta) => {
    cullAcc.current += delta
    if (cullAcc.current < 0.4) return
    cullAcc.current = 0
    const p = playerState.position
    const reach = viewDistance + CELL * 0.75
    const reach2 = reach * reach
    for (let i = 0; i < cells.length; i++) {
      const group = cellRefs.current[i]
      if (!group) continue
      const dx = p.x - cells[i].cx
      const dz = p.z - cells[i].cz
      group.visible = dx * dx + dz * dz < reach2
    }
  })

  return (
    <group>
      {cells.map((cell, i) => (
        <group
          key={cell.key}
          ref={(g) => {
            cellRefs.current[i] = g
          }}
        >
          <Cell data={cell} />
        </group>
      ))}
    </group>
  )
}
