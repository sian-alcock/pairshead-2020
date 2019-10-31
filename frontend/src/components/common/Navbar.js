import React from 'react'
import { Link, withRouter } from 'react-router-dom'

import Auth from '../../lib/Auth'


class Navbar extends React.Component {

  constructor() {
    super()

    this.state = {
      navbarOpen: false
    }
    this.logout = this.logout.bind(this)
    this.toggleNavbar = this.toggleNavbar.bind(this)
  }

  logout() {
    Auth.removeToken()
    Auth.removeUser()
    this.props.history.push('/')
  }

  toggleNavbar() {
    this.setState({ navbarOpen: !this.state.navbarOpen })
  }

  componentDidUpdate(prevProps) {
    if(prevProps.location.pathname !== this.props.location.pathname) {
      this.setState({ navbarOpen: false })
    }
  }

  render() {
    return (
      <div className="container">
        <nav className="navbar">
          <div className="container">
            <div className="navbar-brand">
              <a
                role="button"
                className={`navbar-burger ${this.state.navbarOpen ? 'is-active' : ''}`}
                onClick={this.toggleNavbar}
              >
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
              </a>
            </div>
            <div className={`navbar-menu ${this.state.navbarOpen ? 'is-active' : ''}`}>
              <div className="navbar-start">
                <Link to="/" className="navbar-item">Home</Link>
                <Link to="/crews" className="navbar-item">All crews</Link>
                <Link to="/race-times" className="navbar-item">Race times</Link>
                <Link to="/results" className="navbar-item">Results</Link>
                <Link to="/import" className="navbar-item">Import data</Link>
                <Link to="/export" className="navbar-item">Export data</Link>
              </div>
              <div className="navbar-end">
                <Link to="/crew-draw-report" className="navbar-item">Draw</Link>
                <Link to="/info" className="navbar-item">Info</Link>
                {!Auth.isAuthenticated() && <Link to="/register" className="navbar-item">Register</Link>}
                {!Auth.isAuthenticated() && <Link to="/login" className="navbar-item">Log in</Link>}
                {Auth.isAuthenticated() && <a className="navbar-item" onClick={this.logout}>Log out</a>}
              </div>
            </div>
          </div>
        </nav>
      </div>
    )
  }
}

export default withRouter(Navbar)
