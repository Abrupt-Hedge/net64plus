import './RadarPanel.scss'

import * as React from 'react'

import { Position, Player, CHARACTER_IMAGES } from '../../../models/Emulator.model'
import { connect } from 'react-redux'
import { State } from '../../../models/State.model'

interface RadarPanelProps {
  playerId: number | null
  self: Player
  cameraAngle: number
  players: (Player | null)[]
}

interface RadarPanelState {
  viewDistance: number
  viewDistanceValue: number
}

const RADIUS = 90
const DEFAULT_VIEW_DISTANCE = 0x2000
const MIN_VIEW_DISTANCE = 0x2000
const MAX_VIEW_DISTANCE = 0x4000
const VIEW_DISTANCE_STEP = 0x200
const FOV_SIZE = 40
const FOV_FILL = 'rgba(247,195,52,1)'
const STROKE_WIDTH = 2
const FILL = '#eee'
const STROKE = 'rgba(0, 0, 0, 0.2)'
const ICON_SIZE = 18
const ICON_SIZE_OUTSIDE_VIEW = 12

class Panel extends React.PureComponent<RadarPanelProps, RadarPanelState> {
  constructor (props: RadarPanelProps) {
    super(props)
    this.state = {
      viewDistance: MAX_VIEW_DISTANCE - DEFAULT_VIEW_DISTANCE,
      viewDistanceValue: DEFAULT_VIEW_DISTANCE
    }
    this.handleSetViewDistance = this.handleSetViewDistance.bind(this)
    this.renderPlayers = this.renderPlayers.bind(this)
  }

  private handleSetViewDistance (event: React.ChangeEvent<HTMLInputElement>): void {
    let value = Number(event.target.value)
    if (value > MAX_VIEW_DISTANCE) {
      value = MAX_VIEW_DISTANCE
    } else if (value < MIN_VIEW_DISTANCE) {
      value = MIN_VIEW_DISTANCE
    }
    this.setState({
      viewDistance: MAX_VIEW_DISTANCE - value,
      viewDistanceValue: value
    })
  }

  private renderPlayers (
    playerId: number | null,
    selfPos: Position,
    rotation: number,
    viewDistance: number,
    players: (Player | null)[]
  ): JSX.Element {
    const rotSin = Math.sin(rotation)
    const rotCos = Math.cos(rotation)
    return <>
      {
        players
          .filter((_, index) => index !== playerId)
          .filter(player => !!player)
          .filter(player => !!player!.position)
          .filter(player => player!.position!.course === selfPos.course)
          .map((player, index) => {
            const distance = this.distance(selfPos, player!.position!)
            const withinViewDistance = distance <= viewDistance
            let normalizedViewDistance = viewDistance
            if (!withinViewDistance) {
              normalizedViewDistance = distance
            }
            const dX = player!.position!.x - selfPos.x
            const dY = player!.position!.y - selfPos.y
            const x = this.normalize(rotCos * dX - rotSin * dY, normalizedViewDistance)
            const y = this.normalize(rotSin * dX + rotCos * dY, normalizedViewDistance)
            const iconSize = withinViewDistance ? ICON_SIZE : ICON_SIZE_OUTSIDE_VIEW
            return <div
              key={player!.username || index}
              className='radar-panel-icon-wrapper'
              style={{
                top: RADIUS - y - iconSize / 2,
                left: RADIUS - x - iconSize / 2,
                width: iconSize,
                height: iconSize
              }}
            >
              <img
                className='radar-panel-icon'
                style={{
                  maxWidth: iconSize,
                  maxHeight: iconSize
                }}
                src={`img/${CHARACTER_IMAGES[player!.characterId || 0]}`}
              />
              {
                withinViewDistance &&
                <span className='radar-panel-label'>{ player!.username }</span>              
              }
            </div>
          })

      }
    </>
  }

  private distance (selfPos: Position, pos: Position): number {
    return Math.sqrt((selfPos.x - pos.x) * (selfPos.x - pos.x) + (selfPos.y - pos.y) * (selfPos.y - pos.y))
  }

