import axios, { AxiosResponse } from "axios";
import { CrewProps } from "../types/components.types";

export const fetchCrews = async (): Promise<CrewProps[]> => {
  const response: AxiosResponse<CrewProps[]> = await axios.get("/api/crews/");
  return response.data;
};

export const fetchCrew = async (id: string | number): Promise<CrewProps> => {
  const response: AxiosResponse<CrewProps> = await axios.get(`/api/crews/${id}`);
  return response.data;
};

export const updateCrew = async (
  crew: CrewProps,
  raceTimeChanges?: { [key: string]: number | null }
): Promise<CrewProps> => {
  // First update the crew
  const response: AxiosResponse<CrewProps> = await axios.patch(`/api/crews/${crew.id}`, crew);

  // Then handle race time changes if provided
  if (raceTimeChanges && Object.keys(raceTimeChanges).length > 0) {
    const raceTimePromises = Object.entries(raceTimeChanges).map(async ([changeKey, newRaceTimeId]) => {
      const [raceIdStr, tap] = changeKey.split("-");
      const raceId = Number(raceIdStr);

      // Find current race time for this race/tap combination
      const currentRaceTime = crew.times?.find((t) => t.race?.race_id === raceId && t.tap === tap);

      if (newRaceTimeId) {
        // Assign new race time to crew
        await axios.patch(`/api/race-times/${newRaceTimeId}`, { crew: crew.id });
      } else if (currentRaceTime?.id) {
        // Unassign current race time
        await axios.patch(`/api/race-times/${currentRaceTime.id}`, { crew: null });
      }
    });

    // Wait for all race time changes to complete
    await Promise.all(raceTimePromises);
  }

  return response.data;
};
