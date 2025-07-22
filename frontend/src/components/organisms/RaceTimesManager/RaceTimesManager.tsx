import React, { ReactElement, useEffect, useState } from 'react'
import axios, {AxiosResponse} from 'axios'
import { RaceProps } from '../../components.types';
import './raceTimesManager.scss'
import TextButton from '../../atoms/TextButton/TextButton';
import { IconButton } from '../../atoms/IconButton/IconButton';
import { Link } from 'react-router-dom';


interface RaceTimesManagerProps {
  title: string;
}

interface RadioSelection {
  raceId: string;
  type: 'default-start' | 'default-finish';
}

export default function RaceTimesManager ({title}: RaceTimesManagerProps):ReactElement {

  const [raceDetails, setRaceDetails] = useState<RaceProps[]>([]);
  const [raceTimes, setRaceTimes] = useState<RaceProps[]>([]);
  const [radioSelections, setRadioSelections] = useState<RadioSelection[]>([]);

  const fetchData = async (url: string) => {
    try {
      const response: AxiosResponse = await axios.get(url);

      const responseData: RaceProps[] = response.data;

      setRaceDetails(responseData);
      console.log(responseData)

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/races/");
  }, [raceTimes]);

  const handleRadio = (e: React.MouseEvent) => {
    const clickedElement = e.target as HTMLInputElement;
    const race = clickedElement.closest('tr')?.dataset.race;
    const radioName = clickedElement.name; // This gets 'default-start' or 'default-finish'
    
    if (race && radioName) {
      // Remove any existing selection for this race and radio type
      setRadioSelections(prev => 
        prev.filter(selection => 
          !(selection.raceId === race && selection.type === radioName as 'default-start' | 'default-finish')
        )
      );
      
      // Add the new selection if the radio is checked
      if (clickedElement.checked) {
        setRadioSelections(prev => [...prev, {
          raceId: race,
          type: radioName as 'default-start' | 'default-finish'
        }]);
      }
      
      console.log(`Radio selected: ${radioName} for race ${race}`);
    }
  }

  const handleSubmit = async () => {
    try {
      // Process each radio selection
      for (const selection of radioSelections) {
        const updateData = {
          [selection.type.replace('-', '_')]: true // Convert 'default-start' to 'default_start'
        };
        
        const response: AxiosResponse = await axios.patch(
          `api/races/${selection.raceId}/`, 
          updateData
        );
        
        console.log(`Updated race ${selection.raceId}:`, response.data);
      }
      
      // Clear selections after successful submission
      setRadioSelections([]);
      
      // Refresh the data to show updated values
      fetchData("/api/races/");
      
      console.log('All updates completed successfully');
    } catch (error) {
      console.error('Error updating races:', error);
    }
  }

  const handleDelete = async (e:React.MouseEvent) => {
    const clickedElement = e.target as Element
    const race = clickedElement.closest('tr')?.dataset.race

    try {
      const response: AxiosResponse = await axios.delete(`api/races/${race}`);

      const responseData: RaceProps[] = response.data;

      setRaceTimes(responseData);
      console.log(responseData)

    } catch (error) {
      console.error(error);
    }
  }

  const handleRefresh = async (e:React.MouseEvent) => {
    const clickedElement = e.target as Element
    const race = clickedElement.closest('tr')?.dataset.race

    try {
      const response: AxiosResponse = await axios.get(`api/crew-race-times-import-webscorer/${race}`);

      const responseData: RaceProps[] = response.data;

      setRaceTimes(responseData);
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
            <tr key={detail.id} data-race={detail.id}>
              <td><Link to={`/settings/race-time-manager/races/${detail.id}/edit`}>{detail.id}</Link></td>
              <td>{detail.race_id}</td>
              <td>{detail.name}</td>
              <td className="td-center"><label><input onClick={handleRadio} type="radio" id={`${idx} - ${detail.id}`} name="default-start" defaultChecked={detail.default_start}></input></label></td>
              <td className="td-center"><label><input onClick={handleRadio} type="radio" id={`${idx} - ${detail.id}`} name="default-finish" defaultChecked={detail.default_finish}></input></label></td>
              <td className="td-center"><IconButton title={'Fetch data from webscorer'} icon={'refresh'} sitsInTable onClick={handleRefresh}/></td>
              <td className="td-center"><IconButton title={'Delete data for race'} icon={'delete'} sitsInTable onClick={handleDelete}/></td>
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