import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../../lib/helpers'
import TextButton from '../../atoms/TextButton/TextButton'
import ProgressMessage from '../../atoms/ProgressMessage/ProgressMessage'
import "./calculateStartOrder.scss"

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
    this.setState({ loading: true, eventBandsAreUpdating: true })

    try {
      const eventBand = await axios.get('/api/crew-get-event-band/')
      console.log(eventBand.data, )
      this.setState({
        eventBandsSuccessMessage: 'Updating event bands',
        eventBandsAreUpdating: false,
        startScoresCalculating: true
      })
      const startScore = await axios.get('/api/crew-get-start-score/')
      console.log(startScore.data, )
      this.setState({
        startScoreSuccessMessage: 'Calculating start score based on Rowing/Sculling CRI',
        startScoresCalculating: false,
        startScoresOrdering: true
      })
      const startOrder = await axios.get('/api/crew-get-start-order/')
      console.log(startOrder.data, {
        cancelToken: this.cancelTokenSource.token
      })
      this.setState({
        startOrderSuccessMessage: 'Allocating start order to crews',
        startScoresOrdering: false,
        checkingScores: true
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

      <section className="calculate-start-order__section">
      <div className="text-container has-text-left">
        <h2 className="calculate-start-order__title">{this.props.title}</h2>
        <p className="calculate-start-order__description">{this.props.description}</p>
      </div>
      <div className="calculate-start-order">
          <TextButton label={'Calculate start order'} onClick={this.getData} disabled={loading}/>
          <div className="calculate-start-order__progress">
            {this.state.eventBandsAreUpdating &&<ProgressMessage message={'Updating event bands'} status={'loading'} />}
            {this.state.eventBandsSuccessMessage &&<ProgressMessage message={this.state.eventBandsSuccessMessage} status={'success'} />}
            {this.state.startScoresCalculating &&<ProgressMessage message={'Importing event band data from British Rowing'} status={'loading'} />}
            {this.state.startScoreSuccessMessage &&<ProgressMessage message={this.state.startScoreSuccessMessage} status={'success'} />}
            {this.state.startScoresOrdering &&<ProgressMessage message={'Importing crew data from British Rowing'} status={'loading'} />}
            {this.state.startOrderSuccessMessage &&<ProgressMessage message={this.state.startOrderSuccessMessage} status={'success'} />}
          
            {this.state.crewDataUpdated && <ProgressMessage message={`Start order calculated: ${formatTimeDate(this.state.crewDataUpdated)}!`} status={'success'}/>}
          </div>
        </div>
      </section>
    )
  }
}

export default CalculateStartOrder
