import React from 'react'

class Info extends React.Component {


  render() {

    return (
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
          </div>
        </div>
      </section>
    )
  }
}

export default Info
