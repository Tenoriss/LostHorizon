import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { QUALITY, useSettings } from '../game/quality'

/**
 * Adaptive resolution. Weak GPUs (and browsers that fall back to software WebGL)
 * are almost always fill-rate bound, so the cheapest large win is drawing fewer
 * pixels. We sample the average frame time and step the pixel ratio down when we
 * cannot hold ~48 fps, then step it back up while the frame rate sits at ~60 fps.
 *
 * The pixel-ratio ladder comes from the selected quality preset, so "High" can
 * reach 1.25x while "Low" stays at 0.65x even on a machine with spare headroom.
 *
 * Rules that keep it from misbehaving:
 * - the first seconds are ignored entirely: shader compilation, texture upload
 *   and the first shadow build produce 100 ms+ frames and would otherwise pin
 *   the game at the lowest step before the scene has even settled;
 * - no sampling while cooling down after a change, so a window always measures
 *   a steady state instead of the hitch caused by the previous resize;
 * - lowering a step takes one bad window, raising it needs several good ones in
 *   a row, and the raise threshold (17.5 ms ~ 57 fps) is well above the lower
 *   threshold (23.5 ms ~ 42 fps) so the resolution cannot ping-pong.
 */
const WARMUP = 2.5 // seconds ignored after mount
const WINDOW = 1.25 // seconds per sample window
const DOWN_MS = 0.0235 // slower than ~42 fps -> lower the resolution
const PANIC_MS = 0.042 // slower than ~24 fps -> drop two steps at once
const UP_MS = 0.0175 // ~57 fps or better -> there is room to raise it
const UP_WINDOWS = 3 // consecutive good windows before raising a step
const DOWN_COOLDOWN = 3.5 // seconds to wait after lowering
const UP_COOLDOWN = 3 // seconds to wait after raising

export default function PerfGuard() {
  const quality = useSettings((s) => s.quality)
  const steps = QUALITY[quality].dprSteps
  const setDpr = useThree((s) => s.setDpr)
  const gl = useThree((s) => s.gl)
  const level = useRef(steps.length - 1)
  const warmup = useRef(WARMUP)
  const elapsed = useRef(0)
  const frames = useRef(0)
  const cooldown = useRef(0)
  const goodWindows = useRef(0)

  // Start in the middle of the ladder instead of at the cap: the first seconds are
  // the worst place to be over budget, and the guard climbs back up quickly when
  // the machine has headroom.
  useEffect(() => {
    const best = Math.min(1, steps.length - 1)
    level.current = best
    warmup.current = WARMUP
    elapsed.current = 0
    frames.current = 0
    cooldown.current = 0
    goodWindows.current = 0
    setDpr(steps[best])
  }, [gl, steps, setDpr])

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
        // A frame time this bad means one step is rarely enough; take two so the
        // climb back does not cost the player another slow second.
        const drop = avg > PANIC_MS ? 2 : 1
        level.current = Math.max(0, level.current - drop)
        cooldown.current = DOWN_COOLDOWN
        setDpr(steps[level.current])
      }
      return
    }

    if (avg < UP_MS && level.current < steps.length - 1) {
      goodWindows.current += 1
      if (goodWindows.current >= UP_WINDOWS) {
        level.current += 1
        goodWindows.current = 0
        cooldown.current = UP_COOLDOWN
        setDpr(steps[level.current])
      }
      return
    }

    goodWindows.current = 0
  })

  return null
}
