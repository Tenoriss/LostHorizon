import Minimap from './Minimap'
import PerfPanel from './PerfPanel'
import { QUESTS, QUEST_LIST } from '../game/quests'
import { useGame } from '../game/store'

export default function HUD() {
  const started = useGame((s) => s.started)
  const paused = useGame((s) => s.paused)
  const quests = useGame((s) => s.quests)
  const timeLabel = useGame((s) => s.timeLabel)
  const night = useGame((s) => s.night)
  const hint = useGame((s) => s.hint)
  const dialogue = useGame((s) => s.dialogue)
  const toast = useGame((s) => s.toast)
  const shards = useGame((s) => s.shards)
  const advanceDialogue = useGame((s) => s.advanceDialogue)
  const setPaused = useGame((s) => s.setPaused)

  if (!started) return null

  const tracked = QUEST_LIST.filter((q) => quests[q.id].status !== 'available')
  const activeCount = tracked.filter((q) => quests[q.id].status !== 'done').length

  return (
    <div className={`hud ${paused ? 'hud-paused' : ''}`}>
      <div className="quest-panel panel">
        <div className="panel-head">
          <span className="panel-kicker">Journal</span>
          <span className="panel-badge">{activeCount} active</span>
        </div>
        <div className="quest-village">Hollowmere</div>
        {tracked.length === 0 && (
          <p className="quest-empty">
            Find the villagers around the well and the forge. They will have work for a
            traveller.
          </p>
        )}
        <ul className="quest-list">
          {tracked.map((q) => {
            const state = quests[q.id]
            return (
              <li key={q.id} className={`quest-item status-${state.status}`}>
                <div className="quest-row">
                  <span className={`quest-dot ${state.status}`} />
                  <span className="quest-title">{q.title}</span>
                </div>
                <div className="quest-objective">
                  {state.status === 'done'
                    ? 'Completed'
                    : state.status === 'ready'
                      ? `Return to ${q.giver}`
                      : q.objective}
                  {q.goal > 1 && state.status !== 'done' && (
                    <span className="quest-progress">
                      {' '}
                      {state.progress}/{q.goal}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        {shards.length > 0 && (
          <div className="shard-count">Shards recovered: {shards.length}/3</div>
        )}
      </div>

      <div className="clock-panel panel">
        <span className={`clock-icon ${night ? 'is-night' : ''}`}>{night ? '☾' : '☀'}</span>
        <div>
          <div className="clock-time">{timeLabel}</div>
          <div className="clock-phase">
            {night ? 'Night' : timeLabel < '07:00' ? 'Dawn' : timeLabel > '18:00' ? 'Dusk' : 'Daylight'}
          </div>
        </div>
      </div>

      <div className="controls-strip">
        <span><b>WASD</b> move</span>
        <span><b>Shift</b> sprint</span>
        <span><b>Space</b> jump</span>
        <span><b>Drag</b> look</span>
        <span><b>E</b> interact</span>
        <span><b>Esc</b> pause</span>
      </div>

      <Minimap />
      <PerfPanel />

      {hint && !dialogue && !paused && (
        <div className="interact-prompt">
          <span className="key">E</span> {hint}
        </div>
      )}

      {toast && <div className="toast">{toast.text}</div>}

      {dialogue && (
        <div className="dialogue panel" onClick={advanceDialogue}>
          <div className="dialogue-head">
            <span className="dialogue-name">{dialogue.script.speaker}</span>
            <span className="dialogue-role">{dialogue.script.role}</span>
          </div>
          <p className="dialogue-line">{dialogue.script.lines[dialogue.index]}</p>
          <div className="dialogue-foot">
            <span>
              {dialogue.index + 1} / {dialogue.script.lines.length}
            </span>
            <span className="dialogue-next">E · continue</span>
          </div>
        </div>
      )}

      {paused && !dialogue && (
        <div className="pause-overlay">
          <div className="pause-card panel">
            <h2>Paused</h2>
            <p>The valley waits for you.</p>
            <div className="pause-controls">
              <span><b>WASD</b> walk</span>
              <span><b>Shift</b> sprint</span>
              <span><b>Space</b> jump</span>
              <span><b>Mouse drag</b> camera</span>
              <span><b>Scroll</b> zoom</span>
              <span><b>E</b> talk / continue</span>
            </div>
            <button className="btn" onClick={() => setPaused(false)}>
              Resume journey
            </button>
          </div>
        </div>
      )}

      {!paused && !dialogue && (
        <div className="quest-tracker">
          {(() => {
            const trackedQuest = QUEST_LIST.find(
              (q) => quests[q.id].status === 'ready' || quests[q.id].status === 'active',
            )
            if (!trackedQuest) return null
            const state = quests[trackedQuest.id]
            return (
              <>
                <span className="tracker-kicker">Objective</span>
                <span className="tracker-text">
                  {state.status === 'ready'
                    ? `Return to ${QUESTS[trackedQuest.id].giver}`
                    : QUESTS[trackedQuest.id].objective}
                  {QUESTS[trackedQuest.id].goal > 1 && state.status !== 'ready' && (
                    <span className="tracker-progress">
                      {' '}
                      {state.progress}/{QUESTS[trackedQuest.id].goal}
                    </span>
                  )}
                </span>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
