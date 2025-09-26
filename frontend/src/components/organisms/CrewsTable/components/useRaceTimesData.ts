import { useMemo } from "react";
import { TimeProps, RaceProps } from "../../../../types/components.types";

export interface RaceTimeRow {
  raceId: number;
  race: RaceProps | NonNullable<TimeProps["race"]>; // Ensure race is never null
  start: TimeProps[];
  finish: TimeProps[];
  rawTime: number;
}

export function useRaceTimesData(times: TimeProps[], allRaces: RaceProps[] = []) {
  const data = useMemo<RaceTimeRow[]>(() => {
    // First, group existing crew times by race
    const timesByRace = times.reduce(
      (acc, t) => {
        const raceId = t.race?.race_id;
        if (!raceId) return acc;

        if (!acc[raceId]) {
          acc[raceId] = { race: t.race, start: [], finish: [] };
        }
        if (t.tap === "Start") acc[raceId].start.push(t);
        if (t.tap === "Finish") acc[raceId].finish.push(t);
        return acc;
      },
      {} as Record<number, { race: TimeProps["race"]; start: TimeProps[]; finish: TimeProps[] }>
    );

    // Create a row for each race in the system
    return allRaces.map((race) => {
      const existingTimes = timesByRace[race.race_id] || { start: [], finish: [] };

      const raw =
        existingTimes.start[0]?.time_tap && existingTimes.finish[0]?.time_tap
          ? existingTimes.finish[0].time_tap - existingTimes.start[0].time_tap
          : 0;

      return {
        raceId: race.race_id,
        race: race,
        start: existingTimes.start,
        finish: existingTimes.finish,
        rawTime: raw
      };
    });
  }, [times, allRaces]);

  const defaultStartRaceId = times.find((t) => t.race?.default_start && t.tap === "Start")?.race?.race_id;
  const defaultFinishRaceId = times.find((t) => t.race?.default_finish && t.tap === "Finish")?.race?.race_id;

  return { data, defaultStartRaceId, defaultFinishRaceId };
}
