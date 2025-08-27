import React, { useEffect, useState } from 'react'
import { AsyncPaginate, LoadOptions } from 'react-select-async-paginate'
import { GroupBase, OptionsOrGroups } from 'react-select';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { formatTimes } from '../../../../lib/helpers'
import Header from '../../../organisms/Header/Header'
import { CrewProps, TimeProps } from '../../../../types/components.types'
import TextButton from '../../../atoms/TextButton/TextButton'
import { useHistory, useParams } from 'react-router-dom'
import Hero from '../../../organisms/Hero/Hero'
import { fetchJSON } from '../../../../lib/api'

import './raceTimeEdit.scss'

type RaceTimeParams = {
  id: string
}

type OptionType = {
  value: number | null
  label: string
}

type AdditionalType = {
  page: number
}

export default function RaceTimeEdit() {
  const [crewId, setCrewId] = useState<number | null>(null)
  const routeParams = useParams<RaceTimeParams>()
  const history = useHistory()
  const queryClient = useQueryClient()

  // Query for race time data
  const raceTimeQuery = useQuery<TimeProps, Error>({
    queryKey: ['raceTime', routeParams.id],
    queryFn: () => fetchJSON<TimeProps>(`/api/race-times/${routeParams.id}`),
  })

  useEffect(() => {
    if (raceTimeQuery.isSuccess && raceTimeQuery.data) {
      setCrewId(raceTimeQuery.data.crew?.id ?? null)
    }
  }, [raceTimeQuery.isSuccess, raceTimeQuery.data])

  useEffect(() => {
    if (raceTimeQuery.isError && raceTimeQuery.error) {
      console.error('Error fetching race time:', raceTimeQuery.error)
    }
  }, [raceTimeQuery.isError, raceTimeQuery.error])


  const crewsQuery = useQuery<CrewProps[], Error>({
    queryKey: ['crews'],
    queryFn: () => fetchJSON<CrewProps[]>('/api/crew-list-select/'),
  })

  const updateRaceTimeMutation = useMutation({
    mutationFn: async (data: { crewId: number | null }) => {
      const raceTimePayload = { ...raceTimeQuery.data, crew: data.crewId || null };

      const updatedRaceTime = await fetchJSON<TimeProps>(
        `/api/race-times/${routeParams.id}`,
        {
          method: "PUT",
          body: JSON.stringify(raceTimePayload),
        }
      );

      if (data.crewId) {
        // Get crew record
        const crewToBeUpdated = await fetchJSON<CrewProps>(`/api/crews/${data.crewId}`);
        const crewData = { ...crewToBeUpdated, requires_recalculation: true };

        await fetchJSON(`/api/crews/${data.crewId}`, {
          method: "PUT",
          body: JSON.stringify(crewData),
        });

        // Other race times for this crew
        const currentTap = raceTimeQuery.data?.tap;
        const otherTimesForSelectedCrew = await fetchJSON<TimeProps[]>(
          `/api/race-times?tap=${currentTap}&crew__id=${data.crewId}`
        );

        if (otherTimesForSelectedCrew.length > 1) {
          const raceTimesToRemove = otherTimesForSelectedCrew.filter(
            (time) => time.id !== raceTimeQuery.data?.id
          );

          for (const timeToRemove of raceTimesToRemove) {
            const raceTimeToRemoveFormData = await fetchJSON<TimeProps>(
              `/api/race-times/${timeToRemove.id}`
            );

            await fetchJSON(`/api/race-times/${timeToRemove.id}`, {
              method: "PUT",
              body: JSON.stringify({ ...raceTimeToRemoveFormData, crew: null }),
            });
          }
        }
      }

      return updatedRaceTime;
    },
      onSuccess: (updatedRaceTime) => {
      queryClient.invalidateQueries({ queryKey: ['raceTime', routeParams.id] })
      queryClient.invalidateQueries({ queryKey: ['crews'] })

      const raceId = updatedRaceTime.race?.id
      const tap = updatedRaceTime.tap

      if (raceId && tap) {
        sessionStorage.setItem(
          'crew-dashboard-active-tab',
          `race-${raceId}-${tap.toLowerCase()}`
        )
        history.push('/crew-management-dashboard')
      } else {
        history.push('/crew-management-dashboard')
      }
    },
    onError: (error) => {
      console.error('Error updating race time:', error)
    },
  })

  const getOptions = (crews: CrewProps[]): OptionType[] => {
    const noCrewOption: OptionType = { value: null, label: 'No crew assigned' }

    const crewOptions: OptionType[] = crews.map((option) => ({
      label: `${option.bib_number} | ${option.id} | ${option.competitor_names} | ${option.times.filter(
        (time) => time.tap === 'Start'
      ).length} start time(s) | ${option.times.filter(
        (time) => time.tap === 'Finish'
      ).length} finish time(s)`,
      value: option.id,
    }))

    return [noCrewOption, ...crewOptions]
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    updateRaceTimeMutation.mutate({ crewId })
  }

  const handleSelectChange = (selectedOption: OptionType | null) => {
    setCrewId(selectedOption?.value || null)
  }

  const crews = crewsQuery.data ?? []
  const isRaceTimeLoading = raceTimeQuery.isLoading
  const isCrewsLoading = crewsQuery.isLoading
  const raceTimeData = raceTimeQuery.data
  const options = getOptions(crews)
  const optionsPerPage = 50;
  const defaultAdditional: AdditionalType = { page: 1 };

  const loadOptions: LoadOptions<OptionType, GroupBase<OptionType>, AdditionalType> =
    async (q, _loadedOptions, additional) => {
      const page = additional?.page ?? 1;
      const search = q.trim().toLowerCase();

      const filtered = !search
        ? options
        : options.filter(o => o.label.toLowerCase().includes(search));

      const start = (page - 1) * optionsPerPage;
      const end = page * optionsPerPage;
      const sliced = filtered.slice(start, end);

      return {
        options: sliced,
        hasMore: end < filtered.length,
        additional: { page: page + 1 },
      };
    };

  const getCurrentValue = (): OptionType | null => {
    if (!raceTimeData?.crew) {
      return { value: null, label: 'No crew assigned' }
    }
    return options.find((option) => option.value === raceTimeData.crew?.id) || null
  }

  if (isRaceTimeLoading || isCrewsLoading) {
    return (
      <>
        <Header />
        <Hero title={'Modify time assignment'} />
        <section className="race-time-edit__section">
          <div className="race-time-edit__container">Loading...</div>
        </section>
      </>
    )
  }

  if (!raceTimeData) {
    return (
      <>
        <Header />
        <Hero title={'Modify time assignment'} />
        <section className="race-time-edit__section">
          <div className="race-time-edit__container">Race time not found</div>
        </section>
      </>
    )
  }

  const { mutate, isPending } = updateRaceTimeMutation;


  return (
    <>
      <Header />
      <Hero title={'Modify time assignment'} />
      <section className="race-time-edit__section">
        <div className="race-time-edit__container">
          <form className="race-time-edit__form" onSubmit={handleSubmit}>
            <div className="race-time-edit__info-box">
              <div>Sequence: {raceTimeData.sequence}</div>
              <div>Tap: {raceTimeData.tap}</div>
              <div>Tap time: {formatTimes(raceTimeData.time_tap)}</div>
            </div>

            <div className="race-time-edit__field">
              <label className="label" htmlFor="crew">
                Crew
              </label>
              <AsyncPaginate
                id="crew"
                additional={defaultAdditional}
                value={getCurrentValue()}
                loadOptions={loadOptions}
                onChange={handleSelectChange}
                placeholder="Select crew or leave unassigned..."
                isClearable
              />
            </div>

            <TextButton
              onClick={() => updateRaceTimeMutation.mutate({ crewId })}
              disabled={isPending}
              label={isPending ? 'Saving…' : 'Save'}
            />
          </form>
        </div>
      </section>
    </>
  )
}
