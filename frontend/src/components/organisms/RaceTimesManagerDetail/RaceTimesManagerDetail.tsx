import React, { useEffect, useState } from "react";
import Header from "../Header/Header";
import { RaceProps } from "../../../types/components.types";
import TextButton from "../../atoms/TextButton/TextButton";
import { useHistory, useParams } from "react-router-dom";
import Hero from "../Hero/Hero";
import { FormInput } from "../../atoms/FormInput/FormInput";
import Checkbox from "../../atoms/Checkbox/Checkbox";
import { useRace, useCreateRace, useUpdateRace, useDeleteRace } from "../../../hooks/useRaces";
import "./raceTimesManagerDetail.scss";

type RaceTimesManagerParams = {
  id: string;
};

export default function RaceTimesManagerDetail() {
  const [raceFormData, setRaceFormData] = useState<Partial<RaceProps>>({});
  const [errors, setErrors] = useState({});
  const routeParams = useParams<RaceTimesManagerParams>();
  const history = useHistory();

  const id = Number(routeParams.id);

  // Query for fetching race data
  const { data: raceData, isLoading, error } = useRace(id);

  // Mutations
  const createRaceMutation = useCreateRace();
  const updateRaceMutation = useUpdateRace();
  const deleteRaceMutation = useDeleteRace();

  // Set form data when race data is loaded
  useEffect(() => {
    if (raceData) {
      setRaceFormData(raceData);
    }
  }, [raceData]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrors({});

    const data = {
      ...raceFormData,
      default_start: raceFormData["default_start"] ? raceFormData["default_start"] : false,
      default_finish: raceFormData["default_finish"] ? raceFormData["default_finish"] : false
    };

    try {
      if (routeParams.id === undefined) {
        await createRaceMutation.mutateAsync(data);
      } else {
        await updateRaceMutation.mutateAsync({ id: id, raceData: data });
      }
      history.push("/manage-race-times");
    } catch (error: any) {
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setRaceFormData({ ...raceFormData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleDelete = async () => {
    if (routeParams.id) {
      try {
        await deleteRaceMutation.mutateAsync(id);
        history.push("/manage-race-times");
      } catch (error: any) {
        if (error.response?.data) {
          setErrors(error.response.data);
        }
      }
    }
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setRaceFormData({ ...raceFormData, [e.target.name]: e.target.checked });
  };

  // Loading and error states
  if (routeParams.id && isLoading) {
    return (
      <>
        <Header />
        <Hero title={"Add / edit race"} />
        <section className="race-times-manager-detail__section">
          <div className="race-times-manager-detail__container">
            <p>Loading...</p>
          </div>
        </section>
      </>
    );
  }

  if (routeParams.id && error) {
    return (
      <>
        <Header />
        <Hero title={"Add / edit race"} />
        <section className="race-times-manager-detail__section">
          <div className="race-times-manager-detail__container">
            <p>Error loading race data. Please try again.</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Header />
      <Hero title={"Add / edit race"} />
      <section className="race-times-manager-detail__section">
        <div className="race-times-manager-detail__container">
          <form onSubmit={handleSubmit} className="race-times-manager-detail__form">
            <FormInput
              type="text"
              fieldName="name"
              defaultValue={raceFormData.name}
              onChange={handleChange}
              label={"Name"}
            />
            <FormInput
              type="text"
              fieldName="race_id"
              defaultValue={raceFormData.race_id || ""}
              onChange={handleChange}
              label={"Race id"}
            />
            <Checkbox
              name={"default_start"}
              checked={!!raceFormData.default_start}
              label={"Set as default race data to use for start times"}
              id={"default-start"}
              onChange={handleCheckbox}
              value={""}
            />
            <Checkbox
              name={"default_finish"}
              checked={!!raceFormData.default_finish}
              label={"Set as default race data to use for finish times"}
              id={"default-finish"}
              onChange={handleCheckbox}
              value={""}
            />
            <Checkbox
              name={"is_timing_reference"}
              checked={!!raceFormData.is_timing_reference}
              label={"Use this race as the time source (ie offset = 0)"}
              id={"is-timing-reference"}
              onChange={handleCheckbox}
              value={""}
            />
            <div className="race-times-manager-detail__buttons">
              {routeParams.id && (
                <TextButton
                  label={"Delete race"}
                  onClick={handleDelete}
                  isCancel
                  disabled={deleteRaceMutation.isPending}
                />
              )}
              <TextButton
                label={"Submit"}
                isSubmit={true}
                disabled={createRaceMutation.isPending || updateRaceMutation.isPending}
              />
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
