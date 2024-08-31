import React from 'react'
import { Link } from 'react-router-dom'
import Auth from '../../lib/Auth'
import Header from '../organisms/Header/Header'
class DrawMenu extends React.Component {
  constructor() {
    super()
    this.state= {
      crews: []
    }
  }



  render() {

    return (
      <><Header /><section className="section">
        <div className="container">

          <div className="columns">
            <div className="column is-one-quarter has-text-centered">
              {Auth.isAuthenticated() && <Link
                to={{
                  pathname: '/crew-draw-report'
                }}>
                <button className="button is-primary">
                  Crew draw report
                </button>
              </Link>}
            </div>

          </div>
          <div className="columns">
            <div className="column is-one-quarter has-text-centered">
              <Link
                to={{
                  pathname: '/crew-on-the-day-contact'
                }}>
                <button className="button is-primary">
                  On the day crew contact list
                </button>
              </Link>
            </div>
          </div>

        </div>
      </section></>
    )
  }
}

export default DrawMenu
