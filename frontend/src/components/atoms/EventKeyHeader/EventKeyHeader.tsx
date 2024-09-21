import React, {useEffect, useState, ReactElement} from 'react'
import axios, { AxiosResponse } from "axios";
import Auth from '../../../lib/Auth'
import { Link } from 'react-router-dom'
import { KeyProps } from '../../components.types';
import './eventKeyHeader.scss'

interface ResponseDataProps {
  results: KeyProps[];
}

export default function EventKeyHeader ():ReactElement {
  const [keys, setKeys] = useState<KeyProps[]>();

  const fetchData = async (url: string) => {
    try {
      const response: AxiosResponse = await axios.get(url);

      const responseData: ResponseDataProps = response.data;

      setKeys(responseData.results);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData("/api/event-meeting-key-list/");
  }, []);

  const getCurrentKey = (results: KeyProps[] | undefined): string | undefined => {
    if(results) {
      return results.filter((key) => key.current_event_meeting)[0]["event_meeting_name"]
    }
  }

  return(
    <div className="event-key-header">
      <span>Current event: </span>{keys && <span>{getCurrentKey(keys)}</span>}
      <span>&nbsp;</span>({Auth.isAuthenticated() && <Link to="/settings/keys">Change</Link>})
    </div>
  )
}

