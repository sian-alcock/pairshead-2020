import React from 'react'
import Header from '../../organisms/Header/Header'


class DrawMenu extends React.Component {
  constructor() {
    super()
    this.state= {
      crews: []
    }

    this.exportCrewData = this.exportCrewData.bind(this)
    this.exportCompetitorData = this.exportCompetitorData.bind(this)
    this.exportResultsData = this.exportResultsData.bind(this)
    this.exportStartData = this.exportStartData.bind(this)
    this.exportWebScorerData = this.exportWebScorerData.bind(this)
  }

  exportCrewData(e){
    e.preventDefault
    window.open('api/crew-data-export/')
  }

  exportCompetitorData(e){
    e.preventDefault
    window.open('api/competitor-data-export/')
  }

  exportResultsData(e){
    e.preventDefault
    window.open('api/results-export/')
  }

  exportStartData(e) {
    e.preventDefault
    window.open('api/crew-start-order-data-export-after-broe-import/')
  }

  exportWebScorerData(e) {
    e.preventDefault
    window.open('api/crew-web-scorer-data/')
  }

  render() {

    return (
      <><Header /><section className="section">
        <div className="container">

          <div className="columns">
            <div className="column is-one-quarter has-text-centered">
              <button className="button is-primary" onClick={this.exportCompetitorData}>Export competitor data</button>
            </div>
            <div className="column left">
              CSV showing crewID alongside competitor names
            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter has-text-centered">
              <button className="button is-primary" onClick={this.exportCrewData}>Export to BROE</button>
            </div>
            <div className="column left">
              CSV of crew data and results in correct format for import into British Rowing Website

            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter has-text-centered">
              <button className="button is-primary" onClick={this.exportResultsData}>Export crew data</button>
            </div>
            <div className="column left">
              CSV of results

            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter has-text-centered">
              <button className="button is-primary double-height-button" onClick={this.exportStartData}>Export crew starting order data</button>
            </div>
            <div className="column left">
              CSV of start order (contains bib number from BROE)

            </div>
          </div>

          <div className="columns">
            <div className="column is-one-quarter has-text-centered">
              <button className="button is-primary double-height-button" onClick={this.exportWebScorerData}>Export crew data for Webscorer</button>
            </div>
            <div className="column left">
              CSV for import into Webscorer

            </div>
          </div>

        </div>
      </section></>
    )
  }
}

export default DrawMenu
