import { useEffect, useState } from 'react'
import { QUALITY, QUALITY_ORDER, useSettings } from '../game/quality'

/** Frame-rate readout plus the Low / Medium / High quality picker. */
export default function PerfPanel() {
  const [open, setOpen] = useState(false)
  const [fps, setFps] = useState(0)
  const quality = useSettings((s) => s.quality)
  const setQuality = useSettings((s) => s.setQuality)
  const preset = QUALITY[quality]

  useEffect(() => {
    let raf = 0
    let frames = 0
    let last = performance.now()
    const tick = (now: number) => {
      frames += 1
      const span = now - last
      if (span >= 500) {
        setFps(Math.round((frames * 1000) / span))
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const status = fps >= 55 ? 'good' : fps >= 40 ? 'ok' : 'poor'

  return (
    <div className={`perf-panel panel ${open ? 'is-open' : ''}`}>
      <div className="perf-row">
        <span className={`fps-badge ${status}`} title="Frames per second">
          <b>{fps || '--'}</b>
          <span className="fps-unit">FPS</span>
        </span>
        <button
          className="quality-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {preset.label}
          <span className="quality-caret">▾</span>
        </button>
      </div>

      {open && (
        <div className="quality-pop">
          <div className="quality-head">Graphics quality</div>
          <div className="quality-options">
            {QUALITY_ORDER.map((level) => {
              const p = QUALITY[level]
              return (
                <button
                  key={level}
                  className={`quality-opt ${level === quality ? 'is-active' : ''}`}
                  onClick={() => setQuality(level)}
                >
                  <span className="quality-name">{p.label}</span>
                  <span className="quality-spec">
                    ≤{p.dprSteps[p.dprSteps.length - 1]}× · {p.shadows ? 'shadows' : 'no shadows'} ·{' '}
                    {p.viewDistance}m
                  </span>
                </button>
              )
            })}
          </div>
          <p className="quality-note">{preset.note}</p>
        </div>
      )}
    </div>
  )
}
