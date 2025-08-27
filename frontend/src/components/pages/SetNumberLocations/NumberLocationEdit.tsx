import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useHistory } from 'react-router'
import axios from 'axios'
import useFetchData from '../../hooks/use-fetch-data'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import TextButton from '../../atoms/TextButton/TextButton'
import { NumberLocationProps } from '../../../types/components.types'

type NumberLocationParams = {
  id: string;
};

export default function NumberLocationEdit () {

  const routeParams = useParams<NumberLocationParams>()
  const history = useHistory()

  const {
    data,
    loading
  } = useFetchData(`/api/number-locations/${routeParams.id}`)
  const [errors, setErrors] = useState<Partial<NumberLocationProps>> ({})
  const [formData, setFormData] = useState<Partial<NumberLocationProps>> ({})

  useEffect(() => setFormData({ ...data }), [!loading])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value})
    setErrors({ ...errors, [e.target.name]: ''})
  }

  const handleDelete = () => {
    axios.delete(`/api/number-locations/${routeParams.id}`)
      .then(()=> history.push('/generate-start-order/set-number-locations'))
      .catch(err => console.log(err))
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()

    console.log(formData)
    
    axios.put(`/api/number-locations/${routeParams.id}`, formData)
      .then(()=> history.push('/generate-start-order/set-number-locations'))
      .catch(err => setErrors(err.response.data))
  }
  
  return (
    <>
    <Header />
    <Hero title={'Modify number location'} />
    <section className='section'>
      <div className="container">
        {loading && <div>Loading</div>}
        {!loading && (
          <form onSubmit={handleSubmit} className="has-text-centered">

            <div className="field">
              <label className="label" htmlFor="club">Club</label>
              <input
                className="input"
                name="club"
                id="club"
                defaultValue={formData.club}
                onChange={handleChange} />
            </div>

            <div className="field">
              <label className="label" htmlFor="numberLocation">Number location</label>
              <input
                className="input"
                name="number_location"
                id="numberLocation"
                defaultValue={formData.number_location || ''}
                onChange={handleChange} />
            </div>

            <div className="field">
              <TextButton label={"Submit"} isSubmit={true}/>
            </div>
            <div className="field">
              <TextButton label={"Delete entry"} onClick={handleDelete}/>
            </div>
          </form>
        )}
      </div>
    </section></>
  )
}