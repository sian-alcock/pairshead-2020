import React from "react";
import { TimeProps, TimingOffsetProps } from "../../../../types/components.types";
import { formatTimes } from "../../../../lib/helpers";
import "./raceTimesSummary.scss";
import { start } from "repl";

interface RaceTimesSummaryProps {
  times: TimeProps[];
  offsetData: TimingOffsetProps[];
  startOverride?: number | null;
  finishOverride?: number | null;
}

type TapType = "Start" | "Finish";

export const RaceTimesSummary: React.FC<RaceTimesSummaryProps> = ({
  times,
  offsetData,
  startOverride,
  finishOverride
}) => {
  // Accept undefined, normalize to null inside
  const getSelectedRaceIdWebScorer = (override: number | null | undefined, type: TapType): number | null => {
    const normalized = override ?? null;

    if (normalized !== null) {
      return times.find((t) => t.race?.id && Number(t.race.id) === normalized && t.tap === type)?.race?.race_id ?? null;
    }

    // default start/finish race if no override
    const def = times.find((t) => (type === "Start" ? t.race?.default_start : t.race?.default_finish));
    return def?.race?.race_id ?? null;
  };

  const getSelectedRaceId = (override: number | null | undefined, type: TapType): number | null => {
    const normalized = override ?? null;

    if (normalized !== null) {
      return times.find((t) => t.race?.id && Number(t.race.id) === normalized && t.tap === type)?.race?.id ?? null;
    }

    // default start/finish race if no override
    const def = times.find((t) => (type === "Start" ? t.race?.default_start : t.race?.default_finish));
    return def?.race?.id ?? null;
  };

  const startRaceId = getSelectedRaceId(startOverride, "Start");
  const finishRaceId = getSelectedRaceId(finishOverride, "Finish");
  console.log(startRaceId);
  console.log(finishRaceId);

  const startRaceIdWebScorer = getSelectedRaceIdWebScorer(startOverride, "Start");
  const finishRaceIdWebScorer = getSelectedRaceIdWebScorer(finishOverride, "Finish");
  console.log(startRaceIdWebScorer);
  console.log(finishRaceIdWebScorer);

  // Only search if we have a raceId selected
  const startTime = startRaceIdWebScorer
    ? times.find((t) => t.race?.race_id === startRaceIdWebScorer && t.tap === "Start")
    : undefined;

  const finishTime = finishRaceIdWebScorer
    ? times.find((t) => t.race?.race_id === finishRaceIdWebScorer && t.tap === "Finish")
    : undefined;

  // Offset is applied if this race appears as target_race; otherwise 0
  const getOffset = (raceId: number | null): number => {
    if (!raceId) return 0;
    const match = offsetData.find((o) => o.target_race === Number(raceId));
    return match?.timing_offset_ms ?? 0;
  };

  const startOffset = getOffset(startRaceId);
  const finishOffset = getOffset(finishRaceId);

  console.log(startOffset);
  console.log(finishOffset);
  console.log(offsetData);

  // Only apply offsets when start/finish are from different races
  let rawTimeText = "-";
  if (startTime && finishTime) {
    if (startRaceIdWebScorer === finishRaceIdWebScorer) {
      rawTimeText = formatTimes(finishTime.time_tap - startTime.time_tap);
    } else {
      rawTimeText = formatTimes(finishTime.time_tap + finishOffset - (startTime.time_tap + startOffset));
    }
  }

  const showStartOffset =
    startTime && finishTime && startRaceIdWebScorer !== finishRaceIdWebScorer && startOffset !== 0;
  const showFinishOffset =
    startTime && finishTime && startRaceIdWebScorer !== finishRaceIdWebScorer && finishOffset !== 0;

  return (
    <div className="race-times-summary">
      <p>
        <strong>Start race:</strong> {startRaceIdWebScorer ?? "None"}{" "}
        {startTime ? `(${formatTimes(startTime.time_tap)}${showStartOffset ? ` +${startOffset}ms` : ""})` : ""}
      </p>
      <p>
        <strong>Finish race:</strong> {finishRaceIdWebScorer ?? "None"}{" "}
        {finishTime ? `(${formatTimes(finishTime.time_tap)}${showFinishOffset ? ` +${finishOffset}ms` : ""})` : ""}
      </p>
      <p>
        <strong>Raw time:</strong> {rawTimeText}
      </p>
    </div>
  );
};
