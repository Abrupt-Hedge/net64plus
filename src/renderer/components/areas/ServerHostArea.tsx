import './ServerHostArea.scss'

import * as React from 'react'
import { connect, Dispatch } from 'react-redux'

import { SMMButton } from '../buttons/SMMButton'
import { ConsolePanel } from '../panels/ConsolePanel'
import { removeServerProcess } from '../../actions/server'
import { State, ConsoleServerMessage } from '../../../models/State.model'

interface ServerHostAreaProps {
  dispatch: Dispatch<State>
  exitCode: number | null
  messages: ConsoleServerMessage[]
  onRestart: () => void
}

class Area extends React.PureComponent<ServerHostAreaProps> {
  constructor (props: ServerHostAreaProps) {
    super(props)
    this.onClose = this.onClose.bind(this)
    this.onRestart = this.onRestart.bind(this)
  }

  private onClose (): void {
    this.props.dispatch(removeServerProcess())
  }

  private onRestart (): void {
    this.props.onRestart()
  }

  public render (): JSX.Element {
    const { exitCode, messages } = this.props
    return (
      <div className='server-host-area'>
        <ConsolePanel
          messages={messages}
        />
        <div className='server-host-area-buttons'>
          <SMMButton
            text='Close Server'
            iconSrc='img/disconnect.svg'
            onClick={this.onClose}
            styles={{
              button: {
                margin: '0px'
              }
            }}
          />
          {
            exitCode != null &&
            <SMMButton
              text='Restart Server'
              iconSrc='img/net64.svg'
              onClick={this.onRestart}
              styles={{
                button: {
                  margin: '0px'
                }
              }}
            />
          }
        </div>
      </div>
    )
  }
}
export const ServerHostArea = connect((state: State) => ({
  messages: state.server.messages
}))(Area)
