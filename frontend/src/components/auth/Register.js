import React from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'


class Register extends React.Component {

  constructor() {
    super()
    this.state = {
      formData: {},
      errors: {}
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(e) {
    const formData = { ...this.state.formData, [e.target.name]: e.target.value }
    const errors = { ...this.state.errors, [e.target.name]: ''}
    this.setState({ formData, errors})
  }

  handleSubmit(e) {
    e.preventDefault()
    axios.post('/api/register/', this.state.formData)
      .then(res => {
        toast.success(res.data.message)
        this.props.history.push('/login')
      })
      .catch(err => this.setState({ errors: err.response.data }))
  }

  render() {
    console.log(this.state.formData)
    return (
      <section className="section">
        <div className="container">
          <div className="column-is-half is-offset-one-quarter">
            <form onSubmit={this.handleSubmit}>
              <div className="field">
                <label className="label">Username</label>
                <div className="control">
                  <input
                    className="input"
                    name="username"
                    placeholder="eg Steph"
                    onChange={this.handleChange}
                  />
                </div>
                {this.state.errors.username && <small className="help">{this.state.errors.username}</small>}
              </div>
              <div className="field">
                <label className="label">Email</label>
                <div className="control">
                  <input
                    className="input"
                    type="email"
                    name="email"
                    placeholder="eg Steph@gmail.com"
                    onChange={this.handleChange}
                  />
                </div>
                {this.state.errors.email && <small className="help">{this.state.errors.email}</small>}
              </div>
              <div className="field">
                <label className="label">Password</label>
                <div className="control">
                  <input
                    className="input"
                    type="password"
                    name="password"
                    onChange={this.handleChange}
                  />
                </div>
                {this.state.errors.password && <small className="help">{this.state.errors.password}</small>}
              </div>
              <div className="field">
                <label className="label">Password Confirmation</label>
                <div className="control">
                  <input
                    className="input"
                    type="password"
                    name="password_confirmation"
                    onChange={this.handleChange}
                  />
                </div>
                {this.state.errors.password_confirmation && <small className="help">{this.state.errors.password_confirmation}</small>}
              </div>
              <button className="button">Submit</button>
            </form>

          </div> 
        </div>
      </section>
    )
  }
}

export default Register