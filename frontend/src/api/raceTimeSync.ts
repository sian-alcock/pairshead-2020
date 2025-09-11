import axios, { AxiosResponse } from "axios";
import { TimingOffsetProps, PaginatedResponse } from "../types/components.types";

export const fetchRaceTimeSync = async (): Promise<TimingOffsetProps[]> => {
  const response: AxiosResponse<PaginatedResponse<TimingOffsetProps>> = await axios.get("/api/race-time-sync/");
  return response.data.results;
};
