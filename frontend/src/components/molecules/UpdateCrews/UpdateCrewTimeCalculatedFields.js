import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../../lib/helpers'
import TextButton from '../../atoms/TextButton/TextButton'
import { IconButton } from '../../atoms/IconButton/IconButton'
import "./updateCrews.scss"

class CrewTimeCalculatedFieldsUpdate extends Component {
  constructor() {
    super()

    this.state = {
      loading: false,
      crewDataUpdated: ''
    }

    this.getData = this.getData.bind(this)

  }

  async getData() {
    this.cancelTokenSource = axios.CancelToken.source()
    this.setState({ loading: true })

    try {

      const update = await axios.get('/api/crew-update-rankings/', {
        cancelToken: this.cancelTokenSource.token
      })

      console.log(update)

      this.setState({ crewDataUpdated: Date.now(), loading: false })

    } catch (err) {
      if (axios.isCancel(err)) {
        // ignore
      } else {
        // propegate
        throw err
      }
    } finally {
      
      this.cancelTokenSource = null

    }
  }

  componentWillUnmount() {
    this.cancelTokenSource && this.cancelTokenSource.cancel()
  }

  render() {
    const { loading } = this.state

    return (
      <div className="update-crews__container">
        <div className="update-crews__message">
          <span>❗️Crew rankings need to be updated.  Note:  This may take a minute...  </span>
        </div>
        <div className="update-crews__button">
          <TextButton label={"Update now"} onClick={this.getData} disabled={loading} loading={loading}/>
          <p><small>{!this.state.crewDataUpdated ? '' : `Updated: ${formatTimeDate(this.state.crewDataUpdated)}`}</small></p>
        </div>
        <div className="update-crews__close">
          <div className="">
            <IconButton title={'Close'} icon={'cross'} onClick={() => this.props.refreshData()} disabled={!this.state.crewDataUpdated}/>
          </div>
        </div>
      </div>
    )
  }
}

export default CrewTimeCalculatedFieldsUpdate
