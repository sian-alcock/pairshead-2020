import axios, { AxiosResponse } from "axios";
import { RaceProps, PaginatedResponse } from "../types/components.types";

export const fetchRaces = async (): Promise<RaceProps[]> => {
  const response: AxiosResponse<PaginatedResponse<RaceProps>> = await axios.get("/api/races/");
  return response.data.results;
};

export const fetchRace = async (id: number): Promise<RaceProps> => {
  const response: AxiosResponse<RaceProps> = await axios.get(`/api/races/${id}/`);
  return response.data;
};

export const createRace = async (raceData: Partial<RaceProps>): Promise<RaceProps> => {
  const response: AxiosResponse<RaceProps> = await axios.post("/api/races/", raceData);
  return response.data;
};

export const updateRace = async (id: number, raceData: Partial<RaceProps>): Promise<RaceProps> => {
  const response: AxiosResponse<RaceProps> = await axios.put(`/api/races/${id}/`, raceData);
  return response.data;
};

export const deleteRace = async (id: number): Promise<void> => {
  await axios.delete(`/api/races/${id}`);
};
