import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; // Add this import
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import { lightweightHeadings, marshallHeadings, timingHeadings } from "./defaultProps";
import { CrewProps } from "../../../types/components.types";

import "./crewDrawReports.scss";
import Header from "../../organisms/Header/Header";
import BladeImage from "../../atoms/BladeImage/BladeImage";

interface LocationState {
  view?: string;
}

interface ResponseParamsProps {
  page_size?: string;
  page?: number;
  ordering?: string;
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
  const location = useLocation<LocationState>(); // Add this hook with type
  const [crews, setCrews] = useState<CrewProps[]>([]);

  // Check for view from route state first, then sessionStorage, then default to "marshall"
  const initialView = location.state?.view || sessionStorage.getItem("view") || "marshall";
  const [view, setView] = useState(initialView);

  const fetchData = async (url: string, params: ResponseParamsProps) => {
    try {
      const response: AxiosResponse = await axios.get(url, {
        params: params
      });

      const responseData: CrewProps[] = response.data.results;

      setCrews(responseData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/crews", {
      page_size: "500",
      page: 1,
      ordering: "bib_number",
      status: ["Accepted", "Scratched"]
    });
  }, []);

  // Update view when location state changes
  useEffect(() => {
    if (location.state?.view) {
      setView(location.state.view);
      // Optional: also update sessionStorage to persist the selection
      sessionStorage.setItem("view", location.state.view);
    }
  }, [location.state]);

  const changeView = (view: string) => {
    sessionStorage.setItem("view", view);
    setView(view);
  };

  console.log(crews);

  return (
    <>
      <Header />
      <Hero title={"Crew draw reports"} />
      <section className="crew-draw-reports__section">
        <div className="crew-draw-reports__container">
          <div className="crew-draw-reports__tabs-wrapper no-print">
            <ul className="crew-draw-reports__tabs">
              <li className={`crew-draw-reports__tab ${view !== "timing" ? "" : "crew-draw-reports__tab--active"}`}>
                <button className="crew-draw-reports__tab-button" onClick={() => changeView("timing")}>
                  <span className="crew-draw-reports__tab-label">Timing view</span>
                </button>
              </li>
              <li className={`crew-draw-reports__tab ${view !== "marshall" ? "" : "crew-draw-reports__tab--active"}`}>
                <button className="crew-draw-reports__tab-button" onClick={() => changeView("marshall")}>
                  <span className="crew-draw-reports__tab-label">Marshal view</span>
                </button>
              </li>
              <li
                className={`crew-draw-reports__tab ${view !== "lightweight" ? "" : "crew-draw-reports__tab--active"}`}
              >
                <button className="crew-draw-reports__tab-button" onClick={() => changeView("lightweight")}>
                  <span className="crew-draw-reports__tab-label">Lightweight view</span>
                </button>
              </li>
            </ul>
          </div>
          {view === "marshall" && <h2 className="crew-draw-reports__title">Start order - Marshal view</h2>}
          {view === "timing" && <h2 className="crew-draw-reports__title">Start order - Timing team view</h2>}
          {view === "lightweight" && (
            <div className="crew-draw-reports__report-intro">
              <h2 className="crew-draw-reports__title">Lightweight weigh in - checklist</h2>
              <h3 className="crew-draw-reports__subtitle">Instructions</h3>
              <ol className="crew-draw-reports__list">
                <li>
                  <p>Check correct crew with British rowing ID or other photo Id</p>
                </li>
                <li>
                  <p>
                    Update Weigh in column: Yes = on or under weight; No = Did not make weight; NS = Did not turn up
                  </p>
                </li>
                <li>
                  <p>When complete, please take photo and send to Sarah Powell</p>
                </li>
              </ol>
              <p className="crew-draw-reports__subtitle">Open lightweight - 75kg</p>
              <p className="crew-draw-reports__subtitle">Womens lightweight - 61.5kg</p>
            </div>
          )}
          <div className="crew-draw-reports__table-container">
            {view === "marshall" && (
              <table className="crew-draw-reports__table crew-draw-reports__table--marshall table">
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
                  {crews.length === 0 && (
                    <tr>
                      <td>No accepted crews found or bib numbers not yet added</td>
                    </tr>
                  )}
                  {crews &&
                    crews.map((crew) => (
                      <tr className={`crew-draw-reports__row-${crew.status.toLowerCase()}`} key={crew.id}>
                        <td>{!crew.bib_number ? "⚠️" : crew.bib_number}</td>
                        <td>{crew.status}</td>
                        <td>{crew.marshalling_division ?? "⚠️"}</td>
                        <td>{crew.event_band}</td>
                        <td>{crew.club.name}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
            {view === "timing" && (
              <table className="crew-draw-reports__table crew-draw-reports__table--timing table">
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
                  {crews.length === 0 && (
                    <tr>
                      <td>No accepted crews found or bib numbers not yet added</td>
                    </tr>
                  )}
                  {crews &&
                    crews.map((crew) => (
                      <tr className={`crew-draw-reports__row-${crew.status.toLowerCase()}`} key={crew.id}>
                        <td>{!crew.bib_number ? "⚠️" : crew.bib_number}</td>
                        <td>{!crew.competitor_names ? crew.name : crew.competitor_names}</td>
                        <td>{crew.status}</td>
                        <td>
                          <BladeImage crew={crew} />
                        </td>
                        <td>{crew.club.index_code}</td>
                        <td>{crew.event_band}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
            {view === "lightweight" && (
              <table className="crew-draw-reports__table crew-draw-reports__table--lightweight table">
                <thead>
                  <tr>
                    {lightweightHeadings.map((heading) => (
                      <td key={heading}>{heading}</td>
                    ))}
                  </tr>
                </thead>
                <tfoot>
                  <tr>
                    {lightweightHeadings.map((heading) => (
                      <td key={heading}>{heading}</td>
                    ))}
                  </tr>
                </tfoot>
                <tbody>
                  {crews.length === 0 && (
                    <tr>
                      <td>No accepted crews found</td>
                    </tr>
                  )}
                  {crews &&
                    crews
                      .filter((crew) => crew.event_band?.includes("Lwt"))
                      .map((crew) => (
                        <tr className={`crew-draw-reports__row-${crew.status.toLowerCase()}`} key={crew.id}>
                          <td>{!crew.bib_number ? "⚠️" : crew.bib_number}</td>
                          <td>{crew.status}</td>
                          <td>{crew.club.name}</td>
                          <td>{!crew.competitor_names ? crew.name : crew.competitor_names}</td>
                          <td>{crew.event_band}</td>
                          <td></td>
                        </tr>
                      ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
