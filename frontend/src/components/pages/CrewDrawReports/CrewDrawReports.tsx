import React, { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import { headings } from "./defaultProps"
import { CrewProps } from "../../components.types";

import "./crewDrawReports.scss"
import Header from "../../organisms/Header/Header";

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

  console.log(crews);

  return (
    <>
      <Header />
      <Hero title={"Crew draw reports"} />
      <section className="section">
        <div className="container">
          <div className="crew-draw-reports__table-container">
            <table className="crew-draw-reports__table table">
              <thead>
                <tr>
                  {headings.map((heading) => (
                    <td key={heading}>{heading}</td>
                  ))}
                </tr>
              </thead>
              <tfoot>
                <tr>
                  {headings.map((heading) => (
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
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
