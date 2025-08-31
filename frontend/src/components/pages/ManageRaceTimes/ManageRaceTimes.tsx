import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";
import RaceTimesManager from "../../organisms/RaceTimesManager/RaceTimesManager";
import TimingOffsetManager from "../../organisms/TimingOffsetManager/TimingOffsetManager";
import "./manageRaceTimes.scss";

export default function ManageRaceTimes() {
  return (
    <>
      <Header />
      <Hero title="Manage race times" />
      <section className="settings__section">
        <div className="settings__container">
          <RaceTimesManager />
          <TimingOffsetManager />
        </div>
      </section>
    </>
  );
}
