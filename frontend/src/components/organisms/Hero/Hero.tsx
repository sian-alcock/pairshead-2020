import React, { ReactElement } from 'react'
import { Link } from 'react-router-dom';
import EventKeyHeader from '../../atoms/EventKeyHeader/EventKeyHeader';
import Breadcrumbs from '../../molecules/Breadcrumbs/Breadcrumbs';
import Icon from '../../atoms/Icons/Icons';
import './hero.scss'
import RaceInfo from '../../pages/RaceInfo/RaceInfo';

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
      </section>
      <div className="page-hero__container">
        <div className="page-hero__bar">
          <Breadcrumbs />
          <details className="masters-calculation__details">
            <summary className="masters-calculation__summary">Race info
              <i className="masters-calculation__icon">
                <Icon icon={"chevron-down"}  />
              </i>
            </summary>
            Show stuff here ...
          </details>
        </div>
      </div>
    </>
  )
}