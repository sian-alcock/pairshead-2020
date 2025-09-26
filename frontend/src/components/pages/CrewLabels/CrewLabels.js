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
      status: ["Accepted", "Scratched"]
    });
  }, []);

  console.log(crews);
  // Only include crews with a bib number
  const filteredCrews = crews.filter((crew) => crew.bib_number);

  return (
    <>
      <Header />
      <Hero title={"Crew labels"} />
      <div id="print-report">
        <div className="crew-labels__container no-print">
          <p className="crew-labels__guidance">Includes accepted and scratched crews that have a bib number in BROE.</p>
          <p className="crew-labels__guidance">
            Use Avery labels 7173, set paper size to A4 and set top and bottom margins set to 6mm or the labels will not
            fit. Recommend saving to pdf first to check the fit.
          </p>
        </div>

        <section className="crew-labels__section">
          <div className="crew-labels__container">
            <div className="crew-labels__grid">
              {filteredCrews.length === 0 && "No crews found"}
              {filteredCrews.map((crew, idx) => (
                <div key={crew.id} className={`crew-labels__label crew-labels__label--${crew.status.toLowerCase()}`}>
                  <h1 className="crew-labels__start-order">
                    {crew.bib_number} {crew.status === "Scratched" && <span> (scratched)</span>}
                  </h1>

                  <div className="crew-labels__crew-details">
                    <span className="crew-labels__names">{crew.competitor_names ?? crew.name}</span>
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
        </section>
      </div>
    </>
  );
}
