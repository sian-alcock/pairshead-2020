import { useQuery } from "@tanstack/react-query";
import { fetchRaceTimeSync } from "../api/raceTimeSync";

export const useRaceTimeSync = () => {
  return useQuery({
    queryKey: ["race-time-sync"],
    queryFn: fetchRaceTimeSync,
    staleTime: 5 * 60 * 1000
  });
};
