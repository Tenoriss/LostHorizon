import { create } from 'zustand'
import { QUESTS, type QuestId, type QuestStatus } from './quests'

export interface DialogueScript {
  speaker: string
  role: string
  lines: string[]
  onComplete?: () => void
}

export interface QuestState {
  status: QuestStatus
  progress: number
}

interface GameStore {
  started: boolean
  paused: boolean
  timeLabel: string
  night: boolean
  hint: string
  dialogue: { npc: string; script: DialogueScript; index: number } | null
  quests: Record<QuestId, QuestState>
  shards: string[]
  toast: { text: string; id: number } | null
  start: () => void
  setPaused: (paused: boolean) => void
  setTime: (label: string, night: boolean) => void
  setHint: (hint: string) => void
  openDialogue: (npc: string, script: DialogueScript) => void
  advanceDialogue: () => void
  startQuest: (id: QuestId) => void
  advanceQuest: (id: QuestId, amount?: number) => void
  finishQuest: (id: QuestId) => void
  collectShard: (id: string) => void
  pushToast: (text: string) => void
}

const emptyQuests = (): Record<QuestId, QuestState> => ({
  shards: { status: 'available', progress: 0 },
  beacon: { status: 'available', progress: 0 },
  fisher: { status: 'available', progress: 0 },
})

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useGame = create<GameStore>((set, get) => ({
  started: false,
  paused: false,
  timeLabel: '08:36',
  night: false,
  hint: '',
  dialogue: null,
  quests: emptyQuests(),
  shards: [],
  toast: null,

  start: () => set({ started: true, paused: false }),

  setPaused: (paused) => set({ paused }),

  setTime: (timeLabel, night) => set({ timeLabel, night }),

  setHint: (hint) => {
    if (get().hint !== hint) set({ hint })
  },

  openDialogue: (npc, script) => set({ dialogue: { npc, script, index: 0 } }),

  advanceDialogue: () => {
    const d = get().dialogue
    if (!d) return
    const next = d.index + 1
    if (next >= d.script.lines.length) {
      set({ dialogue: null })
      d.script.onComplete?.()
    } else {
      set({ dialogue: { ...d, index: next } })
    }
  },

  startQuest: (id) => {
    const state = get()
    if (state.quests[id].status !== 'available') return
    const progress = id === 'shards' ? Math.min(state.shards.length, QUESTS.shards.goal) : 0
    const status: QuestStatus = progress >= QUESTS[id].goal ? 'ready' : 'active'
    set({ quests: { ...state.quests, [id]: { status, progress } } })
    get().pushToast(`Quest started — ${QUESTS[id].title}`)
  },

  advanceQuest: (id, amount = 1) => {
    const state = get()
    const q = state.quests[id]
    if (q.status !== 'active') return
    const goal = QUESTS[id].goal
    const progress = Math.min(goal, q.progress + amount)
    const status: QuestStatus = progress >= goal ? 'ready' : 'active'
    set({ quests: { ...state.quests, [id]: { status, progress } } })
    if (status === 'ready') {
      get().pushToast(`Objective complete — return to ${QUESTS[id].giver}`)
    }
  },

  finishQuest: (id) => {
    const state = get()
    if (state.quests[id].status !== 'ready') return
    set({ quests: { ...state.quests, [id]: { status: 'done', progress: QUESTS[id].goal } } })
    get().pushToast(`Quest complete — ${QUESTS[id].title}`)
  },

  collectShard: (id) => {
    const state = get()
    if (state.shards.includes(id)) return
    const shards = [...state.shards, id]
    const q = state.quests.shards
    let quests = state.quests
    if (q.status === 'active' || q.status === 'ready') {
      const progress = Math.min(QUESTS.shards.goal, shards.length)
      const status: QuestStatus = progress >= QUESTS.shards.goal ? 'ready' : 'active'
      quests = { ...state.quests, shards: { status, progress } }
    }
    set({ shards, quests })
    get().pushToast(`Horizon shard recovered (${shards.length}/3)`)
  },

  pushToast: (text) => {
    const id = Date.now() + Math.random()
    set({ toast: { text, id } })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null })
    }, 5200)
  },
}))
