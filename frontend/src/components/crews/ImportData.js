import React from 'react'
import TimeLoader from '../common/ImportTimeData'
import ClubEventLoader from '../common/ImportClubEventData'
import CrewLoader from '../common/ImportCrewData'
import CompetitorLoader from '../common/ImportCompetitorData'
import DataLoader from '../common/DataLoader'

class ImportData extends React.Component {


  render() {

    return (
      <section className="section">
        <div className="container">

          <div className="columns">
            <div className="column is-one-quarter">
              <ClubEventLoader/>
            </div>
            <div className="column left">
              This button gets the clubs, events and bands from British Rowing.  Note:  Data is deleted before importing.
            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter">
              <CrewLoader/>
            </div>
            <div className="column left">
              This button gets the crew data from British Rowing.  Note:  Data is deleted before importing.
            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter">
              <CompetitorLoader/>
            </div>
            <div className="column left">
              This button gets the competitor data from British Rowing.  Note:  Data is deleted before importing.
            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter">
              <TimeLoader/>
            </div>
            <div className="column left">
              This button imports race time data from a CSV file generated from Web Scorer that needs to be saved in the project folder ..results / csv.  Note:  Data is deleted before importing.
            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter">
              <DataLoader
                url='/api/original-event-import/'
                buttonText='Get original event categories'
                class='double-height-button'
              />
            </div>
            <div className="column left">
              This button imports data from a CSV file created manually after entries have closed and BEFORE the events are changed that needs to be saved in the project folder ..results / csv.  Note:  Data is deleted before importing.
            </div>
          </div>


        </div>
      </section>
    )
  }
}

export default ImportData
