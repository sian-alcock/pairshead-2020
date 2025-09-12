import React from "react";
import { useCrews } from "../../../hooks/useCrews";
import CrewStartOrderTable from "../../organisms/CrewStartOrderTable/CrewStartOrderTable";
import "./crewStartOrder.scss";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";

export default function CrewStartOrder() {
  const { data: crews, isLoading, error, refetch } = useCrews();

  const handleDataChanged = () => {
    refetch();
  };

  return (
    <>
      <Header />
      <Hero title={"Crew start order"} />
      <section className="crew-start-order__section">
        <div className="crew-start-order__container">
          <div className="crew-start-order__content">
            <CrewStartOrderTable onDataChanged={handleDataChanged} />
          </div>
        </div>
      </section>
    </>
  );
}
