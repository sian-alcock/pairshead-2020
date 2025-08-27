import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["race-times", raceId, tap],
    queryFn: () => fetchRaceTimes(raceId?.toString()!, tap),
    enabled: !!raceId,
  });

  const mutation = useMutation({
    mutationFn: async (newRaceTimeId: number | null) => {
      if (newRaceTimeId) {
        // assign RaceTime to crew
        await axios.patch(`/api/race-times/${newRaceTimeId}`, { crew: crewId });
      } else if (raceTimeId) {
        // unassign RaceTime
        await axios.patch(`/api/race-times/${raceTimeId}`, { crew: null });
      }
    },
    onSuccess: (_, newRaceTimeId) => {
      onChange(newRaceTimeId);
      // refetch race-time options after assignment
      queryClient.invalidateQueries({ queryKey: ["race-times", raceId, tap] });
    },
  });

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "unassign" ? null : Number(e.target.value);
    mutation.mutate(value);
  };

  const selectOptions = [...options.map((option) => {
    return {label: `${option.sequence} - ${formatTimes(option.time_tap)}`, value: option.id}
  }), {label: 'Unassign', value: 'unassign'}]

  return (
    <FormSelect
      fieldName={"select-race-time"}
      title={"Select race time"}
      selectOptions={selectOptions}
      value={raceTimeId ?? "unassign"}
      onChange={handleSelect}
      disabled={isLoading || mutation.isPending}
    />
  );
};
