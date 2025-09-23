import React, { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";

import "./crewLabels.scss";
import Header from "../../organisms/Header/Header";

export default function CrewLabels() {
  const [crews, setCrews] = useState([]);

  const fetchData = async (url, params) => {
    console.log(url);
    console.log(params);
    try {
      const response = await axios.get(url, {
        params: params
      });

      const responseData = response.data.results;

      setCrews(responseData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/crews/", {
      page_size: "500",
      page: 1,
      ordering: "bib_number",
      status: "Accepted"
    });
  }, []);

  console.log(crews);

  return (
    <>
      <Header />
      <Hero title={"Crew labels"} />
      <div id="print-report">
        <div className="crew-labels__page">
          <div className="crew-labels__grid">
            {crews.length === 0 && "No accepted crews"}
            {crews.map((crew, idx) => (
              <div key={crew.id} className="crew-labels__label">
                <h1 className="crew-labels__start-order">{crew.bib_number}</h1>
                <div className="crew-labels__crew-details">
                  <span className="crew-labels__names">{crew.competitor_names}</span>
                  <span> - </span>
                  <span className="crew-labels__club">{crew.club.index_code}</span>
                  <span> - </span>
                  <span className="crew-labels__id">{crew.id}</span>
                  <span> - </span>
                  <span className="crew-labels__event">{crew.event_band}</span>
                </div>
                <p className="crew-labels__host">
                  <span>Num loc: </span>
                  {crew.number_location}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
