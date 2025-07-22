import React, { useState, useEffect } from "react"
import axios, { AxiosResponse } from "axios"
import Hero from "../../organisms/Hero/Hero"
import Header from "../../organisms/Header/Header"
import "./setNumberLocations.scss"
import { NumberLocationProps } from "../../components.types"
import TextButton from "../../atoms/TextButton/TextButton"
import { Link } from "react-router-dom"

export default function SetNumberLocations () {
  const [hosts, setHosts] = useState<NumberLocationProps[]>()

  const fetchData = async (url: string) => {
    console.log(url)
    try {
    
      const response: AxiosResponse = await axios.get(url);
      
      const responseData: NumberLocationProps[] = response.data;
      console.log(responseData)
      setHosts(responseData)

    } catch (error) {
    
      console.error(error)
      
    }
  };

  useEffect(() => {
    fetchData("/api/number-locations/")
  },[])

  return (
    <>
      <Header />
      <Hero title={"Set Number locations for host clubs"} />
      <section className="set-number-location__section">
        <div className="set-number-location__container">
          <form>
            <table className="set-number-location__table table">
              <thead>
                <tr>
                  <td>Id</td>
                  <td>Host club</td>
                  <td>Number location</td>
                </tr>
              </thead>
              <tfoot>
                <tr>
                  <td>Id</td>
                  <td>Host club</td>
                  <td>Number location</td>
                </tr>
              </tfoot>
              <tbody>
                {hosts && hosts.map(host => 
                  <tr key={host.id}>
                    <td><Link to={`/generate-start-order/set-number-locations/${host.id}/edit`}>{host.id}</Link></td>
                    <td>{host.club}</td>
                    <td>{host.number_location}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="field is-grouped">
              <p className="control">
                <TextButton label={'Add new'} pathName={'/generate-start-order/set-number-locations/new'}/>
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}