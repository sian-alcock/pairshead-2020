import React from 'react'
import Select from 'react-select'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { formatTimes } from '../../lib/helpers'
// const _ = require('lodash').runInContext()
import Paginator from '../common/Paginator'

class RaceTimeIndex extends React.Component {
  constructor() {
    super()
    this.state= {
      raceTimes: [],
      raceTimesToDisplay: [],
      pageSize: 20,
      pageNumber: 1,
      timesWithoutCrewBoolean: false,
      searchTerm: sessionStorage.getItem('raceTimeIndexSearch') || '',
      startTab: true,
      finishTab: false
    }

    this.displayStartTimes = this.displayStartTimes.bind(this)
    this.displayFinishTimes = this.displayFinishTimes.bind(this)
    this.handleTimesWithoutCrew = this.handleTimesWithoutCrew.bind(this)
    this.handleSearchKeyUp = this.handleSearchKeyUp.bind(this)
    this.handleTimesWithoutCrew = this.handleTimesWithoutCrew.bind(this)
    this.refreshData = this.refreshData.bind(this)
    this.changePage = this.changePage.bind(this)
    this.handlePagingChange = this.handlePagingChange.bind(this)
    this.handleCrewsWithTooManyTimes = this.handleCrewsWithTooManyTimes.bind(this)
  }

