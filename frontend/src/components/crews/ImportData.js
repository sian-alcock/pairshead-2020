import React from 'react'
import ClubEventLoader from '../common/ImportClubEventData'
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
              <DataLoader
                url='/api/crew-data-import'
                buttonText='Get crew data'
                class='single-height-button'
              />
            </div>
            <div className="column left">
              This button gets the crew data from British Rowing.  Note:  Data is deleted before importing.
            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter">
              <DataLoader
                url='/api/competitor-data-import'
                buttonText='Get competitor data'
                class='single-height-button'
              />
            </div>
            <div className="column left">
              This button gets the competitor data from British Rowing.  Note:  Data is deleted before importing.
            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter">
              <DataLoader
                url='/api/crew-race-times'
                buttonText='Get race times'
                class='single-height-button'
              />
            </div>
            <div className="column left">
              This button imports race time data from a CSV file generated from Web Scorer that needs to be saved in the project folder ..results / csv.  Note:  Data is deleted before importing.
            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter">
              <DataLoader
                url='/api/masters-adjustments-import/'
                buttonText='Get masters adjustment lookup'
                class='double-height-button'
              />
            </div>
            <div className="column left">
              This button imports data from a CSV file containing the masters adjustments that needs to be saved in the project folder ..results / csv.  Note:  Data is deleted before importing.
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

          <div className="columns">
            <div className="column is-one-quarter">
              <DataLoader
                url='/api/crew-update-rankings/'
                buttonText='Calculate race times'
                class='double-height-button'
              />
            </div>
            <div className="column left">
              This button initiates a calculation of rankings and masters adjustments.
            </div>
          </div>


        </div>
      </section>
    )
  }
}

export default ImportData
