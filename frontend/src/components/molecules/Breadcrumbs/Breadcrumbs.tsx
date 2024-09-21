import { ReactNode } from 'react'
import { useLocation, Link } from "react-router-dom";
import Auth from '../../../lib/Auth';
import './breadcrumbs.scss'

export default function Breadcrumbs () {
  const location = useLocation()

  console.log(location)

  let currentLink = ''

  const createLabelFromLink = (link: string): ReactNode => {
    return link.split('-').join(' ').charAt(0).toUpperCase() + link.slice(1)
  }

  const crumbs = location.pathname.split('/')
    .filter(crumb => crumb !== '')
    .map((crumb, idx) => {
      currentLink += `/${crumb}`

      return (
        <>
          <span className="breadcrumbs__divider">{">"}</span>
          <Link className="breadcrumbs__crumb" key={idx} to={currentLink}>{createLabelFromLink(crumb)}</Link>
        </>
      )
    })

  return (
    <div className="breadcrumbs">
      <div className="breadcrumbs__container">
        {Auth.isAuthenticated() && <Link to="/summary">Home</Link>}
        {!Auth.isAuthenticated() && <Link to="/">Home</Link>}
        {crumbs}
      </div>
    </div>
  )
}