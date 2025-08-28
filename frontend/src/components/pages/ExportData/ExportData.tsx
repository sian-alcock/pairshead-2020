import TextButton from "../../atoms/TextButton/TextButton";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";
import "./exportData.scss";

export default function ExportData() {
  const exportCrewData = (e: { preventDefault: any }) => {
    e.preventDefault;
    window.open("api/crew-data-export/");
  };

  const exportCompetitorData = (e: { preventDefault: any }) => {
    e.preventDefault;
    window.open("api/competitor-data-export/");
  };

  const exportResultsData = (e: { preventDefault: any }) => {
    e.preventDefault;
    window.open("api/results-export/");
  };

  const exportStartData = (e: { preventDefault: any }) => {
    e.preventDefault;
    window.open("api/crew-start-order-data-export-after-broe-import/");
  };

  const exportWebScorerData = (e: { preventDefault: any }) => {
    e.preventDefault;
    window.open("api/crew-web-scorer-data/");
  };
  return (
    <>
      <Header />
      <Hero title={"Data exports"} />
      <section className="data-exports__section">
        <div className="data-exports__container">
          <div className="data-exports__columns">
            <TextButton onClick={exportCompetitorData} label={"Export competitor data"} />
            <div className="data-exports__description">CSV showing crewID alongside competitor names</div>
          </div>

          <div className="data-exports__columns">
            <TextButton onClick={exportCrewData} label={"Export to BROE"} />
            <div className="data-exports__description">
              CSV of crew data and results in correct format for import into British Rowing Website
            </div>
          </div>

          <div className="data-exports__columns">
            <TextButton onClick={exportResultsData} label={"Export results data"} />
            <div className="data-exports__description">CSV of results</div>
          </div>

          <div className="data-exports__columns">
            <TextButton onClick={exportStartData} label={"Export crew starting order data"} />
            <div className="data-exports__description">CSV of start order (contains bib number from BROE)</div>
          </div>

          <div className="data-exports__columns">
            <TextButton onClick={exportWebScorerData} label={"Export crew data for Webscorer"} />
            <div className="data-exports__description">CSV for import into Webscorer</div>
          </div>
        </div>
      </section>
    </>
  );
}
