import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BandProps } from '../types/components.types'


const fetchBands = async (): Promise<BandProps[]> => {
  const { data } = await axios.get('/api/bands/')
  return data
}

export const useBands = () => {
  return useQuery({
    queryKey: ['bands'],
    queryFn: fetchBands,
    staleTime: 5 * 60 * 1000,
  })
}
