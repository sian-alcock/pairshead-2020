import React, { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import useFetchData from '../hooks/use-fetch-data'

const EventKeys = () => {
  const {
    data,
    loading
  } = useFetchData('/api/event-meeting-key-list/')

  const [currentKey, setCurrentKey] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()

    const keyToBeUpdated = data.results.find(item => item.id === Number(currentKey.currentKey))

    const formData = 		{
      'id': keyToBeUpdated.id,
      'event_meeting_key': keyToBeUpdated.event_meeting_key,
      'event_meeting_name': keyToBeUpdated.event_meeting_name,
      'current_event_meeting': true
    }

    console.log(formData)
    
    axios.put(`/api/event-meeting-key-list/${keyToBeUpdated.id}`, formData)
      .then(() => console.log('something happened ...'))
      .catch(err => console.log(err))
  }

  const handleRadio = (e) => {
    setCurrentKey({'currentKey': e.target.id})
  }

  const headings = ['Id', 'Event', 'Meeting Key', 'Select' ]
  return (
    <section className='section'>
      <div className="container">
        {loading && <div>Loading</div>}
        {!loading && (
          <form className="has-text-centered">
            <table className="table">
              <thead>
                <tr>{headings.map((heading, i) =>
                  <td key={i}>{heading}</td>)
                }
                </tr>
              </thead>
              <tfoot>
                <tr>{headings.map((heading, i) =>
                  <td key={i}>{heading}</td>)
                }
                </tr>
              </tfoot>
              <tbody>
                {data && data['results'].map(key =>
                  <tr key={key.id}>
                    <td><Link to={`/keys/${key.id}`}>{key.id}</Link></td>
                    <td>{key.event_meeting_name}</td>
                    <td>{'******' + key.event_meeting_key.slice(-5)}</td>
                    <td><label><input onClick={handleRadio} type="radio" id={key.id} name="meeting-key" defaultChecked={key.current_event_meeting}></input></label></td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="field is-grouped">
              <p className="control">
                <button className="button is-primary" onClick={handleSubmit}>Submit</button>
              </p>
              <p className="control">
                <Link
                  to={{
                    pathname: '/keys/new'
                  }}>
                  <button className="button is-primary">
                  Add new
                  </button>
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

export default EventKeys