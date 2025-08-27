import React, { useState } from 'react'
import { useHistory } from 'react-router'
import axios from 'axios'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import TextButton from '../../atoms/TextButton/TextButton'
import { NumberLocationProps } from '../../../types/components.types'

export default function NumberLocationNew () {
  const history = useHistory()
  const [errors, setErrors] = useState<Partial<NumberLocationProps>> ({})
  const [formData, setFormData] = useState<Partial<NumberLocationProps>> ({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value})
    setErrors({ ...errors, [e.target.name]: ''})
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()

    const data = 	{
      ...formData,
    }

    axios.post('/api/number-locations/', data)
      .then(()=> history.push('/generate-start-order/set-number-locations'))
      .catch(err => setErrors(err.response.data))
  }

  return (
    <>
    <Header />
    <Hero title={'Add new number location'} />
    <section className='section'>
      <div className="container">
        <form onSubmit={handleSubmit}>

        <div className="field">
            <label className="label" htmlFor="club">Club</label>
            <input
              className="input"
              type="text"
              name="club"
              id="club"
              placeholder="eg: Thames RC"
              onChange={handleChange}
            />
          </div>
          {errors && errors.number_location && <small className="help is-danger">{errors.number_location}</small>}

          <div className="field">
            <label className="label" htmlFor="numberLocation">Number location</label>
            <input
              className="input"
              type="text"
              name="number_location"
              id="numberLocation"
              placeholder="eg: Thames RC"
              onChange={handleChange}
            />
          </div>
          {errors && errors.number_location && <small className="help is-danger">{errors.number_location}</small>}


          <div className="field">
            <TextButton label={'Submit'} isSubmit={true} />
          </div>
        </form>

      </div>
    </section>
    </>
  )
}