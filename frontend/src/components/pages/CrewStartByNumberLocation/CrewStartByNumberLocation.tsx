import React, {useState, useEffect} from 'react'
import axios, { AxiosResponse } from 'axios'
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
    const [crews, setCrews] = useState<CrewProps[]>([]);

  const fetchData = async (url: string, params: ResponseParamsProps) => {
    console.log(url);
    console.log(params);
    try {
      const response: AxiosResponse = await axios.get(url, {
        params: params
      });

      const responseData: ResponseDataProps = response.data;

      setCrews(responseData.results);
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


    const numberLocations = Array.from(crews.map(host => host.number_location).sort())
    const uniqueNumberLocations = [...new Set(numberLocations)]
    console.log(uniqueNumberLocations)


    return (
      <>
      <Header />
      <Hero title={'Crews by number location'} />
      <section className="crew-start-by-number-location__section">
        <div className="crew-start-by-number-location__container">

          <div className="crew-start-by-number-location__title">Pairs Head {(new Date().getFullYear())} - Start order</div>

          {uniqueNumberLocations.map((host, i) => <div className='block' key={i}>
            <div className="crew-start-by-number-location__location-title">{host} ({crews.filter(numberLocation => numberLocation.number_location === host).length} numbers)</div>
            <table className="table crew-start-by-number-location__table has-text-left">
              <thead>
                <tr>{tableHeadings.map((heading, i) => <td key={i}>{heading}</td>
                )}
                </tr>
              </thead>
              <tfoot className="no-print">
                <tr>{tableHeadings.map((heading, i) => <td key={i}>{heading}</td>
                )}
                </tr>
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
                  <td>{crew.number_location}</td>
                  <td>&#9634;</td>
                </tr>
                )}
              </tbody>
            </table>
            {i < uniqueNumberLocations.length - 1 ? <div className='page-break'></div> : ''}

          </div>
          )}

        </div>
      </section>
      </>
    )
}
