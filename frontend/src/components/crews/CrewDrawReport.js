import React from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { getImage } from '../../lib/helpers'


class CrewDrawReport extends React.Component {
  constructor() {
    super()
    this.state = {
      crews: []
    }

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

  render() {

    !this.state.crews ? <h2>loading...</h2> : console.log(this.state.crews)

    return (
      <section className="section">
        <div className="container">

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
                </tr>
              )}
            </tbody>
          </table>

        </div>
      </section>
    )
  }
}

export default CrewDrawReport
