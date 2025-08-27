import React, { ReactElement, useEffect, useState } from 'react'
import axios, { AxiosResponse } from 'axios'
import Header from '../Header/Header'
import { RaceProps, TimingOffsetProps } from '../../../types/components.types'
import TextButton from '../../atoms/TextButton/TextButton'
import { useHistory, useParams } from 'react-router-dom'
import Hero from '../Hero/Hero'
import { FormSelect } from '../../atoms/FormSelect/FormSelect'
import { FormInput } from '../../atoms/FormInput/FormInput'

type RaceTimesManagerParams = {
  id: string;
};

export default function TimingOffsetManagerDetail () {
  const [races, setRaces] = useState<RaceProps[]>([]);
  const [raceTimingSyncFormData, setRaceTimingSyncFormData] = useState<Partial<TimingOffsetProps>> ({})
  const [referenceRaceId, setReferenceRaceId] = useState<number | ''>('');
  const [targetRaceId, setTargetRaceId] = useState<number | ''>('');
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [hundredths, setHundredths] = useState<number>(0);
  const [isNegative, setIsNegative] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const routeParams = useParams<RaceTimesManagerParams>()
  const history = useHistory()
  
  const fetchData = async () => {

    try {
      if (routeParams.id !== undefined) {
        const raceTimingSyncResponse: AxiosResponse = await axios.get(`/api/race-time-sync/${routeParams.id}/`)
        const raceTimingSyncResponseData = raceTimingSyncResponse.data
        setRaceTimingSyncFormData(raceTimingSyncResponseData)
        setIsLoading(true)
      }

      const raceResponse: AxiosResponse = await axios.get(`/api/races/`);
      const raceResponseData = raceResponse.data;
      const races = raceResponseData
      if(races) {
        setRaces(races)
      }
      const referenceRace = raceResponseData?.find((race: { is_timing_reference: boolean }) => race.is_timing_reference);
      if (referenceRace) {
        setReferenceRaceId(referenceRace.id);
      }


    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
  if (raceTimingSyncFormData?.timing_offset_ms !== undefined) {
    const parsedOffset = parseTimingOffset(raceTimingSyncFormData.timing_offset_ms);
    
    setMinutes(parsedOffset.minutes);
    setSeconds(parsedOffset.seconds);
    setHundredths(parsedOffset.hundredths);
    setIsNegative(parsedOffset.isNegative);
  }
}, [raceTimingSyncFormData]);

  const parseTimingOffset = (timing_offset_ms: number | undefined) => {
    if (!timing_offset_ms || timing_offset_ms === 0) {
      return {
        minutes: 0,
        seconds: 0,
        hundredths: 0,
        isNegative: false
      };
    }

    const isNegative = timing_offset_ms < 0;
    const absoluteMs = Math.abs(timing_offset_ms);
    
    const minutes = Math.floor(absoluteMs / 60000);
    const seconds = Math.floor((absoluteMs % 60000) / 1000);
    const hundredths = Math.floor((absoluteMs % 1000) / 10);

    return {
      minutes,
      seconds,
      hundredths,
      isNegative
    };
  };


  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()

    if (!referenceRaceId || !targetRaceId) {
        setMessage('Please select both reference and target races');
        setMessageType('error');
      return;
    }

    if (referenceRaceId === targetRaceId) {
      setMessage('Reference and target races must be different');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const timing_offset = calculateTotalOffset()

      const data = {...raceTimingSyncFormData, timing_offset_ms: timing_offset, reference_race: referenceRaceId, target_race: targetRaceId}

      if(routeParams.id === undefined) {
      axios.post(`/api/race-time-sync/`, data)
        .then(()=> history.push('/generate-results/race-times'))
      } else {
      axios.put(`/api/race-time-sync/${routeParams.id}/`, data)
        .then(()=> history.push('/generate-results/race-times'))
      }
      // history.push('/generate-results/race-times')
    } catch(error) {
      setMessage('Failed to save timing offset');
      setMessageType('error');
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalOffset = (): number => {
    const totalMs = (minutes * 60000) + (seconds * 1000) + (hundredths * 10);
    return isNegative ? -totalMs : totalMs;
  };

    const formatPreview = (): string => {
    const totalMs = Math.abs(calculateTotalOffset());
    if (totalMs === 0) return '0ms';
    
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const hundr = Math.floor((totalMs % 1000) / 10);
    
    let preview = '';
    if (mins > 0) preview += `${mins}m `;
    if (secs > 0) preview += `${secs}s `;
    if (hundr > 0) preview += `${hundr}cs`;
    
    return `${isNegative ? '-' : '+'}${preview.trim()}`;
  };

  const referenceRaceOptions = races?.map((race) => (
    {
      value: race.id.toString(),
      label: `${race.name} ${race.is_timing_reference ? '(Current Reference)' : ''}`
    }
  ))

  const targetRaceOptions = races?.map((race: {id: number, name: string, is_timing_reference: boolean}) => (
    {
      value: race.id,
      label: race.name
    }
  ))

  console.log(raceTimingSyncFormData)

  return (
    <>
      <Header />
      <Hero title={'Add / edit race'} />
      <section className="timing-offset-manager__section">
      <div className="timing-offset-manager__container">
        {!isLoading &&
          <form onSubmit={handleSubmit} className="timing-offset-manager__form">

            <div className="timing-offset-manager__field">
              <FormSelect
                fieldName={'reference_race'}
                title={'Select reference race'}
                label={'Reference race (Timing origin)'}
                selectOptions={referenceRaceOptions}
                value={raceTimingSyncFormData?.reference_race?.toString()}
                onChange={(e) => setReferenceRaceId(e.target.value ? parseInt(e.target.value) : '')}
                />
            </div>

            <div className="timing-offset-manager__field">
              <FormSelect
                fieldName={'target_race'}
                title={'Select target race'}
                label={'Target race (to be synchronised)'}
                selectOptions={targetRaceOptions}
                value={raceTimingSyncFormData?.target_race?.toString()}
                onChange={(e) => setTargetRaceId(e.target.value ? parseInt(e.target.value) : '')}
              />
            </div>

            {/* Offset Direction */}
            <div className="timing-offset-manager__field">
              <label className="">
                Offset Direction
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isNegative}
                    onChange={() => setIsNegative(false)}
                    className="mr-2"
                  />
                  <span className="text-sm">Target is ahead (+)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={isNegative}
                    onChange={() => setIsNegative(true)}
                    className="mr-2"
                  />
                  <span className="text-sm">Target is behind (-)</span>
                </label>
              </div>
            </div>

            <div className="">            
              <div className="timing-offset-manager__field">
                <FormInput
                  fieldName={'timing_offset_minutes'}
                  label={'Minutes'}
                  type={'number'}
                  min={0}
                  max={59}
                  value={minutes.toString()}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="timing-offset-manager__field">
                <FormInput
                  fieldName={'timing_offset_seconds'}
                  label={'Seconds'}
                  type={'number'}
                  min={0}
                  max={59}
                  value={seconds.toString()}
                  onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="timing-offset-manager__field">
                <FormInput
                  fieldName={'timing_offset_hundredths_seconds'}
                  label={'Hundredths of second'}
                  type={'number'}
                  min={0}
                  max={99}
                  value={hundredths.toString()}
                  onChange={(e) => setHundredths(parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Preview */}
              <div className="timing-offset-manager__preview">
                <span className="">Preview: </span>
                <span className="">{formatPreview()}</span>
              </div>

              {/* Message */}
              {message && (
                <div className={`timing-offset-manager__message ${
                  messageType === 'success' ? 'timing-offset-manager__message--success' : 'timing-offset-manager__error'
                }`}>
                  <span className="timing-offset-manager__message-text">{message}</span>
                </div>
              )}

            </div>

            <div className="timing-offset-manager__field">
              <TextButton label={"Submit"} isSubmit={true}/>
            </div>

            {/* Help Text */}
            <div className="">
              <p>
                <strong>Tip:</strong> If the target race's clock shows a time that's 2.5 seconds behind 
                the reference race, select "Target is behind (-)" and enter 0:02.50
              </p>
            </div>
          </form>
        }
      </div>
      </section>
    </>
  )
}