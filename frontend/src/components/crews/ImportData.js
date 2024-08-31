import React from 'react'
import BROELoader from '../molecules/BROEDataLoader/ImportBROEData'
import DataLoader from '../common/DataLoader'
import CSVDataLoader from '../molecules/CSVDataLoader/CSVDataLoader'
import Hero from '../organisms/Hero/Hero'
// import axios from 'axios'
import Header from '../organisms/Header/Header'

class ImportData extends React.Component {
  constructor() {
    super()

  }


  render() {

    return (
      <>
        <Header />
        <Hero title={"Import data"} />
        <section className="section">
          <div className="container">
            <BROELoader
              importPersonalData={false} title={'Get data from British Rowing'} description={'Import data from BROE via the api'} />

              <CSVDataLoader
                url='/api/crew-race-times-import/'
                buttonText='Import race times'
                class='single-height-button'
                title='Import race times from csv'
                description='Import webscorer race times from csv.' 
              />

              <CSVDataLoader
                url='/api/original-event-import/'
                buttonText='Import original event categories'
                class='double-height-button' 
                title='Import original event categories from csv'
                description='Import event categories from csv.' 
                />

              <CSVDataLoader
                url='/api/masters-adjustments-import/'
                buttonText='Import masters adjustments'
                class='double-height-button'
                title='Import masters adjustments from csv'
                description='Import masters adjustments from csv.' 
              />

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
                  class='single-height-button' />
              </div>
              <div className="column left">
                Initiates a calculation (or re-calculation) of rankings and masters adjustments.
              </div>
            </div>
          </section>

        </div>
      </section></>
    )
  }
}

export default ImportData
