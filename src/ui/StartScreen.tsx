import { useGame } from '../game/store'

export default function StartScreen() {
  const start = useGame((s) => s.start)

  return (
    <div className="start-screen">
      <div className="start-card">
        <div className="start-kicker">Project</div>
        <h1 className="start-title">LOST HORIZON</h1>
        <p className="start-sub">
          An open-world journey through the valley of Hollowmere — forests, rivers, mountain
          ridges and a village that remembers every traveller.
        </p>

        <div className="start-controls">
          <div><span className="key">W A S D</span> Walk</div>
          <div><span className="key">Shift</span> Sprint</div>
          <div><span className="key">Space</span> Jump</div>
          <div><span className="key">Mouse drag</span> Look around</div>
          <div><span className="key">Wheel</span> Zoom camera</div>
          <div><span className="key">E</span> Talk · Interact</div>
        </div>

        <button className="btn btn-primary" onClick={start}>
          Enter the horizon
        </button>
        <p className="start-note">Best played fullscreen · headphones optional</p>
      </div>
    </div>
  )
}
