import React from "react"
import { Link } from 'react-router-dom'
import "./menuButton.scss"

type MenuButtonProps = {
  label: string;
  pathName?: string;
}

export default function MenuButton({label, pathName}: MenuButtonProps) {
  return (
    <Link
      className="menu-button"
      to={{
        pathname: pathName
      }}>
      {label}
    </Link>
  )
}


