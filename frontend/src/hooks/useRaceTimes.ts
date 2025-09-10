import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { fetchRaceTimes } from "../api/raceTimes";

export type UseRaceTimesParams = {
  race: number;
  tap: "Start" | "Finish";
};

export const useRaceTimes = ({ race, tap }: UseRaceTimesParams) => {
  return useQuery({
    queryKey: ["raceTimes", race, tap],
    queryFn: () => fetchRaceTimes(race, tap),
    staleTime: 10 * 60 * 1000,
    retry: 3
  });
};
