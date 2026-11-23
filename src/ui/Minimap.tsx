import { useEffect, useRef } from 'react'
import { WATER_LEVEL, WORLD_HALF, heightAt } from '../game/terrain'
import { ROADS, beacon, houses, npcSpots, shards } from '../game/worldData'
import { playerState } from '../game/state'
import { useGame } from '../game/store'
import { QUEST_LIST } from '../game/quests'

const MAP_PX = 168
const SAMPLE = 128

let baseCanvas: HTMLCanvasElement | null = null

function toMap(x: number, z: number): [number, number] {
  return [
    ((x + WORLD_HALF) / (2 * WORLD_HALF)) * MAP_PX,
    ((z + WORLD_HALF) / (2 * WORLD_HALF)) * MAP_PX,
  ]
}

function buildBase(): HTMLCanvasElement {
  if (baseCanvas) return baseCanvas
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE
  canvas.height = SAMPLE
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(SAMPLE, SAMPLE)
  const step = (WORLD_HALF * 2) / SAMPLE

  for (let py = 0; py < SAMPLE; py++) {
    for (let px = 0; px < SAMPLE; px++) {
      const wx = -WORLD_HALF + px * step
      const wz = -WORLD_HALF + py * step
      const h = heightAt(wx, wz)
      let r: number
      let g: number
      let b: number
      if (h < WATER_LEVEL) {
        r = 46
        g = 92
        b = 112
      } else if (h < WATER_LEVEL + 1.2) {
        r = 186
        g = 166
        b = 122
      } else if (h < 26) {
        r = 92
        g = 128
        b = 70
      } else if (h < 42) {
        r = 108
        g = 116
        b = 84
      } else if (h < 52) {
        r = 124
        g = 118
        b = 108
      } else {
        r = 226
        g = 233
        b = 238
      }
      const relief = 1 + (heightAt(wx + 2.5, wz + 2.5) - h) * 0.03
      const i = (py * SAMPLE + px) * 4
      img.data[i] = Math.max(0, Math.min(255, r * relief))
      img.data[i + 1] = Math.max(0, Math.min(255, g * relief))
      img.data[i + 2] = Math.max(0, Math.min(255, b * relief))
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  // roads (drawn in sample space, scaled by CSS draw)
  ctx.save()
  ctx.scale(SAMPLE / MAP_PX, SAMPLE / MAP_PX)
  ctx.strokeStyle = 'rgba(122, 96, 62, 0.85)'
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  for (const road of ROADS) {
    ctx.beginPath()
    road.forEach((pt, i) => {
      const [mx, my] = toMap(pt.x, pt.z)
      if (i === 0) ctx.moveTo(mx, my)
      else ctx.lineTo(mx, my)
    })
    ctx.stroke()
  }

  // houses
  for (const h of houses) {
    const [mx, my] = toMap(h.x, h.z)
    ctx.fillStyle = '#3d2f22'
    ctx.fillRect(mx - 2, my - 2, 4, 4)
  }

  // village ring
  const [vx, vy] = toMap(0, -25)
  ctx.strokeStyle = 'rgba(232, 195, 122, 0.22)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(vx, vy, 12, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  baseCanvas = canvas
  return canvas
}

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = MAP_PX * dpr
    canvas.height = MAP_PX * dpr
    const ctx = canvas.getContext('2d')!
    const base = buildBase()
    let raf = 0

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, MAP_PX, MAP_PX)
      ctx.drawImage(base, 0, 0, MAP_PX, MAP_PX)

      const st = useGame.getState()

      // quest objects
      for (const shard of shards) {
        if (st.shards.includes(shard.id)) continue
        const [mx, my] = toMap(shard.x, shard.z)
        ctx.save()
        ctx.translate(mx, my)
        ctx.rotate(Math.PI / 4)
        ctx.fillStyle = '#ffd479'
        ctx.fillRect(-2.6, -2.6, 5.2, 5.2)
        ctx.restore()
      }

      if (st.quests.beacon.status === 'active') {
        const [mx, my] = toMap(beacon.x, beacon.z)
        ctx.fillStyle = '#8fe8ff'
        ctx.beginPath()
        ctx.moveTo(mx, my - 5)
        ctx.lineTo(mx + 4.5, my + 3)
        ctx.lineTo(mx - 4.5, my + 3)
        ctx.closePath()
        ctx.fill()
      }

      // NPCs
      for (const npc of npcSpots) {
        const quest = QUEST_LIST.find((q) => q.giverNpc === npc.id)
        const status = quest ? st.quests[quest.id].status : null
        const [mx, my] = toMap(npc.x, npc.z)
        if (status === 'available' || status === 'ready') {
          ctx.fillStyle = status === 'ready' ? '#9ef0a8' : '#ffd479'
          ctx.beginPath()
          ctx.arc(mx, my, 3.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = 'rgba(10, 14, 20, 0.9)'
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          ctx.fillStyle = 'rgba(240, 234, 218, 0.75)'
          ctx.beginPath()
          ctx.arc(mx, my, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // player
      const [px, py] = toMap(playerState.position.x, playerState.position.z)
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(Math.PI - playerState.facing)
      ctx.fillStyle = '#ffe9b0'
      ctx.strokeStyle = 'rgba(20, 24, 30, 0.9)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(0, -6.5)
      ctx.lineTo(4.2, 5)
      ctx.lineTo(0, 2.6)
      ctx.lineTo(-4.2, 5)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="minimap-wrap panel">
      <div className="minimap-tag">Hollowmere Valley</div>
      <canvas ref={canvasRef} className="minimap" style={{ width: MAP_PX, height: MAP_PX }} />
      <div className="minimap-north">N</div>
    </div>
  )
}
