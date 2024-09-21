import React from 'react'
import Select from 'react-select'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { formatTimes } from '../../../lib/helpers'
import Paginator from '../../molecules/Paginator/Paginator'
import PageTotals from '../../molecules/PageTotals/PageTotals'
import Header from '../../organisms/Header/Header'

class RaceTimeIndex extends React.Component {
  constructor() {
    super()
    this.state= {
      raceTimes: [],
      raceTimesToDisplay: [],
      pageSize: 20,
      pageNumber: 1,
      crewsWithTooManyTimesBoolean: sessionStorage.getItem('timesInvalid') === 'true' ? true : false,
      timesWithoutCrewBoolean: sessionStorage.getItem('timesWithNoCrew') === 'true' ? true : false,
      searchTerm: sessionStorage.getItem('raceTimeIndexSearch') || '',
      startTab: !sessionStorage.getItem('tapTimes') || sessionStorage.getItem('tapTimes') === 'Start' ? true : false,
      finishTab: sessionStorage.getItem('tapTimes') === 'Finish' ? true : false
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
        tap: !sessionStorage.getItem('tapTimes') ? 'Start' : sessionStorage.getItem('tapTimes'),
        noCrew: sessionStorage.getItem('timesWithNoCrew') === 'true' ? true : false,
        crewInvalidTimes: sessionStorage.getItem('timesInvalid') === 'true' ? true : false
      }
    })
      .then(res => this.setState({
        totalTimes: res.data['count'],
        raceTimes: res.data['results'],
        startTimesWithNoCrew: res.data['start_times_no_crew'],
        finishTimesWithNoCrew: res.data['finish_times_no_crew'],
        startTimesInvalid: res.data['crews_invalid_times_start'],
        finishTimesInvalid: res.data['crews_invalid_times_finish']
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

    axios.get(`/api/race-times?${queryString}`, {
      // cancel token used by axios
      cancelToken: this._source.token,

      params: {
        page_size: this.state.pageSize,
        page: this.state.pageNumber,
        tap: this.state.startTab ? 'Start' : 'Finish',
        noCrew: this.state.timesWithoutCrewBoolean,
        crewInvalidTimes: this.state.crewsWithTooManyTimesBoolean
      }
    })
      .then(res => this.setState({ 
        totalTimes: res.data['count'],
        raceTimes: res.data['results'],
        startTimesWithNoCrew: res.data['start_times_no_crew'],
        finishTimesWithNoCrew: res.data['finish_times_no_crew'],
        startTimesInvalid: res.data['crews_invalid_times_start'],
        finishTimesInvalid: res.data['crews_invalid_times_finish']
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
    sessionStorage.setItem('tapTimes', 'Start')
    this.setState({
      startTab: true,
      finishTab: false,
      pageNumber: 1
    }, () => this.refreshData())
  }

  displayFinishTimes(){
    sessionStorage.setItem('tapTimes', 'Finish')
    this.setState({
      startTab: false,
      finishTab: true,
      pageNumber: 1
    }, () => this.refreshData())
  }

  handleSearchKeyUp(e){
    sessionStorage.setItem('raceTimeIndexSearch', e.target.value)
    this.setState({
      searchTerm: e.target.value,
      pageNumber: 1
    }, () => this.refreshData(`search=${this.state.searchTerm}`))
  }

  handleTimesWithoutCrew(e){
    sessionStorage.setItem('timesWithNoCrew', e.target.checked)
    sessionStorage.setItem('timesInvalid', false)
    this.setState({
      timesWithoutCrewBoolean: e.target.checked,
      crewsWithTooManyTimesBoolean: false,
      pageNumber: 1
    }, () => this.refreshData())
  }

  handleCrewsWithTooManyTimes(e){
    sessionStorage.setItem('timesInvalid', e.target.checked)
    sessionStorage.setItem('timesWithNoCrew', false)
    this.setState({
      crewsWithTooManyTimesBoolean: e.target.checked,
      timesWithoutCrewBoolean: false,
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
      <><Header /><section className="section">
        <div className="container">
          <div className="tabContainer no-print">
            <div className="tabs is-toggle is-large is-centered">
              <ul>
                <li onClick={this.displayStartTimes}><a className={`startTab ${!this.state.startTab ? '' : 'active'}`}>Start times</a></li>
                <li onClick={this.displayFinishTimes}><a className={`finishTab ${!this.state.finishTab ? '' : 'active'}`}>Finish times</a></li>
              </ul>
            </div>
          </div>

          <div className="columns is-vcentered">

            <div className="column">
              <label className="label has-text-left" htmlFor="raceTimeSort">Search</label>

              <div className="search field control control-full-width has-icons-left no-print">
                <span className="icon is-left">
                  <i className="fas fa-search"></i>
                </span>
                <input id="raceTimeSort" className="input control-full-width" placeholder="search" value={this.state.searchTerm} onChange={this.handleSearchKeyUp} />
              </div>
            </div>

            <div className="column">
              <div className="field">
                <label className="label has-text-left" htmlFor="paging">Select page size</label>
                <div className="control">
                  <Select
                    id="paging"
                    onChange={this.handlePagingChange}
                    options={pagingOptions}
                    placeholder='Select page size' />
                </div>
              </div>
            </div>

            <div className="column has-text-left">
              <div className="field no-print">
                <label className="checkbox">
                  <input type="checkbox" className="checkbox" onClick={this.handleTimesWithoutCrew} value={this.state.timesWithoutCrewBoolean} defaultChecked={!!this.state.timesWithoutCrewBoolean} />
                  ⚠️ Times with no crew ({this.state.startTab ? this.state.startTimesWithNoCrew : this.state.finishTimesWithNoCrew})
                </label>
              </div>

              <div className="field no-print">
                <label className="checkbox">
                  <input type="checkbox" className="checkbox" onClick={this.handleCrewsWithTooManyTimes} value={this.state.crewsWithTooManyTimesBoolean} defaultChecked={!!this.state.crewsWithTooManyTimesBoolean} />
                  ❗️ Crews with too many times ({this.state.startTab ? this.state.startTimesInvalid : this.state.finishTimesInvalid})
                </label>
              </div>
            </div>

          </div>


          <div className="no-print">
            <Paginator
              pageNumber={this.state.pageNumber}
              totalPages={totalPages}
              changePage={this.changePage} />
          </div>
          <PageTotals
            totalCount={this.state.totalTimes}
            entities='times'
            pageSize={this.state.pageSize}
            pageNumber={this.state.pageNumber} />
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
                <th>Category</th>
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
                <th>Category</th>
              </tr>
            </tfoot>
            <tbody>
              {this.state.raceTimes.map(raceTime => <tr key={raceTime.id}>
                <td><Link to={`/generate-results/race-times/${raceTime.id}`}>{raceTime.sequence}</Link></td>
                <td>{raceTime.tap}</td>
                <td>{formatTimes(raceTime.time_tap)}</td>
                <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.bib_number}</td>
                <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.id}</td>
                <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.times.length > 2 ? raceTime.crew.name + '❗️' : raceTime.crew.name}</td>
                <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.competitor_names}</td>
                <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.event_band}</td>

              </tr>
              )}
            </tbody>
          </table>

          <div className="no-print">
            <Paginator
              pageNumber={this.state.pageNumber}
              totalPages={totalPages}
              changePage={this.changePage} />
          </div>

        </div>

      </section></>
    )
  }
}

export default RaceTimeIndex
