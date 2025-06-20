import React, { ReactElement, useEffect, useState } from 'react'
import axios, { AxiosResponse } from 'axios'
import Header from '../Header/Header'
import { RaceProps } from '../../components.types'
import TextButton from '../../atoms/TextButton/TextButton'
import { useHistory, useParams } from 'react-router-dom'
import Hero from '../Hero/Hero'

type RaceTimesManagerParams = {
  id: string;
};

// type OptionType = {
//   value: string;
//   label: string;
// };

// type AdditionalType = {
//   page: number;
// };

export default function RaceTimesManagerDetail () {
  const [raceFormData, setRaceFormData] = useState<Partial<RaceProps>> ({})
  const [errors, setErrors] = useState({})
  const routeParams = useParams<RaceTimesManagerParams>()
  const history = useHistory()
  
  const fetchData = async () => {

    try {
      const raceResponse: AxiosResponse = await axios.get(`/api/race/${routeParams.id}/`);
      const raceResponseData = raceResponse.data;
      setRaceFormData(raceResponseData)

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
    axios.post(`/api/race-list/`, data)
      .then(()=> history.push('/generate-results/race-times'))
      .catch(err => setErrors(err.response.data))
    } else {
    axios.put(`/api/race/${routeParams.id}/`, data)
      .then(()=> history.push('/generate-results/race-times'))
      .catch(err => setErrors(err.response.data))
    }
    // history.push('/generate-results/race-times')  
  }

  const handleChange = (e:React.ChangeEvent<HTMLInputElement>):void => {
    setRaceFormData({ ...raceFormData, [e.target.name]: e.target.value})
    setErrors({ ...errors, [e.target.name]: ''})
  }

  const handleDelete = () => {
    console.log(raceFormData)
    
    axios.delete(`/api/race/${routeParams.id}`)
      .then(()=> history.push('/generate-results/race-times'))
      .catch(err => setErrors(err.response.data))
    
    history.push('/generate-results/race-times')  
  }

  const handleCheckbox = (e:React.ChangeEvent<HTMLInputElement>):void => {
    setRaceFormData({ ...raceFormData, [e.target.name]: e.target.checked})
  }
 

  return (
    <>
      <Header />
      <Hero title={'Add / edit race'} />
      <section className="section">
      <div className="container">
        {
          <form onSubmit={handleSubmit} className="has-text-centered">

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
                  onChange={handleCheckbox} /> Set as data to use for start times
              </label>
            </div>
            <div className="field">
              <label className="checkbox" htmlFor="default_finish">
                <input
                  className="checkbox"
                  type="checkbox"
                  name="default_finish"
                  checked={!!raceFormData.default_finish}
                  onChange={handleCheckbox} /> Set as data to use for finish times
              </label>
            </div>

            <div className="field">
              <TextButton label={"Submit"} isSubmit={true}/>
            </div>
            <div className="field">
              <TextButton label={"Delete key"} onClick={handleDelete} isCancel/>
            </div>
          </form>
        }
      </div>
      </section>
    </>
  )
}