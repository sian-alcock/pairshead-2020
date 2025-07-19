import React, { useState, useEffect, ReactNode } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import Select from 'react-select'
import axios from 'axios'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import { formatTimes } from '../../../lib/helpers'
import TextButton from '../../atoms/TextButton/TextButton'
import { TimeProps } from '../../components.types'

// Type definitions
interface BandOption {
  label: string
  value: number | string
}

interface Band {
  id: number
  name: string
  event: {
    override_name: string
  }
}

interface FormData {
  // Basic crew info
  id?: string | number
  name?: string
  bib_number?: string
  competitor_names?: string
  
  // Timing data
  category_position_time?: number
  penalty?: number
  manual_override_minutes?: number
  manual_override_seconds?: number
  manual_override_hundredths_seconds?: number
  start_time?: string
  finish_time?: string
  raw_time?: string
  
  // Status flags
  time_only?: boolean
  did_not_start?: boolean
  did_not_finish?: boolean
  disqualified?: boolean
  
  // Band/event info
  band?: {
    id: number
    value: number
  }
  
  // Division/category info
  marshalling_division?: string
  times: TimeProps[];
  race_id_start_override?: string | null;
  race_id_finish_override?: string | null;
}

interface Errors {
  [key: string]: string
}

interface RouteParams {
  id: string
}

const RaceTimesTable: React.FC<{
  times: TimeProps[];
  startOverride?: string | null;
  finishOverride?: string | null;
  onStartOverrideChange: (raceId: string | null) => void;
  onFinishOverrideChange: (raceId: string | null) => void;
}> = ({
  times,
  startOverride,
  finishOverride,
  onStartOverrideChange,
  onFinishOverrideChange
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
            console.log(selectedRawTime)
            return selectedRawTime ? 
              `${formatTimes(selectedRawTime)}` : 
              'None';
          })()}
        </p>
      </div>
    </div>
  );
};

const CrewTimeEdit: React.FC = () => {
  const { id } = useParams<RouteParams>()
  const history = useHistory()
  
  const [formData, setFormData] = useState<FormData | undefined>(undefined)
  const [errors, setErrors] = useState<Errors>({})
  const [bands, setBands] = useState<BandOption[]>([])

  useEffect(() => {
    Promise.all([
      axios.get(`/api/crews/${id}`),
      axios.get('/api/bands/')
    ]).then(([res1, res2]) => {
      console.log(res1.data, res2.data)
      setFormData(res1.data)
      setBands(
        res2.data.map((option: Band) => ({
          label: `${option.event.override_name} ${option.name}`,
          value: option.id
        })).sort()
      )
    })
  }, [id])

  const getBandOptions = (): BandOption[] => {
    const options = [{ label: '', value: '' }, ...bands]
    return options
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData) return

    const data = {
      ...formData,
      band: !formData?.band ? '' : formData.band.id,
      requires_recalculation: true
    }

    axios.put(`/api/crews/${id}`, data)
      .then(() => history.push('/generate-results/crews'))
      .catch(err => setErrors(err.response.data))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return
    const updatedFormData = { ...formData, [e.target.name]: e.target.value }
    setFormData(updatedFormData)
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return
    const updatedFormData = { ...formData, [e.target.name]: e.target.checked }
    setFormData(updatedFormData)
  }

  const handleBandChange = (selectedOption: BandOption | null) => {
    if (selectedOption && formData) {
      const updatedFormData = { ...formData, band: { id: selectedOption.value as number, value: selectedOption.value as number } }
      setFormData(updatedFormData)
    }
  }

const handleStartOverrideChange = (raceId: string | null) => {
  if (!formData) return;
  const updatedFormData = { 
    ...formData, 
    race_id_start_override: raceId 
  };
  setFormData(updatedFormData);
};

