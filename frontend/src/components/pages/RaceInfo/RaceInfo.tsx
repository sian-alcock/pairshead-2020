import React, { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { Link } from "react-router-dom";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";
import { RaceInfoProps } from "../../components.types";
import DataLoader from "../../common/DataLoader";
import "./raceInfo.scss"

interface ResponseDataProps {
  results: RaceInfoProps[];
}

export default function RaceInfo() {
  const [settings, setSettings] = useState<RaceInfoProps[]>([]);

  const fetchData = async (url: string) => {
    try {
      const response: AxiosResponse = await axios.get(url);

      const responseData: ResponseDataProps = response.data;

      setSettings(responseData.results);


    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/global-settings-list/");
  }, []);


  console.log(settings);

  return (
    <>
      <Header />
      <Hero title={"Race settings"} />
      <section className="race-info__section">
        <div className="race-info__container">
          <div className="race-info__table-container">
            <table className="race-info__table table">
            <thead>
                <tr>
                  <th>Setting</th>
                  <th>Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><h3>Offset</h3></td>
                  <td>{settings[0]?.timing_offset}</td>
                  {settings.length > 0 ? 
                  <td><Link to={`/settings/race-info/${settings[0]?.id}/edit`}>Edit</Link></td> : <td><Link to={`/settings/race-info/new`}>Add offset</Link></td>}
                </tr>
              </tbody>
            </table>
            </div>
          <div className="columns">
          <div className="column is-one-quarter">
            <DataLoader
              url='/api/crew-update-rankings/'
              buttonText='Apply offset'
              class='single-height-button' />
          </div>
        </div>
        </div>
      </section>
    </>
  );
}
