import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { fetchRaces, fetchRace, createRace, deleteRace, updateRace } from "../api/races";
import { RaceProps } from "../types/components.types";

export const useRaces = () => {
  return useQuery({
    queryKey: ["races"],
    queryFn: fetchRaces,
    staleTime: 10 * 60 * 1000,
    retry: 3
  });
};

export const useRace = (id: number) => {
  return useQuery({
    queryKey: ["races", id],
    queryFn: () => fetchRace(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    retry: 3
  });
};

export const useCreateRace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (raceData: Partial<RaceProps>) => createRace(raceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["races"] });
    }
  });
};

export const useUpdateRace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, raceData }: { id: number; raceData: Partial<RaceProps> }) => updateRace(id, raceData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["races"] });
      queryClient.invalidateQueries({ queryKey: ["races", variables.id] });
    }
  });
};

export const useDeleteRace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteRace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["races"] });
    }
  });
};
