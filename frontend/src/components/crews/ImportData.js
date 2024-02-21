import React from 'react'
import BROELoader from '../common/ImportBROEData'
import DataLoader from '../common/DataLoader'
import CSVDataLoader from '../common/CSVDataLoader'
// import axios from 'axios'

class ImportData extends React.Component {
  constructor() {
    super()

  }


  render() {

    return (
      <section className="section">
        <div className="container">
          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="title is-2">Get data from British Rowing</h2>
              <p className="left">Import data from British Rowing via the api</p>
            </div>
            <BROELoader
              importPersonalData={false}
            />

          </section>

          <section className="section-has-lines">
            <div className="has-text-left">
              <h2 className="title is-2">Import race times from csv</h2>
              <p className="left">Import webscorer race times from csv.</p>
            </div>

            <div className="column is-one-half">
              <CSVDataLoader
                url='/api/crew-race-times-import/'
                buttonText='Import race times'
                class='single-height-button'
              />
            </div>
          </section>

          <section className="section-has-lines">
            <div className="has-text-left">
              <h2 className="title is-2">Import original event categories from csv</h2>
              <p className="left">Import event categories from csv.</p>
            </div>

            <div className="column is-one-half">
              <CSVDataLoader
                url='/api/original-event-import/'
                buttonText='Import original event categories'
                class='double-height-button'
              />
            </div>
          </section>

          <section className="section-has-lines">
            <div className="has-text-left">
              <h2 className="title is-2">Import masters adjustments from csv</h2>
              <p className="left">Import masters adjustments from csv.</p>
            </div>

            <div className="column is-one-half">
              <CSVDataLoader
                url='/api/masters-adjustments-import/'
                buttonText='Import masters adjustments'
                class='double-height-button'
              />
            </div>
          </section>
          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="title is-2">Update all calculations</h2>
              <p className="left">Refresh all calculations eg ranking etc - this may be needed after making changes such as adding penalties.</p>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <DataLoader
                  url='/api/crew-update-rankings/'
                  buttonText='Refresh calculations'
                  class='single-height-button'
                />
              </div>
              <div className="column left">
                Initiates a calculation (or re-calculation) of rankings and masters adjustments.
              </div>
            </div>
          </section>

        </div>
      </section>
    )
  }
}

export default ImportData
