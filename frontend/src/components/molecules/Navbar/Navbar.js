import React from 'react'
import Menu from '../../organisms/Menu/Menu.js'
import { Link, withRouter } from 'react-router-dom'
import Auth from '../../../lib/Auth.js'
import './navbar.scss'

function Navbar () {

  const logout = () => {
    Auth.removeToken()
    Auth.removeUser()
    // this.props.history.push('/')
  }

  const menuItems = [
    {
      key: 0,
      parentItem: 'Start order',
      items: [
        {
          title: Auth.isAuthenticated() && <Link to="/generate-start-order" className="">Generate start order</Link>
        }
      ]
    },
    {
      parentItem: 'Results',
      key: 1,
      items: [
        {
          title: Auth.isAuthenticated() && <Link to="/crews" className="navbar-item">All crews</Link>
        },
        {
          title: Auth.isAuthenticated() && <Link to="/race-times" className="navbar-item">Race times</Link>
        },
        {
          title: Auth.isAuthenticated() && <Link to="/results" className="navbar-item">Results</Link>
        },
        {
          title: Auth.isAuthenticated() && <Link to="/import" className="navbar-item">Import data</Link>
        },
        {
          title: Auth.isAuthenticated() && <Link to="/export" className="navbar-item">Export data</Link>
        }
      ]
    },
    {
      parentItem: 'Settings',
      key: 2,
      items: [
        {
          title: Auth.isAuthenticated() && <Link to="/keys" className="navbar-item">Add / change event key</Link>
        },
        {
          title: Auth.isAuthenticated() && <Link to="/register" className="navbar-item">Register user</Link>
        },
        {
          title: !Auth.isAuthenticated() && <Link to="/login" className="navbar-item">Log in</Link>
        },
        {
          title: Auth.isAuthenticated() && <a className="navbar-item" onClick={logout}>Log out</a>
        },
        {
          title: Auth.isAuthenticated() && <Link to="/info" className="navbar-item">Info</Link>
        }
      ]
    }
  ]
  return (
    <Menu menuItems={menuItems}/>
  )
}

export default withRouter(Navbar)