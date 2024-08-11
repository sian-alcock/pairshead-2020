import React, {ReactElement, useState, useRef} from "react"
import MenuButton from "../../atoms/MenuButton/MenuButton"
import "./menu.scss"
import { Link } from "react-router-dom";
import Auth from "../../../lib/Auth";
import useOnClickOutside from "../../hooks/useOnClickOutside";

interface ChildMenuItem {
  link: string;
  title: string;
  authenticated: boolean;
}

interface MenuItem  {
  parentItem: string;
  key: number | undefined;
  items: ChildMenuItem[];
}

export type MenuProps = {
  menuItems: MenuItem[];
}

export default function Menu({menuItems}: MenuProps): ReactElement {
  const [expandedSubMenu, setExpandedSubMenu] = useState<number | undefined>()
  const [mobileNavOpen, setmobileNavOpen] = useState(false)
  const noClickOutsideRef = useRef<HTMLInputElement>(null);

  const toggleMenu = (key: number | undefined): void => {
    if(key === expandedSubMenu) {
      setExpandedSubMenu(undefined)
    } else {
      setExpandedSubMenu(key)
    }
  }

  const closeMenu = ()=> setExpandedSubMenu(undefined)
  

  const toggleNavbar = () => {
    setmobileNavOpen(!mobileNavOpen)
  }

  useOnClickOutside(noClickOutsideRef, () => closeMenu());


  // Not sure how to make this work... what is it even doing?
  //   componentDidUpdate(prevProps) {
  //     if(prevProps.location.pathname !== this.props.location.pathname) {
  //       this.setState({ navbarOpen: false })
  //     }
  //   }

  return (
    <nav className='menu' ref={noClickOutsideRef}>
      <div className="navbar-brand">
        <a
          role="button"
          className={`navbar-burger ${mobileNavOpen ? "is-active" : ""}`}
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
            <ul>{item.items.map((item, idx) => <li key={idx}>
              {item.authenticated ? Auth.isAuthenticated() && <Link to={item.link} className="">{item.title}</Link> : <Link to={item.link} className="">{item.title}</Link>}
            </li>)}</ul>
          </li>
          )}
        </ul>}
      </div>
      <ul className='menu__container menu__container--desktop'>
        {menuItems.map((item) => <li className='menu__item' key={item.key}>
          <MenuButton title={item.parentItem} isActive={expandedSubMenu === item.key} clickHandler={() => toggleMenu(item.key)} />
          <ul className={`menu__child ${expandedSubMenu === item.key ? "menu__child--show" : "menu__child--hide"}`}>{item.items.map((item, idx) => <li key={idx}>{item.authenticated ? Auth.isAuthenticated() && <Link to={item.link} className="">{item.title}</Link> : <Link to={item.link} className="">{item.title}</Link>}</li>)}</ul>
        </li>
        )}
      </ul>
    </nav>
  )
}