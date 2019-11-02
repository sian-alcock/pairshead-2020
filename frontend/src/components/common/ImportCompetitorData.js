import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../lib/helpers'

class CompetitorLoader extends Component {
  constructor() {
    super()

    this.state = {
      loading: false,
      competitorDataUpdated: ''
    }

    this.getData = this.getData.bind(this)

  }

  async getData() {
    this.cancelTokenSource = axios.CancelToken.source()
    this.setState({ loading: true })

    try {

      const competitors = await axios.get('/api/competitor-data-import', {
        cancelToken: this.cancelTokenSource.token
      })
      console.log(competitors.data)

      this.setState({ competitorDataUpdated: Date.now(), loading: false })

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
        <button className="button is-primary" onClick={this.getData} disabled={loading}>

          {loading && <span className="spinner"><i
            className="fas fa-spinner fa-spin"
          /> Loading ...</span>}
          {!loading && <span>Get Competitor data</span>}

        </button>
        <p><small>{!this.state.competitorDataUpdated ? '' : `Updated: ${formatTimeDate(this.state.competitorDataUpdated)}`}</small></p>
      </div>
    )
  }
}

export default CompetitorLoader