  componentDidMount() {
    axios.get('/api/race-times/', {
      params: {
        page_size: 20,
        page: 1,
        tap: 'Start',
        noCrew: false
      }
    })
      .then(res => this.setState({
        totalTimes: res.data['count'],
        raceTimes: res.data['results'],
        startTimesWithNoCrew: res.data['start_times_no_crew'],
        finishTimesWithNoCrew: res.data['finish_times_no_crew']
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

  // refreshData(queryString=null) {
  //   axios.get(`/api/race-times/?${queryString}`, {
  //     params: {
  //       page_size: this.state.pageSize,
  //       page: this.state.pageNumber,
  //       tap: this.state.startTab ? 'Start' : 'Finish',
  //       noCrew: this.state.timesWithoutCrewBoolean
  //     }
  //   })
  //     .then(res => this.setState({ 
  //       totalTimes: res.data['count'],
  //       raceTimes: res.data['results'],
  //       startTimesWithNoCrew: res.data['start_times_no_crew'],
  //       finishTimesWithNoCrew: res.data['finish_times_no_crew']
  //     })
  //     )
  // }

  refreshData(queryString=null) {
    if (typeof this._source !== typeof undefined) {
      this._source.cancel('Operation cancelled due to new request')
    }

    // save the new request for cancellation
    this._source = axios.CancelToken.source()

    axios.get(`/api/race-times?${queryString}`, {
      // cancel token used by axios
      cancelToken: this._source.token,

      params: {
        page_size: this.state.pageSize,
        page: this.state.pageNumber,
        tap: this.state.startTab ? 'Start' : 'Finish',
        noCrew: this.state.timesWithoutCrewBoolean
      }
    })
      .then(res => this.setState({ 
        totalTimes: res.data['count'],
        raceTimes: res.data['results'],
        startTimesWithNoCrew: res.data['start_times_no_crew'],
        finishTimesWithNoCrew: res.data['finish_times_no_crew']
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

  displayStartTimes(){
    this.setState({
      startTab: true,
      finishTab: false,
      pageNumber: 1
    }, () => this.refreshData())
  }

  displayFinishTimes(){
    this.setState({
      startTab: false,
      finishTab: true,
      pageNumber: 1
    }, () => this.refreshData())
  }

  // getNumTimesWithNoCrew(){
  //   return this.state.raceTimesToDisplay.filter(time => time.crew === null).length
  // }

  // getNumCrewsWithTooManyTimes(){
  //   return this.state.raceTimesToDisplay.filter(time => time.crew && time.crew.times.length > 2).length
  // }

  handleSearchKeyUp(e){
    sessionStorage.setItem('raceTimeIndexSearch', e.target.value)
    this.setState({
      searchTerm: e.target.value,
      pageNumber: 1
    }, () => this.refreshData(`search=${this.state.searchTerm}`))
  }

  handleTimesWithoutCrew(e){
    this.setState({
      timesWithoutCrewBoolean: e.target.checked,
      pageNumber: 1
    }, () => this.refreshData())
  }

  handleCrewsWithTooManyTimes(e){
    this.setState({
      crewsWithTooManyTimesBoolean: e.target.checked,
      pageNumber: 1
    }, () => this.refreshData())
  }


  handlePagingChange(selectedOption){
    this.setState({
      pageSize: selectedOption.value,
      pageNumber: 1
    }, () => this.refreshData())
    
  }


  render() {

    const totalPages = Math.ceil(this.state.totalTimes / this.state.pageSize)
    const pagingOptions = [{label: '20 times', value: '20'}, {label: '50 times', value: '50'}, {label: '100 times', value: '100'}, {label: 'All times', value: '500'}]

    return (
      <section className="section">
        <div className="container">
          <div className="tabContainer no-print">
            <div className="tabs is-toggle is-large is-centered">
              <ul>
                <li onClick={this.displayStartTimes}><a className={`startTab ${this.state.startTab ? 'active' : ''}`}>Start times</a></li>
                <li onClick={this.displayFinishTimes}><a className={`finishTab ${this.state.finishTab ? 'active' : ''}`}>Finish times</a></li>
              </ul>
            </div>
          </div>

          <div className="columns">

            <div className="column">
              <div className="search field control has-icons-left no-print">
                <span className="icon is-left">
                  <i className="fas fa-search"></i>
                </span>
                <input className="input" placeholder="search" value={this.state.searchTerm} onChange={this.handleSearchKeyUp} />
              </div>
            </div>

            <div className="column">
              <div className="field">
                <div className="control">
                  <Select
                    id="paging"
                    onChange={this.handlePagingChange}
                    options={pagingOptions}
                    placeholder='Select page size'
                  />
                </div>
              </div>
            </div>

            <div className="column">
              <div className="field no-print">
                <label className="checkbox" >
                  <input type="checkbox"  className="checkbox" value="timesWithoutCrew" onClick={this.handleTimesWithoutCrew} />
                  ⚠️ Times with no crew ({this.state.startTab ? this.state.startTimesWithNoCrew : this.state.finishTimesWithNoCrew})
                </label>
              </div>
            </div>

            <div className="column">
              <div className="field no-print">
                <label className="checkbox" >
                  <input type="checkbox"  className="checkbox" value="timesWithoutCrew" onClick={this.handleCrewsWithTooManyTimes} />
                  ❗️ Crews with too many times (??)
                </label>
              </div>
            </div>

          </div>


          <div className="no-print">
            <Paginator
              pageNumber={this.state.pageNumber}
              totalPages={totalPages}
              changePage={this.changePage}
            />
          </div>
          <div className="list-totals"><small>{this.state.raceTimes.length} of {this.state.totalTimes} times</small></div>

          <table className="table">
            <thead>
              <tr>
                <th>Sequence</th>
                <th>Tap</th>
                <th>Start / Finish Tap</th>
                <th>Bib number</th>
                <th>Crew ID</th>
                <th>Crew name</th>
                <th>Competitors</th>
              </tr>
            </thead>
            <tfoot>
              <tr>
                <th>Sequence</th>
                <th>Tap</th>
                <th>Start / Finish Tap</th>
                <th>Bib number</th>
                <th>Crew ID</th>
                <th>Crew name</th>
                <th>Competitors</th>
              </tr>
            </tfoot>
            <tbody>
              {this.state.raceTimes.map(raceTime =>
                <tr key={raceTime.id}>
                  <td><Link to={`/race-times/${raceTime.id}`}>{raceTime.sequence}</Link></td>
                  <td>{raceTime.tap}</td>
                  <td>{formatTimes(raceTime.time_tap)}</td>
                  <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.bib_number}</td>
                  <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.id}</td>
                  <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.times.length > 2 ? raceTime.crew.name + '❗️' : raceTime.crew.name}</td>
                  <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.competitor_names}</td>

                </tr>
              )}
            </tbody>
          </table>

          <div className="no-print">
            <Paginator
              pageNumber={this.state.pageNumber}
              totalPages={totalPages}
              changePage={this.changePage}
            />
          </div>

        </div>

      </section>
    )
  }
}

export default RaceTimeIndex
