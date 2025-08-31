import React from "react";
import Hero from "../../organisms/Hero/Hero";
import Header from "../../organisms/Header/Header";
import "./setNumberLocations.scss";
import NumberLocationsManager from "../../organisms/NumberLocationsManager/NumberLocationsManager";

export default function SetNumberLocations() {
  const exportNumberLocationTemplate = (e: { preventDefault: any }) => {
    e.preventDefault;
    window.open("api/number-location-template/");
  };
  return (
    <>
      <Header />
      <Hero title={"Set Number locations for host clubs"} />
      <section className="set-number-location__section">
        <div className="set-number-location__container">
          <NumberLocationsManager />
        </div>
      </section>
    </>
  );
}
