import React from 'react'
import BROELoader from '../../molecules/BROEDataLoader/ImportBROEData'
import DataLoader from '../../common/DataLoader'
import CSVDataLoader from '../../molecules/CSVDataLoader/CSVDataLoader'
import Hero from '../../organisms/Hero/Hero'
import Header from '../../organisms/Header/Header'
import TextButton from '../../atoms/TextButton/TextButton'

class GenerateResults extends React.Component {
  constructor() {
    super()
  }


  render() {

    return (
      <>
        <Header />
        <Hero title={"Generate results"} />
        <section className="section">
          <div className="container">
            <section className="c-data-loader__section">
            <div className="text-container has-text-left">
              <h2 className="c-data-loader__title">Get data from British Rowing</h2>
              <p className="c-data-loader__description">Import data from BROE via the api</p>
            </div>
              <BROELoader
            importPersonalData={true} title={'Get data from British Rowing'} description={'Import data from BROE via the api'} location={'page'}/>
            </section>
              <CSVDataLoader
                url='/api/crew-race-times-import/'
                buttonText='Import race times'
                class='single-height-button'
                title='Import race times from csv'
                description='Import webscorer race times from csv.'
                lines='true'
              />

              <CSVDataLoader
                url='/api/original-event-import/'
                buttonText='Import original event categories'
                class='double-height-button' 
                title='Import original event categories from csv'
                description='Import event categories from csv.'
                lines='true' 
                />

              <CSVDataLoader
                url='/api/masters-adjustments-import/'
                buttonText='Import masters adjustments'
                class='double-height-button'
                title='Import masters adjustments from csv'
                description='Import masters adjustments from csv.'
                lines='true'
              />

          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="generate-start-order__title">Update all calculations</h2>
              <p className="left">Refresh all calculations eg ranking etc - this may be needed after making changes such as adding penalties.</p>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <DataLoader
                  url='/api/crew-update-rankings/'
                  buttonText='Refresh calculations'
                  class='single-height-button' />
              </div>
            </div>
          </section>

          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="generate-start-order__title">Reports</h2>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="All crews" pathName='/generate-results/crews' />
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Race times" pathName='/generate-results/race-times' />
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Final results" pathName='/generate-results/results' />
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Result data exports" pathName='/generate-results/export' />
              </div>
            </div>
          </section>

        </div>
      </section>
      </>
    )
  }
}

export default GenerateResults
