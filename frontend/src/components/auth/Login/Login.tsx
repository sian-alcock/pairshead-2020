import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useHistory } from 'react-router-dom'
import TextButton from '../../atoms/TextButton/TextButton'
import Auth from '../../../lib/Auth'
import { FormInput } from '../../atoms/FormInput/FormInput'
import './login.scss'

// Type definitions
interface LoginFormData {
  email: string
  password: string
}

interface User {
  id: string | number
  email: string
  username?: string
  [key: string]: any // Allow for additional user properties
}

interface LoginResponse {
  token: string
  user: User
  message: string
}

// API function
const loginUser = async (formData: LoginFormData): Promise<LoginResponse> => {
  const response = await axios.post('/api/login/', formData)
  return response.data
}

const Login: React.FC = () => {
  const history = useHistory()
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  
  const [error, setError] = useState<string>('')

  // React Query mutation
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      Auth.setToken(data.token)
      Auth.setUser(data.user)
      toast.success(data.message)
      history.push({
        pathname: '/',
        state: data.user
      })
    },
    onError: () => {
      Auth.removeToken()
      Auth.removeUser()
      setError('Invalid credentials')
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    loginMutation.mutate(formData)
  }

  return (
    <section className="login__section">
      <div className="login__container">
        <div className="login__hero">
          <div className="login__hero-body">
            <div className="column is-half is-offset-one-quarter">
              <form className="login__form" onSubmit={handleSubmit}>
                <div className="field">
                  <FormInput 
                    fieldName="email" 
                    type="email" 
                    onChange={handleChange} 
                    label="Email"
                    value={formData.email}
                    disabled={loginMutation.isPending}
                  />
                </div>
                <div className="field">
                  <FormInput 
                    fieldName="password" 
                    type="password" 
                    onChange={handleChange} 
                    label="Password"
                    value={formData.password}
                    disabled={loginMutation.isPending}
                  />
                  {error && <small className="help is-danger">{error}</small>}
                </div>
                <TextButton 
                  label={loginMutation.isPending ? "Logging in..." : "Submit"} 
                  isSubmit={true}
                  disabled={loginMutation.isPending}
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login