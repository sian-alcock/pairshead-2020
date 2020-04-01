import React from 'react'

import AsyncPaginate from 'react-select-async-paginate'

import axios from 'axios'
import Select from 'react-select'
import { formatTimes } from '../../lib/helpers'


class RaceTimeEdit extends React.Component {
  constructor() {
    super()
    this.state= {
      errors: {},
      crews: [],
      crew: {},
      data: {},
      formData: {}
    }
    // this.getCrews = this.getCrews.bind(this)

    this.handleSelectChange = this.handleSelectChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.getCrewOptions = this.getCrewOptions.bind(this)
  }

  componentDidMount() {
    Promise.all([
      axios.get(`/api/race-times/${this.props.match.params.id}`), // i.e. axios.get(something)
      axios.get('/api/crews/')
    ]).then(([res1, res2]) => {
      console.log(res1.data, res2.data)
      this.setState({ formData: res1.data, crews: res2.data['results'].map(option => {
        return {label: `${option.bib_number} | ${option.id} | ${option.competitor_names} | ${option.times.length} start/finish time(s)`, value: option.id}
      })
      })
    })
  }

  async loadOptions(search, loadedOptions, { page }) {
    const response = await fetch(`/api/crews/?search=${search}&page=${page}&status=Accepted`)
    const responseJSON = await response.json()
  
    return {
      options: responseJSON.results.map(option => {
        return {label: `${option.bib_number} | ${option.id} | ${option.competitor_names} | ${option.times.length} start/finish time(s)`, value: option.id}
      }),
      hasMore: responseJSON.next,
      additional: {
        page: page + 1
      }
    }
  }

  handleSubmit(e) {
    e.preventDefault()

    const data = {
      ...this.state.formData,
      crew: this.state.formData.crew.value
    }

    axios.put(`/api/race-times/${this.props.match.params.id}`, data)
      .then(() => this.props.history.push('/race-times'))
      .catch(err => this.setState({ errors: err.response.data }))
  }


  handleSelectChange(selectedOption) {
    const formData = { ...this.state.formData, crew: selectedOption }
    this.setState({ formData })
  }

  getCrewOptions(){
    const options = [{label: '', value: ''}, ...this.state.crews]
    return options
  }


  render() {
    if(!this.state.formData) return null
    {!this.state.crews && <h2>Loading</h2>}

    return (
      <section className="section">
        <div className="container">
          <div className="box">
            <div className="columns is-multiline">

              <div className="column is-one-third">
                <div>Sequence: {this.state.formData.sequence}</div>
              </div>

              <div className="column is-one-third">
                <div>Tap: {this.state.formData.tap}</div>
              </div>

              <div className="column is-one-third">
                <div>Tap time: {formatTimes(this.state.formData.time_tap)}</div>
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
                  value={!this.state.formData.crew ? '' : this.state.crews.find(option => option.value === this.state.formData.crew.id)}
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
