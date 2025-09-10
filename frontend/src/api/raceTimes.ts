import axios, { AxiosResponse } from "axios";
import { TimeProps, PaginatedResponse } from "../types/components.types";

export const fetchRaceTimes = async (race: number, tap: string): Promise<TimeProps[]> => {
  const params = new URLSearchParams();
  params.append("race_id", race.toString());
  params.append("tap", tap);

  const response: AxiosResponse<PaginatedResponse<TimeProps>> = await axios.get(
    `/api/race-times/?${params.toString()}`
  );
  return response.data.results;
};
