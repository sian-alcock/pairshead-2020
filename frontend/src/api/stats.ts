import axios, { AxiosResponse } from "axios";
import { DataStats } from "../types/components.types";

export const fetchDataStats = async (phase: string): Promise<DataStats> => {
  const response: AxiosResponse = await axios.get("/api/crews/stats/", {
    params: {
      phase: phase
    }
  });
  return response.data;
};
