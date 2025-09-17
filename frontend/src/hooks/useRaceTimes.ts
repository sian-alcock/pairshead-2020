import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { fetchRaceTimes } from "../api/raceTimes";

export type UseRaceTimesParams = {
  race: number;
  tap: "Start" | "Finish";
  enabled?: boolean;
  // New parameters for backend pagination/filtering
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  noPagination?: boolean; // For getting all data
};

export const useRaceTimes = ({
  race,
  tap,
  enabled = true,
  page,
  pageSize,
  search,
  ordering,
  noPagination = false
}: UseRaceTimesParams) => {
  return useQuery({
    queryKey: ["raceTimes", race, tap, page, pageSize, search, ordering, noPagination],
    queryFn: () =>
      fetchRaceTimes({
        race,
        tap,
        page,
        pageSize,
        search,
        ordering,
        noPagination
      }),
    staleTime: 10 * 60 * 1000,
    retry: 3,
    enabled
  });
};

// Alternative: Separate hook for different use cases
export const useAllRaceTimes = ({ race, tap, enabled = true }: { race: number; tap: string; enabled?: boolean }) => {
  return useQuery({
    queryKey: ["allRaceTimes", race, tap],
    queryFn: () => fetchRaceTimes({ race, tap, noPagination: true }),
    staleTime: 10 * 60 * 1000,
    retry: 3,
    enabled
  });
};
