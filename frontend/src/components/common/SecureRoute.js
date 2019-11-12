import React from 'react'
import { Route, Redirect } from 'react-router-dom'

import Auth from '../../lib/Auth'

const SecureRoute = (props) => {
  // if logged in, return a Route with the same props as SecureRoute
  if(Auth.isAuthenticated()) return <Route {...props} />
  // otherwise redirect to login
  return <Redirect to="/login" />
}

export default SecureRoute
