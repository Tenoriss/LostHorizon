import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * Adaptive resolution. Weak GPUs (and browsers that fall back to software WebGL)
 * are almost always fill-rate bound, so the cheapest large win is drawing fewer
 * pixels. We sample the average frame time and step the pixel ratio down when we
 * cannot hold ~48 fps, then step it back up while the frame rate sits at ~60 fps.
 *
 * Rules that keep it from misbehaving:
 * - the first seconds are ignored entirely: shader compilation, texture upload
 *   and the first shadow build produce 100 ms+ frames and would otherwise pin
 *   the game at the lowest step before the scene has even settled;
 * - no sampling while cooling down after a change, so a window always measures
 *   a steady state instead of the hitch caused by the previous resize;
 * - lowering a step takes one bad window, raising it needs several good ones in
 *   a row, and the raise threshold (17 ms ~ 59 fps) is well above the lower
 *   threshold (21 ms ~ 48 fps) so the resolution cannot ping-pong;
 * - the starting level is read from the real pixel ratio on mount, because the
 *   Canvas dpr range is clamped to the display's devicePixelRatio.
 */
const STEPS = [0.6, 0.8, 1, 1.25]

const WARMUP = 4 // seconds ignored after mount
const WINDOW = 1.5 // seconds per sample window
const DOWN_MS = 0.021 // slower than ~48 fps -> lower the resolution
const UP_MS = 0.017 // ~59 fps or better -> there is room to raise it
const UP_WINDOWS = 2 // consecutive good windows before raising a step
const DOWN_COOLDOWN = 5 // seconds to wait after lowering
const UP_COOLDOWN = 2.5 // seconds to wait after raising

export default function PerfGuard() {
  const setDpr = useThree((s) => s.setDpr)
  const gl = useThree((s) => s.gl)
  const level = useRef(STEPS.length - 1)
  const warmup = useRef(WARMUP)
  const elapsed = useRef(0)
  const frames = useRef(0)
  const cooldown = useRef(0)
  const goodWindows = useRef(0)

  // Match the bookkeeping to the resolution the renderer actually started with.
  useEffect(() => {
    const actual = gl.getPixelRatio()
    let best = 0
    for (let i = 1; i < STEPS.length; i++) {
      if (Math.abs(STEPS[i] - actual) < Math.abs(STEPS[best] - actual)) best = i
    }
    level.current = best
    warmup.current = WARMUP
    elapsed.current = 0
    frames.current = 0
    cooldown.current = 0
    goodWindows.current = 0
  }, [gl])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.5)

    // Let the scene warm up (shader compile, first shadow pass) before judging it.
    if (warmup.current > 0) {
      warmup.current -= dt
      if (warmup.current <= 0) {
        elapsed.current = 0
        frames.current = 0
      }
      return
    }

    // Right after a resolution change the next frames include the resize hitch,
    // so measure nothing until the cooldown is over.
    if (cooldown.current > 0) {
      cooldown.current -= dt
      return
    }

    elapsed.current += dt
    frames.current += 1
    if (elapsed.current < WINDOW) return

    const avg = elapsed.current / frames.current
    elapsed.current = 0
    frames.current = 0

    if (avg > DOWN_MS) {
      goodWindows.current = 0
      if (level.current > 0) {
        level.current -= 1
        cooldown.current = DOWN_COOLDOWN
        setDpr(STEPS[level.current])
      }
      return
    }

    if (avg < UP_MS && level.current < STEPS.length - 1) {
      goodWindows.current += 1
      if (goodWindows.current >= UP_WINDOWS) {
        level.current += 1
        goodWindows.current = 0
        cooldown.current = UP_COOLDOWN
        setDpr(STEPS[level.current])
      }
      return
    }

    goodWindows.current = 0
  })

  return null
}