  private normalize (val: number, viewDistance: number): number {
    return val * RADIUS / viewDistance
  }

  public render (): JSX.Element | null {
    const { playerId, self, cameraAngle, players } = this.props
    const { viewDistance, viewDistanceValue } = this.state
    if (!self.position) return null
    const selfRotation = self.position.rotation * 2 * Math.PI / 0x10000
    const rotation = cameraAngle * 2 * Math.PI / 0x10000
    const rotationDiff = rotation - selfRotation
    let playersMock: (Player | null)[]
    if (process.env.NODE_ENV === 'development') {
      playersMock = [ ...players ]
      playersMock[2] = {
        characterId: 2,
        username: 'Player 2',
        position: {
          x: 0x2000,
          y: 0x800,
          rotation: 0,
          course: 4
        }
      }
      playersMock[4] = {
        characterId: 4,
        username: 'Player 4',
        position: {
          x: 0x800,
          y: 0x1500,
          rotation: 0,
          course: 4
        }
      }
      playersMock[7] = {
        characterId: 7,
        username: 'Very Long Player Name ASDASDASD',
        position: {
          x: 0x1500,
          y: -0x1700,
          rotation: 0,
          course: 4
        }
      }
    }
    return (
      <div className='radar-panel'>
        <svg width={RADIUS * 2} height={RADIUS * 2}>
          <g>
            <circle cx={RADIUS} cy={RADIUS} fill={FILL} r={RADIUS} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
            <circle cx={RADIUS} cy={RADIUS} fill={FILL} r={RADIUS * 2 / 3} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
            <circle cx={RADIUS} cy={RADIUS} fill={FILL} r={RADIUS / 3} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
            <line stroke={STROKE} strokeWidth={STROKE_WIDTH} x1="0" x2={RADIUS * 2} y1={RADIUS} y2={RADIUS} />
            <line stroke={STROKE} strokeWidth={STROKE_WIDTH} x1={RADIUS} x2={RADIUS} y1="0" y2={RADIUS * 2} />
          </g>
        </svg>
        <svg
          className='radar-panel-stroke'
          style={{
            transform: `rotate(${rotationDiff}rad)`
          }}
          width={RADIUS * 2}
          height={RADIUS * 2}
        >
          <defs>
            <filter id="dropshadow-left">                                          
              <feGaussianBlur stdDeviation={5} />
              <feOffset dx={5} dy={-5} result="offsetblur"/>
              <feComposite operator="out" in2="SourceGraphic"/>
            </filter>
            <filter id="dropshadow-right">                                          
              <feGaussianBlur stdDeviation={5} />
              <feOffset dx={-5} dy={-5} result="offsetblur"/>
              <feComposite operator="out" in2="SourceGraphic"/>
            </filter>
          </defs>
          <path
            style={{
              filter: 'url(#dropshadow-left)'
            }}
            fill={FOV_FILL}
            d={`M ${RADIUS} ${RADIUS} H ${RADIUS - FOV_SIZE} V ${RADIUS - FOV_SIZE} Z`}
          />
          <path
            style={{
              filter: 'url(#dropshadow-right)'
            }}
            fill={FOV_FILL}
            d={`M ${RADIUS} ${RADIUS} H ${RADIUS + FOV_SIZE} V ${RADIUS - FOV_SIZE} Z`}
          />
        </svg>
        { this.renderPlayers(playerId, self.position, rotation, viewDistance, process.env.NODE_ENV === 'asd' ? playersMock! : players) }
        <input
          className='radar-panel-range'
          type='range'
          min={MIN_VIEW_DISTANCE}
          max={MAX_VIEW_DISTANCE}
          value={viewDistanceValue}
          step={VIEW_DISTANCE_STEP}
          onChange={this.handleSetViewDistance}
        ></input>
      </div>
    )
  }
}
export const RadarPanel = connect((state: State) => ({
  playerId: state.connection.playerId,
  cameraAngle: state.connection.cameraAngle
}))(Panel)
