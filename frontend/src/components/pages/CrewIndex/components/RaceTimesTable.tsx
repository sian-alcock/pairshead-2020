import React from 'react'
import { formatTimes } from '../../../../lib/helpers'
import { TimeProps, TimingOffsetProps } from '../../../components.types'

export const RaceTimesTable: React.FC<{
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
  // Group times by race ID
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
    // If there's an override, find the race_id for that database ID
    if (startOverride) {
      const overrideRace = times.find(t => t.race.id.toString() === startOverride);
      return overrideRace?.race.race_id;
    }
    return defaultStartRaceId;
  };

  const getSelectedFinishRaceId = () => {
    // If there's an override, find the race_id for that database ID
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
    const race = groupedTimes[raceId]?.race;
    if (!race) return;
    
    // If selecting the default, clear the override
    if (raceId === defaultStartRaceId) {
      onStartOverrideChange(null);
    } else {
      onStartOverrideChange(race.id);
    }
  };

  const handleFinishRadioChange = (raceId: string) => {
    const race = groupedTimes[raceId]?.race;
    if (!race) return;
    
    // If selecting the default, clear the override
    if (raceId === defaultFinishRaceId) {
      onFinishOverrideChange(null);
    } else {
      onFinishOverrideChange(race.id);
    }
  };

  console.log(offsetData)

  return (
    <div className="box">
      <h4 className="title is-5">Race Times</h4>
      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Race</th>
            <th>Start Time</th>
            <th>Use Start</th>
            <th>Finish Time</th>
            <th>Use Finish</th>
            <th>Raw time</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedTimes).map(([raceId, data]) => (
            <tr key={raceId}>
              <td>
                <strong>{data.race.name}</strong>
                <br />
                <small className="has-text-grey">ID: {raceId}</small>
                {data.race.default_start && (
                  <span className="tag is-small is-info ml-2">Default Start</span>
                )}
                {data.race.default_finish && (
                  <span className="tag is-small is-info ml-2">Default Finish</span>
                )}
              </td>
              
              {/* Start Time Column */}
              <td>
                {data.start ? (
                  <span className="has-text-weight-medium">
                    {formatTimes(data.start.time_tap)}
                  </span>
                ) : (
                  <span className="has-text-grey-light">No start time</span>
                )}
              </td>
              
              {/* Start Radio Column */}
              <td>
                {data.start && (
                  <label className="radio">
                    <input
                      type="radio"
                      name="start_race_selection"
                      value={raceId}
                      checked={getSelectedStartRaceId() === raceId}
                      onChange={() => handleStartRadioChange(raceId)}
                    />
                    <span className="ml-1">Use</span>
                  </label>
                )}
              </td>
              
              {/* Finish Time Column */}
              <td>
                {data.finish ? (
                  <span className="has-text-weight-medium">
                    {formatTimes(data.finish.time_tap)}
                  </span>
                ) : (
                  <span className="has-text-grey-light">No finish time</span>
                )}
              </td>
              {/* Finish Radio Column */}
              <td>
                {data.finish && (
                  <label className="radio">
                    <input
                      type="radio"
                      name="finish_race_selection"
                      value={raceId}
                      checked={getSelectedFinishRaceId() === raceId}
                      onChange={() => handleFinishRadioChange(raceId)}
                    />
                    <span className="ml-1">Use</span>
                  </label>
                )}
              </td>
              {/* Raw time */}
              <td>{data.finish && data.start && formatTimes(data.finish.time_tap - data.start.time_tap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Summary of current selection */}
      <div className="notification is-light">
        <p>
          <strong>Current Selection:</strong>
        </p>
        <p>
          Start: {(() => {
            const selectedStartId = getSelectedStartRaceId();
            return selectedStartId ? 
              `${groupedTimes[selectedStartId]?.race.name} ${startOverride ? '(Override)' : '(Default)'}` : 
              'None selected';
          })()}
        </p>
        <p>
          Finish: {(() => {
            const selectedFinishId = getSelectedFinishRaceId();
            return selectedFinishId ? 
              `${groupedTimes[selectedFinishId]?.race.name} ${finishOverride ? '(Override)' : '(Default)'}` : 
              'None selected';
          })()}
        </p>
        <p>
          Raw time for crew based on selection: {(() => {
            const selectedRawTime = getSelectedRawTime();
            return selectedRawTime ? 
              `${selectedRawTime}` : 
              'None';
          })()}
        </p>
      </div>
    </div>
  );
};
