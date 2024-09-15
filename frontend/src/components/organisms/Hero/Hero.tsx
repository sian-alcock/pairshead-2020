import React, { ReactElement } from 'react'
import './hero.scss'
import EventKeyHeader from '../../atoms/EventKeyHeader/EventKeyHeader';

interface HeroProps {
  title: string;
}

export default function Hero ({title}: HeroProps):ReactElement {
  return (
    <section className="page-hero">
      <div className="page-hero__container">
        <h1>{title}</h1>
        <div className="page-hero__side">
          <EventKeyHeader />
        </div>
      </div>
    </section>
  )
}