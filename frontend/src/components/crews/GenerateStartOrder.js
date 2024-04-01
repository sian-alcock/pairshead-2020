import React from 'react'
import BROELoader from '../common/ImportBROEData'
import CSVDataLoader from '../common/CSVDataLoader'
import CalculateStartOrder from '../common/CalculateStartOrder'
import { Link } from 'react-router-dom/cjs/react-router-dom.min'

class GenerateStartOrder extends React.Component {
  constructor() {
    super()

    this.exportBibData = this.exportBibData.bind(this)
    this.exportStartOrderData = this.exportStartOrderData.bind(this)
    this.exportEventOrderTemplate = this.exportEventOrderTemplate.bind(this)
    
  }

  exportEventOrderTemplate(e){
    e.preventDefault
    window.open('api/event-order-template-export/')
  }

  exportBibData(e){
    e.preventDefault
    window.open('api/bib-data-export/')
  }

  exportStartOrderData(e){
    e.preventDefault
    window.open('api/start-order-data-export/')
  }


  render() {

    return (
      <section className="section">
        <div className="container">
          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="title is-2">Get data from BROE</h2>
              <p className="left">Import data from BROE via the api</p>
            </div>

            <BROELoader
              importPersonalData={true}
            />

          </section>

          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="title is-2">Create template for event order</h2>
              <p className="left">Download a template for the event order</p>
            </div>
            <div className="columns">
              <div className="column is-one-quarter has-text-centered">
                <button className="button is-primary double-height-button" onClick={this.exportEventOrderTemplate}>Export csv template for event order</button>
              </div>
              <div className="column left">
              CSV with all events listed ready for admin to enter the order
              </div>
            </div>
            <div className="has-text-left">
              <h2 className="title is-2">Import event order from csv</h2>
              <p className="left">Import event order from csv.</p>
            </div>

            <div className="column is-one-half">
              <CSVDataLoader
                url='/api/event-order-import/'
                buttonText='Import event order'
                class='double-height-button'
              />
            </div>
          </section>
          
          <section className="section-has-lines">
            <div className="has-text-left">
              <h2 className="title is-2">Import marshalling division ranges from csv</h2>
              <p className="left">Marshalling division ranges from csv.</p>
            </div>

            <div className="column is-one-half">
              <CSVDataLoader
                url='/api/marshalling-division-import/'
                buttonText='Import marshalling division ranges'
                class='double-height-button'
              />
            </div>
          </section>

          <section className="section-has-lines">
            <div className="has-text-left">
              <h2 className="title is-2">Import number locations from csv</h2>
              <p className="left">Import number locations from csv.</p>
            </div>

            <div className="column is-one-half">
              <CSVDataLoader
                url='/api/number-location-import/'
                buttonText='Import number locations'
                class='double-height-button'
              /> 
            </div>
          </section>

          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="title is-2">Calculate start order</h2>
              <p className="left">Use the CRI scores and event order to calculate the overall start order</p>
            </div>
            <CalculateStartOrder/>
          </section>

          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="title is-2">Inspect start order</h2>
              <p className="left">View lists of crews with start order</p>
            </div>
            <div className="columns">
              <div className="column is-one-quarter has-text-centered">
                <Link
                  to={{
                    pathname: '/crew-start-order'
                  }}>
                  <button className="button is-primary">
                      Start order
                  </button>
                </Link>
              </div>

            </div>
            <div className="columns">
              <div className="column is-one-quarter has-text-centered">
                <Link
                  to={{
                    pathname: '/crew-start-order-by-host'
                  }}>
                  <button className="button is-primary">
                      Start order by host club
                  </button>
                </Link>
              </div>
            </div>
          </section>

          <section className="section-has-lines">
            <div className="text-container has-text-left">
              <h2 className="title is-2">Export start order data</h2>
              <p className="left">Export start order data for import to BROE and for reports/admin</p>
            </div>
            <div className="columns">
              <div className="column is-one-quarter has-text-centered">
                <button className="button is-primary" onClick={this.exportBibData}>Export bib data</button>
              </div>
              <div className="column left">
              CSV with crew ID and start order for import into BROE
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter has-text-centered">
                <button className="button is-primary" onClick={this.exportStartOrderData}>Export start order data</button>
              </div>
              <div className="column left">
                CSV with details of the start order
              </div>
            </div>
          </section>



        </div>
      </section>
    )
  }
}

export default GenerateStartOrder
