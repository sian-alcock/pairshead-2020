import React, { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table'
import { formatTimes } from '../../../../lib/helpers'
import { TimeProps, TimingOffsetProps } from '../../../components.types'

// Define the row data structure
interface RaceTimeRow {
  raceId: string
  race: TimeProps['race']
  start: TimeProps | null
  finish: TimeProps | null
  rawTime: number
}

export const CrewRaceTimesTable: React.FC<{
  times: TimeProps[];
  startOverride?: string | null;
  finishOverride?: string | null;
  onStartOverrideChange: (raceId: string | null) => void;
  onFinishOverrideChange: (raceId: string | null) => void;
  offsetData: TimingOffsetProps[];
}> = ({
  times,
  startOverride,
  finishOverride,
  onStartOverrideChange,
  onFinishOverrideChange,
  offsetData
}) => {
  
  // Get the default start and finish race IDs
  const getDefaultStartRaceId = () => {
    const defaultStart = times.find(t => t.race.default_start && t.tap === 'Start');
    return defaultStart?.race.race_id;
  };

  const getDefaultFinishRaceId = () => {
    const defaultFinish = times.find(t => t.race.default_finish && t.tap === 'Finish');
    return defaultFinish?.race.race_id;
  };

  const defaultStartRaceId = getDefaultStartRaceId();
  const defaultFinishRaceId = getDefaultFinishRaceId();

  const getSelectedStartRaceId = () => {
    if (startOverride) {
      const overrideRace = times.find(t => t.race.id.toString() === startOverride);
      return overrideRace?.race.race_id;
    }
    return defaultStartRaceId;
  };

  const getSelectedFinishRaceId = () => {
    if (finishOverride) {
      const overrideRace = times.find(t => t.race.id.toString() === finishOverride);
      return overrideRace?.race.race_id;
    }
    return defaultFinishRaceId;
  };

  const getSelectedRawTime = () => {
    let startTap = times.find(t => t.race.default_start && t.tap === 'Start')?.time_tap;
    let finishTap = times.find(t => t.race.default_finish && t.tap === 'Finish')?.time_tap;

    if (startOverride) {
      startTap = times.find(t => t.race.id.toString() === startOverride && t.tap === 'Start')?.time_tap;
    }
    if (finishOverride) {
      finishTap = times.find(t => t.race.id.toString() === finishOverride && t.tap === 'Finish')?.time_tap;
    }

    return startTap && finishTap ? finishTap - startTap : 0;
  }

  const handleStartRadioChange = (raceId: string) => {
    // If selecting the default, clear the override
    if (raceId === defaultStartRaceId) {
      onStartOverrideChange(null);
    } else {
      const race = data.find(row => row.raceId === raceId)?.race;
      if (race) {
        onStartOverrideChange(race.id);
      }
    }
  };

  const handleFinishRadioChange = (raceId: string) => {
    // If selecting the default, clear the override
    if (raceId === defaultFinishRaceId) {
      onFinishOverrideChange(null);
    } else {
      const race = data.find(row => row.raceId === raceId)?.race;
      if (race) {
        onFinishOverrideChange(race.id);
      }
    }
  };

  // Transform times data into table rows
  const data = useMemo<RaceTimeRow[]>(() => {
    const groupedTimes = times.reduce((acc, time) => {
      const raceId = time.race.race_id;
      if (!acc[raceId]) {
        acc[raceId] = { 
          race: time.race, 
          start: null, 
          finish: null 
        };
      }
      if (time.tap === 'Start') {
        acc[raceId].start = time;
      } else if (time.tap === 'Finish') {
        acc[raceId].finish = time;
      }
      return acc;
    }, {} as Record<string, { race: TimeProps['race']; start: TimeProps | null; finish: TimeProps | null }>);

    return Object.entries(groupedTimes).map(([raceId, groupData]) => ({
      raceId,
      race: groupData.race,
      start: groupData.start,
      finish: groupData.finish,
      rawTime: groupData.start && groupData.finish ? 
        groupData.finish.time_tap - groupData.start.time_tap : 0
    }));
  }, [times]);

  // Define columns using column helper
  const columnHelper = createColumnHelper<RaceTimeRow>()

  const columns = useMemo<ColumnDef<RaceTimeRow, any>[]>(() => [
    columnHelper.accessor('race', {
      id: 'race',
      header: 'Race',
      cell: ({ getValue }) => {
        const race = getValue()
        return (
          <div className="race-times-table__race-info">
            <strong className="race-times-table__race-name">{race.name}</strong>
            <br />
            <small className="race-times-table__race-id">ID: {race.race_id}</small>
            <div className="race-times-table__tags">
              {race.default_start && (
                <span className="race-times-table__tag race-times-table__tag--default-start">
                  Default Start
                </span>
              )}
              {race.default_finish && (
                <span className="race-times-table__tag race-times-table__tag--default-finish">
                  Default Finish
                </span>
              )}
            </div>
          </div>
        )
      }
    }),
    
    columnHelper.accessor('start', {
      id: 'startTime',
      header: 'Start Time',
      cell: ({ getValue }) => {
        const start = getValue()
        return start ? (
          <span className="race-times-table__time race-times-table__time--available">
            {formatTimes(start.time_tap)}
          </span>
        ) : (
          <span className="race-times-table__time race-times-table__time--unavailable">
            No start time
          </span>
        )
      }
    }),
    
    columnHelper.accessor('raceId', {
      id: 'useStart',
      header: 'Use Start',
      cell: ({ getValue, row }) => {
        const raceId = getValue()
        const hasStart = row.original.start
        
        return hasStart ? (
          <label className="race-times-table__radio-label">
            <input
              className="race-times-table__radio-input"
              type="radio"
              name="start_race_selection"
              value={raceId}
              checked={getSelectedStartRaceId() === raceId}
              onChange={() => handleStartRadioChange(raceId)}
            />
            <span className="race-times-table__radio-text">Use</span>
          </label>
        ) : null
      }
    }),
    
    columnHelper.accessor('finish', {
      id: 'finishTime',
      header: 'Finish Time',
      cell: ({ getValue }) => {
        const finish = getValue()
        return finish ? (
          <span className="race-times-table__time race-times-table__time--available">
            {formatTimes(finish.time_tap)}
          </span>
        ) : (
          <span className="race-times-table__time race-times-table__time--unavailable">
            No finish time
          </span>
        )
      }
    }),
    
    columnHelper.accessor('raceId', {
      id: 'useFinish',
      header: 'Use Finish',
      cell: ({ getValue, row }) => {
        const raceId = getValue()
        const hasFinish = row.original.finish
        
        return hasFinish ? (
          <label className="race-times-table__radio-label">
            <input
              className="race-times-table__radio-input"
              type="radio"
              name="finish_race_selection"
              value={raceId}
              checked={getSelectedFinishRaceId() === raceId}
              onChange={() => handleFinishRadioChange(raceId)}
            />
            <span className="race-times-table__radio-text">Use</span>
          </label>
        ) : null
      }
    }),
    
    columnHelper.accessor('rawTime', {
      id: 'rawTime',
      header: 'Raw Time',
      cell: ({ getValue, row }) => {
        const { start, finish } = row.original
        return start && finish ? formatTimes(getValue()) : '-'
      }
    })
  ], [getSelectedStartRaceId, getSelectedFinishRaceId, handleStartRadioChange, handleFinishRadioChange])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  console.log(offsetData)

  return (
    <div className="race-times-table">
      <h4 className="race-times-table__title">Race Times</h4>
      
      <div className="race-times-table__wrapper">
        <table className="race-times-table__table">
          <thead className="race-times-table__thead">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="race-times-table__header-row">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="race-times-table__th">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="race-times-table__tbody">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="race-times-table__row">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="race-times-table__td">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary of current selection */}
      <div className="race-times-table__summary">
        <p className="race-times-table__summary-title">
          <strong>Current Selection:</strong>
        </p>
        <p className="race-times-table__summary-item">
          Start: {(() => {
            const selectedStartId = getSelectedStartRaceId();
            const selectedRace = data.find(row => row.raceId === selectedStartId);
            return selectedStartId && selectedRace ? 
              `${selectedRace.race.name} ${startOverride ? '(Override)' : '(Default)'}` : 
              'None selected';
          })()}
        </p>
        <p className="race-times-table__summary-item">
          Finish: {(() => {
            const selectedFinishId = getSelectedFinishRaceId();
            const selectedRace = data.find(row => row.raceId === selectedFinishId);
            return selectedFinishId && selectedRace ? 
              `${selectedRace.race.name} ${finishOverride ? '(Override)' : '(Default)'}` : 
              'None selected';
          })()}
        </p>
        <p className="race-times-table__summary-item">
          Raw time for crew based on selection: {(() => {
            const selectedRawTime = getSelectedRawTime();
            return selectedRawTime ? 
              `${formatTimes(selectedRawTime)}` : 
              'None';
          })()}
        </p>
      </div>
    </div>
  );
};