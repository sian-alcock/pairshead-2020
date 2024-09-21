import React, {ReactElement} from "react"
import Menu from "../Menu/Menu"
import { Link, withRouter } from "react-router-dom"
import Auth from "../../../lib/Auth"
import { menuProps } from "../../organisms/Header/defaultProps"
import { MenuProps } from "../Menu/Menu"
import MenuButton from "../../atoms/MenuButton/MenuButton"
import "./navbar.scss"

export type NavbarProps = {
  menuData: MenuProps[];
}


function Navbar (): ReactElement {
  const logout = () => {
    Auth.removeToken()
    Auth.removeUser()
    // this.props.history.push('/')
  }

  return (
    <div className="nav-bar">
      {Auth.isAuthenticated() && <div className="nav-bar__desktop">
        <MenuButton label={'Generate start order'} pathName={"/generate-start-order"} />
        <MenuButton label={'Generate results'} pathName={"/generate-results"}/>
      </div>}
      <Menu menuItems={menuProps.menuItems} />
      {Auth.isAuthenticated() && <Link className="nav-bar__login" to="/" onClick={logout}>Log out</Link>}
      {!Auth.isAuthenticated() && <Link className="nav-bar__login" to="/login">Log in</Link>}
    </div>
  )
}

export default withRouter(Navbar)