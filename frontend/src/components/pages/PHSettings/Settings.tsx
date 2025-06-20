import './settings.scss'
import TextButton from '../../atoms/TextButton/TextButton';
import Header from '../../organisms/Header/Header';
import Hero from '../../organisms/Hero/Hero';

export default function Settings () {

  return (
    <>
    <Header />
    <Hero title="Settings" />
      <section className="settings__section">
        <div className="settings__container">
            <div className="text-container has-text-left">
              <h2 className="settings__title">System settings</h2>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Add new event key" pathName='/settings/keys/new' />
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="View all event keys" pathName='/settings/keys' />
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Racing offset" pathName='/settings/race-info' />
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="Register a user" pathName='/settings/register' />
              </div>
            </div>
            <div className="columns">
              <div className="column is-one-quarter">
                <TextButton label="About this application" pathName='/settings/info' />
              </div>
            </div>
        </div>
      </section>
    </>
  )
}