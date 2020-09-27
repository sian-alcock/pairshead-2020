import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../lib/helpers'

class DataLoader extends Component {


  constructor() {
    super()

    this.state = {
      loading: false,
      updated: ''
    }

    this.getData = this.getData.bind(this)
  }

  async getData() {
    this.cancelTokenSource = axios.CancelToken.source()
    this.setState({ loading: true })

    try {

      const retrievedData = await axios.get(this.props.url, {
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
      <div>
        <button className={`${this.props.class} button is-primary`} onClick={this.getData} disabled={loading}>

          {loading && <span className="spinner"><i
            className="fas fa-spinner fa-spin"
          />Loading ...</span>}
          {!loading && <span>{this.props.buttonText}</span>}
        </button>

        <p><small>{!this.state.updated ? '' : `Updated: ${formatTimeDate(this.state.updated)}`}</small></p>
      </div>
    )
  }
}

export default DataLoader
