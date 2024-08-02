import React, { useState} from 'react'
import Button from '../../atoms/MenuButton/MenuButton'
import './menu.scss'

export default function Menu({menuItems}) {
  const [expandedSubMenu, setExpandedSubMenu] = useState()
  const [mobileNavOpen, setmobileNavOpen] = useState(false)

  const toggleMenu = (key) => {
    if(key === expandedSubMenu) {
      setExpandedSubMenu(undefined)
    } else {
      setExpandedSubMenu(key)
    }
  }

  const toggleNavbar = () => {
    setmobileNavOpen(!mobileNavOpen)
  }


  // Not sure how to make this work... what is it even doing?
  //   componentDidUpdate(prevProps) {
  //     if(prevProps.location.pathname !== this.props.location.pathname) {
  //       this.setState({ navbarOpen: false })
  //     }
  //   }

  return (
    <nav className='menu'>
      <div className="navbar-brandxx">
        <a
          role="button"
          className={`navbar-burgerxx ${mobileNavOpen ? 'is-active' : ''}`}
          onClick={toggleNavbar}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
        {mobileNavOpen && <ul
          className='menu__container menu__container--mobile'>
          {menuItems.map((item) => <li className='menu__item' key={item.key}>
            <h2>{item.parentItem}</h2>
            <ul>{item.items.map((child, idx) => <li key={idx}>{child.title}</li>)}</ul>
          </li>
          )}
        </ul>}
      </div>
      <ul className='menu__container menu__container--desktop'>
        {menuItems.map((item) => <li className='menu__item' key={item.key}>
          <Button title={item.parentItem} clickHandler={() => toggleMenu(item.key)} />
          <ul className={`menu__child ${expandedSubMenu === item.key ? 'menu__child--show' : 'menu__child--hide'}`}>{item.items.map((child, idx) => <li key={idx}>{child.title}</li>)}</ul>
        </li>
        )}
      </ul>
    </nav>
  )
}