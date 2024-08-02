import React from 'react'
import './hero.scss'

export default function Hero ({title}) {
  return (
    <section className='page-hero'>
      <h1>{title}</h1>
    </section>
  )
}