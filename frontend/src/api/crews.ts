import axios, { AxiosResponse } from "axios";
import { CrewProps, PaginatedResponse } from "../types/components.types";

export const fetchCrews = async (): Promise<CrewProps[]> => {
  const response: AxiosResponse<PaginatedResponse<CrewProps>> = await axios.get("/api/crews/");
  return response.data.results;
};

export const fetchCrew = async (id: string | number): Promise<CrewProps> => {
  const response: AxiosResponse<CrewProps> = await axios.get(`/api/crews/${id}`);
  return response.data;
};

export const updateCrew = async (
  crew: CrewProps,
  raceTimeChanges?: { [key: string]: number | null }
): Promise<CrewProps> => {
  // Handle race time changes first
  if (raceTimeChanges && Object.keys(raceTimeChanges).length > 0) {
    const raceTimePromises = Object.entries(raceTimeChanges).map(async ([changeKey, newRaceTimeId]) => {
      const [raceIdStr, tap] = changeKey.split("-");
      const raceId = Number(raceIdStr);

      const currentRaceTime = crew.times?.find((t) => t.race?.race_id === raceId && t.tap === tap);

      if (newRaceTimeId) {
        await axios.patch(`/api/race-times/${newRaceTimeId}`, { crew: crew.id });
      } else if (currentRaceTime?.id) {
        await axios.patch(`/api/race-times/${currentRaceTime.id}`, { crew: null });
      }
    });

    await Promise.all(raceTimePromises);
  }

  // Then update the crew (this will trigger computed properties update)
  const response: AxiosResponse<CrewProps> = await axios.patch(`/api/crews/${crew.id}`, crew);

  return response.data;
};
