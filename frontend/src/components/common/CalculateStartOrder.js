import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../lib/helpers'

class CalculateStartOrder extends Component {
  // This component makes two successive api calls
  // To calculate the start score for each event category
  // Then to create the start order across the whole set

  constructor() {
    super()

    this.state = {
      loading: false,
      crewDataUpdated: '',
      eventBandsSuccessMessage: '',
      startScoreSuccessMessage: '',
      startOrderSuccessMessage: ''
    }

    this.getData = this.getData.bind(this)

  }

  async getData() {
    this.cancelTokenSource = axios.CancelToken.source()
    this.setState({ loading: true })

    try {
      const eventBand = await axios.get('/api/crew-get-event-band/')
      console.log(eventBand.data, )
      this.setState({
        eventBandsSuccessMessage: 'Event bands updated'
      })
      const startScore = await axios.get('/api/crew-get-start-score/')
      console.log(startScore.data, )
      this.setState({
        startScoreSuccessMessage: 'Start score calculated based on Rowing/Sculling CRI'
      })
      const startOrder = await axios.get('/api/crew-get-start-order/')
      console.log(startOrder.data, {
        cancelToken: this.cancelTokenSource.token
      })
      this.setState({
        startOrderSuccessMessage: 'Crews have been allocated a start order'
      })
      const checkStartOrder = await axios.get('/api/crew-check-start-order/')
      console.log(checkStartOrder)
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
      <div>
        <button className="button is-primary" onClick={this.getData} disabled={loading}>

          {loading && <span className="spinner"><i
            className="fas fa-spinner fa-spin"
          /> Loading ...</span>}
          {!loading && <span>Calculate start order</span>}

        </button>
        <p><small>{!this.state.eventBandsSuccessMessage ? '' : this.state.eventBandsSuccessMessage}</small></p>
        <p><small>{!this.state.startScoreSuccessMessage ? '' : this.state.startScoreSuccessMessage}</small></p>
        <p><small>{!this.state.startOrderSuccessMessage ? '' : this.state.startOrderSuccessMessage}</small></p>
        <p><small>{!this.state.crewDataUpdated ? '' : `Updated: ${formatTimeDate(this.state.crewDataUpdated)}`}</small></p>

      </div>
    )
  }
}

export default CalculateStartOrder
