import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TimeProps } from "../../../../types/components.types";
import axios from "axios";
import { formatTimes } from "../../../../lib/helpers";
import { FormSelect } from "../../../atoms/FormSelect/FormSelect";

const fetchRaceTimes = async (raceId: string, tap: string): Promise<TimeProps[]> => {
  const params = new URLSearchParams();
  params.append("race_id", raceId.toString());
  params.append("tap", tap);
  const response = await axios.get(`/api/race-times/?${params.toString()}`);
  return response.data;
};

type RaceTimeSelectorProps = {
  crewId: number;
  raceTimeId?: number | null;
  raceId?: number | null; 
  tap: "Start" | "Finish";
  onChange: (newRaceTimeId: number | null) => void;
};

export const RaceTimeSelector: React.FC<RaceTimeSelectorProps> = ({
  crewId,
  raceTimeId,
  raceId,
  tap,
  onChange,
}) => {
  // Local state to track the selected value before submission
  const [selectedValue, setSelectedValue] = useState<number | null>(raceTimeId ?? null);

  // Update local state when the prop changes (e.g., when switching crews)
  useEffect(() => {
    setSelectedValue(raceTimeId ?? null);
  }, [raceTimeId]);

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["race-times", raceId, tap],
    queryFn: () => fetchRaceTimes(raceId?.toString()!, tap),
    enabled: !!raceId,
  });

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "unassign" ? null : Number(e.target.value);
    setSelectedValue(value);
    onChange(value); // This now just updates the parent's local state
  };

  const selectOptions = [...options.map((option) => {
    return {label: `${option.sequence} - ${formatTimes(option.time_tap)}`, value: option.id}
  }), {label: 'Unassign', value: 'unassign'}]

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