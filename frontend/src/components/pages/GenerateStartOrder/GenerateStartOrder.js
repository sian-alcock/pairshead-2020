import React from 'react'
import BROELoader from '../../molecules/BROEDataLoader/ImportBROEData'
import CSVDataLoader from '../../molecules/CSVDataLoader/CSVDataLoader'
import CalculateStartOrder from '../../molecules/CalculateStartOrder/CalculateStartOrder'
import TextButton from '../../atoms/TextButton/TextButton'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import "./generateStartOrder.scss"

class GenerateStartOrder extends React.Component {
  constructor() {
    super()

    this.exportBibData = this.exportBibData.bind(this)
    this.exportEventOrderTemplate = this.exportEventOrderTemplate.bind(this)
    
  }

  exportNumberLocationTemplate(e) {
    e.preventDefault
    window.open('api/number-location-template/')
  }

  exportEventOrderTemplate(e){
    e.preventDefault
    window.open('api/event-order-template-export/')
  }

  exportBibData(e){
    e.preventDefault
    window.open('api/bib-data-export/')
  }

  render() {

    return (
      <>
      <Header />
      <Hero title="Generate start order" />
      <section className="section">
        <div className="container">
          <BROELoader
              importPersonalData={true} title={'Get data from British Rowing'} description={'Import data from BROE via the api'} />

          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="generate-start-order__title">Create template for event order</h2>
              <p className="left">Download a template for the event order</p>
            </div>
            <div className="columns">
              <div className="column is-one-quarter has-text-centered">
                <TextButton onClick={this.exportEventOrderTemplate} label={'Export event order template'}/>
              </div>
              <div className="column left">
                CSV with all events listed ready for admin to enter the order
              </div>
            </div>
          </section>

            <CSVDataLoader
              url='/api/event-order-import/'
              buttonText='Import event order'
              class='double-height-button' 
              title='Import event order from csv'
              description='Import event order from csv.'
            />

            <section className="section-has-lines">
              <div className="text-container has-text-left">
                <h2 className="generate-start-order__title">Create template for Number locations</h2>
                <p className="left">Download a template for the number locations</p>
              </div>
              <div className="columns">
                <div className="column is-one-quarter has-text-centered">
                  <TextButton onClick={this.exportNumberLocationTemplate} label={'Number location template'}/>
                </div>
                <div className="column left">
                  CSV with all host clubs ready for admin to enter the associated number location
                </div>
              </div>
              <CSVDataLoader
                url='/api/number-location-import/'
                buttonText='Import number locations'
                class='double-height-button'
                title='Import number locations from csv'
                description='Import number locations from csv.'
              />

              <TextButton label="Inspect number locations" pathName='/generate-start-order/set-number-locations' />

            </section>

            <CSVDataLoader
              url='/api/marshalling-division-import/'
              buttonText='Import marshalling division ranges'
              class='double-height-button' 
              title='Import marshalling division ranges from csv'
              description='Marshalling division ranges from csv.'
              lines='true'
            />

            <CalculateStartOrder
              title='Calculate start order'
              description='Use the CRI scores and event order to calculate the overall start order'
            />


          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="generate-start-order__title">Inspect calculated start order</h2>
              <p className="generate-start-order__description">Report showing crews with calculated start order for inspection</p>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Start order" pathName='/generate-start-order/crew-start-order' />
              </div>
            </div>
          </section>

          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="generate-start-order__title">Export start order data</h2>
              <p className="generate-start-order__description">Export start order data for import to BROE and for reports/admin</p>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Export bib data" onClick={this.exportBibData} />
              </div>
            </div>
          </section>
        </div>
      </section>
      </>
    )
  }
}

export default GenerateStartOrder
