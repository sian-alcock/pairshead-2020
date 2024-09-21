import './logistics.scss'
import TextButton from '../../atoms/TextButton/TextButton';
import Header from '../../organisms/Header/Header';
import Hero from '../../organisms/Hero/Hero';

export default function Logistics () {

  return (
    <>
    <Header />
    <Hero title="Logistics" />
      <section className="logistics__section">
        <div className="logistics__container">
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Crew labels" pathName='/logistics/crew-labels' />
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Crew draw report" pathName='/logistics/crew-draw-report' />
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Start order by number location" pathName='/logistics/start-order-by-number-location' />
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="On the day contact details" pathName='/logistics/crew-on-the-day-contact' />
              </div>
            </div>
        </div>
      </section>
    </>
  )
}