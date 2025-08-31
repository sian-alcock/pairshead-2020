import { useQuery } from "@tanstack/react-query";
import { fetchCrews } from "../api/crews";
import { CrewProps } from "../types/components.types";

export function useCrews() {
  return useQuery<CrewProps[]>({
    queryKey: ["crews"],
    queryFn: fetchCrews,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    enabled: true,
  });
}