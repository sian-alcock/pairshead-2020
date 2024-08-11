import React from 'react'
import Select from 'react-select'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { getImage } from '../../lib/helpers'
import Paginator from '../molecules/Paginator/Paginator'
import PageTotals from '../molecules/PageTotals/PageTotals'


class CrewStartOrder extends React.Component {
  constructor() {
    super()
    this.state = {
      crews: [],
      pageSize: 20,
      pageNumber: 1
    }
    this.changePage = this.changePage.bind(this)
    this.refreshData = this.refreshData.bind(this)
    this.handlePagingChange = this.handlePagingChange.bind(this)
  }

  componentDidMount() {
    axios.get('/api/crews', {
      params: {
        page_size: 500,
        page: 1,
        order: 'start-score',
        status: 'Accepted'
      }
    })
      .then(res => this.setState({ 
        // totalCrews: res.data['count'],
        crews: res.data['results']
        // scratchedCrews: res.data['num_scratched_crews'],
        // acceptedCrewsNoStart: res.data['num_accepted_crews_no_start_time'],
        // acceptedCrewsNoFinish: res.data['num_accepted_crews_no_finish_time'],
        // crewsInvalidTimes: res.data['num_accepted_crews_invalid_time']
      })
      )
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
        page: this.state.pageNumber
      }
    })
      .then(res => this.setState({
        totalCrews: res.data['count'],
        crews: res.data['results'],
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

  handlePagingChange(selectedOption){
    this.setState({
      pageSize: selectedOption.value,
      pageNumber: 1
    }, () => this.refreshData())
    
  }

  changePage(pageNumber, totalPages) {
    if (
      pageNumber > totalPages ||
      pageNumber < 0
    ) return null
    this.setState({ pageNumber }, () => this.refreshData())
  }

  render() {

    !this.state.crews ? <h2>loading...</h2> : console.log(this.state.crews)
    const totalPages = Math.floor((this.state.totalCrews) / this.state.pageSize)
    const pagingOptions = [{label: '20 crews', value: '20'}, {label: '50 crews', value: '50'}, {label: '100 crews', value: '100'}, {label: 'All crews', value: '500'}]



    return (
      <section className="section">
        <div className="container">

          <div className="columns no-print">

            <div className="column is-one-quarter">

              <div className="field">
                <div className="control">
                  <Select
                    id="paging"
                    onChange={this.handlePagingChange}
                    options={pagingOptions}
                    placeholder='Page size'
                  />
                </div>
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
          <div className="no-print">
            <PageTotals
              totalCount={this.state.totalCrews}
              entities='crews'
              pageSize={this.state.pageSize}
              pageNumber={this.state.pageNumber}  
            />
          </div>
          <div className="title is-4">Pairs Head {(new Date().getFullYear())} - Start order</div>
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
                <td>Event order</td>
                <td>Sculling CRI</td>
                <td>Rowing CRI</td>
                <td>Start score</td>
                <td>Start order</td>
                <td>Host club</td>
                <td>Number location</td>
                <td>Marshalling division</td>
              </tr>
            </thead>
            <tfoot className="no-print">
              <tr>
                <td>Crew ID</td>
                <td>Crew</td>
                <td>Status</td>
                <td>Blade</td>
                <td>Bib</td>
                <td>Club</td>
                <td>Category</td>
                <td>Event order</td>
                <td>Sculling CRI</td>
                <td>Rowing CRI</td>
                <td>Start score</td>
                <td>Start order</td>
                <td>Host club</td>
                <td>Number location</td>
                <td>Marshalling division</td>
              </tr>
            </tfoot>
            <tbody>
              {this.state.crews.map(crew =>
                <tr key={crew.id}>
                  <td><Link to={`/crews/${crew.id}`}>{crew.id}</Link></td>
                  <td>{!crew.competitor_names ? crew.name : crew.competitor_names}</td>
                  <td>{crew.status}</td>
                  <td>{getImage(crew)}</td>
                  <td>{!crew.bib_number ? '' : crew.bib_number}</td>
                  <td>{crew.club.index_code}</td>
                  <td>{crew.event_band}</td>
                  <td>{crew.event_order}</td>
                  <td>{crew.sculling_CRI}</td>
                  <td>{crew.rowing_CRI}</td>
                  <td>{crew.draw_start_score}</td>
                  <td>{crew.calculated_start_order}</td>
                  <td>{crew.host_club.name === 'Unknown club' ? `⚠️ ${crew.host_club.name}` : crew.host_club.name}</td>
                  <td>{crew.number_location}</td>
                  <td>{crew.marshalling_division}</td>
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

export default CrewStartOrder
