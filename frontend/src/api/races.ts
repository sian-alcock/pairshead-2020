import axios, { AxiosResponse } from "axios";
import { RaceProps } from "../types/components.types";

export const fetchRaces = async (): Promise<RaceProps[]> => {
  const response: AxiosResponse = await axios.get("/api/races/");
  return response.data;
};

export const fetchRace = async (id: string): Promise<RaceProps> => {
  const response: AxiosResponse = await axios.get(`/api/races/${id}/`);
  return response.data;
};

export const createRace = async (raceData: Partial<RaceProps>): Promise<RaceProps> => {
  const response: AxiosResponse = await axios.post("/api/races/", raceData);
  return response.data;
};

export const updateRace = async (id: string, raceData: Partial<RaceProps>): Promise<RaceProps> => {
  const response: AxiosResponse = await axios.put(`/api/races/${id}/`, raceData);
  return response.data;
};

export const deleteRace = async (id: string): Promise<void> => {
  await axios.delete(`/api/races/${id}`);
};
