import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useHistory } from 'react-router'
import axios from 'axios'
import useFetchData from '../../hooks/use-fetch-data'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import TextButton from '../../atoms/TextButton/TextButton'
import { RaceInfoProps } from '../../components.types'
import Toggle from '../../atoms/Toggle/Toggle'
import './raceInfo.scss'

type RaceInfoParams = {
  id: string;
};

export default function RaceInfoEdit () {

  const routeParams = useParams<RaceInfoParams>()
  const history = useHistory()

  const {
    data,
    loading
  } = useFetchData(`/api/global-settings-list/${routeParams.id}`)
  const [errors, setErrors] = useState<Partial<RaceInfoProps>> ({})
  const [formData, setFormData] = useState<Partial<RaceInfoProps>> ({})

  useEffect(() => setFormData({ ...data }), [!loading])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value})
    setErrors({ ...errors, [e.target.name]: ''})
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked})
    setErrors({ ...errors, [e.target.name]: ''})
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    
    axios.put(`/api/global-settings-list/${routeParams.id}`, formData)
      .then(()=> history.push('/settings/race-info'))
      .catch(err => setErrors(err.response.data))
  }
  console.log(formData)
  return (
    <>
    <Header />
    <Hero title={'Modify settings'} />
    <section className='race-info__section'>
      <div className="race-info__container">
        {loading && <div>Loading</div>}
        {!loading &&
          <form onSubmit={handleSubmit} className="race-info__form">
            
            <p>Race time offset</p>
            <p>Enter a time offset below.  This time will be added/subtracted to all finish times.</p>
            <div className="field">
              <Toggle name={'timing_offset_positive'}
                checked={!!formData.timing_offset_positive}
                label={'Make offset positive'}
                id={'timing_offset_positive'}
                onChange={handleCheckbox}
                defaultChecked={formData.timing_offset_positive}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="offsetHours">Hours</label>
              <input
                className="input"
                type="number"
                name="timing_offset_hours"
                id="offsetHours"
                defaultValue={formData.timing_offset_hours || ''}
                onChange={handleChange} />
            </div>

            <div className="field">
              <label className="label" htmlFor="offsetMinutes">Minutes</label>
              <input
                className="input"
                type="number"
                name="timing_offset_minutes"
                id="offsetMinutes"
                min="0"
                max="59"
                defaultValue={formData.timing_offset_minutes || ''}
                onChange={handleChange} />
            </div>

            <div className="field">
              <label className="label" htmlFor="offsetSeconds">Seconds</label>
              <input
                className="input"
                type="number"
                name="timing_offset_seconds"
                id="offsetSeconds"
                min="0"
                max="59"
                defaultValue={formData.timing_offset_seconds || ''}
                onChange={handleChange} />
            </div>

            <div className="field">
              <label className="label" htmlFor="offsetHundredthsSeconds">Hundredths of second</label>
              <input
                className="input"
                type="number"
                name="timing_offset_hundredths_seconds"
                id="offsetHundredthsSeconds"
                min="0"
                max="99"
                defaultValue={formData.timing_offset_hundredths_seconds || ''}
                onChange={handleChange} />
            </div>

            <div className="field">
              <TextButton label={"Submit"} isSubmit={true}/>
            </div>
            {/* <div className="field">
              <TextButton label={"Delete entry"} onClick={handleDelete}/>
            </div> */}
          </form>
        }
      </div>
    </section>
    </>
    )
}
