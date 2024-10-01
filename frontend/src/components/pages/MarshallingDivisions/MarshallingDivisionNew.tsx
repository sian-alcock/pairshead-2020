import React, { useState } from 'react'
import { useHistory } from 'react-router'
import axios from 'axios'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import TextButton from '../../atoms/TextButton/TextButton'
import { MarshallingDivisionProps } from '../../components.types'

export default function MarshallingDivisionNew () {
  const history = useHistory()
  const [errors, setErrors] = useState<Partial<MarshallingDivisionProps>> ({})
  const [formData, setFormData] = useState<Partial<MarshallingDivisionProps>> ({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value})
    setErrors({ ...errors, [e.target.name]: ''})
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()

    const data = 	{
      ...formData,
    }

    axios.post('/api/marshalling-divisions/', data)
      .then(()=> history.push('/generate-start-order/marshalling-divisions'))
      .catch(err => setErrors(err.response.data))
  }

  return (
    <>
    <Header />
    <Hero title={'Add new marshalling division'} />
    <section className='section'>
      <div className="container">
        <form onSubmit={handleSubmit}>

        <div className="field">
            <label className="label" htmlFor="name">Name</label>
            <input
              className="input"
              type="text"
              name="name"
              id="name"
              placeholder="eg: Division 1"
              onChange={handleChange}
            />
          </div>
          {errors && errors.name && <small className="help is-danger">{errors.name}</small>}

          <div className="field">
            <label className="label" htmlFor="topRange">Top of range</label>
            <input
              className="input"
              type="text"
              name="top_range"
              id="topRange"
              placeholder="eg: Thames RC"
              onChange={handleChange}
            />
          </div>
          {errors && errors.top_range && <small className="help is-danger">{errors.top_range}</small>}


          <div className="field">
            <TextButton label={'Submit'} isSubmit={true} />
          </div>
        </form>

      </div>
    </section>
    </>
  )
}