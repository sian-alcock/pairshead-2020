import React from 'react'
// import axios from 'axios'

class Info extends React.Component {

  // constructor() {
  //   super()
  //   this.state = {
  //     formData: [],
  //     current_event_meeting: ''
  //   }

  //   this.handleSubmit = this.handleSubmit.bind(this)
  //   this.handleChange = this.handleChange.bind(this)
  // }

  // componentDidMount() {
  //   axios.get('/api/event-meeting-key-list/', {
  //     params: {

  //     }
  //   })
  //     .then(res => this.setState({ 
  //       totalKeys: res.data['count'],
  //       formData: res.data['results']
  //     })
  //     ) 
  // }

  // handleSubmit(e) {
  //   e.preventDefault()

  //   const data = {
  //     ...this.state.formData,
  //     // need to specify which key is true
  //     band: !this.state.formData.band ? '' : this.state.formData.band.value, requires_recalculation: true
  //   }
  // PLAN OF ATTACK /////////////////
  // DO ONE POST TO SET THE CURRENT KEY TO FALSE
  // THEN A POST TO SET NEW RECORD TO TRUE
  // AND WHEN YOU ADD A NEW ONE SET TO TRUE
    
  //   axios.put(`/api/event-meeting-key-list/${this.props.match.params.id}`, data)
  //     .then(() => this.props.history.push('/event-meeting-key-list'))
  //     .catch(err => this.setState({ errors: err.response.data }))
  // }

  // handleChange(e) {
  //   console.log('is this running?')
  //   const formData = { ...this.state.formData, [e.target.name]: e.target.value }

  //   this.setState({ formData })
  //   console.log(formData)
  // }
  
  render() {

    return (
      <>
        {/* <section>
          <div className="container">
            <div className="box">
              <form onSubmit={this.handleSubmit}>
                <ul>
                  {this.state.formData.map((key) =>
                    <li key={key.id}>{key.event_meeting_name} - {key.event_meeting_key} 
                      <input type='radio' name='current' value={key.event_meeting_key} onChange={this.handleChange}></input>
                    </li>
                  )}
                </ul>
                <button className="button is-primary" type='submit'>Change meeting</button>

              </form>
            </div>
          </div>
        </section> */}

        <section className="section">
          <div className="container">
            <div className="box has-text-left">
              <h1 className="title is-size-2">Calculations</h1>
              <p><strong>Raw time</strong> - the raw time is the finish time less the start time</p>
              <p><strong>Race time</strong> - the race time is the raw time plus any penalty</p>
              <p><strong>Disqualified</strong> - the calculation of raw time will be set to zero if the crew has been disqualified (see under All crews)</p>
              <p><strong>Did not finish</strong> - the calculation of raw time will be set to zero if the crew has been marked as &quot;Did not finish&quot; (see under All crews)</p>
              <p><strong>Did not start</strong> - the calculation of raw time will be set to zero if the crew has been marked as &quot;Did not start&quot; (see under All crews)</p>
              <p><strong>Time</strong> - the Time column on the Results page presents the Race time unless a manual override time has been entered for a crew in which case, the manual override time plus any penalties will be presented there</p>
              <p><strong>Masters adjustment</strong> - where Masters categories have been combined into a single event band, times are adjusted according to masters interpolated times set out on British Rowing website (and imported into this app via a .csv)</p>
              <p><strong>Masters adjusted time</strong> - the race time minus a masters adjustment.  Note:  The Masters adjusted time is only used to calculate the position in category for masters events that have been combined</p>
              <p><strong>Position in category</strong> - the position in category is the ranking within a specific event</p>
              <p><strong>Pennant</strong> - pennant image is presented alongside ranking for all ranked 1 within a category</p>
              <p><strong>Trophy</strong> - trophy image is presented alongside ranking if crew is fastest female double scull or crew is fastest female pair or is fastest mixed double scull</p>
              <p><strong>Position in category</strong> - the position in category is the ranking within a specific event</p>

            </div>
          </div>
        </section>


      </>
    )
  }
}

export default Info
