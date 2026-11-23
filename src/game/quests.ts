export type QuestId = 'shards' | 'beacon' | 'fisher'
export type QuestStatus = 'available' | 'active' | 'ready' | 'done'

export interface QuestDef {
  id: QuestId
  title: string
  giver: string
  giverNpc: string
  objective: string
  goal: number
}

export const QUESTS: Record<QuestId, QuestDef> = {
  shards: {
    id: 'shards',
    title: 'Shards of the Horizon',
    giver: 'Elder Maeve',
    giverNpc: 'maeve',
    objective: 'Recover horizon shards',
    goal: 3,
  },
  beacon: {
    id: 'beacon',
    title: 'Light the Way',
    giver: 'Bran the Smith',
    giverNpc: 'bran',
    objective: 'Reach the north ridge beacon',
    goal: 1,
  },
  fisher: {
    id: 'fisher',
    title: 'Word for the Riverfolk',
    giver: 'Lira the Herbalist',
    giverNpc: 'lira',
    objective: 'Speak with Finn by the river',
    goal: 1,
  },
}

export const QUEST_LIST: QuestDef[] = Object.values(QUESTS)
