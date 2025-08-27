import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCrew, updateCrew } from '../api/crews'
import { CrewProps } from '../types/components.types'

export const useCrew = (id?: string) =>
  useQuery({
    queryKey: ['crew', id],
    queryFn: () => fetchCrew(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
  })

export const useUpdateCrew = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (crew: CrewProps) => updateCrew(crew),
    onSuccess: (updatedCrew) => {
      // update both single-crew and crew list caches
      queryClient.setQueryData(['crew', updatedCrew.id], updatedCrew)
      queryClient.invalidateQueries({ queryKey: ['crews'] })
      queryClient.invalidateQueries({ queryKey: ['data-stats'] })
      queryClient.invalidateQueries({ queryKey: ['races'] })
      queryClient.invalidateQueries({ queryKey: ['winners-comparison'] })
      queryClient.invalidateQueries({ queryKey: ['raceTimes'] })
    },
  })
}
