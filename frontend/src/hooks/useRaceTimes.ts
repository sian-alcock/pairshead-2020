import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { fetchRaceTimes } from "../api/raceTimes";

export type UseRaceTimesParams = {
  race: number;
  tap: "Start" | "Finish";
  enabled?: boolean;
};

export const useRaceTimes = ({ race, tap, enabled = true }: UseRaceTimesParams) => {
  return useQuery({
    queryKey: ["raceTimes", race, tap],
    queryFn: () => fetchRaceTimes(race, tap),
    staleTime: 10 * 60 * 1000,
    retry: 3,
    enabled
  });
};
