import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCrew } from "../api/crews";
import { CrewProps } from "../types/components.types";

export function useUpdateCrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ crew, raceTimeChanges }: { crew: CrewProps; raceTimeChanges?: { [key: string]: number | null } }) =>
      updateCrew(crew, raceTimeChanges),
    onSuccess: (updatedCrew, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["crew", updatedCrew.id] });
      queryClient.invalidateQueries({ queryKey: ["crews"] });

      // Also invalidate race-times queries if we made changes
      if (variables.raceTimeChanges && Object.keys(variables.raceTimeChanges).length > 0) {
        // Invalidate all race-times queries to refresh the dropdowns
        queryClient.invalidateQueries({ queryKey: ["race-times"] });
      }
    }
  });
}
