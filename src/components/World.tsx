import Atmosphere from './Atmosphere'
import Scenery from './Scenery'
import Terrain from './Terrain'
import Village from './Village'
import Water from './Water'
import Npcs from './Npcs'
import Player from './Player'
import QuestObjects from './QuestObjects'
import WorldLogic from './WorldLogic'

export default function World() {
  return (
    <>
      <Atmosphere />
      <WorldLogic />
      <Terrain />
      <Water />
      <Scenery />
      <Village />
      <Npcs />
      <QuestObjects />
      <Player />
    </>
  )
}
