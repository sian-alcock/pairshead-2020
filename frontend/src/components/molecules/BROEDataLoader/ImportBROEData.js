import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../../lib/helpers'
import TextButton from '../../atoms/TextButton/TextButton'
import { FeedbackModal } from '../FeedbackModal/FeedbackModal'
import ProgressMessage from '../../atoms/ProgressMessage/ProgressMessage'
import "./importBroeData.scss"

class BROELoader extends Component {
  // This component makes three successive api calls
  // To fetch first the club data, the event data, followed by the band data

  constructor({importPersonalData}) {
    super()

    this.state = {
      loading: false,
      modalOpen: false,
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
    this.close = this.close.bind(this)

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
        clubEventImportSuccessMessage: 'Importing clubs and events from British Rowing',
        clubsAndEventsAreLoading: false,
        bandsAreLoading: true
      })

      // wait for first two calls before running the event bands
      const bands = await axios.get('/api/band-data-import/')
      console.log(bands.data)

      this.setState({ 
        bandImportSuccessMessage: 'Importing event band data from British Rowing',
        bandsAreLoading: false,
        crewsAreLoading: true
      })

      const crewPromise = axios.get(this.state.crewApi)
      const [crews] = await Promise.all([crewPromise])
      console.log(crews.data)
      this.setState({
        crewImportSuccessMessage: 'Importing crew data from British Rowing',
        crewsAreLoading: false,
        competitorsAreLoading: true
      })

      const competitors = await axios.get('/api/competitor-data-import')
      console.log(competitors.data)
      this.setState({
        competitorImportSuccessMessage: 'Importing competitor data from British Rowing',
        competitorsAreLoading: false,
        eventBandsAreUpdating: true
      })

      const eventBand = await axios.get('/api/crew-get-event-band/')
      console.log(eventBand.data, )
      this.setState({
        eventBandsSuccessMessage: 'Updating event names in the crew table',
        eventBandsAreUpdating: false,
        crewDataUpdated: crews.data[0].updated
      })

      const settingsTable = await axios.get('api/global-settings-list/')

      const formData = new FormData()
      formData.append( 'broe_data_last_update', crews.data[0].updated )

      if (settingsTable.data.results.length > 0) {
        axios.put(`/api/global-settings-list/${settingsTable.data.results[0].id}`, formData)
      } else {
        axios.post(`/api/global-settings-list/`, formData)
      }

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

  close () {
    this.setState({ loading: false,
      clubEventImportSuccessMessage: '',
      crewDataUpdated: '',
      clubEventImportSuccessMessage: '',
      bandImportSuccessMessage: '',
      crewImportSuccessMessage: '',
      competitorImportSuccessMessage: '',
      eventBandsSuccessMessage: '',
      errorMessage: ''
    });
    document.body.classList.remove('lock-scroll');
  };
  
  componentWillUnmount() {
    this.cancelTokenSource && this.cancelTokenSource.cancel()
  }

  render() {
    const { loading } = this.state

    return (

    <div className="c-data-loader">
      <TextButton label={'Get BROE data'} onClick={this.getData} disabled={loading}/>
        {loading && <FeedbackModal isOpen={true} closeModal={this.close}>
            {this.state.clubsAndEventsAreLoading &&<ProgressMessage message={'Importing clubs and events from British Rowing'} status={'loading'} />}
            {this.state.clubEventImportSuccessMessage &&<ProgressMessage message={this.state.clubEventImportSuccessMessage} status={'success'} />}
            {this.state.bandsAreLoading &&<ProgressMessage message={'Importing event band data from British Rowing'} status={'loading'} />}
            {this.state.bandImportSuccessMessage &&<ProgressMessage message={this.state.bandImportSuccessMessage} status={'success'} />}
            {this.state.crewsAreLoading &&<ProgressMessage message={'Importing crew data from British Rowing'} status={'loading'} />}
            {this.state.crewImportSuccessMessage &&<ProgressMessage message={this.state.crewImportSuccessMessage} status={'success'} />}
            {this.state.competitorsAreLoading &&<ProgressMessage message={'Importing competitor data from British Rowing'} status={'loading'} />}
            {this.state.competitorImportSuccessMessage &&<ProgressMessage message={this.state.competitorImportSuccessMessage} status={'success'} />}
            {this.state.eventBandsAreUpdating &&<ProgressMessage message={'Updating event bands for all crews'} status={'loading'} />}
            {this.state.eventBandsSuccessMessage &&<ProgressMessage message={this.state.eventBandsSuccessMessage} status={'success'} />}
            {this.state.crewDataUpdated && <ProgressMessage message={`All British Rowing data imported successfully: ${formatTimeDate(this.state.crewDataUpdated)}`} status={'success'}/>}
        </FeedbackModal>}
      </div>
    )
  }
}

export default BROELoader
