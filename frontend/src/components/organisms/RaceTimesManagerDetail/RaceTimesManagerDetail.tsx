import React, { ReactElement, useEffect, useState } from 'react'
import axios, { AxiosResponse } from 'axios'
import Header from '../Header/Header'
import { RaceProps } from '../../components.types'
import TextButton from '../../atoms/TextButton/TextButton'
import { useHistory, useParams } from 'react-router-dom'
import Hero from '../Hero/Hero'
import './RaceTimesManagerDetail.scss'

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
      .then(()=> history.push('/generate-results/crew-management-dashboard'))
      .catch(err => setErrors(err.response.data))
    } else {
    axios.put(`/api/races/${routeParams.id}/`, data)
      .then(()=> history.push('/generate-results/crew-management-dashboard'))
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
      .then(()=> history.push('/generate-results/crew-management-dashboard'))
      .catch(err => setErrors(err.response.data))
    }

  const handleCheckbox = (e:React.ChangeEvent<HTMLInputElement>):void => {
    if (e.target.name === "is_timing_reference") {
      setRaceFormData({ ...raceFormData, [e.target.name]: e.target.checked})
    } else {
      setRaceFormData({ ...raceFormData, [e.target.name]: e.target.checked})
    }
  }
 

  return (
    <>
      <Header />
      <Hero title={'Add / edit race'} />
      <section className="race-times-manager-detail__section">
      <div className="race-times-manager-detail__container">
        {
          <form onSubmit={handleSubmit} className="race-times-manager-detail__form">

            <div className="field">
              <label className="label" htmlFor="raceName">Race name (eg Results A)</label>
              <input
                className="input"
                name="name"
                id="raceName"
                defaultValue={raceFormData.name}
                onChange={handleChange} />
            </div>

            <div className="field">
              <label className="label" htmlFor="raceId">Race id</label>
              <input
                className="input"
                name="race_id"
                id="raceId"
                defaultValue={raceFormData.race_id || ''}
                onChange={handleChange} />
            </div>

            <div className="field">
              <label className="checkbox" htmlFor="default_start">
                <input
                  className="checkbox"
                  type="checkbox"
                  name="default_start"
                  checked={!!raceFormData.default_start}
                  onChange={handleCheckbox} /> Set as default race data to use for start times
              </label>
            </div>
            <div className="field">
              <label className="checkbox" htmlFor="default_finish">
                <input
                  className="checkbox"
                  type="checkbox"
                  name="default_finish"
                  checked={!!raceFormData.default_finish}
                  onChange={handleCheckbox} /> Set as default race data to use for finish times
              </label>
            </div>
            <div className="field">
              <label className="checkbox" htmlFor="is_timing_reference">
                <input
                  className="checkbox"
                  type="checkbox"
                  name="is_timing_reference"
                  checked={!!raceFormData.is_timing_reference}
                  onChange={handleCheckbox} /> Use this race as the time source (ie offset = 0)
              </label>
            </div>

            <div className="field">
              <TextButton label={"Submit"} isSubmit={true}/>
            </div>
            <div className="field">
              <TextButton label={"Delete race"} onClick={handleDelete} isCancel/>
            </div>
          </form>
        }
      </div>
      </section>
    </>
  )
}