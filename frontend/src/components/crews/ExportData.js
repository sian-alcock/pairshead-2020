import React from 'react'


class ExportData extends React.Component {
  constructor() {
    super()
    this.state= {
      crews: []
    }

    this.exportCrewData = this.exportCrewData.bind(this)
    this.exportCompetitorData = this.exportCompetitorData.bind(this)
  }

  exportCrewData(e){
    e.preventDefault
    window.open('api/crew-data-export/')
  }

  exportCompetitorData(e){
    e.preventDefault
    window.open('api/competitor-data-export/')
  }

  render() {

    return (
      <section className="section">
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
            <div className="column is-one-quarter">
              <button className="button is-primary" onClick={this.exportCrewData}>Export crew data</button>
            </div>
            <div className="column left">
              CSV showing crewID and race time

            </div>
          </div>






        </div>
      </section>
    )
  }
}

export default ExportData
