import { useGame, type DialogueScript } from './store'

export interface NpcMeta {
  id: string
  name: string
  role: string
  colors: {
    cloak: string
    hood: string
    pants: string
    scarf: string
  }
}

export const NPCS: NpcMeta[] = [
  {
    id: 'maeve',
    name: 'Elder Maeve',
    role: 'Village Elder',
    colors: { cloak: '#4b3a63', hood: '#3a2c4e', pants: '#2f2a35', scarf: '#d9b06a' },
  },
  {
    id: 'bran',
    name: 'Bran the Smith',
    role: 'Blacksmith',
    colors: { cloak: '#7a4a34', hood: '#5c3626', pants: '#3c342c', scarf: '#c68a4e' },
  },
  {
    id: 'lira',
    name: 'Lira',
    role: 'Herbalist',
    colors: { cloak: '#3f6247', hood: '#2f4c37', pants: '#3a4032', scarf: '#a8c46b' },
  },
  {
    id: 'tomas',
    name: 'Tomas',
    role: 'Woodcutter',
    colors: { cloak: '#46607a', hood: '#34495c', pants: '#33363b', scarf: '#cfd6d8' },
  },
  {
    id: 'finn',
    name: 'Finn',
    role: 'Riverfolk Fisher',
    colors: { cloak: '#2f5f6b', hood: '#234a54', pants: '#37403c', scarf: '#d7c188' },
  },
]

export function npcMeta(id: string): NpcMeta {
  return NPCS.find((n) => n.id === id) ?? NPCS[0]
}

function script(
  speaker: string,
  role: string,
  lines: string[],
  onComplete?: () => void,
): DialogueScript {
  return { speaker, role, lines, onComplete }
}

import { shards } from './worldData'
const shardHints: Record<string, string> = {
  'shard-river': 'the meadow east of the ford',
  'shard-forest': 'the deep western wood',
  'shard-ridge': 'the eastern rise',
}

export function getDialogue(npcId: string): DialogueScript {
  const s = useGame.getState()
  const q = s.quests

  if (npcId === 'maeve') {
    const qs = q.shards
    if (qs.status === 'available') {
      return script(
        'Elder Maeve',
        'Village Elder',
        [
          'So the south trail still holds a traveller. Hollowmere has been quiet since the mountain cracked.',
          'Three shards of the old horizon broke loose that night. They hum with light — one in the riverside meadow, one in the western wood, one on the eastern rise.',
          'Bring them home, and we can kindle the beacon again. Go carefully. The wilds remember more than we do.',
        ],
        () => s.startQuest('shards'),
      )
    }
    if (qs.status === 'active') {
      const left = 3 - s.shards.length
      return script('Elder Maeve', 'Village Elder', [
        `${s.shards.length} of 3 shards recovered. ${left} still out there, humming.`,
        'Follow the gold marks on your map. A shard cannot hide from someone who is truly looking.',
      ])
    }
    if (qs.status === 'ready') {
      return script(
        'Elder Maeve',
        'Village Elder',
        [
          'All three. And still warm — the horizon remembers you now.',
          'Take this dawnthread cloak-pin. Small thing, but the peaks will treat you more kindly.',
          'The beacon on the north ridge is next. Bram has been asking after it.',
        ],
        () => s.finishQuest('shards'),
      )
    }
    return script('Elder Maeve', 'Village Elder', [
      'The horizon holds, and Hollowmere breathes easy. Rest a while, traveller.',
    ])
  }

  if (npcId === 'bran') {
    const qb = q.beacon
    if (qb.status === 'available') {
      return script(
        'Bran the Smith',
        'Blacksmith',
        [
          'Mind the sparks. Everything in this forge is borrowed from the mountain, one way or another.',
          'The beacon up on the north ridge went dark the same night the shards scattered. Cold iron, cold light, cold welcome for anyone crossing the pass.',
          'Climb up there and stand in the beacon ring. If you are the sort who can carry light, it will answer you. Then come tell me.',
        ],
        () => s.startQuest('beacon'),
      )
    }
    if (qb.status === 'active') {
      return script('Bran the Smith', 'Blacksmith', [
        'Still dark up on the ridge? It is a long climb, but the path bends east past the trees.',
        'Stand inside the ring of stones. You will know it when the wind changes.',
      ])
    }
    if (qb.status === 'ready') {
      return script(
        'Bran the Smith',
        'Blacksmith',
        [
          'Ha! I felt it from here — a warm thread running down the ridge.',
          'The pass is open again in spirit, if not in stone. Take this smith-mark. It will not buy you bread, but it will get you a story.',
        ],
        () => s.finishQuest('beacon'),
      )
    }
    return script('Bran the Smith', 'Blacksmith', [
      'The forge burns steady now. The ridge light answers it, night and morning.',
    ])
  }

  if (npcId === 'lira') {
    const qf = q.fisher
    if (qf.status === 'available') {
      return script(
        'Lira',
        'Herbalist',
        [
          'Careful with that step — moonbells grow there.',
          'You are heading north? Then do me a kindness. Finn fishes the river by the ford and has not come to market in two weeks.',
          'Tell him the winter root is ready, and that his sister is not angry. Well. Only a little.',
        ],
        () => s.startQuest('fisher'),
      )
    }
    if (qf.status === 'active') {
      return script('Lira', 'Herbalist', [
        'Finn keeps to the north bank, past the third bend. Dark hair, patient hands, terrible hat.',
        'If the shards take you that way, listen for water.',
      ])
    }
    if (qf.status === 'ready') {
      return script(
        'Lira',
        'Herbalist',
        [
          'He listened? Then there is hope for the stubborn after all.',
          'Here — riverleaf and honey. For the road, and for not asking me what it does.',
        ],
        () => s.finishQuest('fisher'),
      )
    }
    return script('Lira', 'Herbalist', [
      'Finn came down at dusk, if you can believe it. Sat by the fire and complained about the fish.',
    ])
  }

  if (npcId === 'finn') {
    const qf = q.fisher
    if (qf.status === 'active') {
      return script(
        'Finn',
        'Riverfolk Fisher',
        [
          'Easy. You will scare the silver ones.',
          'Lira sent you? Of course she did. Tell her the winter root can wait until the water drops.',
          'And tell her... no. Tell her I will come down when the shard-light stops flickering in the shallows. That is honest enough.',
        ],
        () => s.advanceQuest('fisher'),
      )
    }
    if (qf.status === 'ready' || qf.status === 'done') {
      return script('Finn', 'Riverfolk Fisher', [
        'Still here? The river is good company. So is the village, when I remember to go.',
        'Shards hum louder near the water. If you are hunting them, follow the bank upstream.',
      ])
    }
    return script('Finn', 'Riverfolk Fisher', [
      'The fish do not care about horizons. It is one of the things I admire about them.',
    ])
  }

  // Tomas
  const remaining = shards.filter((sh) => !s.shards.includes(sh.id))
  return script('Tomas', 'Woodcutter', [
    'Hollowmere is small, but the land around it is not. Mountains north and east, forest west, river across the whole north.',
    remaining.length > 0
      ? `A shard glimmers out near ${shardHints[remaining[0].id]}. You can see the glow a long way off at dusk.`
      : 'You found every shard? Then the whole valley feels a little brighter. Even the wood.'
    ,
    'Press Shift to run. You will want your legs under you when the light goes.',
  ])
}
