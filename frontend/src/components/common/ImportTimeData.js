import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../lib/helpers'

class TimeLoader extends Component {


  constructor() {
    super()

    this.state = {
      loading: false,
      raceTimesDataUpdated: ''
    }

    this.getData = this.getData.bind(this)
  }

  async getData() {
    this.cancelTokenSource = axios.CancelToken.source()
    this.setState({ loading: true })

    try {

      const times = await axios.get('/api/crew-race-times', {
        cancelToken: this.cancelTokenSource.token
      })
      console.log(times.data)

      this.setState({ raceTimesDataUpdated: Date.now(), loading: false })

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
      <div>
        <button className="button is-primary" onClick={this.getData} disabled={loading}>

          {loading && <span className="spinner"><i
            className="fas fa-spinner fa-spin"
          />Loading ...</span>}
          {!loading && <span>Get race times</span>}
        </button>

        <p><small>{!this.state.raceTimesDataUpdated ? '' : `Updated: ${formatTimeDate(this.state.raceTimesDataUpdated)}`}</small></p>
      </div>
    )
  }
}

export default TimeLoader
