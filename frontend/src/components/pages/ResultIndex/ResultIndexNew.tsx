import React, { useState, useEffect } from "react"
import axios, { AxiosResponse } from "axios"
import Hero from "../../organisms/Hero/Hero"
import { formatTimes } from "../../../lib/helpers"
import { CrewProps } from "../../components.types"
import { tableHeadings } from "./defaultProps"
import BladeImage from "../../atoms/BladeImage/BladeImage"
import "./resultIndex.scss"

interface ResponseParamsProps {
  page_size?: string;
  page?: number;
  order?: string;
  status?: string | string[];
  masters?: boolean;
  gender?: string;
  categoryRank?: string;
}

interface ResponseDataProps {
  count: number;
  next: number | null;
  previous: number | null;
  results: CrewProps[];
  num_scratched_crews: number;
  num_accepted_crews: number;
}

export default function ResultIndex () {
  const [results, setResults] = useState<CrewProps[]>([])
  // const [pageSize, setPageSize] = useState("20")
  // const [pageNumber, setPageNumber] = useState(1)
  // const [searchTerm, setSearchTerm] = useState(sessionStorage.getItem("resultIndexSearch") || "")
  // const [crewsInCategory, setCrewsInCategory] = useState([])
  const [gender] = useState("all")
  // const [firstAndSecondCrewsBoolean, setFirstAndSecondCrewsBoolean] = useState(false)
  // const [closeFirstAndSecondCrewsBoolean, setCloseFirstAndSecondCrewsBoolean] = useState(false)

  const fetchData = async (url: string, params: ResponseParamsProps) => {
    console.log(url)
    console.log(params)
    try {
    
      const response: AxiosResponse = await axios.get(url, {
        params: params
      });
      
      const responseData: ResponseDataProps = response.data;
      console.log(responseData)
      setResults(responseData.results)
    
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
  },[])

  return (
    <>
      <Hero title={"New Results page"} />
      <section className="section">
        <div className="container">
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
                    {/* <td>{crew.category_rank === 1 ? <Img src="https://www.bblrc.co.uk/wp-content/uploads/2023/10/pennant_PH-2.jpg" width="20px" />  : ""} </td> */}
                    {/* <td>{crew.overall_rank === 1 || crew.published_time === fastestFemale2x || crew.published_time === fastestFemaleSweep || crew.published_time === fastestMixed2x ? <Img src="https://www.bblrc.co.uk/wp-content/uploads/2023/10/trophy_PH-2.jpg" width="20px" />  : ""} </td> */}
                    {/* <td>{this.getTopCrews(crew.event_band, this.state.crews) && this.state.closeFirstAndSecondCrewsBoolean ? '❓' : ''}</td> */}
                    <td>{crew.penalty ? "P" : ""}</td>
                    <td>{crew.time_only ? "TO" : ""}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}