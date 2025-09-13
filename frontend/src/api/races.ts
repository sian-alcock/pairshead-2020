import axios, { AxiosResponse } from "axios";
import { RaceProps, PaginatedResponse } from "../types/components.types";

export const fetchRaces = async (): Promise<RaceProps[]> => {
  try {
    const response: AxiosResponse<PaginatedResponse<RaceProps>> = await axios.get("/api/races/");

    if (!response.data) {
      console.error("No response data");
      throw new Error("No response data from races API");
    }

    if (!Array.isArray(response.data.results)) {
      console.error("Invalid response structure - results is not an array:", response.data);
      throw new Error("Invalid response structure from races API");
    }

    return response.data.results;
  } catch (error) {
    console.error("Error fetching races:", error);
    throw error;
  }
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
