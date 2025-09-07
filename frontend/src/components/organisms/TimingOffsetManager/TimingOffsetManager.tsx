import React, { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { Link } from "react-router-dom";
import { RaceProps, TimingOffsetProps } from "../../../types/components.types";
import "./timingOffsetManager.scss";
import TextButton from "../../atoms/TextButton/TextButton";
import { IconButton } from "../../atoms/IconButton/IconButton";

export default function TimingOffsetManager() {
  const [timingOffsets, setTimingOffsets] = useState<TimingOffsetProps[]>([]);
  const [races, setRaces] = useState<RaceProps[] | undefined>();

  const fetchData = async (url: string) => {
    try {
      const response: AxiosResponse = await axios.get(url);

      const responseData: TimingOffsetProps[] = response.data;

      setTimingOffsets(responseData);

      const raceResponse: AxiosResponse = await axios.get("api/races");
      console.log(raceResponse);
      setRaces(raceResponse.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/race-time-sync/");
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    const clickedElement = e.target as Element;
    const timingOffset = clickedElement.closest("tr")?.dataset.timingOffset;

    try {
      const response: AxiosResponse = await axios.delete(`api/race-time-sync/${timingOffset}`);

      const responseData: TimingOffsetProps[] = response.data;

      setTimingOffsets(responseData);
    } catch (error) {
      console.error(error);
    }
  };

  const headings = ["Timing sync id", "Reference race", "Target race", "Offset in ms", "Delete"];
  return (
    <>
      <section className="timing-offset-manager">
        <div className="timing-offset-manager__table-container">
          <table className="timing-offset-manager__table">
            <thead>
              <tr>
                {headings.map((heading, idx) => (
                  <th key={idx}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tfoot>
              <tr>
                {headings.map((heading, idx) => (
                  <th key={idx}>{heading}</th>
                ))}
              </tr>
            </tfoot>
            <tbody>
              {timingOffsets &&
                timingOffsets.map((detail) => (
                  <tr key={detail.id} data-timing-offset={detail.id}>
                    <td>
                      <Link to={`/manage-race-times/race-time-syncs/${detail.id}/edit`}>{detail.id}</Link>
                    </td>
                    <td>{races?.find((race) => race.id.toString() === detail.reference_race.toString())?.name}</td>
                    <td>{races?.find((race) => race.id.toString() === detail.target_race.toString())?.name}</td>
                    <td>{detail.timing_offset_ms}</td>
                    <td className="td-center">
                      <IconButton title={"Delete data for race"} icon={"delete"} smaller onClick={handleDelete} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="field is-grouped">
          <p className="control">
            <TextButton label={"Add new"} pathName={"/manage-race-times/race-time-syncs/new"} />
          </p>
        </div>
      </section>
    </>
  );
}
