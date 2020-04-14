import React from 'react'

import AsyncPaginate from 'react-select-async-paginate'

import axios from 'axios'
import { formatTimes } from '../../lib/helpers'


class RaceTimeEdit extends React.Component {
  constructor() {
    super()
    this.state= {
      errors: {},
      crews: [],
      crewId: '',
      data: {},
      raceTimeFormData: {},
      crewFormData: {}
    }

    this.handleSelectChange = this.handleSelectChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.getCrewValue = this.getCrewValue.bind(this)
  }

  async componentDidMount() {
    await axios.get(`/api/race-times/${this.props.match.params.id}`)
      .then((res1) => {
        console.log(res1.data)
        this.setState({ raceTimeFormData: res1.data, crewId: !res1.data.crew ? '' : res1.data.crew.id })
      })
  }

  async loadOptions(search, loadedOptions, { page }) {
    const response = await fetch(`/api/crews/?search=${search}&page=${page}&status=Accepted`)
    const responseJSON = await response.json()
  
    return {
      options: responseJSON.results.map(option => {
        return {label: `${option.bib_number} | ${option.id} | ${option.competitor_names} | ${option.times.filter(time => time.tap === 'Start').length} start time(s) | ${option.times.filter(time => time.tap === 'Finish').length} finish time(s)`, value: option.id}
      }),
      hasMore: responseJSON.next,
      additional: {
        page: page + 1
      }
    }
  }

  

  // handleSubmit(e) {
  //   e.preventDefault()

  //   const data = {
  //     ...this.state.formData,
  //     crew: this.state.formData.crew.value
  //   }

  //   axios.put(`/api/race-times/${this.props.match.params.id}`, data)
  //     .then(() => this.props.history.push('/race-times'))
  //     .catch(err => this.setState({ errors: err.response.data }))
  // }




  async handleSubmit(e) {
    e.preventDefault()

    // Add selected crew to raceTime being edited

    const raceTimeData = {...this.state.raceTimeFormData, crew: this.state.crewId
    }

    const raceTimePromise = await axios.put(`/api/race-times/${this.props.match.params.id}`, raceTimeData)
    
    const updatedRaceTime = raceTimePromise.data
    console.log('this should be logged first: updatedRaceTime', updatedRaceTime)

    // Get crew record for selected crew

    console.log('this should be logged second')
    const crewPromise = await axios.get(`/api/crews/${this.state.crewId}`)
    const crewToBeUpdated = crewPromise.data

    const crewData = {...crewToBeUpdated, requires_recalculation: true}
    console.log(crewData)

    // Set requires recalculation flag on crew
    const crewUpdatePromise = await axios.put(`/api/crews/${this.state.crewId}`, crewData)
    const crewUpdated = crewUpdatePromise.data
    console.log(crewUpdated)

    // Search for other raceTimes with the currentTap assigned to this crew
    const currentTap = this.state.raceTimeFormData.tap
    const otherTimesForSelectedCrewPromise = await axios.get(`/api/race-times?tap=${currentTap}&crew__id=${this.state.crewId}`)
    const otherTimesForSelectedCrew = otherTimesForSelectedCrewPromise.data
    console.log(otherTimesForSelectedCrew)

    // If more than one...get the one that is not the current one and update it to remove the crewID

    if(otherTimesForSelectedCrew.results.length > 1) {
      // get the ID of the one that isn't this one
      const raceTimesToRemove = otherTimesForSelectedCrew.results.filter(time => time.id !== this.state.raceTimeFormData.id)
      console.log(raceTimesToRemove)
      console.log(raceTimesToRemove[0].id)
      for(let i = 0; i < raceTimesToRemove.length; i++) {
        const raceTimeToRemovePromise = await axios.get(`/api/race-times/${raceTimesToRemove[i].id}`)
        const raceTimeToRemoveFormData = raceTimeToRemovePromise.data
        const raceTimeRemoveCrewPromise = await axios.put(`/api/race-times/${raceTimesToRemove[i].id}`, {...raceTimeToRemoveFormData, crew: ''})
        console.log(`Removing other raceTime for crew ${this.state.crewId}, ${raceTimeRemoveCrewPromise.data}`)
      }
    }
    
    this.setState({ raceTimeFormData: updatedRaceTime}, () => this.props.history.push('/race-times'))
  
  }

  handleSelectChange(selectedOption) {
    // const formData = { ...this.state.formData, crew: selectedOption }
    this.setState({ crewId: selectedOption.value }, ()=> this.getCrewValue(selectedOption.value))
  }

  async getCrewValue (crewId) {
    
    if(crewId) {
      await axios.get(`/api/crews/${crewId}`)
        .then(res => {
          const myObject = {label: `${res.data.bib_number} | ${res.data.id} | ${res.data.competitor_names ? res.data.competitor_names : res.data.name} | ${res.data.times ? res.data.times.filter(time => time.tap === 'Start').length : 0} start time(s) | ${res.data.times ? res.data.times.filter(time => time.tap === 'Finish').length : 0} finish time(s)`, value: `${res.data.id}`}
          console.log(myObject)
          return myObject
        })
    }
    
  }

  render() {
    if(!this.state.raceTimeFormData) return null
    {!this.state.crews && <h2>Loading</h2>}
    console.log(this.state.crewId)

    return (
      <section className="section">
        <div className="container">
          <div className="box">
            <div className="columns is-multiline">

              <div className="column is-one-third">
                <div>Sequence: {this.state.raceTimeFormData.sequence}</div>
              </div>

              <div className="column is-one-third">
                <div>Tap: {this.state.raceTimeFormData.tap}</div>
              </div>

              <div className="column is-one-third">
                <div>Tap time: {formatTimes(this.state.raceTimeFormData.time_tap)}</div>
              </div>

            </div>
          </div>
          <form className="container box tableBorder" onSubmit={this.handleSubmit}>

            <div className="field">
              <div className="control">
                <label className="label" htmlFor="crew">Crew</label>
                <AsyncPaginate
                  id="crew"
                  onChange={this.handleSelectChange}
                  loadOptions={this.loadOptions}
                  additional={{page: 1}}
                  value={() => this.getCrewValue(this.state.crewId)}
                />
              </div>
            </div>
            <button className="button is-primary">Submit</button>
          </form>
        </div>
      </section>
    )
  }
}

export default RaceTimeEdit
