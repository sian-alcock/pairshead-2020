import React from 'react'
import './menuButton.scss'

type MenuButtonProps = {
  title: string;
  clickHandler: () => void;
}

export default function MenuButton({title, clickHandler}: MenuButtonProps) {
  return (
    <button className="menu-button" onClick={clickHandler}>
      {title}
    </button>
  )
}

