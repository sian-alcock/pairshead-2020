import React, { useState, useEffect } from "react"
import axios, { AxiosResponse } from "axios"
import Hero from "../../organisms/Hero/Hero"
import Header from "../../organisms/Header/Header"
import "./marshallingDivisions.scss"
import TextButton from "../../atoms/TextButton/TextButton"
import { Link } from "react-router-dom"
import { MarshallingDivisionProps } from "../../components.types"

interface ResponseParamsProps {

}

interface ResponseDataProps {
  results: MarshallingDivisionProps[];
}

export default function MarshallingDivisions () {
  const [divisions, setDivisions] = useState<MarshallingDivisionProps[]>()

  const fetchData = async (url: string, params: ResponseParamsProps) => {
    console.log(url)
    console.log(params)
    try {
    
      const response: AxiosResponse = await axios.get(url, {
        params: params
      });
      
      const responseData: ResponseDataProps = response.data;
      console.log(responseData)
      setDivisions(responseData.results)

    } catch (error) {
    
      console.error(error)
      
    }
  };

  useEffect(() => {
    fetchData("/api/marshalling-divisions/", {
      page_size: "50",
      order: "id"
    })
  },[])

  const headings = ['id', 'Name', 'Bottom range', 'Top range']
  const getHeadings = () => {
    return headings.map((heading) => <td key={heading}>{heading}</td>)
  }

  return (
    <>
      <Header />
      <Hero title={"Set marshalling divisions"} />
      <section className="marshalling-divisions__section">
        <div className="marshalling-divisions__container">
          <form>
            <table className="marshalling-divisions__table table">
              <thead>
                <tr>{getHeadings()}</tr>
              </thead>
              <tfoot>
                <tr>{getHeadings()}</tr>
              </tfoot>
              <tbody>
                {divisions && divisions.map(division => 
                  <tr key={division.id}>
                    <td><Link to={`/generate-start-order/marshalling-divisions/${division.id}/edit`}>{division.id}</Link></td>
                    <td>{division.name}</td>
                    <td>{division.bottom_range}</td>
                    <td>{division.top_range}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="field is-grouped">
              <p className="control">
                <TextButton label={'Add new'} pathName={'/generate-start-order/marshalling-divisions/new'}/>
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}