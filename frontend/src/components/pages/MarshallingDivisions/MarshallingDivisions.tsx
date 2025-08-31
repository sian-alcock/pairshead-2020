import './marshallingDivisions.scss'
import Header from '../../organisms/Header/Header';
import Hero from '../../organisms/Hero/Hero';
import MarshallingDivisionsTable from '../../organisms/MarshallingDivisionsTable/MarshallingDivisionsTable';

export default function MarshallingDivisions () {

  return (
    <>
    <Header />
    <Hero title="Marshalling divisions" />
      <section className="settings__section">
        <div className="settings__container">
            <MarshallingDivisionsTable />
        </div>
      </section>
    </>
  )
}