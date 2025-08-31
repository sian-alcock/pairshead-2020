import { useQuery } from "@tanstack/react-query";
import { fetchRaces } from "../api/races";

export const useRaces = () => {
  return useQuery({
    queryKey: ["races"],
    queryFn: fetchRaces,
    staleTime: 10 * 60 * 1000,
    retry: 3
  });
};
