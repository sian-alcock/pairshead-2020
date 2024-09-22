import React, { ReactElement } from 'react'
import './hero.scss'
import EventKeyHeader from '../../atoms/EventKeyHeader/EventKeyHeader';
import Breadcrumbs from '../../molecules/Breadcrumbs/Breadcrumbs';

interface HeroProps {
  title: string;
}

export default function Hero ({title}: HeroProps):ReactElement {
  return (
    <>
      <section className="page-hero no-print">
        <div className="page-hero__container">
          <h1>{title}</h1>
          <div className="page-hero__side">
            <EventKeyHeader />
          </div>
        </div>
      </section><Breadcrumbs />
    </>
  )
}