import './logistics.scss'
import TextButton from '../../atoms/TextButton/TextButton';
import Header from '../../organisms/Header/Header';
import Hero from '../../organisms/Hero/Hero';

export default function Logistics () {

  const exportStartOrderData = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    window.open('api/start-order-data-export/')
  }

  return (
    <>
    <Header />
    <Hero title="Logistics" />
      <section className="logistics__section">
        <div className="logistics__container">
          <div className="logistics__item">
            <TextButton label="Crew labels" pathName='/logistics/crew-labels' />
          </div>
          <div className="logistics__item">
            <TextButton label="Export start order data" onClick={exportStartOrderData} />
          </div>
          <div className="logistics__item">
            <TextButton label="Crew draw report - timing team" pathName='/logistics/crew-draw-reports' stateProps={ {view: 'timing'} } />
          </div>
          <div className="logistics__item">
            <TextButton label="Crew draw report - marshal view" pathName='/logistics/crew-draw-reports' stateProps={ {view: 'marshall'} } />
          </div>
          <div className="logistics__item">
            <TextButton label="Lightweight crews - weigh in check sheet" pathName='/logistics/crew-draw-reports' stateProps={ {view: 'lightweight'} } />
          </div>
          <div className="logistics__item">
            <TextButton label="Start order by number location" pathName='/logistics/start-order-by-number-location' />
          </div>
          <div className="logistics__item">
            <TextButton label="On the day contact details" pathName='/logistics/crew-on-the-day-contact' />
          </div>
        </div>
      </section>
    </>
  )
}