import { useMemo } from "react";
import { TimeProps } from "../../../../types/components.types";

export interface RaceTimeRow {
  raceId: number;
  race: TimeProps["race"];
  start: TimeProps[];
  finish: TimeProps[];
  rawTime: number;
}

export function useRaceTimesData(times: TimeProps[]) {
  const data = useMemo<RaceTimeRow[]>(() => {
    const grouped = times.reduce((acc, t) => {
      const raceId = t.race?.race_id;
      if (!raceId) return acc;

      if (!acc[raceId]) {
        acc[raceId] = { race: t.race, start: [], finish: [] };
      }
      if (t.tap === "Start") acc[raceId].start.push(t);
      if (t.tap === "Finish") acc[raceId].finish.push(t);
      return acc;
    }, {} as Record<number, { race: TimeProps["race"]; start: TimeProps[]; finish: TimeProps[] }>);

    return Object.entries(grouped).map(([raceId, group]) => {
      const raw = (group.start[0]?.time_tap && group.finish[0]?.time_tap)
        ? group.finish[0].time_tap - group.start[0].time_tap
        : 0;
      return { raceId: Number(raceId), race: group.race, start: group.start, finish: group.finish, rawTime: raw };
    });
  }, [times]);

  const defaultStartRaceId = times.find(t => t.race?.default_start && t.tap === "Start")?.race?.race_id;
  const defaultFinishRaceId = times.find(t => t.race?.default_finish && t.tap === "Finish")?.race?.race_id;

  return { data, defaultStartRaceId, defaultFinishRaceId };
}
