import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../lib/helpers'

class CSVDataLoader extends Component {


  constructor() {
    super()

    this.state = {
      loading: false,
      updated: ''
    }

    this.handleSubmitData = this.handleSubmitData.bind(this)
    this.handleFile = this.handleFile.bind(this)
  }

  handleFile (e) {
    e.preventDefault()

    const fileToUpload = e.target.files[0]
    this.setState({
      fileToUpload: fileToUpload
    })
  }

  async handleSubmitData(e) {
    e.preventDefault()
    this.cancelTokenSource = axios.CancelToken.source()
    this.setState({ loading: true })

    const formData = new FormData()
    formData.append('file', this.state.fileToUpload)

    try {

      const retrievedData = await axios.post(this.props.url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        cancelToken: this.cancelTokenSource.token
      })
      console.log(retrievedData.data)

      this.setState({ updated: Date.now(), loading: false })

    } catch (err) {
      if (axios.isCancel(err)) {
        // ignore
      } else {
        // propegate
        throw err
      }
    } finally {
      this.cancelTokenSource = null
    }
  }
  componentWillUnmount() {
    this.cancelTokenSource && this.cancelTokenSource.cancel()
  }

  render() {
    const { loading } = this.state

    return (
      <form onSubmit={this.handleSubmitData}>
        <div className="file has-name is-right">
          <label className="file-label">
            <input
              className="file-input"
              type="file"
              name="file"
              multiple={false}
              accept=".xls,.xlsx,.csv,.txt"
              onChange={this.handleFile}
            />
            <span className="file-cta">
              <span className="file-icon">
                <i className="fas fa-upload"></i>
              </span>
              <span className="file-label">
                Choose a file…
              </span>
            </span>
            <span className="file-name">
            Select the csv file to import ...
            </span>
          </label>
        </div>

        <button className={`${this.props.class} button is-primary`}>
          {loading && <span className="spinner"><i
            className="fas fa-spinner fa-spin"
          />Loading ...</span>
          }
          {!loading && <span>{this.props.buttonText}</span>}
        </button>
        <p><small>{!this.state.updated ? '' : `Updated: ${formatTimeDate(this.state.updated)}`}</small></p>
      </form>

    )
  }
}

export default CSVDataLoader
