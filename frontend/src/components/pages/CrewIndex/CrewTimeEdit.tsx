import React, { useState, useEffect, ReactNode } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import Select from 'react-select'
import axios from 'axios'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import { RaceTimesTable } from './components/RaceTimesTable'
import TextButton from '../../atoms/TextButton/TextButton'
import { TimeProps, TimingOffsetProps } from '../../components.types'

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


const CrewTimeEdit: React.FC = () => {
  const { id } = useParams<RouteParams>()
  const history = useHistory()
  
  const [formData, setFormData] = useState<FormData | undefined>(undefined)
  const [errors, setErrors] = useState<Errors>({})
  const [bands, setBands] = useState<BandOption[]>([])
  const [raceTimeSync, setRaceTimeSync] = useState<TimingOffsetProps[]>([])

  useEffect(() => {
    Promise.all([
      axios.get(`/api/crews/${id}`),
      axios.get('/api/bands/'),
      axios.get('api/race-time-sync/')
    ]).then(([res1, res2, res3]) => {
      console.log(res1.data, res2.data)
      setFormData(res1.data)
      setBands(
        res2.data.map((option: Band) => ({
          label: `${option.event.override_name} ${option.name}`,
          value: option.id
        })).sort()
      )
      setRaceTimeSync(res3.data)
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
                  offsetData={raceTimeSync}
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