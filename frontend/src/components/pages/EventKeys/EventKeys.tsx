import './eventKeys.scss'
import Header from '../../organisms/Header/Header';
import Hero from '../../organisms/Hero/Hero';
import EventMeetingKeyManager from '../../organisms/EventMeetingKeyManager/EventMeetingKeyManager';


export default function EventKeys () {

  return (
    <>
    <Header />
    <Hero title="Event meeting keys" />
      <section className="settings__section">
        <div className="settings__container">
            <EventMeetingKeyManager />
        </div>
      </section>
    </>
  )
}