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

// Separate hook for getting ALL race times (using large page size)
export const useAllRaceTimes = ({
  race,
  tap,
  enabled = true
}: {
  race: number;
  tap: "Start" | "Finish";
  enabled?: boolean;
}) => {
  console.log("useAllRaceTimes called with:", { race, tap, pageSize: 500, page: 1 });

  return useQuery({
    queryKey: ["allRaceTimes", race, tap],
    queryFn: () => {
      console.log("About to call fetchRaceTimes with pageSize 500");
      return fetchRaceTimes({
        race,
        tap,
        pageSize: 500,
        page: 1
      });
    },
    staleTime: 10 * 60 * 1000,
    retry: 3,
    enabled,
    select: (data) => {
      console.log("Raw API response:", data);
      console.log("Results length:", data.results?.length || "no results array");
      return data.results || data;
    }
  });
};
