import React, { ReactElement, useEffect, useState } from 'react'
import axios, {AxiosResponse} from 'axios'
import EventKeyHeader from '../../atoms/EventKeyHeader/EventKeyHeader';
import Breadcrumbs from '../../molecules/Breadcrumbs/Breadcrumbs';
import Icon from '../../atoms/Icons/Icons';
import { RaceProps } from '../../components.types';
import './raceTimesManager.scss'
import { formatTimeDate } from '../../../lib/helpers';
import TextButton from '../../atoms/TextButton/TextButton';
import { IconButton } from '../../atoms/IconButton/IconButton';
import { Link } from 'react-router-dom';


interface RaceTimesManagerProps {
  title: string;
}

interface ResponseDataProps {
  results: RaceProps[];
}

export default function RaceTimesManager ({title}: RaceTimesManagerProps):ReactElement {

  const [raceDetails, setRaceDetails] = useState<RaceProps[]>([]);
  const [raceTimes, setRaceTimes] = useState<RaceProps[]>([]);

  const fetchData = async (url: string) => {
    try {
      const response: AxiosResponse = await axios.get(url);

      const responseData: ResponseDataProps = response.data;

      setRaceDetails(responseData.results);
      console.log(responseData)

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/race-list/");
  }, []);

  const handleRadio = (e: React.MouseEvent) => {
    console.log(e.target)
    // setCurrentKey({'currentKey': e.target.id})
  }

  const handleSubmit = () => {
    console.log('submit happened yo')
  }

  const handleRefresh = async (e:React.MouseEvent) => {
    const clickedElement = e.target as Element
    const race = clickedElement.closest('td')?.dataset.race

    try {
      const response: AxiosResponse = await axios.get(`api/crew-race-times-import-webscorer/${race}`);

      const responseData: ResponseDataProps = response.data;

      setRaceTimes(responseData.results);
      console.log(responseData)

    } catch (error) {
      console.error(error);
    }
  } 

  const headings =['Id', 'Race id', 'Name', 'Default start', 'Default finish', 'Fetch data', 'Delete']
  return (
    <section className="race-times-manager no-print">
      <h1>{title}</h1>
      <form className="race-times-manager__form">
        <table className="race-times-manager__table table">
          <thead>
            <tr>
              {headings.map((heading, idx) => <th key={idx}>{heading}</th> )}
            </tr>
          </thead>
          <tfoot>
            <tr>
              {headings.map((heading, idx) => <th key={idx}>{heading}</th> )}
            </tr>
          </tfoot>
          <tbody>
              {raceDetails.map((detail, idx) => 
            <tr key={detail.id}>
              <td><Link to={`/settings/race-time-manager/races/${detail.id}/edit`}>{detail.id}</Link></td>
              <td>{detail.race_id}</td>
              <td>{detail.name}</td>
              <td className="td-center"><label><input onClick={handleRadio} type="radio" id={`${idx} - ${detail.id}`} name="default-start" defaultChecked={detail.default_start}></input></label></td>
              <td className="td-center"><label><input onClick={handleRadio} type="radio" id={`${idx} - ${detail.id}`} name="default-finish" defaultChecked={detail.default_finish}></input></label></td>
              <td className="td-center" data-race={detail.id}><IconButton title={'Fetch data from webscorer'} icon={'refresh'} sitsInTable onClick={handleRefresh}/></td>
              <td className="td-center"><IconButton title={'Delete data for race'} icon={'delete'} sitsInTable/></td>
            </tr>
              )}
          </tbody>
        </table>
        <div className="field is-grouped">
          <p className="control">
            <TextButton label={'Submit'} onClick={handleSubmit}/>
          </p>
          <p className="control">
            <TextButton label={'Add new'} pathName={'/settings/race-time-manager/races/new'}/>
          </p>
        </div>
      </form>
    </section>

  )
}