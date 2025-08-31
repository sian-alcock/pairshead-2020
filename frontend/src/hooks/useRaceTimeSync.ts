// useRaceTimeSync.ts
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { TimingOffsetProps } from '../types/components.types'

const fetchRaceTimeSync = async (): Promise<TimingOffsetProps[]> => {
  const { data } = await axios.get('/api/race-time-sync/')
  return data
}

export const useRaceTimeSync = () => {
  return useQuery({
    queryKey: ['race-time-sync'],
    queryFn: fetchRaceTimeSync,
    staleTime: 5 * 60 * 1000,
  })
}
