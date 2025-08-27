import React, { ReactElement, useEffect, useState } from 'react'
import axios, { AxiosResponse } from 'axios'
import Header from '../Header/Header'
import { RaceProps } from '../../../types/components.types'
import TextButton from '../../atoms/TextButton/TextButton'
import { useHistory, useParams } from 'react-router-dom'
import Hero from '../Hero/Hero'
import './RaceTimesManagerDetail.scss'
import { FormInput } from '../../atoms/FormInput/FormInput'
import Checkbox from '../../atoms/Checkbox/Checkbox'

type RaceTimesManagerParams = {
  id: string;
};

export default function RaceTimesManagerDetail () {
  const [raceFormData, setRaceFormData] = useState<Partial<RaceProps>> ({})
  const [errors, setErrors] = useState({})
  const routeParams = useParams<RaceTimesManagerParams>()
  const history = useHistory()
  
  const fetchData = async () => {
    try {
      const raceResponse: AxiosResponse = await axios.get(`/api/races/${routeParams.id}/`);
      const raceResponseData = raceResponse.data;
      setRaceFormData(raceResponseData)
      console.log(raceResponseData)
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (routeParams.id !== undefined) {
      fetchData();
    }
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    console.log(routeParams.id)
    console.log(raceFormData)

    const data = {...raceFormData, 'default_start': raceFormData['default_start'] ? raceFormData['default_start'] : false, 'default_finish': raceFormData['default_finish'] ? raceFormData['default_finish'] : false}

    console.log(data)

    if(routeParams.id === undefined) {
    axios.post(`/api/races/`, data)
      .then(()=> history.push('/generate-results/generate-results/'))
      .catch(err => setErrors(err.response.data))
    } else {
    axios.put(`/api/races/${routeParams.id}/`, data)
      .then(()=> history.push('/generate-results/generate-results/'))
      .catch(err => setErrors(err.response.data))
    }
  }

  const handleChange = (e:React.ChangeEvent<HTMLInputElement>):void => {
    setRaceFormData({ ...raceFormData, [e.target.name]: e.target.value})
    setErrors({ ...errors, [e.target.name]: ''})
  }

  const handleDelete = () => {
    console.log(raceFormData)
    
    axios.delete(`/api/races/${routeParams.id}`)
      .then(()=> history.push('/generate-results/generate-results/'))
      .catch(err => setErrors(err.response.data))
  }

  const handleCheckbox = (e:React.ChangeEvent<HTMLInputElement>):void => {
    setRaceFormData({ ...raceFormData, [e.target.name]: e.target.checked})
  }
 
  return (
    <>
      <Header />
      <Hero title={'Add / edit race'} />
      <section className="race-times-manager-detail__section">
      <div className="race-times-manager-detail__container">
        {
          <form onSubmit={handleSubmit} className="race-times-manager-detail__form">
            <FormInput
              type="text"
              fieldName="name"
              defaultValue={raceFormData.name}
              onChange={handleChange}
              label={'Name'}
            />
            <FormInput
              type="text"
              fieldName="race_id"
              defaultValue={raceFormData.race_id || ''}
              onChange={handleChange}
              label={'Race id'}
            />
            <Checkbox
              name={'default_start'}
              checked={!!raceFormData.default_start}
              label={'Set as default race data to use for start times'}
              id={'default-start'}
              onChange={handleCheckbox}
              value={''}
            />
            <Checkbox
              name={'default_finish'}
              checked={!!raceFormData.default_finish}
              label={'Set as default race data to use for finish times'}
              id={'default-finish'}
              onChange={handleCheckbox}
              value={''}
            />
            <Checkbox
              name={'is_timing_reference'}
              checked={!!raceFormData.is_timing_reference}
              label={'Use this race as the time source (ie offset = 0)'}
              id={'is-timing-reference'}
              onChange={handleCheckbox}
              value={''}
            />

            <div className="race-times-manager-detail__buttons">
              <TextButton label={"Submit"} isSubmit={true}/>
              <TextButton label={"Delete race"} onClick={handleDelete} isCancel/>
            </div>
          </form>
        }
      </div>
      </section>
    </>
  )
}