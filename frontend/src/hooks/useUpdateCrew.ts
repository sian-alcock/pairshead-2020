import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCrew } from '../api/crews'
import { CrewProps } from '../types/components.types'

export function useUpdateCrew() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (crew: CrewProps) => updateCrew(crew), // pass CrewProps directly
    onSuccess: (updatedCrew) => {
      // Update the cache for this crew immediately
      queryClient.setQueryData(['crew', updatedCrew.id], updatedCrew)

      // Force a refetch in case other data depends on this
      queryClient.invalidateQueries({ queryKey: ['crew', updatedCrew.id] })
      queryClient.invalidateQueries({ queryKey: ['crews'] })
    },
  })
}
