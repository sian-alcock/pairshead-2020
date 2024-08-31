import React from 'react'
import Auth from '../../../lib/Auth'
import { Link } from 'react-router-dom'
import useFetchData from '../../hooks/use-fetch-data'

const EventKeyHeader = () => {
  const {
    data,
    loading
  } = useFetchData('/api/event-meeting-key-list/')

  console.log(data['results'])

  return (
    <>
      {loading && <div>Loading</div>}
      {data && data['results']?.filter((key) => key.current_event_meeting).event_meeting_name}
      {Auth.isAuthenticated() && <Link to="/keys">Change event</Link>}
    </>
  )
}

export default EventKeyHeader

