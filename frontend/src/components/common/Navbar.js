import React from 'react'
import { Link, withRouter } from 'react-router-dom'

// import Auth from '../../lib/Auth'
import image from '../../assets/ph-logo.jpg'

class Navbar extends React.Component {

  constructor() {
    super()

    this.state = {
      navbarOpen: false
    }
    // this.logout = this.logout.bind(this)
    this.toggleNavbar = this.toggleNavbar.bind(this)
  }

  // logout() {
  //   Auth.removeToken()
  //   Auth.removeUser()
  //   this.props.history.push('/')
  // }

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
      <nav className="navbar">
        <div className="container">
          <div className="navbar-brand">
            <Link to="/" className="navbar-item">
            </Link>
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
              <Link to="/" className="navbar-item">
                <img src={image} alt="Pairs Head Results" /></Link>
              <Link to="/crews" className="navbar-item">All crews</Link>
              <Link to="/race-times" className="navbar-item">Race times</Link>
              <Link to="/results" className="navbar-item">Results</Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }
}

export default withRouter(Navbar)
