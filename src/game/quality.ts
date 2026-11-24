import { create } from 'zustand'

export type QualityLevel = 'low' | 'medium' | 'high'

export interface QualityPreset {
  label: string
  /** Pixel-ratio ladder PerfGuard may move between; the last entry is the cap. */
  dprSteps: number[]
  shadows: boolean
  shadowMapSize: number
  /** How far the player can see, in world units (fog + terrain chunk culling). */
  viewDistance: number
  note: string
}

export const QUALITY: Record<QualityLevel, QualityPreset> = {
  low: {
    label: 'Low',
    dprSteps: [0.4, 0.5, 0.65],
    shadows: false,
    shadowMapSize: 512,
    viewDistance: 130,
    note: 'Biggest FPS gain: no shadows, 0.65x pixels at most, short horizon.',
  },
  medium: {
    label: 'Medium',
    dprSteps: [0.6, 0.75, 0.9],
    shadows: true,
    shadowMapSize: 1024,
    viewDistance: 240,
    note: 'Balanced: 0.9x pixel cap, 1024 shadow map, mid horizon.',
  },
  high: {
    label: 'High',
    dprSteps: [0.8, 1, 1.25],
    shadows: true,
    shadowMapSize: 2048,
    viewDistance: 400,
    note: 'Full detail: up to 1.25x pixels, 2048 shadow map, long horizon.',
  },
}

export const QUALITY_ORDER: QualityLevel[] = ['low', 'medium', 'high']

const STORAGE_KEY = 'lost-horizon.quality'

function readStored(): QualityLevel {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'low' || value === 'medium' || value === 'high') return value
  } catch {
    // private mode / blocked storage: fall back to the default
  }
  return 'medium'
}

interface SettingsStore {
  quality: QualityLevel
  setQuality: (quality: QualityLevel) => void
}

export const useSettings = create<SettingsStore>((set) => ({
  quality: readStored(),
  setQuality: (quality) => {
    try {
      localStorage.setItem(STORAGE_KEY, quality)
    } catch {
      // not being able to remember the choice must not break the game
    }
    set({ quality })
  },
}))
