import React, {useState, useEffect} from 'react'
import axios, { AxiosResponse } from 'axios'
import useNavigation from 'react-router-dom'
import BladeImage from '../../atoms/BladeImage/BladeImage'
import Header from '../../organisms/Header/Header'
import Hero from '../../organisms/Hero/Hero'
import { tableHeadings } from './defaultProps'
import { CrewProps } from '../../components.types'
import "./crewStartByNumberLocation.scss"

interface ResponseParamsProps {
    page_size?: string;
    page?: number;
    order?: string;
    status?: string | string[];
    masters?: boolean;
  }
  
  interface ResponseDataProps {
    count: number;
    requires_ranking_update: number;
    next: number | null;
    previous: number | null;
    results: CrewProps[];
  }

export default function CrewStartByNumberLocation () {
  const [isLoading, setIsLoading] = useState(false);
  const [crews, setCrews] = useState<CrewProps[]>([]);
  const [showHostClubBoolean, setShowHostClubBoolean] = useState(false)
  const [missing, setMissing] = useState(false)

  const fetchData = async (url: string, params: ResponseParamsProps) => {
    console.log(url);
    console.log(params);
    setIsLoading(true)
    try {
      const response: AxiosResponse = await axios.get(url, {
        params: params
      });

      const responseData: CrewProps[] = response.data;

      setCrews(responseData);
      setIsLoading(false)

    //   setTotalCrews(responseData.count);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/crews", {
        page_size: "500",
        page: 1,
        order: 'bib_number',
        status: 'Accepted'
    });
  }, []);

  useEffect(() => {
  }, [showHostClubBoolean]);

  const numberLocations = Array.from(crews.map(host => host.number_location)).sort()
  const uniqueNumberLocations = [...new Set(numberLocations)]

  const showHostClubColumn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowHostClubBoolean(e.target.checked)
  }

  const getTableHeadings = () => {
    return tableHeadings.map((heading) => heading === 'Host club' ? showHostClubBoolean && <td key={heading}>{heading}</td> : <td key={heading}>{heading}</td>)
  }

  return (
    <>
    <Header />
    <Hero title={'Crews by number location'} />
    <section className="crew-start-by-number-location__section">
      <div className="crew-start-by-number-location__container">
        <div className="columns no-print">
          <div className="column">
            <div className="field">
              <label className="checkbox" htmlFor="crewsWithoutFinishTime" >
                <input type="checkbox"  className="checkbox" id="crewsWithoutFinishTime"  onChange={showHostClubColumn} />
                <small>Show host club</small>
              </label>
            </div>
          </div>
        </div>
        <h2 className="crew-start-by-number-location__title">Pairs Head {(new Date().getFullYear())} - Start order</h2>
        
        {isLoading ? <p>Loading...</p> : null}

        {uniqueNumberLocations.filter(host => host === null) && uniqueNumberLocations.filter(host => host === null).map((host, i) => <div className='block' key={i}>
          <h3 className="crew-start-by-number-location__location-title">Crews with no host club / number locations ({crews.filter(numberLocation => numberLocation.number_location === host).length} numbers)</h3>
          <div className="crew-start-by-number-location__table-container">
          <table className="table crew-start-by-number-location__table has-text-left">
            <thead>
              <tr>{getTableHeadings()}</tr>
            </thead>
            <tfoot className="no-print">
              <tr>{getTableHeadings()}</tr>
            </tfoot>
            <tbody>
              {crews.filter(numberLocation => numberLocation.number_location === host).map(crew => <tr key={crew.id}>
                <td>{crew.id}</td>
                <td>{!crew.competitor_names ? crew.name : crew.competitor_names}</td>
                <td>
                  <BladeImage crew={crew} />
                </td>
                <td>{!crew.bib_number ? '' : crew.bib_number}</td>
                <td>{crew.club.index_code}</td>
                <td>{crew.event_band}</td>
                {showHostClubBoolean && <td>{crew.host_club.name}</td>}
                <td>{crew.number_location}</td>
                <td>&#9634;</td>
              </tr>
              )}
            </tbody>
          </table>
          </div>
          {i < uniqueNumberLocations.length - 1 ? <div className='page-break'></div> : ''}

        </div>
        )}
        {uniqueNumberLocations.filter(host => host !== null).map((host, i) => <div className='block' key={i}>
          <h3 className="crew-start-by-number-location__location-title">{host} ({crews.filter(numberLocation => numberLocation.number_location === host).length} numbers)</h3>
          <div className="crew-start-by-number-location__table-container">
          <table className="table crew-start-by-number-location__table has-text-left">
            <thead>
              <tr>{getTableHeadings()}</tr>
            </thead>
            <tfoot className="no-print">
              <tr>{getTableHeadings()}</tr>
            </tfoot>
            <tbody>
              {crews.filter(numberLocation => numberLocation.number_location === host).map(crew => <tr key={crew.id}>
                <td>{crew.id}</td>
                <td>{!crew.competitor_names ? crew.name : crew.competitor_names}</td>
                <td>
                  <BladeImage crew={crew} />
                </td>
                <td>{!crew.bib_number ? '' : crew.bib_number}</td>
                <td>{crew.club.index_code}</td>
                <td>{crew.event_band}</td>
                {showHostClubBoolean && <td>{crew.host_club.name}</td>}
                <td>{crew.number_location}</td>
                <td>&#9634;</td>
              </tr>
              )}
            </tbody>
          </table>
          </div>
          {i < uniqueNumberLocations.length - 1 ? <div className='page-break'></div> : ''}

        </div>
        )}

        </div>
      </section>
    </>
  )
}
