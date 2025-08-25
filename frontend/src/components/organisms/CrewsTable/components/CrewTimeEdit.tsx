import React, { useState, useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Select from 'react-select'
import axios from 'axios'
import Header from '../../Header/Header'
import Hero from '../../Hero/Hero'
import { CrewRaceTimesTable } from './CrewRaceTimesTable'
import TextButton from '../../../atoms/TextButton/TextButton'
import { TimeProps, TimingOffsetProps } from '../../../components.types'
import './crewTimeEdit.scss'
import { FormInput } from '../../../atoms/FormInput/FormInput'

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

// API functions
const fetchCrewData = async (id: string): Promise<FormData> => {
  const { data } = await axios.get(`/api/crews/${id}`)
  return data
}

const fetchBands = async (): Promise<Band[]> => {
  const { data } = await axios.get('/api/bands/')
  return data
}

const fetchRaceTimeSync = async (): Promise<TimingOffsetProps[]> => {
  const { data } = await axios.get('api/race-time-sync/')
  return data
}

const updateCrew = async ({ id, formData }: { id: string, formData: FormData }) => {
  const data = {
    ...formData,
    band: !formData?.band ? '' : formData.band.id,
    requires_recalculation: true
  }
  
  const { data: response } = await axios.put(`/api/crews/${id}`, data)
  return response
}

const CrewTimeEdit: React.FC = () => {
  const { id } = useParams<RouteParams>()
  const history = useHistory()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState<FormData | undefined>(undefined)
  const [errors, setErrors] = useState<Errors>({})

  // Queries
  const {
    data: crewData,
    isLoading: isCrewLoading,
    error: crewError
  } = useQuery({
    queryKey: ['crew', id],
    queryFn: () => fetchCrewData(id!),
    enabled: !!id
  })

  // Set form data when crew data is loaded
  useEffect(() => {
    if (crewData) {
      setFormData(crewData)
    }
  }, [crewData])

  const {
    data: bandsData = [],
    isLoading: isBandsLoading
  } = useQuery({
    queryKey: ['bands'],
    queryFn: fetchBands,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const {
    data: raceTimeSync = [],
    isLoading: isRaceTimeSyncLoading
  } = useQuery({
    queryKey: ['race-time-sync'],
    queryFn: fetchRaceTimeSync,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Mutation
  const updateCrewMutation = useMutation({
    mutationFn: updateCrew,
    onSuccess: () => {
      // Invalidate and refetch crew data
      queryClient.invalidateQueries({ queryKey: ['crew', id] })
      queryClient.invalidateQueries({ queryKey: ['crews'] }) // If you have a crews list query
      
      // Navigate back
      history.push('/generate-results/crew-management-dashboard/')
    },
    onError: (error: any) => {
      if (error.response?.data) {
        setErrors(error.response.data)
      }
    }
  })

  const getBandOptions = (): BandOption[] => {
    const options = [{ label: '', value: '' }, ...bandsData.map((option: Band) => ({
      label: `${option.event.override_name} ${option.name}`,
      value: option.id
    })).sort()]
    return options
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData || !id) return

    setErrors({}) // Clear previous errors
    updateCrewMutation.mutate({ id, formData })
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

  // Loading state
  if (isCrewLoading || isBandsLoading || isRaceTimeSyncLoading) {
    return (
      <>
        <Header />
        <Hero title={"Edit crew time"} />
        <section className="crew-time-edit__section">
          <div className="crew-time-edit__container">
            <div className="crew-time-edit__loading">Loading...</div>
          </div>
        </section>
      </>
    )
  }

  // Error state
  if (crewError) {
    return (
      <>
        <Header />
        <Hero title={"Edit crew time"} />
        <section className="crew-time-edit__section">
          <div className="crew-time-edit__container">
            <div className="crew-time-edit__error">
              Error loading crew data. Please try again.
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <Header />
      <Hero title={"Edit crew time"} />
      <section className="crew-time-edit__section">
        <div className="crew-time-edit__container">
          <div className="crew-time-edit__box">
            <div className="crew-time-edit__column">
              <div>Crew ID: {formData?.id}</div>
            </div>

            <div className="crew-time-edit__column">
              <div>Crew: {formData?.name}</div>
            </div>

            <div className="crew-time-edit__column">
              <div>Bib number: {formData?.bib_number}</div>
            </div>
          </div>

          <form className="crew-time-edit__form" onSubmit={handleSubmit}>
            <div className="crew-time-edit__form-wrapper">
              <div className="crew-time-edit__field">
                <FormInput
                  fieldName={'penalty'}
                  label={'Penalty in seconds'}
                  type={'number'}
                  value={formData?.penalty || ''}
                  onChange={handleChange}
                  disabled={updateCrewMutation.isPending}
                />
                {errors.penalty && <small className="crew-time-edit__error-text">{errors.penalty}</small>}
              </div>

              <div className="crew-time-edit__field">
                <div className="crew-time-edit__control">
                  <label className="crew-time-edit__label" htmlFor="band">Band</label>
                  <Select
                    id="band"
                    onChange={handleBandChange}
                    options={getBandOptions()}
                    value={!formData?.band ? null : getBandOptions().find(option => option.value === formData.band?.id)}
                    isDisabled={updateCrewMutation.isPending}
                  />
                  {errors.band && <small className="crew-time-edit__error-text">{errors.band}</small>}
                </div>
              </div>
            </div>

            <p className="crew-time-edit__override-title">Override race time</p>

            <div className="crew-time-edit__time-inputs">
              <div className="crew-time-edit__time-input-group">
                <div className="crew-time-edit__field">
                  <FormInput
                    fieldName={'manual_override_minutes'}
                    label={'Minutes'}
                    type={'number'}
                    value={formData?.manual_override_minutes || ''}
                    onChange={handleChange}
                    disabled={updateCrewMutation.isPending}
                    min={0}
                    max={59}
                  />
                  {errors.manual_override_minutes && <small className="crew-time-edit__error-text">{errors.manual_override_minutes}</small>}
                </div>
              </div>

              <div className="crew-time-edit__time-input-group">
                <div className="crew-time-edit__field">
                  <FormInput
                    fieldName={'manual_override_seconds'}
                    label={'Seconds'}
                    type={'number'}
                    value={formData?.manual_override_seconds || ''}
                    onChange={handleChange}
                    disabled={updateCrewMutation.isPending}
                    min={0}
                    max={59}
                  />
                  {errors.manual_override_seconds && <small className="crew-time-edit__error-text">{errors.manual_override_seconds}</small>}
                </div>
              </div>

              <div className="crew-time-edit__time-input-group">
                <div className="crew-time-edit__field">
                  <FormInput
                    fieldName={'manual_override_hundredths_seconds'}
                    label={'Hundredths of seconds'}
                    type={'number'}
                    value={formData?.manual_override_hundredths_seconds || ''}
                    onChange={handleChange}
                    disabled={updateCrewMutation.isPending}
                    min={0}
                    max={99}
                  />
                  {errors.manual_override_hundredths_seconds && <small className="crew-time-edit__error-text">{errors.manual_override_hundredths_seconds}</small>}
                </div>
              </div>
            </div>

            <div className="crew-time-edit__checkboxes">
              <div className="crew-time-edit__checkbox-group">
                <div className="crew-time-edit__field">
                  <label className="crew-time-edit__checkbox-label" htmlFor="time_only">
                    <input
                      className="crew-time-edit__checkbox"
                      type="checkbox"
                      name="time_only"
                      id="time_only"
                      checked={!!formData?.time_only}
                      onChange={handleCheckbox}
                      disabled={updateCrewMutation.isPending}
                    /> Time only
                  </label>
                  {errors.time_only && <small className="crew-time-edit__error-text">{errors.time_only}</small>}
                </div>

                <div className="crew-time-edit__field">
                  <label className="crew-time-edit__checkbox-label" htmlFor="did_not_start">
                    <input
                      className="crew-time-edit__checkbox"
                      type="checkbox"
                      name="did_not_start"
                      id="did_not_start"
                      checked={!!formData?.did_not_start}
                      onChange={handleCheckbox}
                      disabled={updateCrewMutation.isPending}
                    /> Did not start
                  </label>
                  {errors.did_not_start && <small className="crew-time-edit__error-text">{errors.did_not_start}</small>}
                </div>

                <div className="crew-time-edit__field">
                  <label className="crew-time-edit__checkbox-label" htmlFor="did_not_finish">
                    <input
                      className="crew-time-edit__checkbox"
                      type="checkbox"
                      name="did_not_finish"
                      id="did_not_finish"
                      checked={!!formData?.did_not_finish}
                      onChange={handleCheckbox}
                      disabled={updateCrewMutation.isPending}
                    /> Did not finish
                  </label>
                  {errors.did_not_finish && <small className="crew-time-edit__error-text">{errors.did_not_finish}</small>}
                </div>

                <div className="crew-time-edit__field">
                  <label className="crew-time-edit__checkbox-label" htmlFor="disqualified">
                    <input
                      className="crew-time-edit__checkbox"
                      type="checkbox"
                      name="disqualified"
                      id="disqualified"
                      checked={!!formData?.disqualified}
                      onChange={handleCheckbox}
                      disabled={updateCrewMutation.isPending}
                    /> Disqualified
                  </label>
                  {errors.disqualified && <small className="crew-time-edit__error-text">{errors.disqualified}</small>}
                </div>
              </div>
            </div>

            <div className="crew-time-edit__box">
              {formData?.times && (
                <CrewRaceTimesTable
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
            <TextButton 
              isSubmit={true} 
              label={updateCrewMutation.isPending ? "Submitting..." : "Submit"} 
              disabled={updateCrewMutation.isPending}
            />
          </form>
        </div>
      </section>
    </>
  )
}

export default CrewTimeEdit