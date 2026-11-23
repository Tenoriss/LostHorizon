import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { bushes, oaks, pines, rocks, type TreeInst } from '../game/worldData'

const dummy = new THREE.Object3D()
const tintColor = new THREE.Color()

function useInstanceSetup(
  ref: React.RefObject<THREE.InstancedMesh>,
  items: TreeInst[],
  palette: string[],
) {
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
  }, [ref, items, palette])
}

export default function Scenery() {
  const pineTrunkRef = useRef<THREE.InstancedMesh>(null!)
  const pineLowRef = useRef<THREE.InstancedMesh>(null!)
  const pineHighRef = useRef<THREE.InstancedMesh>(null!)
  const oakTrunkRef = useRef<THREE.InstancedMesh>(null!)
  const oakCrownRef = useRef<THREE.InstancedMesh>(null!)
  const oakCrown2Ref = useRef<THREE.InstancedMesh>(null!)
  const bushRef = useRef<THREE.InstancedMesh>(null!)
  const rockRef = useRef<THREE.InstancedMesh>(null!)

  const geo = useMemo(
    () => ({
      pineTrunk: new THREE.CylinderGeometry(0.17, 0.3, 2.8, 4).translate(0, 1.4, 0),
      pineLow: new THREE.ConeGeometry(1.85, 4.2, 5).translate(0, 3.5, 0),
      pineHigh: new THREE.ConeGeometry(1.25, 3.1, 5).translate(0, 5.8, 0),
      oakTrunk: new THREE.CylinderGeometry(0.22, 0.36, 2.4, 4).translate(0, 1.2, 0),
      oakCrown: new THREE.IcosahedronGeometry(1.95, 0).translate(0, 3.4, 0),
      oakCrown2: new THREE.IcosahedronGeometry(1.25, 0).translate(0.85, 4.25, 0.35),
      bush: new THREE.IcosahedronGeometry(0.95, 0).translate(0, 0.55, 0),
      rock: new THREE.DodecahedronGeometry(1, 0).translate(0, 0.15, 0),
    }),
    [],
  )

  const materials = useMemo(
    () => ({
      trunk: new THREE.MeshLambertMaterial({ color: '#5a4433', flatShading: true }),
      pine: new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }),
      oak: new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }),
      bush: new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }),
      rock: new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }),
    }),
    [],
  )

  const pinePalette = useMemo(() => ['#39613a', '#2f5533', '#426b3f', '#35573a'], [])
  const oakPalette = useMemo(() => ['#527f3c', '#628c45', '#466f38', '#6d9448'], [])
  const bushPalette = useMemo(() => ['#476b32', '#3c5f2c', '#547a3a'], [])
  const rockPalette = useMemo(() => ['#7a756c', '#69645d', '#847e73', '#5d5952'], [])

  useInstanceSetup(pineTrunkRef, pines, ['#5a4433'])
  useInstanceSetup(pineLowRef, pines, pinePalette)
  useInstanceSetup(pineHighRef, pines, pinePalette)
  useInstanceSetup(oakTrunkRef, oaks, ['#5f4a37'])
  useInstanceSetup(oakCrownRef, oaks, oakPalette)
  useInstanceSetup(oakCrown2Ref, oaks, oakPalette)
  useInstanceSetup(bushRef, bushes, bushPalette)
  useInstanceSetup(rockRef, rocks, rockPalette)

  return (
    <group>
      <instancedMesh
        ref={pineTrunkRef}
        args={[geo.pineTrunk, materials.trunk, pines.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={pineLowRef}
        args={[geo.pineLow, materials.pine, pines.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={pineHighRef}
        args={[geo.pineHigh, materials.pine, pines.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={oakTrunkRef}
        args={[geo.oakTrunk, materials.trunk, oaks.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={oakCrownRef}
        args={[geo.oakCrown, materials.oak, oaks.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={oakCrown2Ref}
        args={[geo.oakCrown2, materials.oak, oaks.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={bushRef}
        args={[geo.bush, materials.bush, bushes.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={rockRef}
        args={[geo.rock, materials.rock, rocks.length]}
        castShadow
        frustumCulled={false}
      />
    </group>
  )
}
