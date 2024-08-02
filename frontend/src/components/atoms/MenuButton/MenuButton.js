import React from 'react'
import './menuButton.scss'

export default function Button({title, clickHandler}) {
  return (
    <button className='menu-button' onClick={clickHandler}>
      {title}
    </button>
  )
}

