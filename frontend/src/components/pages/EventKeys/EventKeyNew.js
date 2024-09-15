import React, { useState } from 'react'
import { useHistory } from 'react-router'
import axios from 'axios'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import TextButton from '../../atoms/TextButton/TextButton'

const EventKeyNew = () => {
  const history = useHistory()
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value})
    setErrors({ ...errors, [e.target.name]: ''})
  }

  const handleCheckbox = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked})
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const data = 	{
      ...formData, 'current_event_meeting': formData['current_event_meeting'] ? formData['current_event_meeting'] : false
    }

    axios.post('/api/event-meeting-key-list/', data)
      .then(()=> history.push('/keys'))
      .catch(err => setErrors(err.response.data))
  }

  return (
    <>
    <Header />
    <Hero title={'Modify event key'} />
    <section className='section'>
      <div className="container">
        <form onSubmit={handleSubmit}>

          <div className="field">
            <label className="label" htmlFor="eventKeyName">Event name</label>
            <input
              className="input"
              name="event_meeting_name"
              id="eventKeyName"
              placeholder="eg: MEETING2024"
              value={formData.event_meeting_name || ''}
              onChange={handleChange}
            />
          </div>
          {errors.event_meeting_name && <small className="help is-danger">{errors.event_meeting_name}</small>}


          <div className="field">
            <label className="label" htmlFor="eventKey">Event / Meeting Key</label>
            <input
              className="input"
              name="event_meeting_key"
              id="eventKey"
              placeholder="eg: 5"
              value={formData.event_meeting_key || ''}
              onChange={handleChange}
            />
          </div>
          {errors.event_meeting_key && <small className="help is-danger">{errors.event_meeting_key}</small>}


          <div className="field">
            <label className="checkbox" htmlFor="current_event_meeting">
              <input
                className="checkbox"
                type="checkbox"
                name="current_event_meeting"
                onChange={handleCheckbox}
              /> Set to current meeting
            </label>

          </div>

          <div className="field">
            <TextButton label={'Submit'} isSubmit={true} />
          </div>
        </form>

      </div>
    </section>
    </>
  )
}

export default EventKeyNew