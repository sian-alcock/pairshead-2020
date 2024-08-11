import React from "react"
import "./menuButton.scss"

type MenuButtonProps = {
  title: string;
  clickHandler: () => void;
  isActive: boolean;
}

export default function MenuButton({title, clickHandler, isActive}: MenuButtonProps) {
  return (
    <button className={`menu-button ${isActive ? "menu-button--active" : ""}`} onClick={clickHandler}>
      {title}
    </button>
  )
}

