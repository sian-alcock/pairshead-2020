import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../../lib/helpers'
import TextButton from '../../atoms/TextButton/TextButton'
import './csvdataloader.scss'
import { title } from 'process'

class CSVDataLoader extends Component {

  constructor() {
    super()

    this.state = {
      loading: false,
      updated: '',
    }

    this.handleSubmitData = this.handleSubmitData.bind(this)
    this.handleFile = this.handleFile.bind(this)
  }

  handleFile (e) {
    e.preventDefault()

    const fileToUpload = e.target.files[0]
    const fileName = fileToUpload.name
    this.setState({
      fileToUpload: fileToUpload,
      fileName: fileToUpload.name
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

      <section className={`csv-data-loader__section ${this.props.lines ? 'csv-data-loader__section--lines' : ''}`}>
        <div className="csv-data-loader__text-wrapper">
          <h2 className="csv-data-loader__title">{this.props.title}</h2>
          <p className="csv-data-loader__description">{this.props.description}</p>
        </div>

        <form className="csv-data-loader" onSubmit={this.handleSubmitData}>
          <div className="csv-data-loader__file-container file has-name is-right">
            <label className="file-label">
              <input
                className="csv-data-loader__file-input file-input"
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
              <span className="csv-data-loader__file-name file-name">
              {this.state.fileToUpload && this.state.fileName ? this.state.fileName : 'Select the csv file to import ...'}
              </span>
            </label>
          </div>
          <TextButton isSubmit={true} disabled={this.state.fileToUpload ? false : true} label={this.props.buttonText} loading={loading}/>
          <p><small>{!this.state.updated ? '' : `Updated: ${formatTimeDate(this.state.updated)}`}</small></p>
        </form>

      </section>

    )
  }
}

export default CSVDataLoader
