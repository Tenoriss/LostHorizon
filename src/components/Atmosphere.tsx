import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { clockState, playerState } from '../game/state'
import { smoothstep } from '../game/terrain'
import { useGame } from '../game/store'

const skyNight = new THREE.Color('#0a1120')
const skyDusk = new THREE.Color('#e6a070')
const skyDay = new THREE.Color('#a6d1e6')
const fogNight = new THREE.Color('#0f1a2b')
const fogDusk = new THREE.Color('#d9a98a')
const fogDay = new THREE.Color('#b6d3df')

const sunDay = new THREE.Color('#fff3d2')
const sunDusk = new THREE.Color('#ffb168')
const sunNight = new THREE.Color('#8ea9e0')

const skyColor = new THREE.Color()
const fogColor = new THREE.Color()
const lightColor = new THREE.Color()

const sunDir = new THREE.Vector3()
const lightPos = new THREE.Vector3()
const lightTarget = new THREE.Vector3()

function formatTime(hours: number) {
  const h = Math.floor(hours) % 24
  const m = Math.floor((hours - Math.floor(hours)) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export default function Atmosphere() {
  const { scene } = useThree()
  const sunRef = useRef<THREE.DirectionalLight>(null!)
  const hemiRef = useRef<THREE.HemisphereLight>(null!)
  const ambientRef = useRef<THREE.AmbientLight>(null!)
  const sunDisc = useRef<THREE.Mesh>(null!)
  const moonDisc = useRef<THREE.Mesh>(null!)
  const timeAcc = useRef(0)
  const shadowAcc = useRef(0)
  const lastShadowPos = useRef(new THREE.Vector3(1e9, 1e9, 1e9))
  const [starsVisible, setStarsVisible] = useState(false)

  const fog = useMemo(() => new THREE.Fog('#b6d3df', 80, 360), [])

  useEffect(() => {
    scene.background = skyColor
    scene.fog = fog
    return () => {
      scene.background = null
      scene.fog = null
    }
  }, [scene, fog])

  useFrame((_, delta) => {
    const hours = clockState.hours
    const angle = (hours / 24) * Math.PI * 2 - Math.PI / 2
    const elevation = Math.sin(angle)
    const horizontal = Math.cos(angle)

    sunDir.set(horizontal, elevation, 0.3).normalize()

    // sky + fog palette
    const nightToDusk = smoothstep(-0.32, 0.02, elevation)
    const duskToDay = smoothstep(0.02, 0.34, elevation)
    skyColor.copy(skyNight).lerp(skyDusk, nightToDusk).lerp(skyDay, duskToDay)
    fogColor.copy(fogNight).lerp(fogDusk, nightToDusk).lerp(fogDay, duskToDay)
    fog.color.copy(fogColor)

    // sun / moon light
    const dayLight = smoothstep(-0.02, 0.3, elevation)
    if (sunRef.current) {
      lightColor.copy(sunNight).lerp(sunDusk, smoothstep(-0.15, 0.12, elevation)).lerp(sunDay, dayLight)
      sunRef.current.color.copy(lightColor)
      sunRef.current.intensity = 0.16 + dayLight * 2.9

      lightTarget.set(playerState.position.x, playerState.position.y, playerState.position.z)
      lightPos.copy(lightTarget).addScaledVector(sunDir, 72)
      sunRef.current.position.copy(lightPos)
      sunRef.current.target.position.copy(lightTarget)
      sunRef.current.target.updateMatrixWorld()

      // Re-rendering the shadow map means drawing every caster again, so it is a
      // per-update spike. Keep it near-static: only refresh when the light actually
      // moved far enough to matter, and never more than a few times a second.
      shadowAcc.current += delta
      if (
        shadowAcc.current > 0.35 &&
        (shadowAcc.current > 1.2 || lastShadowPos.current.distanceToSquared(lightPos) > 4)
      ) {
        shadowAcc.current = 0
        lastShadowPos.current.copy(lightPos)
        sunRef.current.shadow.needsUpdate = true
      }
    }

    if (hemiRef.current) {
      hemiRef.current.intensity = 0.16 + dayLight * 0.34
      hemiRef.current.color.copy(skyColor)
      hemiRef.current.groundColor.setRGB(
        0.12 + 0.1 * dayLight,
        0.1 + 0.09 * dayLight,
        0.08 + 0.06 * dayLight,
      )
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.11 + dayLight * 0.17
    }

    // celestial bodies
    if (sunDisc.current) {
      sunDisc.current.position.copy(sunDir).multiplyScalar(430)
      const sunMat = sunDisc.current.material as THREE.MeshBasicMaterial
      sunMat.opacity = smoothstep(-0.12, 0.06, elevation)
    }
    if (moonDisc.current) {
      moonDisc.current.position.copy(sunDir).multiplyScalar(-430)
    }

    if (elevation < 0.02 !== starsVisible) setStarsVisible(elevation < 0.02)

    // low-frequency UI clock updates
    timeAcc.current += delta
    if (timeAcc.current > 0.25) {
      timeAcc.current = 0
      useGame.getState().setTime(formatTime(hours), elevation < -0.04)
    }
  })

  return (
    <>
      <directionalLight
        ref={sunRef}
        castShadow
        intensity={2.4}
        position={[60, 90, 40]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-bias={-0.0004}
        shadow-normalBias={0.06}
        shadow-autoUpdate={false}
      />
      <hemisphereLight ref={hemiRef} args={['#a8cfe0', '#3d3a2c', 0.4]} />
      <ambientLight ref={ambientRef} intensity={0.18} />

      <mesh ref={sunDisc} frustumCulled={false}>
        <sphereGeometry args={[16, 12, 12]} />
        <meshBasicMaterial color="#fff2c4" transparent fog={false} toneMapped={false} />
      </mesh>
      <mesh ref={moonDisc} frustumCulled={false}>
        <sphereGeometry args={[10, 12, 12]} />
        <meshBasicMaterial color="#dfe9ff" transparent opacity={0.85} fog={false} toneMapped={false} />
      </mesh>

      {starsVisible && (
        <Stars radius={260} depth={70} count={1100} factor={3.4} saturation={0} fade speed={0.4} />
      )}
    </>
  )
}
