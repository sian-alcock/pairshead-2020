import React, { Component } from 'react'
import axios from 'axios'
import { formatTimeDate } from '../../lib/helpers'
import TextButton from '../atoms/TextButton/TextButton'

class DataLoader extends Component {


  constructor() {
    super()

    this.state = {
      loading: false,
      updated: ''
    }

    this.getData = this.getData.bind(this)
    this.close = this.close.bind(this)
  }

  async getData() {
    this.cancelTokenSource = axios.CancelToken.source()
    this.setState({ loading: true })

    try {

      const retrievedData = await axios.get(this.props.url, {
        cancelToken: this.cancelTokenSource.token
      })
      console.log(retrievedData.data)

      this.setState({ loading: false, updated: Date.now() })

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

  close () {
    this.setState({ loading: false });
    document.body.classList.remove('lock-scroll');
  };

  render() {
    const { loading } = this.state

    return (
      <div>
        
        <TextButton label={this.props.buttonText} onClick={this.getData} disabled={loading} loading={loading}/>
        <p><small>{!this.state.updated ? '' : `Updated: ${formatTimeDate(this.state.updated)}`}</small></p>
      </div>
    )
  }
}

export default DataLoader
