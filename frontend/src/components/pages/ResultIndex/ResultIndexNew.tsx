import React, { useState, useEffect } from "react"
import axios, { AxiosResponse } from "axios"
import Hero from "../../organisms/Hero/Hero"
import { formatTimes } from "../../../lib/helpers"
import { CrewProps } from "../../components.types"
import { tableHeadings } from "./defaultProps"
import BladeImage from "../../atoms/BladeImage/BladeImage"
import CrewTimeCalculatedFieldsUpdate from "../../molecules/UpdateCrews/UpdateCrewTimeCalculatedFields";
import PageTotals from "../../molecules/PageTotals/PageTotals";
import { pagingOptions, genderOptions } from "./defaultProps"
import TrophyImage from "../../atoms/Trophy/Trophy"
import PennantImage from "../../atoms/Pennant/Pennant"


import "./resultIndex.scss"
import Paginator from "../../molecules/Paginator/Paginator"
import Header from "../../organisms/Header/Header"

interface ResponseParamsProps {
  page_size?: string;
  page?: number;
  order?: string;
  status?: string | string[];
  masters?: boolean;
  gender?: string;
  categoryRank?: string;
  categoryRankClose?: string;
}

interface ResponseDataProps {
  count: number;
  next: number | null;
  previous: number | null;
  results: CrewProps[];
  num_scratched_crews: number;
  num_accepted_crews: number;
  requires_ranking_update: number;
  fastest_open_2x_time: {raw_time__min: number};
  fastest_female_2x_time: {raw_time__min: number};
  fastest_open_sweep_time: {raw_time__min: number};
  fastest_female_sweep_time: {raw_time__min: number};
  fastest_mixed_2x_time:{raw_time__min: number};

}

interface CategoryResponseDataProps {
  override_name: string;
}

type SelectOption = {
  label: string | undefined;
  value: string | undefined;
}

