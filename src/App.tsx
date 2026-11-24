import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import World from './components/World'
import HUD from './ui/HUD'
import StartScreen from './ui/StartScreen'
import { useGame } from './game/store'
import { QUALITY, useSettings } from './game/quality'

export default function App() {
  const started = useGame((s) => s.started)
  const quality = useSettings((s) => s.quality)
  const steps = QUALITY[quality].dprSteps

  return (
    <div className="game">
      <Canvas
        // PCF instead of PCF-soft: far fewer shadow taps per ground pixel.
        shadows="percentage"
        // PerfGuard keeps the real pixel ratio inside this range (quality preset).
        dpr={[steps[0], steps[steps.length - 1]]}
        camera={{ fov: 62, near: 0.3, far: 900, position: [0, 22, -6] }}
        // No MSAA: measured ~25% cheaper per frame, and the adaptive pixel ratio
        // already supersamples edges when the GPU has headroom.
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 0.98
        }}
      >
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </Canvas>

      <HUD />
      {!started && <StartScreen />}
    </div>
  )
}
