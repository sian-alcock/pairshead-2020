import React, { ReactElement, useEffect, useState } from 'react'

import { AsyncPaginate } from 'react-select-async-paginate'

import axios, { AxiosResponse } from 'axios'
import { formatTimes } from '../../../lib/helpers'
import Header from '../../organisms/Header/Header'
import { CrewProps, TimeProps } from '../../components.types'
import TextButton from '../../atoms/TextButton/TextButton'
import { useHistory, useParams } from 'react-router-dom'
import Hero from '../../organisms/Hero/Hero'

type RaceTimeParams = {
  id: string;
};

type OptionType = {
  value: string;
  label: string;
};

type AdditionalType = {
  page: number;
};

export default function RaceTimeEdit () {
  const [crews, setCrews] = useState<CrewProps[]>([])
  const [crewId, setCrewId] = useState()
  const [raceTimeFormData, setRaceTimeFormData] = useState<Partial<TimeProps>> ({})

  const routeParams = useParams<RaceTimeParams>()
  const history = useHistory()
  
  const fetchData = async () => {

    try {
      const timeResponse: AxiosResponse = await axios.get(`/api/race-times/${routeParams.id}`);
      const crewResponse: AxiosResponse = await axios.get('api/crew-list-select/', {
        params: {
          page_size: '500'
        }
      })
      const timeResponseData = timeResponse.data;
      const crewResponseData = crewResponse.data;
      setRaceTimeFormData(timeResponseData)
      setCrewId(!timeResponseData.crew ? '' : timeResponseData.crew.id)
      setCrews(crewResponseData)

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getOptions = (crews: CrewProps[]) => {
    const options = crews.map(option => {
      return {label: `${option.bib_number} | ${option.id} | ${option.competitor_names} | ${option.times.filter(time => time.tap === 'Start').length} start time(s) | ${option.times.filter(time => time.tap === 'Finish').length} finish time(s)`, value: option.id}}
    )
    return options
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()

    // Add selected crew to raceTime being edited

    const raceTimeData = {...raceTimeFormData, crew: crewId}

    const raceTimePromise = await axios.put(`/api/race-times/${routeParams.id}`, raceTimeData)
    
    const updatedRaceTime = raceTimePromise.data

    // Get crew record for selected crew

    const crewPromise = await axios.get(`/api/crews/${crewId}`)
    const crewToBeUpdated = crewPromise.data

    const crewData = {...crewToBeUpdated, requires_recalculation: true}

    // Set requires recalculation flag on crew
    const crewUpdatePromise = await axios.put(`/api/crews/${crewId}`, crewData)
    const crewUpdated = crewUpdatePromise.data

    // Search for other raceTimes with the currentTap assigned to this crew
    const currentTap = raceTimeFormData.tap
    const otherTimesForSelectedCrewPromise = await axios.get(`/api/race-times?tap=${currentTap}&crew__id=${crewId}`)
    const otherTimesForSelectedCrew = otherTimesForSelectedCrewPromise.data

    // If more than one...get the one that is not the current one and update it to remove the crewID

    if(otherTimesForSelectedCrew.results.length > 1) {
      // get the ID of the one that isn't this one
      const raceTimesToRemove = otherTimesForSelectedCrew.results.filter((time: TimeProps) => time.id !== raceTimeFormData.id)
      for(let i = 0; i < raceTimesToRemove.length; i++) {
        const raceTimeToRemovePromise = await axios.get(`/api/race-times/${raceTimesToRemove[i].id}`)
        const raceTimeToRemoveFormData = raceTimeToRemovePromise.data
        const raceTimeRemoveCrewPromise = await axios.put(`/api/race-times/${raceTimesToRemove[i].id}`, {...raceTimeToRemoveFormData, crew: ''})
      }
    }

    setRaceTimeFormData(updatedRaceTime)
    history.push('/generate-results/race-times')  
  }

  const handleSelectChange = (selectedOption: any) => {
    const formData = { ...raceTimeFormData, crew: selectedOption }
    setRaceTimeFormData(formData)
    setCrewId(selectedOption.value)
  }

  const optionsPerPage = 50;
  const options = getOptions(crews)

  const loadOptions = async (search: string, page: number) => {

    let filteredOptions: OptionType[];
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
  
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }
  
    const hasMore = Math.ceil(filteredOptions.length / optionsPerPage) > page;
    const slicedOptions = filteredOptions.slice(
      (page - 1) * optionsPerPage,
      page * optionsPerPage
    );
  
    return {
      options: slicedOptions,
      hasMore
    };
  };

  const defaultAdditional: AdditionalType = {
    page: 1
  };

  const loadPageOptions = async (
    q: string,
    prevOptions: unknown,
    { page }: any
  ) => {
    const { options, hasMore } = await loadOptions(q, page);
    return {
      options,
      hasMore,
  
      additional: {
        page: page + 1
      }
    };
  };

  return (
    <>
      <Header />
      <Hero title={'Modify time assignment'} />
      <section className="section">
        <div className="container">
          <div className="box">
            <div className="columns is-multiline">

              <div className="column is-one-third">
                <div>Sequence: {raceTimeFormData.sequence}</div>
              </div>

              <div className="column is-one-third">
                <div>Tap: {raceTimeFormData.tap}</div>
              </div>

              <div className="column is-one-third">
                <div>Tap time: {formatTimes(raceTimeFormData.time_tap)}</div>
              </div>

            </div>
          </div>
          <form className="container box tableBorder" onSubmit={handleSubmit}>

            <div className="field">
              <div className="control">
                <label className="label" htmlFor="crew">Crew</label>
                    <AsyncPaginate
                      id="crew"
                      additional={defaultAdditional}
                      value={!raceTimeFormData.crew ? '' : options.find(option => option.value === raceTimeFormData.crew?.id)}
                      loadOptions={loadPageOptions}
                      onChange={handleSelectChange}
                    />
              </div>
            </div>
            <TextButton isSubmit={true} label={"Submit"}/>

          </form>
        </div>
      </section>
    </>
  )
}