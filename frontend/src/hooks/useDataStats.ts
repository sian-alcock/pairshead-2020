import { useQuery } from "@tanstack/react-query";
import { fetchDataStats } from "../api/stats";

export const useDataStats = (phase = "setup") => {
  return useQuery({
    queryKey: ["data-stats", phase],
    queryFn: () => fetchDataStats(phase),
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
    // Always fetch stats for dashboard overview
    enabled: true
  });
};