export default function ResultIndex () {
  const [results, setResults] = useState<CrewProps[]>([])
  const [totalCrews, setTotalCrews] = useState(0);
  const [pageSize, setPageSize] = useState("20")
  const [pageNumber, setPageNumber] = useState(1)
  const [refreshDataQueryString, setRefreshDataQueryString] = useState<string | null>("")
  const [searchTerm, setSearchTerm] = useState(sessionStorage.getItem("resultIndexSearch") || "")
  const [categories, setCategories] = useState<SelectOption[] | null | undefined>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [gender, setGender] = useState("all")
  const [fastestMen2x, setFastestMen2x] = useState(0)
  const [fastestFemale2x, setFastestFemale2x] = useState(0)
  const [fastestMenSweep, setFastestMenSweep] = useState(0)
  const [fastestFemaleSweep, setFastestFemaleSweep] = useState(0)
  const [fastestMixed2x, setFastestMixed2x] = useState(0)
  const [firstAndSecondCrewsBoolean, setFirstAndSecondCrewsBoolean] = useState(false)
  const [closeFirstAndSecondCrewsBoolean, setCloseFirstAndSecondCrewsBoolean] = useState(false)
  const [updateRequired, setUpdateRequired] = useState(0)

  const fetchData = async (url: string, params: ResponseParamsProps) => {
    console.log(url)
    console.log(params)
    try {
    
      const response: AxiosResponse = await axios.get(url, {
        params: params
      });
      
      const responseData: ResponseDataProps = response.data;
      console.log(responseData)
      setTotalCrews(responseData.count)
      setResults(responseData.results)
      setUpdateRequired(responseData.requires_ranking_update)
      setFastestMen2x(responseData.fastest_open_2x_time.raw_time__min)
      setFastestFemale2x(responseData.fastest_female_2x_time.raw_time__min)
      setFastestMenSweep(responseData.fastest_open_sweep_time.raw_time__min)
      setFastestFemaleSweep(responseData.fastest_female_sweep_time.raw_time__min)
      setFastestMixed2x(responseData.fastest_mixed_2x_time.raw_time__min)
    } catch (error) {
    
      console.error(error)
      
    }
  };

  useEffect(() => {
    fetchData("/api/results", {
      page_size: "20",
      gender: "all",
      page: 1,
      categoryRank: "all"
    })
    getCategories()
  },[])

  const refreshData = async (refreshDataQueryString:string | null = null) => {
    fetchData(`/api/results?${refreshDataQueryString}`, {
      page_size: pageSize,
      gender: gender,
      page: pageNumber,
      categoryRank: firstAndSecondCrewsBoolean ? 'topTwo' : 'all',
      categoryRankClose: closeFirstAndSecondCrewsBoolean ? 'topTwoClose' : 'all'
    });
  };

  useEffect(() => {
    refreshData(refreshDataQueryString);
  }, [pageNumber, pageSize, gender, selectedCategory, firstAndSecondCrewsBoolean, closeFirstAndSecondCrewsBoolean, searchTerm]);

   const getTopCrews = (event: string | undefined, crews:CrewProps[]) => {
    // returns true if the 1st and 2nd crew in a category have a time within 2 seconds
    console.log(crews.length)
    const timeDifference = 2000
    const crewsInCategory = crews.filter(crew => crew.event_band === event && !crew.time_only && crew.category_rank <= 2)
    const raceTimes = crewsInCategory.map(crew => crew.category_position_time)
    const sorted = raceTimes.slice().sort((a,b) => a - b)
    const flagForReview = Math.abs(sorted[0]-sorted[1]) <= timeDifference ? true : false
    // console.log(flagForReview)
    return flagForReview
  }

  const getCategories = async () => {
    // Populate the category (event_band) pull down with all event_bands
    try {
    
      const response: AxiosResponse = await axios.get('api/events/');
      
      const responseData: CategoryResponseDataProps[] = response.data;
      let eventBands = responseData.map(event => event.override_name)
      eventBands = Array.from(new Set(eventBands)).sort()
      const options = eventBands.map(option => {
        return {label: option, value: option}
      })
      setCategories([{label: 'All cats', value: ''}, ...options]) 

    } catch (error) {
      console.error(error)
    }
  }

  const handlePagingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(e.target.value)
    setPageNumber(1)
  }

  const handleSearchKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const term = e.target
    console.log(term)
    sessionStorage.setItem("resultIndexSearch", term instanceof HTMLInputElement ? term.value : "");
    setSearchTerm(term instanceof HTMLInputElement ? term.value : "");
    setPageNumber(1);
    if(term) {
      setRefreshDataQueryString(`search=${searchTerm}`)
    } else {
      setRefreshDataQueryString("")
    }
  };

   const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value)
    setGender("all")
    setSearchTerm("")
    setPageNumber(1)
    if(e.target.value) {
      setRefreshDataQueryString(`event_band=${e.target.value}`)
    } else {
      setRefreshDataQueryString("")
    }
  }

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGender(e.target.value)
    setPageNumber(1)
  }

  const changePage = (pageNumber: number, totalPages: number) => {
    if (pageNumber > totalPages || pageNumber < 0) return null;
    setPageNumber(pageNumber);
  };

  const handleFirstAndSecondCrews = (e: React.ChangeEvent<HTMLInputElement>) =>{
    setFirstAndSecondCrewsBoolean(e.target.checked)
  }

  const handleCloseCrews = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCloseFirstAndSecondCrewsBoolean(e.target.checked)
  }

  const totalPages = Math.floor(totalCrews / Number(pageSize));

  return (
    <>
      <Header />
      <Hero title={"Results"} />
      {(updateRequired && updateRequired > 0) ? 
        <div className="box">
          <CrewTimeCalculatedFieldsUpdate refreshData={refreshData} updateRequired={updateRequired}/>
        </div> : ''}
      <section className="section">
        <div className="container">

          <div className="columns no-print is-vtop">

            <div className="column">
              <label className="label has-text-left" htmlFor="searchResultsControl">Search</label>
              <div className="field control has-icons-left" id="searchResultsControl">
                <span className="icon is-left">
                <i className="fas fa-search"></i>
                </span>
                <input className="input" id="search" placeholder="Search" defaultValue={searchTerm} onKeyUp={handleSearchKeyUp} />
              </div>
            </div>

            <div className="column">
              <div className="field">
                <label className="label has-text-left" htmlFor="category">Select category</label>
                  <div className="select control-full-width">

                    <select className="control-full-width" onChange={handleCategoryChange}>
                      <option value=""></option>
                      {categories && categories.map((option) =>
                        <option key={option.value} value={option.value}>{option.label}</option>
                      )}
                    </select>
                  </div>
              </div>
            </div>

            <div className="column">
              <div className="field">
                <label className="label has-text-left" htmlFor="paging">Page size</label>
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
                <label className="label has-text-left" htmlFor="gender">Select gender</label>
                <div className="select control-full-width">
                  <select className="control-full-width" onChange={handleGenderChange}>
                    <option value=""></option>
                    {genderOptions.map((option) =>
                      <option key={option.value} value={option.value}>{option.label}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="column has-text-left">
              <div className="field">
                <label className="checkbox" >
                  <input type="checkbox"  className="checkbox" value="" onChange={handleFirstAndSecondCrews} />
                  <small>Crews in 1st and 2nd place</small>
                </label>
              </div>

              <div className="field">
                <label className="checkbox" >
                  <input type="checkbox"  className="checkbox" value="highlightCloseCrews" onChange={handleCloseCrews}/>
                  <small>Highlight 1st/2nd crews within 2s&nbsp;❓</small>
                </label>
              </div>
            </div>

          </div>

        <Paginator pageNumber={pageNumber} totalPages={totalPages} changePage={changePage} />

        <PageTotals
          totalCount={totalCrews}
          entities='crews'
          pageSize={pageSize}
          pageNumber={pageNumber}  
          />
          <div className="result-index__table-container">
            <table className="result-index__table table">
              <thead>
                <tr>
                  {tableHeadings.map(heading =>
                    <td key={heading.name} colSpan={heading.colSpan}>{heading.name}</td>
                  )}
                </tr>
              </thead>
              <tfoot className="no-print">
                <tr>
                  {tableHeadings.map(heading =>
                    <td key={heading.name} colSpan={heading.colSpan}>{heading.name}</td>
                  )}
                </tr>
              </tfoot>
              <tbody>
                {results.map((crew) =>
                  <tr key={crew.id}>
                    <td>{!gender || gender === "all" ? crew.overall_rank : crew.gender_rank}</td>
                    <td>{crew.bib_number}</td>
                    <td>{formatTimes(crew.published_time)}</td>
                    <td>{!crew.masters_adjusted_time ? "" : formatTimes(crew.masters_adjusted_time)}</td>
                    <td><BladeImage crew={crew} /></td>
                    <td>{crew.club.name}</td>
                    <td>{!crew.competitor_names ? crew.name : crew.competitor_names }</td>
                    <td>{crew.composite_code}</td>
                    <td>{crew.event_band}</td>
                    <td>{!crew.category_rank ? "" : crew.category_rank} </td>
                    <td>{crew.category_rank === 1 ? <PennantImage />  : ""} </td>
                    <td>{crew.overall_rank === 1 || crew.published_time === fastestFemale2x || crew.published_time === fastestFemaleSweep || crew.published_time === fastestMixed2x ? <TrophyImage />  : ""} </td>
                    <td>{getTopCrews(crew.event_band, results) && closeFirstAndSecondCrewsBoolean ? '❓' : ''}</td>
                    <td>{crew.penalty ? "P" : ""}</td>
                    <td>{crew.time_only ? "TO" : ""}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Paginator pageNumber={pageNumber} totalPages={totalPages} changePage={changePage} />
        </div>
      </section>
    </>
  )
}