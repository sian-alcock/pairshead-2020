import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../../lib/helpers'
import TextButton from '../../atoms/TextButton/TextButton'
import Icon from '../../atoms/Icons/Icons'
import ProgressMessage from '../../atoms/ProgressMessage/ProgressMessage'
import "./importBroeData.scss"

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
      crewApi: importPersonalData ? 'api/crew-data-import/1' : 'api/crew-data-import/',
    }

    console.log(this.state.crewApi)

    this.getData = this.getData.bind(this)

  }


  async getData() {
    this.cancelTokenSource = axios.CancelToken.source()
    this.setState({ loading: true, clubsAndEventsAreLoading: true })

    try {

      const clubsPromise = axios.get('/api/club-data-import/')
      const eventsPromise = axios.get('/api/event-data-import/')
      const [clubs, events] = await Promise.all([clubsPromise, eventsPromise])
      console.log(clubs.data, events.data)
      this.setState({
        clubEventImportSuccessMessage: 'Importing clubs and events from British rowing',
        clubsAndEventsAreLoading: false,
        bandsAreLoading: true
      })

      // wait for first two calls before running the event bands
      const bands = await axios.get('/api/band-data-import/')
      console.log(bands.data)

      this.setState({ 
        bandImportSuccessMessage: 'Importing event band data from British rowing',
        bandsAreLoading: false,
        crewsAreLoading: true
      })

      const crewPromise = axios.get(this.state.crewApi)
      const [crews] = await Promise.all([crewPromise])
      console.log(crews.data)
      this.setState({
        crewImportSuccessMessage: 'Importing crew data from British rowing',
        crewsAreLoading: false,
        competitorsAreLoading: true
      })

      const competitors = await axios.get('/api/competitor-data-import')
      console.log(competitors.data)
      this.setState({
        competitorImportSuccessMessage: 'Importing competitor data from British rowing',
        competitorsAreLoading: false,
        eventBandsAreUpdating: true
      })

      const eventBand = await axios.get('/api/crew-get-event-band/')
      console.log(eventBand.data, )
      this.setState({
        eventBandsSuccessMessage: 'Updating event names in the crew table',
        eventBandsAreUpdating: false,
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
      <section className="c-data-loader__section">
      <div className="text-container has-text-left">
        <h2 className="c-data-loader__title">{this.props.title}</h2>
        <p className="c-data-loader__description">{this.props.description}</p>
      </div>
      <div className="c-data-loader">
          <TextButton label={'Get BROE data'} onClick={this.getData} disabled={loading}/>
          <div className="c-data-loader__progress">
            {this.state.clubsAndEventsAreLoading &&<ProgressMessage message={'Importing clubs and events from British rowing'} status={'loading'} />}
            {this.state.clubEventImportSuccessMessage &&<ProgressMessage message={this.state.clubEventImportSuccessMessage} status={'success'} />}
            {this.state.bandsAreLoading &&<ProgressMessage message={'Importing event band data from British rowing'} status={'loading'} />}
            {this.state.bandImportSuccessMessage &&<ProgressMessage message={this.state.bandImportSuccessMessage} status={'success'} />}
            {this.state.crewsAreLoading &&<ProgressMessage message={'Importing crew data from British rowing'} status={'loading'} />}
            {this.state.crewImportSuccessMessage &&<ProgressMessage message={this.state.crewImportSuccessMessage} status={'success'} />}
            {this.state.competitorsAreLoading &&<ProgressMessage message={'Importing competitor data from British rowing'} status={'loading'} />}
            {this.state.competitorImportSuccessMessage &&<ProgressMessage message={this.state.competitorImportSuccessMessage} status={'success'} />}
            {this.state.eventBandsAreUpdating &&<ProgressMessage message={'Updating event bands for all crews'} status={'loading'} />}
            {this.state.eventBandsSuccessMessage &&<ProgressMessage message={this.state.eventBandsSuccessMessage} status={'success'} />}
            {this.state.crewDataUpdated && <ProgressMessage message={`All British rowing data imported successfully: ${formatTimeDate(this.state.crewDataUpdated)}!`} status={'success'}/>}
          </div>
        </div>
      </section>
    )
  }
}

export default BROELoader
