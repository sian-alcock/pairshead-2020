import React from 'react'
import axios from 'axios'
import Header from '../../organisms/Header/Header'
import TextButton from '../../atoms/TextButton/TextButton'
import Hero from '../../organisms/Hero/Hero'
import './home.scss'

class Home extends React.Component {
  constructor() {
    super()
    this.state= {
      crews: []
    }
  }

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

  render() {

    return (
      <>
      <Header />
      <Hero title={"Summary"}/>
      <section className="summary__section">
        <div className="summary__container">
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
          <div className="summary__button-column">

            <div className="summary__button-wrapper">
              <TextButton pathName={"/generate-start-order"} label={"Generate start order"} />
            </div>

            <div className="summary__button-wrapper">
              <TextButton pathName={"/logistics"} label={"On the day logistics"} />
            </div>
          </div>          
          
          <div className="summary__button-column">

            <div className="summary__button-wrapper">
              <TextButton pathName={"/generate-results"} label={"Generate results"} />
            </div>

            <div className="summary__button-wrapper">
              <TextButton pathName={"/settings"} label={"System settings"} />
            </div>
          </div>

        </div>
      </section>
      </>
    )
  }
}

export default Home
