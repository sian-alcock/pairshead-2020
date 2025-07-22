import React, { ReactElement, useEffect, useState } from 'react'
import axios, {AxiosResponse} from 'axios'
import EventKeyHeader from '../../atoms/EventKeyHeader/EventKeyHeader';
import Breadcrumbs from '../../molecules/Breadcrumbs/Breadcrumbs';
import Icon from '../../atoms/Icons/Icons';
import { RaceInfoProps } from '../../components.types';
import './hero.scss'
import { formatTimeDate } from '../../../lib/helpers';


interface HeroProps {
  title: string;
}

export default function Hero ({title}: HeroProps):ReactElement {

  const [settings, setSettings] = useState<RaceInfoProps[]>([]);

  const fetchData = async (url: string) => {
    try {
      const response: AxiosResponse = await axios.get(url);

      const responseData: RaceInfoProps[] = response.data;

      setSettings(responseData);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/global-settings-list/");
  }, []);

  console.log(settings[0]?.broe_data_last_update)
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
            <div className="masters-calculation__content">
              {settings[0] && <p>BROE data last refresh: {formatTimeDate(settings[0].broe_data_last_update)}</p>}
            </div>
          </details>
        </div>
      </div>
    </>
  )
}