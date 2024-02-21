import React from 'react'
import axios from 'axios'
import { getImage } from '../../lib/helpers'


class CrewStartByHostClub extends React.Component {
  constructor() {
    super()
    this.state = {
      crews: [],
      pageSize: 20,
      pageNumber: 1
    }

    this.refreshData = this.refreshData.bind(this)
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
        totalCrews: res.data['count'],
        crews: res.data['results']
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

  render() {

    !this.state.crews ? <h2>loading...</h2> : console.log(this.state.crews)
    const numberLocations = Array.from(this.state.crews.map(host => host.number_location))
    const uniqueNumberLocations = [...new Set(numberLocations)]
    console.log(uniqueNumberLocations)
    const tableHeadings = [
      'Crew',
      'Blade',
      'Bib',
      'Club',
      'Category',
      'Number location',
      'Marshalling division',
      ''
    ]

    return (
      <section className="section">
        <div className="container">

          <div className="title is-2">Pairs Head {(new Date().getFullYear())} - Start order</div>

          {uniqueNumberLocations.map((host, i) =>

            <div className='block' key={i}>
              <div className="title is-4">{host}</div>
              <table className="table has-text-left">
                <thead>
                  <tr>{
                    tableHeadings.map((heading, i) =>
                      <td key={i}>{heading}</td>
                    )}
                  </tr>
                </thead>
                <tfoot className="no-print">
                  <tr>{
                    tableHeadings.map((heading, i) =>
                      <td key={i}>{heading}</td>
                    )}
                  </tr>
                </tfoot>
                <tbody>
                  {this.state.crews.filter(numberLocation => numberLocation.number_location === host).map(crew =>
                    <tr key={crew.id}>
                      <td>{!crew.competitor_names ? crew.name : crew.competitor_names}</td>
                      <td>{getImage(crew)}</td>
                      <td>{!crew.bib_number ? '' : crew.bib_number}</td>
                      <td>{crew.club.index_code}</td>
                      <td>{crew.event_band}</td>
                      <td>{crew.number_location}</td>
                      <td>{crew.marshalling_division}</td>
                      <td>&#9634;</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {i < uniqueNumberLocations.length - 1 ? <div className='page-break'></div> : ''}

            </div>
          )}

        </div>
      </section>
    )
  }
}

export default CrewStartByHostClub
