import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useHistory } from 'react-router'
import axios from 'axios'
import useFetchData from '../../hooks/use-fetch-data'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import TextButton from '../../atoms/TextButton/TextButton'

const EventKeyEdit = () => {
  const routeParams = useParams()
  const history = useHistory()

  const {
    data,
    loading
  } = useFetchData(`/api/event-meeting-key-list/${routeParams.id}`)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setFormData({...data})
  }, [!loading])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value})
    setErrors({ ...errors, [e.target.name]: ''})
  }

  const handleCheckbox = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked})
  }

  const handleDelete = (e) => {
    e.preventDefault()
    axios.delete(`/api/event-meeting-key-list/${routeParams.id}`)
      .then(()=> history.push('/settings/keys'))
      .catch(err => console.log(err))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    console.log(formData)
    
    axios.put(`/api/event-meeting-key-list/${routeParams.id}`, formData)
      .then(()=> history.push('/settings/keys'))
      .catch(err => setErrors(err.response.data))

  }
  return (
    <>
    <Header />
    <Hero title={'Modify event key'} />
    <section className='section'>
      <div className="container">
        {loading && <div>Loading</div>}
        {!loading && (
          <form onSubmit={handleSubmit} className="has-text-centered">

            <div className="field">
              <label className="label" htmlFor="eventKeyName">Event name</label>
              <input
                className="input"
                name="event_meeting_name"
                id="eventKeyName"
                defaultValue={formData.event_meeting_name}
                onChange={handleChange} />
            </div>

            <div className="field">
              <label className="label" htmlFor="eventKey">Event / Meeting Key</label>
              <input
                className="input"
                name="event_meeting_key"
                id="eventKey"
                defaultValue={formData.event_meeting_key || ''}
                onChange={handleChange} />
            </div>

            <div className="field">
              <label className="checkbox" htmlFor="current_event_meeting">
                <input
                  className="checkbox"
                  type="checkbox"
                  name="current_event_meeting"
                  value={formData.current_event_meeting}
                  checked={!!formData.current_event_meeting}
                  onChange={handleCheckbox} /> Set to current meeting
              </label>

            </div>

            <div className="field">
              <TextButton label={"Submit"} isSubmit={true}/>
            </div>
            <div className="field">
              <TextButton label={"Delete key"} onClick={handleDelete} type="cancel"/>
            </div>
          </form>
        )}
      </div>
    </section></>
  )
}

export default EventKeyEdit