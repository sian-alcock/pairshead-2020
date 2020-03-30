import React from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

import { formatTimes, getImage } from '../../lib/helpers'
import Paginator from '../common/Paginator'
// import { search } from '../../lib/utils'

// const _ = require('lodash').runInContext()


class CrewIndex extends React.Component {
  constructor() {
    super()
    this.state = {
      crews: [],
      pageSize: 20,
      pageNumber: 1,
      loading: false,
      sortTerm: 'bib_number',
      searchTerm: sessionStorage.getItem('crewIndexSearch') || '',
      scratchedCrewsBoolean: sessionStorage.getItem('showScratchedCrews') || ''
    }

    this.changePage = this.changePage.bind(this)
    this.handleSearchKeyUp = this.handleSearchKeyUp.bind(this)
    this.handleSortChange = this.handleSortChange.bind(this)
    this.handleCrewsWithoutStartTime = this.handleCrewsWithoutStartTime.bind(this)
    this.handleCrewsWithoutFinishTime = this.handleCrewsWithoutFinishTime.bind(this)
    this.handleCrewsWithTooManyTimes = this.handleCrewsWithTooManyTimes.bind(this)
    this.handleScratchedCrews = this.handleScratchedCrews.bind(this)
  }

  componentDidMount() {
    axios.get('/api/crews', {
      params: {
        page_size: 20,
        page: 1,
        order: 'bib_number',
        status: this.state.scratchedCrewsBoolean ? 'Accepted' : ['Accepted', 'Scratched']

      }
    })
      .then(res => this.setState({ 
        totalCrews: res.data['count'],
        crews: res.data['results'],
        scratchedCrews: res.data['num_scratched_crews'],
        acceptedCrewsNoStart: res.data['num_accepted_crews_no_start_time'],
        acceptedCrewsNoFinish: res.data['num_accepted_crews_no_finish_time'],
        crewsInvalidTimes: res.data['num_accepted_crews_invalid_time']
      })
      )
  }

  changePage(pageNumber, totalPages) {
    if (
      pageNumber > totalPages ||
      pageNumber < 0
    ) return null
    this.setState({ pageNumber }, () => this.refreshData())
  }

  refreshData(queryString=null) {
    if (typeof this._source !== typeof undefined) {
      this._source.cancel('Operation cancelled due to new request')
    }

    // save the new request for cancellation
    this._source = axios.CancelToken.source()

    axios.get(`/api/crews?${queryString}`, {
      // cancel token used by axios
      cancelToken: this._source.token,

      params: {
        page_size: this.state.pageSize,
        page: this.state.pageNumber,
        order: this.state.sortTerm,
        status: this.state.scratchedCrewsBoolean ? 'Accepted' : ['Accepted', 'Scratched']
      }
    })
      .then(res => this.setState({
        totalCrews: res.data['count'],
        crews: res.data['results'],
        scratchedCrews: res.data['num_scratched_crews'],
        loading: false
      })
      )
      .catch((error) => {
        if (axios.isCancel(error) || error) {
          this.setState({
            loading: false,
            message: 'Failed to get data'
          })
        }
      })
  }

  handleSearchKeyUp(e){
    sessionStorage.setItem('resultIndexSearch', e.target.value)
    this.setState({
      loading: true,
      searchTerm: e.target.value,
      pageNumber: 1
    }, () => this.refreshData(`search=${this.state.searchTerm}`)
    )
  }

  handleSortChange(e){
    this.setState({ sortTerm: e.target.value }, () => this.refreshData())
  }

  handleCrewsWithoutStartTime(e){
    
    this.setState({
      crewsWithoutStartTimeBoolean: e.target.checked,
      crewsWithoutFinishTimeBoolean: false,
      crewsWithTooManyTimesBoolean: false,
      searchTerm: ''
    }, (e.target.checked) ? () => this.refreshData('status=Accepted&start_time=0') : this.refreshData())
  }

