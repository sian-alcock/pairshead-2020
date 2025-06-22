import React, { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import { Link } from "react-router-dom";
import { formatTimes } from "../../../lib/helpers";
import BladeImage from "../../atoms/BladeImage/BladeImage";
import { pagingOptions, sortingOptions } from "./defaultProps"
import { CrewProps, RaceProps } from "../../components.types";
import Paginator from "../../molecules/Paginator/Paginator";
import PageTotals from "../../molecules/PageTotals/PageTotals";
import CrewTimeCalculatedFieldsUpdate from "../../molecules/UpdateCrews/UpdateCrewTimeCalculatedFields";

import "./crewIndex.scss"
import Header from "../../organisms/Header/Header";
import TextButton from "../../atoms/TextButton/TextButton";

interface ResponseParamsProps {
  page_size?: string;
  page?: number;
  order?: string;
  status?: string | string[];
  masters?: boolean;
}

interface ResponseDataProps {
  count: number;
  requires_ranking_update: number;
  next: number | null;
  previous: number | null;
  results: CrewProps[];
  num_scratched_crews: number;
  num_accepted_crews: number;
  num_accepted_crews_no_start_time: number;
  num_accepted_crews_no_finish_time: number;
  fastest_open_2x_time: {raw_time__min: number};
  fastest_female_2x_time: {raw_time__min: number};
  fastest_open_sweep_time: {raw_time__min: number};
  fastest_female_sweep_time: {raw_time__min: number};
  fastest_mixed_2x_time:{raw_time__min: number};
  num_crews_masters_adjusted: boolean;
  num_crews_require_masters_adjusted: boolean;
}

interface RaceResponseDataProps {
  results: RaceProps[];
}

export default function CrewTimeCompare() {
  const [crews, setCrews] = useState<CrewProps[]>([]);
  const [races, setRaces] = useState<RaceProps[]>([]);
  const [totalCrews, setTotalCrews] = useState(0);
  const [pageSize, setPageSize] = useState("20");
  const [pageNumber, setPageNumber] = useState(1);
  const [scratchedCrews, setScratchedCrews] = useState(0);
  const [crewsWithTooManyTimesBoolean, setCrewsWithTooManyTimesBoolean] = useState(false)
  const [crewsWithoutFinishTimeBoolean, setCrewsWithoutFinishTimeBoolean] = useState(false)
  const [crewsWithoutStartTimeBoolean, setCrewsWithoutStartTimeBoolean] = useState(false)
  const [refreshDataQueryString, setRefreshDataQueryString] = useState<string | null>("")
  const [acceptedCrewsNoStart, setAcceptedCrewsNoStart] = useState(0)
  const [acceptedCrewsNoFinish, setAcceptedCrewsNoFinish] = useState(0)
  const [mastersAdjustmentsBoolean, setMastersAdjustmentsBoolean] = useState(false)
  const [updateRequired, setUpdateRequired] = useState(0)

  // const [loading, setLoading] = useState(false)
  const [sortTerm, setSortTerm] = useState("bib_number");
  const [searchTerm, setSearchTerm] = useState(sessionStorage.getItem("crewIndexSearch") || "");
  const [scratchedCrewsBoolean, setScratchedCrewsBoolean] = useState(sessionStorage.getItem("showScratchedCrews") === "true" || false)
  // const [handleMastersAdjustments, setHandleMastersAdjustments] = useState(false)

  const fetchData = async (url: string, params: ResponseParamsProps) => {
    console.log(url);
    console.log(params);
    try {
      const response: AxiosResponse = await axios.get(url, {
        params: params
      });

      const responseData: ResponseDataProps = response.data;

      setCrews(responseData.results);
      setTotalCrews(responseData.count);
      setScratchedCrews(responseData.num_scratched_crews);
      setAcceptedCrewsNoStart(responseData.num_accepted_crews_no_start_time)
      setAcceptedCrewsNoFinish(responseData.num_accepted_crews_no_finish_time)
      setUpdateRequired(responseData.requires_ranking_update)

    } catch (error) {
      console.error(error);
    }
  };

  const fetchRaceData = async (url: string) => {
    console.log(url);
    try {
      const response: AxiosResponse = await axios.get(url);

      const responseData: RaceResponseDataProps = response.data;

      setRaces(responseData.results);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/crews", {
      page_size: "20",
      page: 1,
      order: "bib_number",
      status: "Accepted"
    });
    fetchRaceData("/api/race-list");
  }, []);

  const refreshData = async (refreshDataQueryString:string | null = null) => {
    fetchData(`/api/crews?${refreshDataQueryString}`, {
      page_size: pageSize,
      page: pageNumber,
      order: sortTerm,
      status: scratchedCrewsBoolean ? "Accepted" : ["Accepted", "Scratched"],
      masters: mastersAdjustmentsBoolean
    });
  };

  useEffect(() => {
    refreshData(refreshDataQueryString);
  }, [pageNumber, searchTerm, pageSize, scratchedCrewsBoolean, crewsWithTooManyTimesBoolean, crewsWithoutFinishTimeBoolean, crewsWithoutStartTimeBoolean, sortTerm, mastersAdjustmentsBoolean]);

  const changePage = (pageNumber: number, totalPages: number) => {
    if (pageNumber > totalPages || pageNumber < 0) return null;
    setPageNumber(pageNumber);
  };

  const handleSearchKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const term = e.target
    console.log(term)
    sessionStorage.setItem("crewIndexSearch", term instanceof HTMLInputElement ? term.value : "");
    setSearchTerm(term instanceof HTMLInputElement ? term.value : "");
    setPageNumber(1);
    if(term) {
      setRefreshDataQueryString(`search=${searchTerm}`)
    } else {
      setRefreshDataQueryString("")
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortTerm(e.target.value)
  }

  const handlePagingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(e.target.value)
    setPageNumber(1)
  }

  const handleCrewsWithoutStartTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCrewsWithoutStartTimeBoolean(e.target.checked)
    setCrewsWithoutFinishTimeBoolean(false)
    setCrewsWithTooManyTimesBoolean(false)
    setSearchTerm("")
    setPageNumber(1)
    if(e.target.checked) {
      setRefreshDataQueryString("status=Accepted&start_time=0")
    } else {
      setRefreshDataQueryString("")
    }
  }

  const handleCrewsWithoutFinishTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCrewsWithoutFinishTimeBoolean(e.target.checked)
    setCrewsWithoutStartTimeBoolean(false)
    setCrewsWithTooManyTimesBoolean(false)
    setSearchTerm("")
    setPageNumber(1)
    if(e.target.checked) {
      setRefreshDataQueryString("status=Accepted&finish_time=0")
    } else {
      setRefreshDataQueryString("")
    }
  }

  const handleScratchedCrews = (e: React.ChangeEvent<HTMLInputElement>) => {
    sessionStorage.setItem("showScratchedCrews", e.target.checked ? "true" : "false")
    setScratchedCrewsBoolean(e.target.checked)
  }

  console.log(crews);
  console.log(races);

  const defaultStart = races.filter((race) => race.default_start)[0]?.race_id
  const defaultFinish = races.filter((race) => race.default_finish)[0]?.race_id
  const otherStart = races.filter((race) => !race.default_start)[0]?.race_id
  const otherFinish = races.filter((race) => !race.default_finish)[0]?.race_id

  console.log(typeof defaultStart)

  const headingsTimeCompare = [
  "Id",
  "Crew",
  "Status",
  "Bib",
  "Club",
  "Category",
  `Start (default race) - ${defaultStart}`,
  `Finish (default race) - ${defaultFinish}`,
  `Start (other) - ${otherStart}`,
  `Finish (other) - ${otherFinish}`,
];

  const totalPages = Math.floor(totalCrews / Number(pageSize));

  return (
    <>
      <Header />
      <Hero title={"All crews"} />
      {(updateRequired && updateRequired > 0) ? 
        <div className="box">
          <CrewTimeCalculatedFieldsUpdate refreshData={refreshData} updateRequired={updateRequired}/>
        </div> : ''}
      <section className="section">
        <div className="container">
          <div className="columns is-vtop">
            <div className="column">
              <div className="field">
                <label className="label has-text-left" htmlFor="searchControl">
                  Search
                </label>
                <div className="control has-icons-left" id="searchControl">
                  <span className="icon is-left">
                    <i className="fas fa-search"></i>
                  </span>
                  <input className="input" placeholder="search" defaultValue={searchTerm} onKeyUp={handleSearchKeyUp} />
                </div>
              </div>
            </div>

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

            <div className="column">
              <div className="field">
                <label className="label has-text-left" htmlFor="selectSort">
                  Sort by
                </label>
                <div className="select control-full-width" id="selectSort">
                  <select className="control-full-width" onChange={handleSortChange}>
                    <option value=""></option>
                    {sortingOptions.map((option) =>
                      <option key={option.value} value={option.value}>{option.label}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="column has-text-left">
              <div className="field">
                <label className="checkbox" htmlFor="crewsWithoutStartTime">
                  <input type="checkbox"  className="checkbox" id="crewsWithoutStartTime" onChange={handleCrewsWithoutStartTime} checked={!!crewsWithoutStartTimeBoolean} />
                  <small>⚠️ Accepted crews without start time ({acceptedCrewsNoStart})</small>
                </label>
              </div>

              <div className="field">
                <label className="checkbox" htmlFor="crewsWithoutFinishTime" >
                  <input type="checkbox"  className="checkbox" id="crewsWithoutFinishTime"  onChange={handleCrewsWithoutFinishTime} checked={!!crewsWithoutFinishTimeBoolean} />
                  <small>⚠️ Accepted crews without finish time ({acceptedCrewsNoFinish})</small>
                </label>
              </div>
            </div>

            <div className="column">
              <div className="field">
                <label className="checkbox" htmlFor="showScratchedCrews" >
                  <input type="checkbox"  className="checkbox" id="showScratchedCrews" checked={!!scratchedCrewsBoolean} onChange={handleScratchedCrews} />
                  <small>Hide scratched crews {scratchedCrews ? `(${scratchedCrews})` : ""}</small>
                </label>
              </div>
            </div>
            <div className="crew-index__buttons column">
              <TextButton label={"Race times"} pathName="/generate-results/race-times" />
              <TextButton label={"Add race offset"} pathName="/settings/race-info" />
            </div>
          </div>

          <Paginator pageNumber={pageNumber} totalPages={totalPages} changePage={changePage} />
          <PageTotals
            totalCount={totalCrews}
            entities='crews'
            pageSize={pageSize}
            pageNumber={pageNumber}  
          />
          <div className="crew-index__table-container">
            <table className="crew-index__table table">
              <thead>
                <tr>
                  {headingsTimeCompare.map((heading) => (
                    <td key={heading}>{heading}</td>
                  ))}
                </tr>
              </thead>
              <tfoot>
                <tr>
                  {headingsTimeCompare.map((heading) => (
                    <td key={heading}>{heading}</td>
                  ))}
                </tr>
              </tfoot>
              <tbody>
                {crews &&
                crews.map((crew) => (
                  <tr key={crew.id}>
                    <td>
                      <Link to={`/generate-results/crews/${crew.id}/edit`}>{crew.id}</Link>
                    </td>
                    <td>
                      {!crew.competitor_names
                        ? crew.name
                        : crew.times.length && crew.times.length > 2
                          ? crew.competitor_names + "❗️"
                          : crew.competitor_names}
                    </td>
                    <td>{crew.status}</td>
                    <td>{!crew.bib_number ? "" : crew.bib_number}</td>
                    <td>{crew.club.index_code}</td>
                    <td>{crew.event_band}</td>
                    <td>{formatTimes(crew.times.filter((time) => time.race.race_id === defaultStart)[0]?.time_tap)}</td>
                    <td>{formatTimes(crew.times.filter((time) => time.race.race_id === defaultFinish)[0]?.time_tap)}</td>
                    <td>{formatTimes(crew.times.filter((time) => time.race.race_id !== defaultStart)[0]?.time_tap)}</td>
                    <td>{formatTimes(crew.times.filter((time) => time.race.race_id !== defaultFinish)[0]?.time_tap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator pageNumber={pageNumber} totalPages={totalPages} changePage={changePage} />
        </div>
      </section>
    </>
  );
}
