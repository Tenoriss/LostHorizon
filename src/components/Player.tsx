import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cameraState, interaction, keys, playerState } from '../game/state'
import { WATER_LEVEL, clamp, heightAt } from '../game/terrain'
import { resolveCollisions } from '../game/collision'
import { useGame } from '../game/store'
import { npcSpots } from '../game/worldData'
import { getDialogue, npcMeta } from '../game/npcs'

const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const moveDir = new THREE.Vector3()
const camTarget = new THREE.Vector3()
const desiredCam = new THREE.Vector3()

const SPAWN = { x: 0, z: -17 }

export default function Player() {
  const root = useRef<THREE.Group>(null!)
  const bodyRef = useRef<THREE.Group>(null!)
  const legL = useRef<THREE.Group>(null!)
  const legR = useRef<THREE.Group>(null!)
  const armL = useRef<THREE.Group>(null!)
  const armR = useRef<THREE.Group>(null!)
  const initialized = useRef(false)
  const { camera, gl } = useThree()

  useEffect(() => {
    const y = heightAt(SPAWN.x, SPAWN.z)
    playerState.position.set(SPAWN.x, y, SPAWN.z)
    playerState.facing = Math.PI
  }, [])

  useEffect(() => {
    const dom = gl.domElement
    let dragging = false
    let lastX = 0
    let lastY = 0

    const onPointerDown = (e: PointerEvent) => {
      if (!useGame.getState().started) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      dom.style.cursor = 'grabbing'
      dom.setPointerCapture?.(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      cameraState.yaw -= dx * 0.0033
      cameraState.pitch = clamp(cameraState.pitch + dy * 0.0026, 0.04, 1.15)
    }
    const onPointerUp = () => {
      dragging = false
      dom.style.cursor = 'grab'
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cameraState.targetDistance = clamp(cameraState.targetDistance + e.deltaY * 0.008, 3.8, 14)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
      const st = useGame.getState()
      if (!st.started) return
      if (e.code === 'KeyE' && !e.repeat) {
        if (st.dialogue) st.advanceDialogue()
        else if (interaction.npcId && !st.paused) {
          st.openDialogue(interaction.npcId, getDialogue(interaction.npcId))
        }
      }
      if (e.code === 'Escape' && !e.repeat) {
        if (st.dialogue) st.advanceDialogue()
        else st.setPaused(!st.paused)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false
    }
    const onBlur = () => {
      for (const k of Object.keys(keys)) keys[k] = false
      dragging = false
    }

    dom.style.cursor = 'grab'
    dom.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    dom.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      dom.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [gl])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const st = useGame.getState()
    const frozen = !st.started || st.paused || !!st.dialogue
    const p = playerState.position

    // ---- input ----
    let ix = 0
    let iz = 0
    if (!frozen) {
      if (keys.KeyW || keys.ArrowUp) iz += 1
      if (keys.KeyS || keys.ArrowDown) iz -= 1
      if (keys.KeyA || keys.ArrowLeft) ix -= 1
      if (keys.KeyD || keys.ArrowRight) ix += 1
    }
    const inputLen = Math.hypot(ix, iz)
    if (inputLen > 0) {
      ix /= inputLen
      iz /= inputLen
    }

    const yaw = cameraState.yaw
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw))
    right.set(Math.cos(yaw), 0, -Math.sin(yaw))
    moveDir.set(0, 0, 0)
    if (inputLen > 0) moveDir.addScaledVector(forward, iz).addScaledVector(right, ix).normalize()

    const sprinting = !frozen && !!(keys.ShiftLeft || keys.ShiftRight) && inputLen > 0
    const groundHere = heightAt(p.x, p.z)
    const inWater = groundHere < WATER_LEVEL - 0.15
    const baseSpeed = sprinting ? 9.8 : 5.5
    const targetSpeed = inputLen > 0 ? baseSpeed * (inWater ? 0.55 : 1) : 0

    // ---- horizontal movement ----
    const accel = 1 - Math.exp(-(inputLen > 0 ? 13 : 17) * dt)
    playerState.velocity.x += (moveDir.x * targetSpeed - playerState.velocity.x) * accel
    playerState.velocity.z += (moveDir.z * targetSpeed - playerState.velocity.z) * accel
    p.x += playerState.velocity.x * dt
    p.z += playerState.velocity.z * dt

    resolveCollisions(p, 0.45)

    // ---- vertical movement ----
    const ground = heightAt(p.x, p.z)
    const surface = Math.max(ground, WATER_LEVEL - 0.55)
    if (!frozen && keys.Space && playerState.grounded) {
      playerState.grounded = false
      playerState.velocity.y = 8.6
    }
    playerState.velocity.y -= 26 * dt
    p.y += playerState.velocity.y * dt
    if (playerState.velocity.y <= 0 && p.y - surface <= 1.6) {
      p.y = surface
      playerState.velocity.y = 0
      playerState.grounded = true
    } else {
      playerState.grounded = false
    }
    if (p.y < surface) {
      p.y = surface
      playerState.velocity.y = 0
      playerState.grounded = true
    }

    // ---- facing + animation ----
    const planarSpeed = Math.hypot(playerState.velocity.x, playerState.velocity.z)
    playerState.speed = planarSpeed
    playerState.moving = planarSpeed > 0.6
    playerState.sprinting = sprinting
    playerState.inWater = inWater

    if (inputLen > 0) {
      const targetFacing = Math.atan2(moveDir.x, moveDir.z)
      let diff = targetFacing - playerState.facing
      diff = ((diff + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      playerState.facing += diff * (1 - Math.exp(-14 * dt))
    }

    if (!initialized.current) {
      p.y = Math.max(heightAt(p.x, p.z), WATER_LEVEL)
      initialized.current = true
    }

    if (root.current) {
      root.current.position.copy(p)
      root.current.rotation.y = playerState.facing
    }

    const phase = (playerState.phase += dt * (5.5 + planarSpeed * 1.05))
    const swing = Math.min(1, planarSpeed / 5.5) * 0.72
    if (legL.current && legR.current && armL.current && armR.current) {
      const air = playerState.grounded ? 0 : 1
      legL.current.rotation.x = Math.sin(phase) * swing - air * 0.25
      legR.current.rotation.x = -Math.sin(phase) * swing + air * 0.15
      armL.current.rotation.x = -Math.sin(phase) * swing * 0.75 - air * 0.5
      armR.current.rotation.x = Math.sin(phase) * swing * 0.75 - air * 0.5
      armL.current.rotation.z = 0.08
      armR.current.rotation.z = -0.08
    }
    if (bodyRef.current) {
      const t = state.clock.elapsedTime
      bodyRef.current.position.y = Math.abs(Math.sin(phase)) * 0.045 * Math.min(1, planarSpeed / 4) +
        Math.sin(t * 1.8) * 0.012
    }

    // ---- camera ----
    cameraState.distance += (cameraState.targetDistance - cameraState.distance) * (1 - Math.exp(-8 * dt))
    const cosPitch = Math.cos(cameraState.pitch)
    camTarget.set(p.x, p.y + 1.6, p.z)
    const dirX = Math.sin(cameraState.yaw) * cosPitch
    const dirY = Math.sin(cameraState.pitch)
    const dirZ = Math.cos(cameraState.yaw) * cosPitch

    // pull the camera in if terrain blocks the view of the player
    let camDist = cameraState.distance
    const SAMPLES = 12
    for (let i = 1; i <= SAMPLES; i++) {
      const t = (i / SAMPLES) * camDist
      const sx = camTarget.x + dirX * t
      const sy = camTarget.y + dirY * t
      const sz = camTarget.z + dirZ * t
      if (sy < heightAt(sx, sz) + 0.7) {
        camDist = Math.max(2.4, ((i - 1) / SAMPLES) * camDist - 0.25)
        break
      }
    }

    desiredCam.set(
      camTarget.x + dirX * camDist,
      camTarget.y + dirY * camDist,
      camTarget.z + dirZ * camDist,
    )
    const cameraFloor = heightAt(desiredCam.x, desiredCam.z) + 0.8
    if (desiredCam.y < cameraFloor) desiredCam.y = cameraFloor

    const follow = initialized.current ? 1 - Math.exp(-9 * dt) : 1
    camera.position.lerp(desiredCam, follow)
    camera.lookAt(camTarget)

    // ---- interaction hint ----
    let nearest: string | null = null
    let bestDist = 3.8
    for (const n of npcSpots) {
      const d = Math.hypot(p.x - n.x, p.z - n.z)
      if (d < bestDist) {
        bestDist = d
        nearest = n.id
      }
    }
    if (nearest !== interaction.npcId) {
      interaction.npcId = nearest
      st.setHint(nearest ? `Speak with ${npcMeta(nearest).name}` : '')
    }
  })

  return (
    <group ref={root} position={[0, 10, 0]}>
      <group ref={bodyRef}>
        {/* legs */}
        <group ref={legL} position={[-0.17, 0.86, 0]}>
          <mesh position={[0, -0.43, 0]} castShadow>
            <boxGeometry args={[0.24, 0.86, 0.26]} />
            <meshLambertMaterial color="#3f4a56" flatShading />
          </mesh>
          <mesh position={[0, -0.82, 0.05]} castShadow>
            <boxGeometry args={[0.27, 0.2, 0.36]} />
            <meshLambertMaterial color="#2e2822" flatShading />
          </mesh>
        </group>
        <group ref={legR} position={[0.17, 0.86, 0]}>
          <mesh position={[0, -0.43, 0]} castShadow>
            <boxGeometry args={[0.24, 0.86, 0.26]} />
            <meshLambertMaterial color="#3f4a56" flatShading />
          </mesh>
          <mesh position={[0, -0.82, 0.05]} castShadow>
            <boxGeometry args={[0.27, 0.2, 0.36]} />
            <meshLambertMaterial color="#2e2822" flatShading />
          </mesh>
        </group>

        {/* torso + cloak */}
        <mesh position={[0, 1.22, 0]} castShadow>
          <boxGeometry args={[0.62, 0.78, 0.38]} />
          <meshLambertMaterial color="#2f6f68" flatShading />
        </mesh>
        <mesh position={[0, 1.02, -0.24]} castShadow>
          <boxGeometry args={[0.7, 0.95, 0.22]} />
          <meshLambertMaterial color="#285c57" flatShading />
        </mesh>
        <mesh position={[0, 1.5, 0.02]}>
          <boxGeometry args={[0.66, 0.16, 0.42]} />
          <meshLambertMaterial color="#e0a34a" flatShading />
        </mesh>

        {/* arms */}
        <group ref={armL} position={[-0.4, 1.5, 0]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.17, 0.68, 0.2]} />
            <meshLambertMaterial color="#2a615b" flatShading />
          </mesh>
          <mesh position={[0, -0.72, 0]} castShadow>
            <boxGeometry args={[0.16, 0.18, 0.18]} />
            <meshLambertMaterial color="#e6b88a" flatShading />
          </mesh>
        </group>
        <group ref={armR} position={[0.4, 1.5, 0]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.17, 0.68, 0.2]} />
            <meshLambertMaterial color="#2a615b" flatShading />
          </mesh>
          <mesh position={[0, -0.72, 0]} castShadow>
            <boxGeometry args={[0.16, 0.18, 0.18]} />
            <meshLambertMaterial color="#e6b88a" flatShading />
          </mesh>
        </group>

        {/* head + hood */}
        <group position={[0, 1.78, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.4, 0.38]} />
            <meshLambertMaterial color="#e6b88a" flatShading />
          </mesh>
          <mesh position={[0, 0.07, -0.06]} castShadow>
            <boxGeometry args={[0.48, 0.34, 0.46]} />
            <meshLambertMaterial color="#24524f" flatShading />
          </mesh>
          <mesh position={[0, 0.26, -0.12]} castShadow>
            <boxGeometry args={[0.4, 0.3, 0.4]} />
            <meshLambertMaterial color="#24524f" flatShading />
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

        {/* backpack */}
        <mesh position={[0, 1.22, -0.34]} castShadow>
          <boxGeometry args={[0.42, 0.5, 0.2]} />
          <meshLambertMaterial color="#6b4c30" flatShading />
        </mesh>
      </group>
    </group>
  )
}
