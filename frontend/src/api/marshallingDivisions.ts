import axios, { AxiosResponse } from "axios";
import { MarshallingDivision, PaginatedResponse } from "../types/components.types";

export const fetchMarshallingDivisions = async (): Promise<MarshallingDivision[]> => {
  const response: AxiosResponse<PaginatedResponse<MarshallingDivision>> =
    await axios.get("/api/marshalling-divisions/");
  return response.data.results;
};
