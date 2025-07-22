import React, { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import useFetchData from '../../hooks/use-fetch-data'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import TextButton from '../../atoms/TextButton/TextButton'
import './eventKeys.scss'

const EventKeys = () => {
  const {
    data,
    loading
  } = useFetchData('/api/event-meeting-key-list/')

  const [currentKey, setCurrentKey] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()

    const keyToBeUpdated = data.find(item => item.id === Number(currentKey.currentKey))

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

  const getHeadings = () => {
    return headings.map((heading, i) => <td key={i}>{heading}</td>)
  }

  const headings = ['Id', 'Event', 'Meeting Key', 'Select' ]
  return (
    <>
    <Header />
    <Hero title={'Event keys'}/>
    <section className='section'>
      <div className="container">
        {loading && <div>Loading</div>}
        {!loading && (
          <form>
            <table className="table event-keys__table">
              <thead>
                <tr>{getHeadings()}
                </tr>
              </thead>
              <tfoot>
                <tr>{getHeadings()}
                </tr>
              </tfoot>
              <tbody>
                {data.map(key => <tr key={key.id}>
                  <td><Link to={`/settings/keys/${key.id}/edit`}>{key.id}</Link></td>
                  <td>{key.event_meeting_name}</td>
                  <td>{'******' + key.event_meeting_key.slice(-5)}</td>
                  <td><label><input onClick={handleRadio} type="radio" id={key.id} name="meeting-key" defaultChecked={key.current_event_meeting}></input></label></td>
                </tr>
                )}
              </tbody>
            </table>
            <div className="field is-grouped">
              <p className="control">
                <TextButton label={'Submit'} onClick={handleSubmit}/>
              </p>
              <p className="control">
                <TextButton label={'Add new'} pathName={'/settings/keys/new'}/>
              </p>
            </div>
          </form>
        )}
      </div>
    </section></>
  )
}

export default EventKeys