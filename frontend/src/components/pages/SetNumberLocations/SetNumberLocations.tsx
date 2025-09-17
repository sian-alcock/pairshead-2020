import React from "react";
import Hero from "../../organisms/Hero/Hero";
import Header from "../../organisms/Header/Header";
import "./setNumberLocations.scss";
// import NumberLocationsManager from "../../organisms/NumberLocationsManager/NumberLocationsManager";
import DataExportComponent from "../../molecules/DataExportComponent/DataExportComponent";
import { CSVUploadModal } from "../../molecules/CSVUploadModal/CSVUploadModal";

export default function SetNumberLocations() {
  return (
    <>
      <Header />
      <Hero title={"Set Number locations for host clubs"} />
      <section className="set-number-location__section">
        <div className="set-number-location__container">
          {/* <NumberLocationsManager /> */}
          <div className="set-number-location__import-wrapper">
            <div className="set-number-location__button">
              <DataExportComponent url={"/api/number-location-template/"} buttonText={"Export template"} />
            </div>
            <div className="set-number-location__button">
              <CSVUploadModal url={"api/number-location-import/"} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
