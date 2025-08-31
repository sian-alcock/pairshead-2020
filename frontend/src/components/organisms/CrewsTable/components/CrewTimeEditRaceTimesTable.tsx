import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from "@tanstack/react-table";
import { formatTimes } from "../../../../lib/helpers";
import { TimeProps, TimingOffsetProps } from "../../../../types/components.types";
import { useRaceTimesData, RaceTimeRow } from "./useRaceTimesData";
import { SequenceList } from "./SequenceList";
import { UseSelector } from "./UseSelector";
import { RaceTimesSummary } from "./RaceTimesSummary";
import { RaceTimeSelector } from "./RaceTimeSelector";
import { useQueryClient } from "@tanstack/react-query";
import './crewTimeEditRaceTimesTable.scss'

export const CrewTimeEditRaceTimesTable: React.FC<{
  crewId: number;
  times: TimeProps[];
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
  startOverride,
  finishOverride,
  onStartOverrideChange,
  onFinishOverrideChange,
  offsetData,
  raceTimeChanges,
  onRaceTimeChange,
}) => {
  const { data, defaultStartRaceId, defaultFinishRaceId } = useRaceTimesData(times);
  const queryClient = useQueryClient()

  const getSelectedStartRaceId = () => {
    if (startOverride) {
      return Number(
        times.find(t => t.race?.id && Number(t.race.id) === startOverride)?.race?.race_id
      );
    }
    return defaultStartRaceId ? Number(defaultStartRaceId) : undefined;
  };

const getSelectedFinishRaceId = () => {
  if (finishOverride) {
    return Number(
      times.find(t => t.race?.id && Number(t.race.id) === finishOverride)?.race?.race_id
    );
  }
  return defaultFinishRaceId ? Number(defaultFinishRaceId) : undefined;
};

  const handleStartRadioChange = (raceId: number) => {
    if (raceId === defaultStartRaceId) {
      onStartOverrideChange(null);
    } else {
      const race = data.find(row => row.raceId === raceId)?.race;
      if (race) onStartOverrideChange(race.id);
    }
  };

  const handleFinishRadioChange = (raceId: number) => {
    if (raceId === defaultFinishRaceId) {
      onFinishOverrideChange(null);
    } else {
      const race = data.find(row => row.raceId === raceId)?.race;
      if (race) onFinishOverrideChange(race.id);
    }
  };

  const getCurrentRaceTimeId = (raceId: number, tap: "Start" | "Finish"): number | null => {
    const changeKey = `${raceId}-${tap}`;
    
    // Check if there's a pending change
    if (raceTimeChanges[changeKey] !== undefined) {
      return raceTimeChanges[changeKey];
    }
    
    // Otherwise get from current data
    const currentTime = times.find(t => t.race?.race_id === raceId && t.tap === tap);
    return currentTime?.id ?? null;
  };

  // const handleRaceTimeChange = (raceId: number, tap: "Start" | "Finish", newRaceTimeId: number | null) => {
  //   queryClient.invalidateQueries({ queryKey: ['crew', crewId.toString()] });
    
  //   console.log(`Race time ${tap} changed for race ${raceId}: ${newRaceTimeId}`);
  // };

  const columnHelper = createColumnHelper<RaceTimeRow>();

  const columns = useMemo<ColumnDef<RaceTimeRow, any>[]>(() => [
    columnHelper.accessor("race", {
      header: "Race",
      cell: ({ getValue }) => {
        const race = getValue();
        return race ? (
          <div>
            <strong>{race.name}</strong> <br />
            ID: {race.race_id}
            {race.default_start && <span className="crew-time-edit-race-times-table__pill">Default start</span>}
            {race.default_finish && <span className="crew-time-edit-race-times-table__pill">Default finish</span>}
          </div>
        ) : "No race";
      },
    }),
    columnHelper.accessor("start", {
      header: "Start times",
      cell: ({ getValue }) => <SequenceList items={getValue()} label="Start" />,
    }),
    columnHelper.accessor("raceId", {
      id: "useStart",
      header: "Use start",
      cell: ({ getValue, row }) =>
        row.original.start.length ? (
          <UseSelector
            name="start_race_selection"
            raceId={getValue()}
            checked={getSelectedStartRaceId() === getValue()}
            onChange={() => handleStartRadioChange(getValue())}
          />
        ) : null,
    }),
    columnHelper.accessor("finish", {
      header: "Finish times",
      cell: ({ getValue }) => <SequenceList items={getValue()} label="Finish" />,
    }),
    columnHelper.accessor("raceId", {
      id: "useFinish",
      header: "Use finish",
      cell: ({ getValue, row }) => {
        const value = getValue();
        const selected = getSelectedFinishRaceId();
        
        return row.original.finish.length ? (
          <UseSelector
            name="finish_race_selection"
            raceId={value}
            checked={selected === value}
            onChange={() => handleFinishRadioChange(value)}
          />
        ) : null;
      },
    }),
    columnHelper.accessor("rawTime", {
      header: "Raw time",
      cell: ({ getValue, row }) =>
        row.original.start.length && row.original.finish.length
          ? formatTimes(getValue())
          : "-",
    }),
    columnHelper.display({
      id: "offset",
      header: "Offset applied?",
      cell: ({ row }) => {
        const startRaceId = row.original.start?.[0]?.race?.race_id;
        const finishRaceId = row.original.finish?.[0]?.race?.race_id;

        if (!startRaceId || !finishRaceId) return "-";

        if (startRaceId === finishRaceId) {
          return "No";
        }

        const startOffset = offsetData.find(o => o.target_race === startRaceId)?.timing_offset_ms ?? 0;
        const finishOffset = offsetData.find(o => o.target_race === finishRaceId)?.timing_offset_ms ?? 0;

        return `Yes (+${startOffset}ms / +${finishOffset}ms)`;
      },
    }),
    columnHelper.display({
      id: "changeStart",
      header: "Change/remove start tap",
      cell: ({ row }) => {
        const { race, start } = row.original;
        const currentRaceTimeId = getCurrentRaceTimeId(race?.race_id!, "Start");
        
        return (
          <div>
            {start.length > 0 && (
              <RaceTimeSelector
                crewId={crewId}
                raceId={race?.id}
                tap="Start"
                raceTimeId={currentRaceTimeId} // Use helper function
                onChange={(newId) => {
                  onRaceTimeChange(race?.race_id!, "Start", newId); // Use prop
                  console.log("Queued start RaceTime change →", newId);
                }}
              />
            )}
          </div>
        );
      },
    }),

    columnHelper.display({
      id: "changeFinish", 
      header: "Change/remove finish tap",
      cell: ({ row }) => {
        const { race, finish } = row.original;
        const currentRaceTimeId = getCurrentRaceTimeId(race?.race_id!, "Finish");
        
        return (
          <div>
            {finish.length > 0 && (
              <RaceTimeSelector
                crewId={crewId}
                raceId={race?.id}
                tap="Finish"
                raceTimeId={currentRaceTimeId} // Use helper function
                onChange={(newId) => {
                  onRaceTimeChange(race?.race_id!, "Finish", newId); // Use prop
                  console.log("Queued finish RaceTime change →", newId);
                }}
              />
            )}
          </div>
        );
      },
    }),

  ], [getSelectedStartRaceId, getSelectedFinishRaceId, startOverride, finishOverride, times, raceTimeChanges, onRaceTimeChange]);
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="crew-time-edit-race-times-table">
      <div className="crew-time-edit-race-times-table__wrapper">
        <table className="crew-time-edit-race-times-table__table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
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
