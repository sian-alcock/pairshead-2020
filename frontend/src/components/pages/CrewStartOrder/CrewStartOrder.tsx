import React from "react";
import CrewStartOrderTable from "../../organisms/CrewStartOrderTable/CrewStartOrderTable";
import "./crewStartOrder.scss";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";

export default function CrewStartOrder() {
  return (
    <>
      <Header />
      <Hero title={"Crew start order"} />
      <section className="crew-start-order__section">
        <div className="crew-start-order__container">
          <div className="crew-start-order__content">
            <CrewStartOrderTable />
          </div>
        </div>
      </section>
    </>
  );
}
