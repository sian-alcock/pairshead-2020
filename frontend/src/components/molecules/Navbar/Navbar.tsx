import React, {ReactElement} from "react"
import Menu from "../Menu/Menu"
import { withRouter } from "react-router-dom"
// import { Link, withRouter } from "react-router-dom"
// import Auth from "../../../lib/Auth"
import { menuProps } from "../../organisms/Header/defaultProps"
import { MenuProps } from "../Menu/Menu"

export type NavbarProps = {
  menuData: MenuProps[];
}


function Navbar (
  
): ReactElement {

  
  // const logout = () => {
  //   Auth.removeToken()
  //   Auth.removeUser()
  //   // this.props.history.push('/')
  // }

  return (
    <Menu menuItems={menuProps.menuItems}/>
  )
}

export default withRouter(Navbar)