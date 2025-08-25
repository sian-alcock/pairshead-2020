import React from 'react'
import Header from '../../organisms/Header/Header'
import TextButton from '../../atoms/TextButton/TextButton'
import Hero from '../../organisms/Hero/Hero'
import './exportData.scss'


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
      <>
      <Header />
      <Hero title={'Data exports'}/>
      <section className="data-exports__section">
        <div className="data-exports__container">

          <div className="data-exports__columns">
            <TextButton onClick={this.exportCompetitorData} label={"Export competitor data"}/>
            <div className="data-exports__description">
              CSV showing crewID alongside competitor names
            </div>
          </div>

          <div className="data-exports__columns">
            <TextButton onClick={this.exportCrewData} label={"Export to BROE"}/>
            <div className="data-exports__description">
              CSV of crew data and results in correct format for import into British Rowing Website
            </div>
          </div>

          <div className="data-exports__columns">
            <TextButton onClick={this.exportResultsData} label={"Export crew data"}/>
            <div className="data-exports__description">
              CSV of results
            </div>
          </div>

          <div className="data-exports__columns">
            <TextButton onClick={this.exportStartData} label={"Export crew starting order data"}/>
            <div className="data-exports__description">
              CSV of start order (contains bib number from BROE)
            </div>
          </div>

          <div className="data-exports__columns">
            <TextButton onClick={this.exportWebScorerData} label={"Export crew data for Webscorer"}/>
            <div className="data-exports__description">
              CSV for import into Webscorer
            </div>
          </div>

        </div>
      </section></>
    )
  }
}

export default DrawMenu
