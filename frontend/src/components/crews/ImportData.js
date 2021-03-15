import React from 'react'
import BROELoader from '../common/ImportBROEData'
import DataLoader from '../common/DataLoader'
import axios from 'axios'

class ImportData extends React.Component {
  constructor() {
    super()

    this.handleFile = this.handleFile.bind(this)
    this.handleSubmitData = this.handleSubmitData.bind(this)
  }

  handleFile (e) {
    e.preventDefault()

    const fileToUpload = e.target.files[0]
    this.setState({
      fileToUpload: fileToUpload
    })
  }

  handleSubmitData (e) {
    e.preventDefault()

    const formData = new FormData()
    formData.append('file', this.state.fileToUpload)

    axios
      .put('/api/masters-adjustments-import-front-end/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then((response) => {
        console.log(response)
        console.log(response.data)
      })
      .catch((error) => {
        console.log(error.response)
      })
  }


  render() {

    return (
      <section className="section">
        <div className="container">

          <div className="columns">
            <div className="column is-one-quarter">
              <BROELoader/>
            </div>
            <div className="column left">
              Fetch the club, event and crew data from British Rowing.  Note:  Data is deleted before importing.
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
              Import race time data from Web Scorer CSV file (NB: CSV must be saved in the project folder ..results / csv).
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
              Imports data from a CSV file containing the masters adjustments that needs to be saved in the project folder ..results / csv.  Note:  Data is deleted before importing.
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
              Imports data from a CSV file created manually after entries have closed and BEFORE the events are changed that needs to be saved in the project folder ..results / csv.  Note:  Data is deleted before importing.
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
              Initiates a calculation (or re-calculation) of rankings and masters adjustments.
            </div>
          </div>

          {/* <div className="columns">
            <div className="column is-one-quarter">
              <form onSubmit={this.handleSubmitData}>
                <input
                  type="file"
                  name="file"
                  multiple={true}
                  accept=".xls,.xlsx,.csv,.txt"
                  onChange={this.handleFile}
                />
                <button className="button is-primary">Submit</button>
              </form>
            </div>
            <div className="column left">
              Import downloaded race times from application.
            </div>
          </div> */}
        </div>
      </section>
    )
  }
}

export default ImportData
