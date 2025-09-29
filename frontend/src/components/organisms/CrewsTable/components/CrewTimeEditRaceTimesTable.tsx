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

  const getSelectedStartRaceId = (): number | undefined => {
    let result: number | undefined;

    if (startOverride) {
      const overrideTime = times.find((t) => t.race?.id === startOverride);
      result = overrideTime?.race?.race_id ? Number(overrideTime.race.race_id) : undefined;
      console.log("Start override:", { startOverride, overrideTime, result });
    } else {
      result = defaultStartRaceId ? Number(defaultStartRaceId) : undefined;
      console.log("Default start:", { defaultStartRaceId, result });
    }

    return result;
  };

  const getSelectedFinishRaceId = (): number | undefined => {
    if (finishOverride) {
      // Find the race time that matches the override
      const overrideTime = times.find((t) => t.race?.id === finishOverride);
      return overrideTime?.race?.race_id ? Number(overrideTime.race.race_id) : undefined;
    }
    return defaultFinishRaceId ? Number(defaultFinishRaceId) : undefined;
  };

  const handleStartRadioChange = (raceId: number) => {
    console.log("handleStartRadioChange called:", {
      raceId,
      defaultStartRaceId,
      willClear: raceId === Number(defaultStartRaceId),
      dataLength: data.length,
      dataRaceIds: data.map((row) => ({ raceId: row.raceId, type: typeof row.raceId }))
    });

    if (raceId === Number(defaultStartRaceId)) {
      // console.log("Clearing start override");
      onStartOverrideChange(null);
    } else {
      // More detailed debugging
      const foundRow = data.find((row) => {
        // console.log("Comparing:", { rowRaceId: row.raceId, targetRaceId: raceId, equal: row.raceId === raceId });
        return Number(row.raceId) === raceId;
      });

      const race = foundRow?.race;

      if (race && "id" in race && race.id) {
        console.log("Setting start override to race.id:", race.id);
        onStartOverrideChange(race.id);
      } else {
        console.log("Could not find valid race or race.id");
      }
    }
  };

  const handleFinishRadioChange = (raceId: number) => {
    console.log("handleFinishRadioChange called:", {
      raceId,
      defaultFinishRaceId,
      willClear: raceId === Number(defaultFinishRaceId),
      dataLength: data.length,
      dataRaceIds: data.map((row) => ({ raceId: row.raceId, type: typeof row.raceId }))
    });

    if (raceId === Number(defaultFinishRaceId)) {
      // console.log("Clearing finish override");
      onFinishOverrideChange(null);
    } else {
      const foundRow = data.find((row) => Number(row.raceId) === raceId);
      console.log("Found row:", foundRow);
      const race = foundRow?.race;
      console.log("Race from row:", race);

      if (race && "id" in race && race.id) {
        console.log("Setting finish override to race.id:", race.id);
        onFinishOverrideChange(race.id);
      } else {
        console.log("Could not find valid race or race.id");
      }
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
        cell: ({ getValue, row }) => {
          const raceId = Number(getValue());
          const selectedRaceId = getSelectedStartRaceId();
          const isChecked = selectedRaceId === raceId;

          console.log("Start radio:", {
            raceId,
            selectedRaceId,
            isChecked,
            startOverride,
            defaultStartRaceId
          });

          return row.original.start.length ? (
            <FormRadioButton
              name="start_race_selection"
              raceId={raceId}
              checked={selectedRaceId === raceId}
              onChange={() => handleStartRadioChange(raceId)}
            />
          ) : (
            <span className="text-gray-400">-</span>
          );
        }
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
          const raceId = Number(getValue());
          const selectedRaceId = getSelectedFinishRaceId();

          return row.original.finish.length ? (
            <FormRadioButton
              name="finish_race_selection"
              raceId={raceId}
              checked={selectedRaceId === raceId}
              onChange={() => handleFinishRadioChange(raceId)}
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
      defaultStartRaceId,
      defaultFinishRaceId,
      times,
      raceTimeChanges,
      onRaceTimeChange,
      data
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
