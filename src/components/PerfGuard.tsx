import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * Adaptive resolution. Weak GPUs (and browsers that fall back to software WebGL)
 * are almost always fill-rate bound, so the cheapest large win is drawing fewer
 * pixels. We sample the average frame time and step the pixel ratio down when we
 * cannot hold ~48 fps, then carefully step it back up when there is headroom.
 */
const STEPS = [0.6, 0.8, 1, 1.25]

export default function PerfGuard() {
  const setDpr = useThree((s) => s.setDpr)
  const level = useRef(STEPS.length - 1)
  const elapsed = useRef(0)
  const frames = useRef(0)
  const cooldown = useRef(0)
  const goodWindows = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.5)
    elapsed.current += dt
    frames.current += 1
    if (cooldown.current > 0) cooldown.current -= dt
    if (elapsed.current < 1.5) return

    const avg = elapsed.current / frames.current
    elapsed.current = 0
    frames.current = 0

    if (avg > 0.021 && level.current > 0) {
      level.current -= 1
      goodWindows.current = 0
      cooldown.current = 6
      setDpr(STEPS[level.current])
      return
    }

    if (avg < 0.0145 && level.current < STEPS.length - 1) {
      goodWindows.current += 1
      if (goodWindows.current >= 3 && cooldown.current <= 0) {
        level.current += 1
        goodWindows.current = 0
        cooldown.current = 4
        setDpr(STEPS[level.current])
      }
      return
    }

    goodWindows.current = 0
  })

  return null
}