  handleCrewsWithoutFinishTime(e){
    
    this.setState({
      crewsWithoutFinishTimeBoolean: e.target.checked,
      crewsWithoutStartTimeBoolean: false,
      crewsWithTooManyTimesBoolean: false,
      searchTerm: ''
    }, (e.target.checked) ? () => this.refreshData('status=Accepted&finish_time=0') : this.refreshData())

  }


  handleCrewsWithTooManyTimes(e){

    this.setState({
      crewsWithTooManyTimesBoolean: e.target.checked,
      crewsWithoutFinishTimeBoolean: false,
      crewsWithoutStartTimeBoolean: false,
      searchTerm: ''
    }, (e.target.checked) ? () => this.refreshData('status=Accepted&invalid_time=1') : this.refreshData())
  }

  handleScratchedCrews(e){
    sessionStorage.setItem('showScratchedCrews', e.target.checked)

    this.setState({
      scratchedCrewsBoolean: e.target.checked
    }, () => this.refreshData())
  }

  render() {

    !this.state.crews ? <h2>loading...</h2> : console.log(this.state.crews)
    console.log(this.state.sortTerm)
    const totalPages = Math.floor((this.state.totalCrews) / this.state.pageSize)

    console.log(this.state.searchTerm)
    console.log(this.state.scratchedCrews)

    return (
      <section className="section">
        <div className="container">

          <div className="columns">

            <div className="column">
              <div className="field control has-icons-left">
                <span className="icon is-left">
                  <i className="fas fa-search"></i>
                </span>
                <input className="input" placeholder="search" defaultValue={this.state.searchTerm} onKeyUp={this.handleSearchKeyUp} />

              </div>
            </div>

            <div className="column">
              <div className="field">
                <div className="select">
                  <select onChange={this.handleSortChange}>
                    <option value=""></option>
                    <option value="crew">Crew A-Z</option>
                    <option value="-crew">Crew Z-A</option>
                    <option value="start_sequence">Start sequence, asc</option>
                    <option value="-start_sequence">Start sequence, desc</option>
                    <option value="finish_sequence">Finish sequence, asc</option>
                    <option value="-finish_sequence">Finish sequence, desc</option>
                    <option value="club__name">Club, asc</option>
                    <option value="-club__name">Club, desc</option>
                    <option value="event_band">Event, asc</option>
                    <option value="-event_band">Event, desc</option>
                    <option value="bib_number">Bib, asc</option>
                    <option value="-bib_number">Bib, desc</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="column">
              <div className="field">
                <label className="checkbox" htmlFor="crewsWithoutStartTime">
                  <input type="checkbox"  className="checkbox" id="crewsWithoutStartTime" onChange={this.handleCrewsWithoutStartTime} value={this.state.crewsWithoutStartTimeBoolean} checked={!!this.state.crewsWithoutStartTimeBoolean} />
                  <small>⚠️ Accepted crews without start time ({this.state.acceptedCrewsNoStart})</small>
                </label>
              </div>

              <div className="field">
                <label className="checkbox" htmlFor="crewsWithoutFinishTime" >
                  <input type="checkbox"  className="checkbox" id="crewsWithoutFinishTime"  onChange={this.handleCrewsWithoutFinishTime} value={this.state.crewsWithoutFinishTimeBoolean} checked={!!this.state.crewsWithoutFinishTimeBoolean} />
                  <small>⚠️ Accepted crews without finish time ({this.state.acceptedCrewsNoFinish})</small>
                </label>
              </div>


              <div className="field">
                <label className="checkbox" htmlFor="crewsWithMultipleTimes">
                  <input type="checkbox"  className="checkbox" id="crewsWithMultipleTimes"  onChange={this.handleCrewsWithTooManyTimes} value={this.state.crewsWithTooManyTimesBoolean} checked={!!this.state.crewsWithTooManyTimesBoolean} />
                  <small>❗️ Crews with multiple times ({this.state.crewsInvalidTimes})</small>
                </label>
              </div>
            </div>

            <div className="column">
              <div className="field">
                <label className="checkbox" htmlFor="showScratchedCrews" >
                  <input type="checkbox"  className="checkbox" id="showScratchedCrews" value={this.state.scratchedCrewsBoolean} checked={!!this.state.scratchedCrewsBoolean} onChange={this.handleScratchedCrews} />
                  <small>Hide scratched crews {this.state.scratchedCrews ? `(${this.state.scratchedCrews})` : ''}</small>
                </label>
              </div>
            </div>
          </div>

          <Paginator
            pageNumber={this.state.pageNumber}
            totalPages={totalPages}
            changePage={this.changePage}
          />

          <div className="list-totals"><small>{this.state.crews.length} of {this.state.totalCrews} crews</small></div>

          <table className="table">
            <thead>
              <tr>
                <td>Crew ID</td>
                <td>Crew</td>
                <td>Status</td>
                <td>Blade</td>
                <td>Bib</td>
                <td>Club</td>
                <td>Category</td>
                <td>Start seq#</td>
                <td>Finish seq#</td>
                <td><abbr title="Penalty">P</abbr></td>
                <td>Start time</td>
                <td>Finish time</td>
                <td>Raw time</td>
                <td>Race time</td>
                <td>Mas adjust</td>
                <td>Mas adjusted</td>
                <td>Time override</td>
                <td>TO</td>
              </tr>
            </thead>
            <tfoot>
              <tr>
                <td>Crew ID</td>
                <td>Crew</td>
                <td>Status</td>
                <td>Blade</td>
                <td>Bib</td>
                <td>Club</td>
                <td>Category</td>
                <td>Start seq#</td>
                <td>Finish seq#</td>
                <td><abbr title="Penalty">P</abbr></td>
                <td>Start time</td>
                <td>Finish time</td>
                <td>Raw time</td>
                <td>Race time</td>
                <td>Mas adjustment</td>
                <td>Mas adjust</td>
                <td>Time override</td>
                <td>TO</td>
              </tr>
            </tfoot>
            <tbody>
              {this.state.crews.map(crew =>
                <tr key={crew.id}>
                  <td><Link to={`/crews/${crew.id}`}>{crew.id}</Link></td>
                  <td>{!crew.competitor_names ? crew.name : crew.times.length && crew.times.length > 2 ? crew.competitor_names + '❗️' : crew.competitor_names}</td>
                  <td>{crew.status}</td>
                  <td>{getImage(crew)}</td>
                  <td>{!crew.bib_number ? '' : crew.bib_number}</td>
                  <td>{crew.club.index_code}</td>
                  <td>{crew.event_band}</td>
                  <td>{crew.start_sequence ? crew.start_sequence : '⚠️'}</td>
                  <td>{crew.finish_sequence ? crew.finish_sequence : '⚠️'}</td>
                  <td>{crew.penalty}</td>
                  <td>{crew.start_time ? formatTimes(crew.start_time) : '⚠️'}</td>
                  <td>{crew.finish_time ? formatTimes(crew.finish_time) : '⚠️'}</td>
                  <td>{crew.raw_time ? formatTimes(crew.raw_time) : '⚠️'}</td>
                  <td>{crew.race_time ? formatTimes(crew.race_time) : '⚠️'}</td>
                  <td>{crew.masters_adjustment === 0 ? '' : formatTimes(crew.masters_adjustment)}</td>
                  <td>{crew.masters_adjusted_time === 0 ? '' : formatTimes(crew.masters_adjusted_time)}</td>
                  <td>{crew.manual_override_time ? formatTimes(crew.manual_override_time) : ''}</td>
                  <td>{crew.time_only ? 'TO' : ''}</td>
                </tr>
              )}
            </tbody>
          </table>

          <Paginator
            pageNumber={this.state.pageNumber}
            totalPages={totalPages}
            changePage={this.changePage}
          />

        </div>
      </section>
    )
  }
}

export default CrewIndex
