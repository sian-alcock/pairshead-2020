import axios, { AxiosResponse } from "axios";
import { CrewProps } from '../types/components.types';

export const fetchCrews = async (): Promise<CrewProps[]> => {
  const response: AxiosResponse<CrewProps[]> = await axios.get("/api/crews/");
  return response.data;
};

export const fetchCrew = async (id: string | number): Promise<CrewProps> => {
  const response: AxiosResponse<CrewProps> = await axios.get(`/api/crews/${id}`);
  return response.data;
};

export const updateCrew = async (crew: CrewProps): Promise<CrewProps> => {
  const response: AxiosResponse<CrewProps> = await axios.patch(`/api/crews/${crew.id}`, crew);
  return response.data;
};