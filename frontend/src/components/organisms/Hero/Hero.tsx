import React, { ReactElement, useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import Breadcrumbs from "../../molecules/Breadcrumbs/Breadcrumbs";
import { RaceInfoProps } from "../../../types/components.types";
import "./hero.scss";
import RaceModeSetter from "../../molecules/RaceModeSetter/RaceModeSetter";

interface HeroProps {
  title: string;
}

export default function Hero({ title }: HeroProps): ReactElement {
  const [settings, setSettings] = useState<RaceInfoProps[]>([]);

  const fetchData = async (url: string) => {
    try {
      const response: AxiosResponse = await axios.get(url);

      const responseData: RaceInfoProps[] = response.data;

      setSettings(responseData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/global-settings-list/");
  }, []);

  return (
    <>
      <section className="page-hero no-print">
        <div className="page-hero__container">
          <h1>{title}</h1>
          <div className="page-hero__side">
            <RaceModeSetter />
          </div>
        </div>
      </section>
      <div className="page-hero__container">
        <div className="page-hero__bar">
          <Breadcrumbs />
        </div>
      </div>
    </>
  );
}
