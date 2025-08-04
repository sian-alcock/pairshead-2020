import React, { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import { Link } from "react-router-dom";
import { formatTimes } from "../../../lib/helpers";
import { headings } from "./defaultProps"
import { TimeProps } from "../../components.types";

import "./raceTime.scss"
import Header from "../../organisms/Header/Header";

interface ResponseParamsProps {
  page_size?: string;
  page?: number;
  order?: string;
  status?: string | string[];
  tap: string | null;
  noCrew: boolean;
  crewInvalidTimes: boolean;
}

interface ResponseDataProps {
  count: number;
  requires_ranking_update: number;
  next: number | null;
  previous: number | null;
  results: TimeProps[];
  start_times_no_crew: number;
  finish_times_no_crew: number;
}

export default function RaceTimeIndex() {
  const [raceTimes, setRaceTimes] = useState<TimeProps[]>([]);
  const [refreshDataQueryString, setRefreshDataQueryString] = useState('')
  const [view, setView] = useState(sessionStorage.getItem('tapTimes') ? sessionStorage.getItem('tapTimes') : 'Start')

  const fetchData = async (url: string, params: ResponseParamsProps) => {
    try {
      const response: AxiosResponse = await axios.get(url, {
        params: params
      });

      const responseData: TimeProps[] = response.data;

      setRaceTimes(responseData);
      // setTotalTimes(responseData.count);

      console.log(responseData)

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {

    const noCrewStart = sessionStorage.getItem('startTimesWithNoCrew') === 'true' ? true : false
    const noCrewFinish = sessionStorage.getItem('finishTimesWithNoCrew') === 'true' ? true : false
    const crewInvalidStart = sessionStorage.getItem('startTimesInvalid') === 'true' ? true : false
    const crewInvalidFinish = sessionStorage.getItem('finishTimesInvalid') === 'true' ? true : false

    fetchData("/api/race-times", {
        tap: !sessionStorage.getItem('tapTimes') ? 'Start' : sessionStorage.getItem('tapTimes'),
        noCrew: view === 'Start' ? noCrewStart : noCrewFinish,
        crewInvalidTimes: view === 'Start' ? crewInvalidStart : crewInvalidFinish,
    });
  }, []);

  const refreshData = async (refreshDataQueryString:string | null = null) => {
    const noCrewStart = sessionStorage.getItem('startTimesWithNoCrew') === 'true' ? true : false
    const noCrewFinish = sessionStorage.getItem('finishTimesWithNoCrew') === 'true' ? true : false
    const crewInvalidStart = sessionStorage.getItem('startTimesInvalid') === 'true' ? true : false
    const crewInvalidFinish = sessionStorage.getItem('finishTimesInvalid') === 'true' ? true : false

    fetchData(`/api/race-times?${refreshDataQueryString}`, {
      tap: !sessionStorage.getItem('tapTimes') ? 'Start' : sessionStorage.getItem('tapTimes'),
      noCrew: view === 'Start' ? noCrewStart : noCrewFinish,
      crewInvalidTimes: view === 'Start' ? crewInvalidStart : crewInvalidFinish,
    });
  };

  useEffect(() => {
    refreshData(refreshDataQueryString);
  }, [view, refreshDataQueryString]);


  const displayView = (view: string) => {
    sessionStorage.setItem('tapTimes', view)
    setView(view)
  }

  return (
    <>
    <Header />
    <Hero title={"Race times"} />
    <section className="race-times__section">
      <div className="race-times__container">
        <div className="race-times__tabs-wrapper no-print">
            <ul className="race-times__tabs">
              <li onClick={() => displayView('Start')}>
                <a className={`race-times__tab ${view === 'Start'  ? 'active' : ''}`}>Start times</a>
                </li>
              <li onClick={() => displayView('Finish')}>
                <a className={`race-times__tab ${view === 'Finish' ? 'active' : ''}`}>Finish times</a>
                </li>
            </ul>
        </div>


        <div className="race-times__table-container">
          <table className="race-times__table">
            <thead>
              <tr>
                {headings.map((heading, idx) => <th key={idx}>{heading}</th> )}
              </tr>
            </thead>
            <tfoot>
              <tr>
                {headings.map((heading, idx) => <th key={idx}>{heading}</th> )}
              </tr>
            </tfoot>
            <tbody>
              {raceTimes && raceTimes.map(raceTime => <tr key={raceTime.id}>
                <td><Link to={`/generate-results/race-times/${raceTime.id}/edit`}>{raceTime.sequence}</Link></td>
                <td>{raceTime.tap}</td>
                <td>{formatTimes(raceTime.time_tap)}</td>
                <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.bib_number}</td>
                <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.id}</td>
                <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.times && raceTime.crew.times.length > 2 ? raceTime.crew.name + '❗️' : raceTime.crew.name}</td>
                <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.competitor_names}</td>
                <td>{raceTime.crew === null ? '⚠️' : raceTime.crew.event_band}</td>
                <td>{raceTime.race.id}</td>

              </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </section></>

  );
}
