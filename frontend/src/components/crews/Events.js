import React from 'react'
import axios from 'axios'

class Events extends React.Component {
  constructor() {
    super()
    this.state = {
      events: []
    }

  }

  componentDidMount() {
    axios.get('/api/events', {
      params: {

      }
    })
      .then(res => console.log(res.data))
  }

  render() {

    return (
      <section className="section">
        <div className="container">
          This is the events page
        </div>
      </section>)
  }
}
export default Events