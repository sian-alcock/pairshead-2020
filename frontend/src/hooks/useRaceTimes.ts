import { useQuery } from "@tanstack/react-query";
import { fetchRaceTimes } from "../api/raceTimes";

export type UseRaceTimesParams = {
  race: number;
  tap: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  unassignedOnly?: boolean;
};

export const useRaceTimes = ({
  race,
  tap,
  enabled = true,
  page,
  pageSize,
  search,
  ordering,
  unassignedOnly = false
}: UseRaceTimesParams) => {
  return useQuery({
    queryKey: ["raceTimes", race, tap, page, pageSize, search, ordering, unassignedOnly], // Add unassignedOnly to queryKey
    queryFn: () =>
      fetchRaceTimes({
        race,
        tap,
        page,
        pageSize,
        search,
        ordering,
        unassignedOnly,
        noPagination: false
      }),
    staleTime: 10 * 60 * 1000,
    retry: 3,
    enabled
  });
};
