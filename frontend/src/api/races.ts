import axios, { AxiosResponse } from "axios";
import { RaceProps } from "../types/components.types";

export const fetchRaces = async (): Promise<RaceProps[]> => {
  const response: AxiosResponse = await axios.get("/api/races/");
  return response.data;
};
