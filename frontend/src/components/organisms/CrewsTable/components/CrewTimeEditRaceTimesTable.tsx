import React, { useMemo } from "react";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { formatTimes } from "../../../../lib/helpers";
import { TimeProps, TimingOffsetProps, RaceProps } from "../../../../types/components.types";
import { useRaceTimesData, RaceTimeRow } from "./useRaceTimesData";
import { SequenceList } from "./SequenceList";
import { FormRadioButton } from "../../../atoms/FormRadioButton/FormRadioButton";
import { RaceTimesSummary } from "./RaceTimesSummary";
import { RaceTimeSelector } from "./RaceTimeSelector";
import "./crewTimeEditRaceTimesTable.scss";

export const CrewTimeEditRaceTimesTable: React.FC<{
  crewId: number;
  times: TimeProps[];
  allRaces: RaceProps[]; // Add this prop
  startOverride?: number | null;
  finishOverride?: number | null;
  onStartOverrideChange: (raceId: number | null) => void;
  onFinishOverrideChange: (raceId: number | null) => void;
  offsetData: TimingOffsetProps[];
  raceTimeChanges: { [key: string]: number | null };
  onRaceTimeChange: (raceId: number, tap: "Start" | "Finish", newRaceTimeId: number | null) => void;
}> = ({
  crewId,
  times,
  allRaces, // Add this prop
  startOverride,
  finishOverride,
  onStartOverrideChange,
  onFinishOverrideChange,
  offsetData,
  raceTimeChanges,
  onRaceTimeChange
}) => {
  // Pass allRaces to the hook
  const { data, defaultStartRaceId, defaultFinishRaceId } = useRaceTimesData(times, allRaces);

  const getSelectedStartRaceId = () => {
    if (startOverride) {
      return Number(times.find((t) => t.race?.id && Number(t.race.id) === startOverride)?.race?.race_id);
    }
    return defaultStartRaceId ? Number(defaultStartRaceId) : undefined;
  };

  const getSelectedFinishRaceId = () => {
    if (finishOverride) {
      return Number(times.find((t) => t.race?.id && Number(t.race.id) === finishOverride)?.race?.race_id);
    }
    return defaultFinishRaceId ? Number(defaultFinishRaceId) : undefined;
  };

  const handleStartRadioChange = (raceId: number) => {
    if (raceId === defaultStartRaceId) {
      onStartOverrideChange(null);
    } else {
      const race = data.find((row) => row.raceId === raceId)?.race;
      if (race && "id" in race && race.id) onStartOverrideChange(race.id);
    }
  };

  const handleFinishRadioChange = (raceId: number) => {
    if (raceId === defaultFinishRaceId) {
      onFinishOverrideChange(null);
    } else {
      const race = data.find((row) => row.raceId === raceId)?.race;
      if (race && "id" in race && race.id) onFinishOverrideChange(race.id);
    }
  };

  const getCurrentRaceTimeId = (raceId: number, tap: "Start" | "Finish"): number | null => {
    const changeKey = `${raceId}-${tap}`;

    // Check if there's a pending change
    if (raceTimeChanges[changeKey] !== undefined) {
      return raceTimeChanges[changeKey];
    }

    // Otherwise get from current data
    const currentTime = times.find((t) => t.race?.race_id === raceId && t.tap === tap);
    return currentTime?.id ?? null;
  };

  const columnHelper = createColumnHelper<RaceTimeRow>();

  const columns = useMemo<ColumnDef<RaceTimeRow, any>[]>(
    () => [
      columnHelper.accessor("race", {
        header: "Race",
        cell: ({ getValue }) => {
          const race = getValue();
          return race ? (
            <div>
              <strong>{race.name}</strong> <br />
              ID: {race.race_id}
              {/* Handle the case where race might be from allRaces (no default_start/finish) or from times */}
              {"default_start" in race && race.default_start && (
                <span className="crew-time-edit-race-times-table__pill">Default start</span>
              )}
              {"default_finish" in race && race.default_finish && (
                <span className="crew-time-edit-race-times-table__pill">Default finish</span>
              )}
            </div>
          ) : (
            "No race"
          );
        }
      }),
      columnHelper.accessor("start", {
        header: "Start times (seq)",
        cell: ({ getValue }) => {
          const startTimes = getValue();
          return startTimes.length > 0 ? (
            <SequenceList items={startTimes} label="Start" />
          ) : (
            <span className="text-gray-400">No start times</span>
          );
        }
      }),
      columnHelper.accessor("raceId", {
        id: "useStart",
        header: "Use start",
        cell: ({ getValue, row }) =>
          row.original.start.length ? (
            <FormRadioButton
              name="start_race_selection"
              raceId={getValue()}
              checked={getSelectedStartRaceId() === getValue()}
              onChange={() => handleStartRadioChange(getValue())}
            />
          ) : (
            <span className="text-gray-400">-</span>
          )
      }),
      columnHelper.accessor("finish", {
        header: "Finish time (seq)",
        cell: ({ getValue }) => {
          const finishTimes = getValue();
          return finishTimes.length > 0 ? (
            <SequenceList items={finishTimes} label="Finish" />
          ) : (
            <span className="text-gray-400">No finish times</span>
          );
        }
      }),
      columnHelper.accessor("raceId", {
        id: "useFinish",
        header: "Use finish",
        cell: ({ getValue, row }) => {
          const value = getValue();
          const selected = getSelectedFinishRaceId();

          return row.original.finish.length ? (
            <FormRadioButton
              name="finish_race_selection"
              raceId={value}
              checked={selected === value}
              onChange={() => handleFinishRadioChange(value)}
            />
          ) : (
            <span className="text-gray-400">-</span>
          );
        }
      }),
      columnHelper.accessor("rawTime", {
        header: "Raw time",
        cell: ({ getValue, row }) =>
          row.original.start.length && row.original.finish.length ? formatTimes(getValue()) : "-"
      }),
      columnHelper.display({
        id: "changeStart",
        header: "Change/remove start tap",
        cell: ({ row }) => {
          const { race } = row.original;
          if (!race) return <div>No race</div>;

          const currentRaceTimeId = getCurrentRaceTimeId(race.race_id, "Start");

          // Determine the correct race ID to pass to RaceTimeSelector
          // Both RaceProps and TimeProps["race"] should have an 'id' field
          let raceId: number | undefined;

          if ("id" in race && race.id) {
            raceId = race.id;
          } else {
            // This shouldn't happen in practice, but provides a fallback
            console.warn("Race object missing id field:", race);
            raceId = undefined;
          }

          return (
            <div>
              <RaceTimeSelector
                crewId={crewId}
                raceId={raceId}
                tap="Start"
                raceTimeId={currentRaceTimeId}
                onChange={(newId) => {
                  onRaceTimeChange(race.race_id, "Start", newId);
                  console.log("Queued start RaceTime change →", newId);
                }}
              />
            </div>
          );
        }
      }),

      columnHelper.display({
        id: "changeFinish",
        header: "Change/remove finish tap",
        cell: ({ row }) => {
          const { race } = row.original;
          if (!race) return <div>No race</div>;

          const currentRaceTimeId = getCurrentRaceTimeId(race.race_id, "Finish");

          // Determine the correct race ID to pass to RaceTimeSelector
          // Both RaceProps and TimeProps["race"] should have an 'id' field
          let raceId: number | undefined;

          if ("id" in race && race.id) {
            raceId = race.id;
          } else {
            // This shouldn't happen in practice, but provides a fallback
            console.warn("Race object missing id field:", race);
            raceId = undefined;
          }

          return (
            <div>
              <RaceTimeSelector
                crewId={crewId}
                raceId={raceId}
                tap="Finish"
                raceTimeId={currentRaceTimeId}
                onChange={(newId) => {
                  onRaceTimeChange(race.race_id, "Finish", newId);
                  console.log("Queued finish RaceTime change →", newId);
                }}
              />
            </div>
          );
        }
      })
    ],
    [
      getSelectedStartRaceId,
      getSelectedFinishRaceId,
      startOverride,
      finishOverride,
      times,
      raceTimeChanges,
      onRaceTimeChange
    ]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="crew-time-edit-race-times-table">
      <div className="crew-time-edit-race-times-table__wrapper">
        <table className="crew-time-edit-race-times-table__table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <RaceTimesSummary
          offsetData={offsetData}
          times={times}
          startOverride={startOverride}
          finishOverride={finishOverride}
        />
      </div>
    </div>
  );
};
