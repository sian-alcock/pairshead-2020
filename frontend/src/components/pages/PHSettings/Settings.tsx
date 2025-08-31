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
          <h2 className="settings__title">System settings</h2>
          <div className="settings__menu-button-container">
          <div className="settings__menu-button">
            <TextButton label="Manage event meeting keys" pathName='/settings/keys' />
          </div>
          <div className="settings__menu-button">
            <TextButton label="Register a user" pathName='/settings/register' />
          </div>
          <div className="settings__menu-button">
            <TextButton label="About this application" pathName='/settings/info' />
          </div>
          </div>
        </div>
      </section>
    </>
  )
}