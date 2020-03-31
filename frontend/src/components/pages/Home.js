import React from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

class Home extends React.Component {
  constructor() {
    super()
    this.state= {
      crews: []
    }

    // this.getCrewsWithTimes = this.getCrewsWithTimes.bind(this)
    // this.getCrewsWithoutTimes = this.getCrewsWithoutTimes.bind(this)
    // this.getTotalCrews = this.getTotalCrews.bind(this)
    // this.getScratchedCrewsWithTimes = this.getScratchedCrewsWithTimes.bind(this)
  }

  // componentDidMount() {
  //   axios.get('/api/crews')
  //     .then(res => this.setState({ crews: res.data}))
  // }

  componentDidMount() {
    axios.get('/api/crews')
      .then(res => this.setState({ 
        totalCrews: res.data['count'],
        crews: res.data['results'],
        acceptedCrews: res.data['num_accepted_crews'],
        scratchedCrews: res.data['num_scratched_crews'],
        scratchedCrewsWithTime: res.data['num_scratched_crews_with_time'],
        acceptedCrewsNoStart: res.data['num_accepted_crews_no_start_time'],
        acceptedCrewsNoFinish: res.data['num_accepted_crews_no_finish_time'],
        crewsInvalidTimes: res.data['num_accepted_crews_invalid_time']
      })
      )
  }

  // getCrewsWithTimes(){
  //   const crewsWithTimes = this.state.crews.filter(crew => crew.status !== 'Scratched' && crew.times.length === 2)
  //   return crewsWithTimes.length
  // }

  // getCrewsWithoutTimes(){
  //   const crewsWithoutTimes = this.state.crews.filter(crew => crew.status !== 'Scratched' && crew.times.length !== 2)
  //   return crewsWithoutTimes.length
  // }

  render() {

    return (
      <section className="section">
        <div className="container">


          <div className="box">
            <h2 className="subtitle has-text-centered">Summary</h2>
          </div>


          <div className="columns is-centered">
            <div className="column">
              <p>Total crews</p>
            </div>
            <div className="column">
              <p>{this.state.totalCrews}</p>
            </div>
            <div className="column">
              <p>Accepted crews with no Start time</p>
            </div>
            <div className="column">
              <p>{this.state.acceptedCrewsNoStart}</p>
            </div>
          </div>

          <div className="columns is-centered">
            <div className="column">
              <p>Accepted crews</p>
            </div>
            <div className="column">
              <p>{this.state.acceptedCrews}</p>
            </div>
            <div className="column">
              <p>Accepted crews with no Finish time</p>
            </div>
            <div className="column">
              <p>{this.state.acceptedCrewsNoFinish}</p>
            </div>
          </div>

          <div className="columns is-centered">
            <div className="column">
              <p>Scratched crews</p>
            </div>
            <div className="column">
              <p>{this.state.scratchedCrews}</p>
            </div>
            <div className="column">
              <p>Scratched crews that have a time</p>
            </div>
            <div className="column">
              <p>{this.state.scratchedCrewsWithTime}</p>
            </div>
          </div>


          <div className="columns is-centered">

            <div className="column has-text-centered">
              <Link
                to={{
                  pathname: '/import'
                }}>
                <button className="button is-primary">
                  Import data
                </button>
              </Link>
            </div>

            <div className="column has-text-centered">
              <Link
                to={{
                  pathname: '/export'
                }}>
                <button className="button is-primary">
                  Export data
                </button>
              </Link>
            </div>

            <div className="column has-text-centered">
              <Link
                to={{
                  pathname: '/race-times',
                  state: { startTab: true, finishTab: false }
                }}>
                <button className="button is-primary">
                  Fix Start Sequence
                </button>
              </Link>
            </div>

            <div className="column has-text-centered">
              <Link
                to={{
                  pathname: '/race-times',
                  state: { startTab: false, finishTab: true }
                }}>
                <button className="button is-primary">
                Fix Finish Sequence
                </button>
              </Link>
            </div>
          </div>

        </div>
      </section>
    )
  }
}

export default Home
