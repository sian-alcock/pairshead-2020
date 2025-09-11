import React, { useEffect, useState } from "react";
import { formatTimes } from "../../../../lib/helpers";
import { FormSelect } from "../../../atoms/FormSelect/FormSelect";
import { useRaceTimes } from "../../../../hooks/useRaceTimes";

type RaceTimeSelectorProps = {
  crewId: number;
  raceTimeId?: number | null;
  raceId?: number | null;
  tap: "Start" | "Finish";
  onChange: (newRaceTimeId: number | null) => void;
};

export const RaceTimeSelector: React.FC<RaceTimeSelectorProps> = ({ crewId, raceTimeId, raceId, tap, onChange }) => {
  // Local state to track the selected value before submission
  const [selectedValue, setSelectedValue] = useState<number | null>(raceTimeId ?? null);

  // Update local state when the prop changes (e.g., when switching crews)
  useEffect(() => {
    setSelectedValue(raceTimeId ?? null);
  }, [raceTimeId]);

  const {
    data: options,
    isLoading,
    error
  } = useRaceTimes({
    race: raceId ?? 0, // Provide a default value since enabled will control execution
    tap,
    enabled: !!raceId // Only run the query when raceId is truthy
  });

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "unassign" ? null : Number(e.target.value);
    setSelectedValue(value);
    onChange(value); // This now just updates the parent's local state
  };

  const selectOptions = [
    ...(options || []).map((option) => {
      return { label: `${option.sequence} - ${formatTimes(option.time_tap)}`, value: option.id };
    }),
    { label: "Unassign", value: "unassign" }
  ];

  return (
    <FormSelect
      fieldName={"select-race-time"}
      title={"Select race time"}
      selectOptions={selectOptions}
      value={selectedValue ?? "unassign"}
      onChange={handleSelect}
      disabled={isLoading}
    />
  );
};
