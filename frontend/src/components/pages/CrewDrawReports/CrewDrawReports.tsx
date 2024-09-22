import React, { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import { marshallHeadings, timingHeadings } from "./defaultProps"
import { CrewProps } from "../../components.types";

import "./crewDrawReports.scss"
import Header from "../../organisms/Header/Header";
import { Link } from "react-router-dom";
import BladeImage from "../../atoms/BladeImage/BladeImage";

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
}

export default function CrewDrawReports() {
  const [crews, setCrews] = useState<CrewProps[]>([]);
  const [view, setView] = useState("timing")
  const [totalCrews, setTotalCrews] = useState(0);

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
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/crews", {
      page_size: "500",
      page: 1,
      order: "bib_number",
      status: "Accepted"
    });
  }, []);

  const showMarshallsView = () => {
    setView("marshall")
  }

  const showTimingTeamView = () => {
    setView("timing")
  } 

  console.log(crews);

  return (
    <>
      <Header />
      <Hero title={"Crew draw reports"} />
      <section className="crew-draw-reports__section">
        <div className="crew-draw-reports__container">
          <div className="crew-draw-reports__tabs-wrapper no-print">
            <ul className="crew-draw-reports__tabs">
              <li onClick={showMarshallsView}>
                <a className={`crew-draw-reports__tab ${view !== 'marshall' ? '' : 'active'}`}>Marshalls view</a>
                </li>
              <li onClick={showTimingTeamView}>
                <a className={`crew-draw-reports__tab ${view !== 'timing' ? '' : 'active'}`}>Timing teams view</a>
              </li>
            </ul>
          </div>
          {view === "marshall" ? <h2 className="crew-draw-reports__title">Start order - Marshalls view</h2> : <h2 className="crew-draw-reports__title">Start order - Timing team view</h2>}
          <div className="crew-draw-reports__table-container">
            {view === "marshall" ?
            <table className="crew-draw-reports__table table">
              <thead>
                <tr>
                  {marshallHeadings.map((heading) => (
                    <td key={heading}>{heading}</td>
                  ))}
                </tr>
              </thead>
              <tfoot>
                <tr>
                  {marshallHeadings.map((heading) => (
                    <td key={heading}>{heading}</td>
                  ))}
                </tr>
              </tfoot>
              <tbody>
                {crews &&
                crews.map((crew) => (
                  <tr key={crew.id}>
                    <td>{!crew.bib_number ? "" : crew.bib_number}</td>
                    <td>{crew.marshalling_division}</td>
                    <td>{crew.event_band}</td>
                    <td>{crew.club.name}</td>
                    <td>{crew.composite_code}</td>
                  </tr>
                ))}
              </tbody>
            </table> : 
            <table className="crew-draw-reports__table table">
              <thead>
                <tr>
                  {timingHeadings.map((heading) => (
                    <td key={heading}>{heading}</td>
                  ))}
                </tr>
              </thead>
              <tfoot>
                <tr>
                  {timingHeadings.map((heading) => (
                    <td key={heading}>{heading}</td>
                  ))}
                </tr>
              </tfoot>
              <tbody>
                {crews &&
                crews.map((crew) => (
                  <tr key={crew.id}>
                    <td><Link to={`/crews/${crew.id}`}>{crew.id}</Link></td>
                    <td>{!crew.competitor_names ? crew.name : crew.competitor_names}</td>
                    <td>{crew.status}</td>
                    <td>
                      <BladeImage crew={crew} />
                    </td>
                    <td>{!crew.bib_number ? '' : crew.bib_number}</td>
                    <td>{crew.club.index_code}</td>
                    <td>{crew.event_band}</td>
                  </tr>
                ))}
              </tbody>
            </table>}
          </div>
        </div>
      </section>
    </>
  );
}
