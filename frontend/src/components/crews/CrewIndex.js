import React from 'react'
import Select from 'react-select'
import axios from 'axios'
import { Link } from 'react-router-dom'

import { formatTimes, getImage } from '../../lib/helpers'
import Paginator from '../common/Paginator'
import MastersCalculations from '../common/MastersCalculations'
import PageTotals from '../common/PageTotals'


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
      scratchedCrewsBoolean: sessionStorage.getItem('showScratchedCrews') || '',
      handleMastersAdjustments: false
    }

    this.changePage = this.changePage.bind(this)
    this.handleSearchKeyUp = this.handleSearchKeyUp.bind(this)
    this.handleSortChange = this.handleSortChange.bind(this)
    this.handleCrewsWithoutStartTime = this.handleCrewsWithoutStartTime.bind(this)
    this.handleCrewsWithoutFinishTime = this.handleCrewsWithoutFinishTime.bind(this)
    this.handleCrewsWithTooManyTimes = this.handleCrewsWithTooManyTimes.bind(this)
    this.handleScratchedCrews = this.handleScratchedCrews.bind(this)
    this.handleMastersAdjustments = this.handleMastersAdjustments.bind(this)
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
        crewsInvalidTimes: res.data['num_accepted_crews_invalid_time'],
        fastestMen2x: res.data['fastest_open_2x_time'].raw_time__min,
        fastestFemale2x: res.data['fastest_female_2x_time'].raw_time__min,
        fastestMenSweep: res.data['fastest_open_sweep_time'].raw_time__min,
        fastestFemaleSweep: res.data['fastest_female_sweep_time'].raw_time__min,
        fastestMixed2x: res.data['fastest_mixed_2x_time'].raw_time__min,
        mastersAdjustmentsApplied: res.data['num_crews_masters_adjusted']
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
        status: this.state.scratchedCrewsBoolean ? 'Accepted' : ['Accepted', 'Scratched'],
        masters: this.state.mastersAdjustmentsBoolean
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

  handleMastersAdjustments(e) {
    this.setState({
      crewsWithoutFinishTimeBoolean: false,
      crewsWithoutStartTimeBoolean: false,
      searchTerm: '',
      mastersAdjustmentsBoolean: e.target.checked
    }, () => this.refreshData())
  }

  render() {

    !this.state.crews ? <h2>loading...</h2> : console.log(this.state.crews)
  
    const totalPages = Math.floor((this.state.totalCrews) / this.state.pageSize)
    const pagingOptions = [{label: '20 crews', value: '20'}, {label: '50 crews', value: '50'}, {label: '100 crews', value: '100'}, {label: 'All crews', value: '500'}]

    return (
      <section className="section">
        <div className="container">

          <div className="columns is-vtop">

            <div className="column">
              <div className="field">
                <label className="label has-text-left" htmlFor="searchControl">Search</label>
                <div className="control has-icons-left" id="searchControl">
                  <span className="icon is-left">
                    <i className="fas fa-search"></i>
                  </span>
                  <input className="input" placeholder="search" defaultValue={this.state.searchTerm} onKeyUp={this.handleSearchKeyUp} />

                </div>
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
                    placeholder='Select page size'
                  />
                </div>
              </div>
            </div>


            <div className="column">
              <div className="field">
                <label className="label has-text-left" htmlFor="selectSort">Sort by</label>
                <div className="select control-full-width" id="selectSort">
                  <select className="control-full-width" onChange={this.handleSortChange}>
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
                    <option value="masters_adjustment">Masters adjust, asc</option>
                    <option value="-masters_adjustment">Masters adjust, desc</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="column has-text-left">
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

          <MastersCalculations
            fastestMen2x={formatTimes(this.state.fastestMen2x)}
            fastestFemale2x={formatTimes(this.state.fastestFemale2x)}
            fastestMenSweep={formatTimes(this.state.fastestMenSweep)}
            fastestFemaleSweep={formatTimes(this.state.fastestFemaleSweep)}
            fastestMixed2x={formatTimes(this.state.fastestMixed2x)}
            mastersAdjustmentsApplied={this.state.mastersAdjustmentsApplied}
            handleMastersAdjustments={this.handleMastersAdjustments}
          />

          <Paginator
            pageNumber={this.state.pageNumber}
            totalPages={totalPages}
            changePage={this.changePage}
          />
          <PageTotals
            totalCount={this.state.totalCrews}
            entities='crews'
            pageSize={this.state.pageSize}
            pageNumber={this.state.pageNumber}  
          />
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
                <td>Mas cat</td>
                <td>Mas adjust</td>
                <td>Mas adjusted</td>
                <td>Time override</td>
                <td>TO</td>
                <td>Pos</td>
                <td>Pos Cat</td>
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
                <td>Mas cat</td>
                <td>Mas adjustment</td>
                <td>Mas adjust</td>
                <td>Time override</td>
                <td>TO</td>
                <td>Pos</td>
                <td>Pos Cat</td>
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
                  <td>{crew.disqualified ? '❌' : crew.did_not_start ? '❌' : crew.did_not_finish ? '❌' :crew.raw_time ? formatTimes(crew.raw_time) : '⚠️'}</td>
                  <td>{crew.disqualified ? 'Disqualified' : crew.did_not_start ? 'Did not start' : crew.did_not_finish ? 'Did not finish' :crew.raw_time ? formatTimes(crew.race_time) : '⚠️'}</td>
                  <td>{crew.event.type === 'Master' && crew.event_original[0] ? crew.event_original[0].event_original : ''}</td>
                  <td>{crew.event.type !== 'Master' ? '' : formatTimes(crew.masters_adjustment)}</td>
                  <td>{crew.event.type !== 'Master' ? '' : formatTimes(crew.masters_adjusted_time)}</td>
                  <td>{crew.manual_override_time ? formatTimes(crew.manual_override_time) : ''}</td>
                  <td>{crew.time_only ? 'TO' : ''}</td>
                  <td>{!crew.overall_rank ? '' : crew.overall_rank}</td>
                  <td>{!crew.category_rank ? '' : crew.category_rank}</td>
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
