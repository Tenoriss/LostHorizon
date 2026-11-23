import { useFrame } from '@react-three/fiber'
import { clockState, playerState } from '../game/state'
import { beacon, shards } from '../game/worldData'
import { useGame } from '../game/store'

export default function WorldLogic() {
  useFrame((_, delta) => {
    const st = useGame.getState()
    if (!st.started || st.paused) return

    clockState.hours = (clockState.hours + Math.min(delta, 0.1) * clockState.speed) % 24

    const p = playerState.position

    for (const shard of shards) {
      if (st.shards.includes(shard.id)) continue
      const d = Math.hypot(p.x - shard.x, p.z - shard.z)
      if (d < 2.6 && Math.abs(p.y - shard.y) < 4) st.collectShard(shard.id)
    }

    if (st.quests.beacon.status === 'active') {
      if (Math.hypot(p.x - beacon.x, p.z - beacon.z) < beacon.radius) {
        st.advanceQuest('beacon')
      }
    }
  })

  return null
}
