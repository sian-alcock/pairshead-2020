import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../lib/helpers'

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
      <div className="columns is-vcentered">
        <div className="column">
          <span>❗️Crew rankings need to be updated.  Note:  This may take several minutes...  </span>
        </div>
        <div className="column">
          <button className="button is-primary" onClick={this.getData} disabled={loading}>

            {loading && <span className="spinner"><i
              className="fas fa-spinner fa-spin"
            /> Loading ...</span>}
            {!loading && <span>Update now</span>}

          </button>
          <p><small>{!this.state.crewDataUpdated ? '' : `Updated: ${formatTimeDate(this.state.crewDataUpdated)}`}</small></p>
        </div>
        <div className="column has-text-right">
          <span className={!this.state.crewDataUpdated ? 'icon icon-disabled' : 'icon icon-clickable'} onClick={() => this.props.refreshData()}>
            <i className="far fa-times-circle fa-2x"></i>
          </span>
        </div>
      </div>
    )
  }
}

export default CrewTimeCalculatedFieldsUpdate
