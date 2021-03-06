import './HostView.scss'

import * as React from 'react'
import { connect, Dispatch } from 'react-redux'

import { ConnectionArea } from '../areas/ConnectionArea'
import { HostArea } from '../areas/HostArea'
import { State } from '../../../models/State.model'
import { Server } from '../../../models/Server.model'

interface ConnectViewProps {
  dispatch: Dispatch<State>
  server: Server
  connectionError: string
}

class View extends React.PureComponent<ConnectViewProps> {
  public render (): JSX.Element {
    const server = this.props.server
    return (
      <div className='host-view'>
        <HostArea />
        {
          server &&
          <ConnectionArea server={server} />
        }
      </div>
    )
  }
}
export const HostView = connect((state: State) => ({
  server: state.connection.server
}))(View)
