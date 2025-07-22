import React, { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import { Link } from "react-router-dom";
import { formatTimes } from "../../../lib/helpers";
import { headings, pagingOptions, sortingOptions } from "./defaultProps"
import { TimeProps } from "../../components.types";
import Paginator from "../../molecules/Paginator/Paginator";
import PageTotals from "../../molecules/PageTotals/PageTotals";

import "./raceTime.scss"
import Header from "../../organisms/Header/Header";
import RaceTimesManager from "../../organisms/RaceTimesManager/RaceTimesManager";

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
  const [totalTimes, setTotalTimes] = useState(0);
  const [pageSize, setPageSize] = useState("20");
  const [pageNumber, setPageNumber] = useState(1);
  const [crewsWithTooManyFinishTimesBoolean, setCrewsWithTooManyFinishTimesBoolean] = useState(sessionStorage.getItem('finishTimesInvalid') === 'true' ? true : false)
  const [crewsWithTooManyStartTimesBoolean, setCrewsWithTooManyStartTimesBoolean] = useState(sessionStorage.getItem('startTimesInvalid') === 'true' ? true : false)
  const [startTimesWithoutCrewBoolean, setStartTimesWithoutCrewBoolean] = useState(sessionStorage.getItem('startTimesWithNoCrew') === 'true' ? true : false)
  const [finishTimesWithoutCrewBoolean, setFinishTimesWithoutCrewBoolean] = useState(sessionStorage.getItem('finishTimesWithNoCrew') === 'true' ? true : false)
  const [startTimesWithNoCrew, setStartTimesWithNoCrew] = useState(0)
  const [finishTimesWithNoCrew, setFinishTimesWithNoCrew] = useState(0)
  const [startTimesInvalid, setStartTimesInvalid] = useState(0)
  const [finishTimesInvalid, setFinishTimesInvalid] = useState(0)
  const [searchTerm, setSearchTerm] = useState(sessionStorage.getItem('raceTimeSearch') || '')
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
      // setStartTimesWithNoCrew(responseData.start_times_no_crew)
      // setFinishTimesWithNoCrew(responseData.finish_times_no_crew)

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
        page_size: "20",
        page: 1,
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
      page_size: pageSize,
      page: pageNumber,
      tap: !sessionStorage.getItem('tapTimes') ? 'Start' : sessionStorage.getItem('tapTimes'),
      noCrew: view === 'Start' ? noCrewStart : noCrewFinish,
      crewInvalidTimes: view === 'Start' ? crewInvalidStart : crewInvalidFinish,
    });
  };

  useEffect(() => {
    refreshData(refreshDataQueryString);
  }, [pageNumber, searchTerm, pageSize, crewsWithTooManyStartTimesBoolean, crewsWithTooManyFinishTimesBoolean, startTimesWithoutCrewBoolean, finishTimesWithoutCrewBoolean, view, refreshDataQueryString]);

  const changePage = (pageNumber: number, totalPages: number) => {
    if (pageNumber > totalPages || pageNumber < 0) return null;
    setPageNumber(pageNumber);
  };

  // const handleSearchKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   sessionStorage.setItem("raceTimeSearch", e.target instanceof HTMLInputElement ? e.target.value : "");
  //   setSearchTerm(e.target instanceof HTMLInputElement ? e.target.value : "");
  //   setPageNumber(1);
  //   setRefreshDataQueryString(`search=${searchTerm}`)
  // };

  const handlePagingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(e.target.value)
    setPageNumber(1)
  }

  const handleTimesWithoutCrew = (e: React.ChangeEvent<HTMLInputElement>) => {
    view === 'Start' ? sessionStorage.setItem('startTimesWithNoCrew', e.target.checked.toString()) : sessionStorage.setItem('finishTimesWithNoCrew', e.target.checked.toString())
    view === 'Start' ? sessionStorage.setItem('startTimesInvalid', "false") : sessionStorage.setItem('finishTimesInvalid', "false")
    view === 'Start' ? setStartTimesWithoutCrewBoolean(e.target.checked) : setFinishTimesWithoutCrewBoolean(e.target.checked)
    view === 'Start' ? setCrewsWithTooManyStartTimesBoolean(false) : setCrewsWithTooManyFinishTimesBoolean(false)
    setPageNumber(1)
  }

  const handleCrewsWithTooManyTimes = (e: React.ChangeEvent<HTMLInputElement>) => {
    view === 'Start' ? sessionStorage.setItem('startTimesInvalid', e.target.checked.toString()) : sessionStorage.setItem('finishTimesInvalid', e.target.checked.toString())
    view === 'Start' ? sessionStorage.setItem('startTimesWithNoCrew', 'false') : sessionStorage.setItem('finishTimesWithNoCrew', 'false')
    view === 'Start' ? setCrewsWithTooManyStartTimesBoolean(e.target.checked) : setCrewsWithTooManyFinishTimesBoolean(e.target.checked)
    view === 'Start' ? setStartTimesWithoutCrewBoolean(false) : setFinishTimesWithoutCrewBoolean(false)
    setPageNumber(1)
  }

  const displayView = (view: string) => {
    sessionStorage.setItem('tapTimes', view)
    setView(view)
  }

  const totalPages = Math.floor(totalTimes / Number(pageSize));

  return (
    <>
    <Header />
    <Hero title={"Race times"} />
    <section className="race-times__section">
      <div className="race-times__container">
        <RaceTimesManager title={"Race time manager goes here..."} />
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

        <div className="columns is-vcentered">

          {/* <div className="column">
            <label className="label has-text-left" htmlFor="raceTimeSearch">Search</label>

            <div className="search field control control-full-width has-icons-left no-print">
              <span className="icon is-left">
                <i className="fas fa-search"></i>
              </span>
              <input id="raceTimeSearch" className="input control-full-width" placeholder="search" defaultValue={searchTerm} onKeyUp={handleSearchKeyUp} />
            </div>
          </div> */}

          <div className="column">
            <div className="field">
              <label className="label has-text-left" htmlFor="paging">
                Select page size
              </label>
              <div className="select control-full-width">
                <select className="control-full-width" onChange={handlePagingChange}>
                  <option value=""></option>
                  {pagingOptions.map((option) =>
                    <option key={option.value} value={option.value}>{option.label}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="column has-text-left">
            <div className="field no-print">
              {view === 'Start' && <label className="checkbox">
                <input type="checkbox" className="checkbox" onChange={handleTimesWithoutCrew} value={startTimesWithoutCrewBoolean.toString()} defaultChecked={!!startTimesWithoutCrewBoolean} />
                ⚠️ Start times with no crew ({startTimesWithNoCrew})
              </label>}

              {view === 'Finish' && <label className="checkbox">
                <input type="checkbox" className="checkbox" onChange={handleTimesWithoutCrew} value={finishTimesWithoutCrewBoolean.toString()} defaultChecked={!!finishTimesWithoutCrewBoolean} />
                ⚠️ Finish times with no crew ({finishTimesWithNoCrew})
              </label>}
            </div>

            <div className="field no-print">
              {view === 'Start' && <label className="checkbox">
                <input type="checkbox" className="checkbox" onChange={handleCrewsWithTooManyTimes} value={crewsWithTooManyStartTimesBoolean.toString()} defaultChecked={!!crewsWithTooManyStartTimesBoolean} />
                ❗️ Crews with too many start times ({startTimesInvalid})
              </label>}
              {view === 'Finish' && <label className="checkbox">
                <input type="checkbox" className="checkbox" onChange={handleCrewsWithTooManyTimes} value={crewsWithTooManyFinishTimesBoolean.toString()} defaultChecked={!!crewsWithTooManyFinishTimesBoolean} />
                ❗️ Crews with too many finish times ({finishTimesInvalid})
              </label>}
            </div>
          </div>

        </div>


        <div className="no-print">
          <Paginator
            pageNumber={pageNumber}
            totalPages={totalPages}
            changePage={changePage} />
        </div>
        <PageTotals
          totalCount={totalTimes}
          entities='times'
          pageSize={pageSize}
          pageNumber={pageNumber} />
        <div className="race-times__table-container">
          <table className="race-times__table table">
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
        <div className="no-print">
          <Paginator
            pageNumber={pageNumber}
            totalPages={totalPages}
            changePage={changePage} />
        </div>

      </div>

    </section></>

  );
}