const handleFinishOverrideChange = (raceId: string | null) => {
  if (!formData) return;
  const updatedFormData = { 
    ...formData, 
    race_id_finish_override: raceId 
  };
  setFormData(updatedFormData);
};

  console.log(formData)
  console.log(formData?.time_only)

  return (
    <>
      <Header />
      <Hero title={"Edit crew time"} />
      <section className="section">
        <div className="container">
          <div className="box">
            <div className="columns is-multiline">
              <div className="column is-one-third">
                <div>Crew ID: {formData?.id}</div>
              </div>

              <div className="column is-one-third">
                <div>Crew: {formData?.name}</div>
              </div>

              <div className="column is-one-third">
                <div>Bib number: {formData?.bib_number}</div>
              </div>
            </div>
          </div>

          <form className="container box tableBorder" onSubmit={handleSubmit}>
            <div className="columns">
              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="penalty">Penalty in seconds</label>
                  <input
                    className="input"
                    name="penalty"
                    id="penalty"
                    placeholder="eg: 5"
                    value={formData?.penalty || ''}
                    onChange={handleChange}
                  />
                  {errors.penalty && <small className="help is-danger">{errors.penalty}</small>}
                </div>
              </div>

              <div className="column">
                <div className="field">
                  <div className="control">
                    <label className="label" htmlFor="band">Band</label>
                    <Select
                      id="band"
                      onChange={handleBandChange}
                      options={getBandOptions()}
                      value={!formData?.band ? null : bands.find(option => option.value === formData.band?.id)}
                    />
                    {errors.band && <small className="help is-danger">{errors.band}</small>}
                  </div>
                </div>
              </div>
            </div>

            <p>Override race time</p>

            <div className="columns is-one-third">
              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="manual_override_minutes">Minutes</label>
                  <input
                    className="input"
                    type="number"
                    name="manual_override_minutes"
                    id="manual_override_minutes"
                    min="0"
                    max="59"
                    value={formData?.manual_override_minutes || ''}
                    onChange={handleChange}
                  />
                  {errors.manual_override_minutes && <small className="help is-danger">{errors.manual_override_minutes}</small>}
                </div>
              </div>

              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="manual_override_seconds">Seconds</label>
                  <input
                    className="input"
                    type="number"
                    name="manual_override_seconds"
                    id="manual_override_seconds"
                    min="0"
                    max="59"
                    value={formData?.manual_override_seconds || ''}
                    onChange={handleChange}
                  />
                  {errors.manual_override_seconds && <small className="help is-danger">{errors.manual_override_seconds}</small>}
                </div>
              </div>

              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="manual_override_hundredths_seconds">Hundredths of seconds</label>
                  <input
                    className="input"
                    type="number"
                    name="manual_override_hundredths_seconds"
                    id="manual_override_hundredths_seconds"
                    min="0"
                    max="99"
                    value={formData?.manual_override_hundredths_seconds || ''}
                    onChange={handleChange}
                  />
                  {errors.manual_override_hundredths_seconds && <small className="help is-danger">{errors.manual_override_hundredths_seconds}</small>}
                </div>
              </div>
            </div>

            <div className="columns">
              <div className="column">
                <div className="field">
                  <label className="checkbox" htmlFor="time_only">
                    <input
                      className="checkbox"
                      type="checkbox"
                      name="time_only"
                      value={formData?.time_only ? 'true' : 'false'}
                      checked={!!formData?.time_only}
                      onChange={handleCheckbox}
                    /> Time only
                  </label>
                  {errors.time_only && <small className="help is-danger">{errors.time_only}</small>}
                </div>

                <div className="field">
                  <label className="checkbox" htmlFor="did_not_start">
                    <input
                      className="checkbox"
                      type="checkbox"
                      name="did_not_start"
                      value={formData?.did_not_start ? 'true' : 'false'}
                      checked={!!formData?.did_not_start}
                      onChange={handleCheckbox}
                    /> Did not start
                  </label>
                  {errors.did_not_start && <small className="help is-danger">{errors.did_not_start}</small>}
                </div>

                <div className="field">
                  <label className="checkbox" htmlFor="did_not_finish">
                    <input
                      className="checkbox"
                      type="checkbox"
                      name="did_not_finish"
                      value={formData?.did_not_finish ? 'true' : 'false'}
                      checked={!!formData?.did_not_finish}
                      onChange={handleCheckbox}
                    /> Did not finish
                  </label>
                  {errors.did_not_finish && <small className="help is-danger">{errors.did_not_finish}</small>}
                </div>

                <div className="field">
                  <label className="checkbox" htmlFor="disqualified">
                    <input
                      className="checkbox"
                      type="checkbox"
                      name="disqualified"
                      value={formData?.disqualified ? 'true' : 'false'}
                      checked={!!formData?.disqualified}
                      onChange={handleCheckbox}
                    /> Disqualified
                  </label>
                  {errors.disqualified && <small className="help is-danger">{errors.disqualified}</small>}
                </div>
                
            </div>
            </div>

            <div className="box">
              {formData?.times && (
                <RaceTimesTable
                  times={formData.times}
                  startOverride={formData.race_id_start_override?.toString()}
                  finishOverride={formData.race_id_finish_override?.toString()}
                  onStartOverrideChange={handleStartOverrideChange}
                  onFinishOverrideChange={handleFinishOverrideChange}
                />
              )}
            </div>

            <br />
            <TextButton isSubmit={true} label={"Submit"} />
          </form>


        </div>
      </section>
    </>
  )
}

export default CrewTimeEdit