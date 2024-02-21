import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../lib/helpers'

class BROELoader extends Component {
  // This component makes three successive api calls
  // To fetch first the club data, the event data, followed by the band data

  constructor({importPersonalData}) {
    super()

    this.state = {
      loading: false,
      crewDataUpdated: '',
      clubEventImportSuccessMessage: '',
      bandImportSuccessMessage: '',
      crewImportSuccessMessage: '',
      competitorImportSuccessMessage: '',
      eventBandsSuccessMessage: '',
      errorMessage: '',
      crewApi: importPersonalData ? 'api/crew-data-import/1' : 'api/crew-data-import/'
    }

    console.log(this.state.crewApi)

    this.getData = this.getData.bind(this)

  }


  async getData() {
    this.cancelTokenSource = axios.CancelToken.source()
    this.setState({ loading: true })

    try {

      const clubsPromise = axios.get('/api/club-data-import/')
      const eventsPromise = axios.get('/api/event-data-import/')
      const [clubs, events] = await Promise.all([clubsPromise, eventsPromise])
      console.log(clubs.data, events.data)
      this.setState({
        clubEventImportSuccessMessage: '✅ Clubs and events successfully imported from British Rowing'
      })

      // wait for first two calls before running the event bands
      const bands = await axios.get('/api/band-data-import/')
      console.log(bands.data)

      this.setState({ 
        bandImportSuccessMessage: '✅ Event bands successfully imported from British Rowing'
      })

      const crewPromise = axios.get(this.state.crewApi)
      const [crews] = await Promise.all([crewPromise])
      console.log(crews.data)
      this.setState({
        crewImportSuccessMessage: '✅ Crew data successfully imported from British rowing'
      })

      const competitors = await axios.get('/api/competitor-data-import')
      console.log(competitors.data)
      this.setState({
        competitorImportSuccessMessage: '✅ Competitor data successfully imported from British rowing'
      })

      const eventBand = await axios.get('/api/crew-get-event-band/')
      console.log(eventBand.data, )
      this.setState({
        eventBandsSuccessMessage: '✅ Event bands updated in the crew table',
        loading: false,
        crewDataUpdated: Date.now()
      })

    } catch (err) {
      if (axios.isCancel(err)) {
        // ignore
      } else {
        // propegate
        this.setState({
          errorMessage: err
        })
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
      <div className="c-data-loader">
        <button className="button is-primary" onClick={this.getData} disabled={loading}>

          {loading && <span className="spinner"><i
            className="fas fa-spinner fa-spin"
          /> Loading ...</span>}
          {!loading && <span>Get BROE data</span>}

        </button>
        <div className="c-data-loader__progress">
          <div className="c-data-loader__status-message">{!this.state.clubEventImportSuccessMessage ? '' : this.state.clubEventImportSuccessMessage}</div>
          <div className="c-data-loader__status-message">{!this.state.bandImportSuccessMessage ? '' : this.state.bandImportSuccessMessage}</div>
          <div className="c-data-loader__status-message">{!this.state.crewImportSuccessMessage ? '' : this.state.crewImportSuccessMessage}</div>
          <div className="c-data-loader__status-message">{!this.state.competitorImportSuccessMessage ? '' : this.state.competitorImportSuccessMessage}</div>
          <div className="c-data-loader__status-message">{!this.state.eventBandsSuccessMessage ? '' : this.state.eventBandsSuccessMessage}</div>
          <div className="c-data-loader__status-message">{!this.state.crewDataUpdated ? '' : `✅ All BROE crew data imported successfully: ${formatTimeDate(this.state.crewDataUpdated)}!`}</div>
        </div>
      </div>
    )
  }
}

export default BROELoader
