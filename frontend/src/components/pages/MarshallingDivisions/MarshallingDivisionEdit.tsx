import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useHistory } from 'react-router'
import axios from 'axios'
import useFetchData from '../../hooks/use-fetch-data'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import TextButton from '../../atoms/TextButton/TextButton'
import { MarshallingDivisionProps } from '../../components.types'

type MarshallingDivisionParams = {
  id: string;
};

export default function MarshallingDivisionEdit () {

  const routeParams = useParams<MarshallingDivisionParams>()
  const history = useHistory()

  const {
    data,
    loading
  } = useFetchData(`/api/marshalling-divisions/${routeParams.id}`)
  const [errors, setErrors] = useState<Partial<MarshallingDivisionProps>> ({})
  const [formData, setFormData] = useState<Partial<MarshallingDivisionProps>> ({})

  useEffect(() => setFormData({ ...data }), [!loading])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value})
    setErrors({ ...errors, [e.target.name]: ''})
  }

  const handleDelete = () => {
    axios.delete(`/api/marshalling-divisions/${routeParams.id}`)
      .then(()=> history.push('/generate-start-order/marshalling-divisions'))
      .catch(err => console.log(err))
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()

    console.log(formData)
    
    axios.put(`/api/marshalling-divisions/${routeParams.id}`, formData)
      .then(()=> history.push('/generate-start-order/marshalling-divisions'))
      .catch(err => setErrors(err.response.data))

  }
  return (
    <>
    <Header />
    <Hero title={'Modify marshalling division'} />
    <section className='section'>
      <div className="container">
        {loading && <div>Loading</div>}
        {!loading && (
          <form onSubmit={handleSubmit} className="has-text-centered">

            <div className="field">
              <label className="label" htmlFor="name">Name</label>
              <input
                className="input"
                name="name"
                id="name"
                defaultValue={formData.name}
                onChange={handleChange} />
            </div>

            <div className="field">
              <label className="label" htmlFor="topRange">Top of the range</label>
              <input
                className="input"
                name="top_range"
                id="topRange"
                defaultValue={formData.top_range || ''}
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