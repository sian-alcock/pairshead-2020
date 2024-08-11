import React, { ReactElement } from 'react'
import './hero.scss'

interface HeroProps {
  title: string;
}

export default function Hero ({title}: HeroProps):ReactElement {
  return (
    <section className="page-hero">
      <div className="page-hero__container">
        <h1>{title}</h1>
      </div>
    </section>
  )
}