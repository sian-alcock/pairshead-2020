import React from "react";
import { TimeProps, TimingOffsetProps } from "../../../../types/components.types";
import { formatTimes } from "../../../../lib/helpers";
import './raceTimesSummary.scss'

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
  finishOverride,
}) => {
  // Accept undefined, normalize to null inside
  const getSelectedRaceId = (
    override: number | null | undefined,
    type: TapType
  ): number | null => {
    const normalized = override ?? null;

    if (normalized !== null) {
      return (
        times.find(
          (t) => t.race?.id && Number(t.race.id) === normalized && t.tap === type
        )?.race?.race_id ?? null
      );
    }

    // default start/finish race if no override
    const def = times.find((t) =>
      type === "Start" ? t.race?.default_start : t.race?.default_finish
    );
    return def?.race?.race_id ?? null;
  };

  const startRaceId = getSelectedRaceId(startOverride, "Start");
  const finishRaceId = getSelectedRaceId(finishOverride, "Finish");

  // Only search if we have a raceId selected
  const startTime = startRaceId
    ? times.find((t) => t.race?.race_id === startRaceId && t.tap === "Start")
    : undefined;

  const finishTime = finishRaceId
    ? times.find((t) => t.race?.race_id === finishRaceId && t.tap === "Finish")
    : undefined;

  // Offset is applied if this race appears as target_race; otherwise 0
  const getOffset = (raceId: number | null): number => {
    if (!raceId) return 0;
    const match = offsetData.find((o) => o.target_race === Number(raceId));
    return match?.timing_offset_ms ?? 0;
  };

  const startOffset = getOffset(startRaceId);
  const finishOffset = getOffset(finishRaceId);

  // Only apply offsets when start/finish are from different races
  let rawTimeText = "-";
  if (startTime && finishTime) {
    if (startRaceId === finishRaceId) {
      rawTimeText = formatTimes(finishTime.time_tap - startTime.time_tap);
    } else {
      rawTimeText = formatTimes(
        (finishTime.time_tap + finishOffset) -
          (startTime.time_tap + startOffset)
      );
    }
  }

  const showStartOffset =
    startTime && finishTime && startRaceId !== finishRaceId && startOffset !== 0;
  const showFinishOffset =
    startTime && finishTime && startRaceId !== finishRaceId && finishOffset !== 0;

  return (
    <div className="race-times-summary">
      <p>
        <strong>Start Race:</strong> {startRaceId ?? "None"}{" "}
        {startTime
          ? `(${formatTimes(startTime.time_tap)}${
              showStartOffset ? ` +${startOffset}ms` : ""
            })`
          : ""}
      </p>
      <p>
        <strong>Finish Race:</strong> {finishRaceId ?? "None"}{" "}
        {finishTime
          ? `(${formatTimes(finishTime.time_tap)}${
              showFinishOffset ? ` +${finishOffset}ms` : ""
            })`
          : ""}
      </p>
      <p>
        <strong>Raw Time:</strong> {rawTimeText}
      </p>
    </div>
  );
};
