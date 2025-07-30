import React, { ReactElement } from "react"
import image from "../../../assets/ph-logo.jpg"
import { Link } from "react-router-dom"
import Navbar from "../../molecules/Navbar/Navbar"
import { menuProps } from "./defaultProps"
import "./header.scss"
import Toggle from "../../atoms/Toggle/Toggle"

export default function Header ():ReactElement {

  return(
    <header className="header no-print">
      <div className="header__inner">
        <Link className="header__logo header__logo--desktop" to="/">
          <img className="logo" src={image} alt='Pairs Head of the River logo' />
        </Link>
        <Navbar {...menuProps}/>
      </div>
    </header>
  )
}