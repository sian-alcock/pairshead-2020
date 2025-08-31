import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import Header from "../../Header/Header";
import Hero from "../../Hero/Hero";
import { CrewTimeEditRaceTimesTable } from "./CrewTimeEditRaceTimesTable";
import TextButton from "../../../atoms/TextButton/TextButton";
import { FormInput } from "../../../atoms/FormInput/FormInput";
import Checkbox from "../../../atoms/Checkbox/Checkbox";
import { FormSelect, SelectOptionsProps } from "../../../atoms/FormSelect/FormSelect";
import { useCrew } from "../../../../hooks/useCrew";
import { useUpdateCrew } from "../../../../hooks/useUpdateCrew";
import { useBands } from "../../../../hooks/useBands";
import { useRaceTimeSync } from "../../../../hooks/useRaceTimeSync";
import { BandProps, CrewProps } from "../../../../types/components.types";
import "./crewTimeEdit.scss";

// Type definitions
interface Errors {
  [key: string]: string;
}

interface RouteParams {
  id: string;
}

const CrewTimeEdit: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const [errors, setErrors] = useState<Errors>({});
  const [formData, setFormData] = useState<CrewProps | null>(null);
  const [raceTimeChanges, setRaceTimeChanges] = useState<{ [key: string]: number | null }>({});

  const handleRaceTimeChange = (raceId: number, tap: "Start" | "Finish", newRaceTimeId: number | null) => {
    const changeKey = `${raceId}-${tap}`;
    setRaceTimeChanges((prev) => ({
      ...prev,
      [changeKey]: newRaceTimeId
    }));
  };

  const { data: crew, isLoading: isCrewLoading, error: crewError } = useCrew(id);
  const { data: bands = [], isLoading: isBandsLoading } = useBands();
  const { data: raceTimeSync = [], isLoading: isRaceTimeSyncLoading } = useRaceTimeSync();

  console.log(bands);

  const updateCrewMutation = useUpdateCrew();

  useEffect(() => {
    if (crew) setFormData(crew);
  }, [crew]);

  const getBandOptions = (): SelectOptionsProps[] => {
    return [
      { label: "Select a band", value: "" },
      ...bands.map((band: BandProps) => ({
        label: `${band.event.override_name} ${band.name}`,
        value: band.id
      }))
    ];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    updateCrewMutation.mutate(
      {
        crew: formData,
        raceTimeChanges: Object.keys(raceTimeChanges).length > 0 ? raceTimeChanges : undefined
      },
      {
        onSuccess: (updatedCrew) => {
          setFormData(updatedCrew);
          setRaceTimeChanges({}); // Clear pending changes
          history.push("/crew-management-dashboard");
        },
        onError: (err: any) => {
          if (err.response?.data) setErrors(err.response.data);
        }
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === "checkbox" ? checked : value
          }
        : prev
    );
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => (prev ? { ...prev, [e.target.name]: e.target.checked } : prev));
  };

  const handleBandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value ? Number(e.target.value) : null;
    const selectedBand = selectedId ? bands.find((b) => b.id === selectedId) : undefined;
    setFormData((prev) => (prev ? { ...prev, band: selectedBand } : prev));
  };

  const handleStartOverrideChange = (raceId: number | null) => {
    setFormData((prev) => (prev ? { ...prev, race_id_start_override: raceId } : prev));
  };

  const handleFinishOverrideChange = (raceId: number | null) => {
    setFormData((prev) => (prev ? { ...prev, race_id_finish_override: raceId } : prev));
  };

  // Loading state
  if (isCrewLoading || isBandsLoading || isRaceTimeSyncLoading) {
    return (
      <>
        <Header />
        <Hero title={"Edit crew time"} />
        <section className="crew-time-edit__section">
          <div className="crew-time-edit__container">
            <div className="crew-time-edit__loading">Loading...</div>
          </div>
        </section>
      </>
    );
  }

  // Error state
  if (crewError) {
    return (
      <>
        <Header />
        <Hero title={"Edit crew time"} />
        <section className="crew-time-edit__section">
          <div className="crew-time-edit__container">
            <div className="crew-time-edit__error">Error loading crew data. Please try again.</div>
          </div>
        </section>
      </>
    );
  }

  console.log(formData);

  if (!crew) return null;

  return (
    <>
      <Header />
      <Hero title={"Edit crew time"} />
      <section className="crew-time-edit__section">
        <div className="crew-time-edit__container">
          <form className="crew-time-edit__form" onSubmit={handleSubmit}>
            <div className="crew-time-edit__box">
              <div>Crew ID: {formData?.id}</div>
              <div>Crew: {formData?.competitor_names ?? formData?.name}</div>
              <div>Bib number: {formData?.bib_number}</div>
            </div>
            <div className="crew-time-edit__penalty-band">
              <div className="crew-time-edit__field">
                <FormInput
                  fieldName={"penalty"}
                  label={"Penalty in seconds"}
                  type={"number"}
                  value={formData?.penalty || ""}
                  onChange={handleChange}
                  disabled={updateCrewMutation.isPending}
                />
                {errors.penalty && <small className="crew-time-edit__error-text">{errors.penalty}</small>}
              </div>

              <div className="crew-time-edit__field">
                <div className="crew-time-edit__control">
                  <FormSelect
                    fieldName={"band"}
                    label={"Band"}
                    onChange={handleBandChange}
                    selectOptions={getBandOptions()}
                    value={formData?.band?.id ?? ""}
                    disabled={updateCrewMutation.isPending}
                    title={"Band"}
                  />
                  {errors.band && <small className="crew-time-edit__error-text">{errors.band}</small>}
                </div>
              </div>
            </div>

            <h3 className="crew-time-edit__group-title">Override race time</h3>

            <div className="crew-time-edit__time-inputs">
              <div className="crew-time-edit__time-input-group">
                <div className="crew-time-edit__field">
                  <FormInput
                    fieldName={"manual_override_minutes"}
                    label={"Minutes"}
                    type={"number"}
                    value={formData?.manual_override_minutes || ""}
                    onChange={handleChange}
                    disabled={updateCrewMutation.isPending}
                    min={0}
                    max={59}
                  />
                  {errors.manual_override_minutes && (
                    <small className="crew-time-edit__error-text">{errors.manual_override_minutes}</small>
                  )}
                </div>
              </div>

              <div className="crew-time-edit__time-input-group">
                <div className="crew-time-edit__field">
                  <FormInput
                    fieldName={"manual_override_seconds"}
                    label={"Seconds"}
                    type={"number"}
                    value={formData?.manual_override_seconds || ""}
                    onChange={handleChange}
                    disabled={updateCrewMutation.isPending}
                    min={0}
                    max={59}
                  />
                  {errors.manual_override_seconds && (
                    <small className="crew-time-edit__error-text">{errors.manual_override_seconds}</small>
                  )}
                </div>
              </div>

              <div className="crew-time-edit__time-input-group">
                <div className="crew-time-edit__field">
                  <FormInput
                    fieldName={"manual_override_hundredths_seconds"}
                    label={"Hundredths of seconds"}
                    type={"number"}
                    value={formData?.manual_override_hundredths_seconds || ""}
                    onChange={handleChange}
                    disabled={updateCrewMutation.isPending}
                    min={0}
                    max={99}
                  />
                  {errors.manual_override_hundredths_seconds && (
                    <small className="crew-time-edit__error-text">{errors.manual_override_hundredths_seconds}</small>
                  )}
                </div>
              </div>
            </div>

            <h3 className="crew-time-edit__group-title">Flags</h3>

            <div className="crew-time-edit__checkboxes">
              <div className="crew-time-edit__checkbox-group">
                <div className="crew-time-edit__field">
                  <Checkbox
                    name={"time_only"}
                    label={"Time only"}
                    id={"time_only"}
                    checked={!!formData?.time_only}
                    onChange={handleCheckbox}
                    disabled={updateCrewMutation.isPending}
                  />
                  {errors.time_only && <small className="crew-time-edit__error-text">{errors.time_only}</small>}
                </div>

                <div className="crew-time-edit__field">
                  <Checkbox
                    name={"did_not_start"}
                    label={"Did not start"}
                    id={"did_not_start"}
                    checked={!!formData?.did_not_start}
                    onChange={handleCheckbox}
                    disabled={updateCrewMutation.isPending}
                  />
                  {errors.did_not_start && <small className="crew-time-edit__error-text">{errors.did_not_start}</small>}
                </div>

                <div className="crew-time-edit__field">
                  <Checkbox
                    name={"did_not_finish"}
                    label={"Did not finish"}
                    id={"did_not_finish"}
                    checked={!!formData?.did_not_finish}
                    onChange={handleCheckbox}
                    disabled={updateCrewMutation.isPending}
                  />
                  {errors.did_not_finish && (
                    <small className="crew-time-edit__error-text">{errors.did_not_finish}</small>
                  )}
                </div>

                <div className="crew-time-edit__field">
                  <Checkbox
                    name={"disqualified"}
                    label={"Disqualified"}
                    id={"disqualified"}
                    checked={!!formData?.disqualified}
                    onChange={handleCheckbox}
                    disabled={updateCrewMutation.isPending}
                  />
                  {errors.disqualified && <small className="crew-time-edit__error-text">{errors.disqualified}</small>}
                </div>
              </div>
            </div>

            {formData?.times && crew && (
              <>
                <h3 className="crew-time-edit__group-title">Race times</h3>
                <CrewTimeEditRaceTimesTable
                  crewId={crew.id!}
                  offsetData={raceTimeSync}
                  times={formData.times}
                  startOverride={formData.race_id_start_override}
                  finishOverride={formData.race_id_finish_override}
                  onStartOverrideChange={handleStartOverrideChange}
                  onFinishOverrideChange={handleFinishOverrideChange}
                  raceTimeChanges={raceTimeChanges}
                  onRaceTimeChange={handleRaceTimeChange}
                />
              </>
            )}

            <br />
            <TextButton
              isSubmit={true}
              label={updateCrewMutation.isPending ? "Submitting..." : "Submit"}
              disabled={updateCrewMutation.isPending}
            />
          </form>
        </div>
      </section>
    </>
  );
};

export default CrewTimeEdit;
