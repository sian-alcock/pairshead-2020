import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useHistory } from 'react-router-dom'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import { FormInput } from '../../atoms/FormInput/FormInput'
import TextButton from '../../atoms/TextButton/TextButton'
import './register.scss'

// Type definitions
interface RegisterFormData {
  username: string
  email: string
  password: string
  password_confirmation: string
}

interface RegisterErrors {
  username?: string
  email?: string
  password?: string
  password_confirmation?: string
  [key: string]: string | undefined
}

interface RegisterResponse {
  message: string
}

// API function
const registerUser = async (formData: RegisterFormData): Promise<RegisterResponse> => {
  const response = await axios.post('/api/register/', formData)
  return response.data
}

const Register: React.FC = () => {
  const history = useHistory()
  
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    password_confirmation: ''
  })
  
  const [errors, setErrors] = useState<RegisterErrors>({})

  // React Query mutation
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast.success(data.message)
      history.push('/login')
    },
    onError: (error: any) => {
      if (error.response?.data) {
        setErrors(error.response.data)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    registerMutation.mutate(formData)
  }

  return (
    <>
      <Header />
      <Hero title={'Register new user'} />
      <section className="register__section">
        <div className="register__container">
          <div className="register__wrapper">
            <form className="register__form" onSubmit={handleSubmit}>
              <div className="field">
                <FormInput
                  onChange={handleChange}
                  type="text"
                  label="Username"
                  fieldName="username"
                  value={formData.username}
                  disabled={registerMutation.isPending} />
                {errors.username && <small className="help">{errors.username}</small>}
              </div>

              <div className="field">
                <FormInput
                  onChange={handleChange}
                  type="email"
                  label="Email"
                  fieldName="email"
                  value={formData.email}
                  disabled={registerMutation.isPending} />
                {errors.email && <small className="help">{errors.email}</small>}
              </div>

              <div className="field">
                <FormInput
                  onChange={handleChange}
                  type="password"
                  label="Password"
                  fieldName="password"
                  value={formData.password}
                  disabled={registerMutation.isPending} />
                {errors.password && <small className="help">{errors.password}</small>}
              </div>

              <div className="field">
                <FormInput
                  onChange={handleChange}
                  type="password"
                  label="Password confirmation"
                  fieldName="password_confirmation"
                  value={formData.password_confirmation}
                  disabled={registerMutation.isPending} />
                {errors.password_confirmation && <small className="help">{errors.password_confirmation}</small>}
              </div>

              <TextButton
                isSubmit
                label={registerMutation.isPending ? 'Submitting...' : 'Submit'}
                disabled={registerMutation.isPending} />
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default Register