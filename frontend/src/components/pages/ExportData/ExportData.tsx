import TextButton from "../../atoms/TextButton/TextButton";
import DataExportComponent from "../../molecules/DataExportComponent/DataExportComponent";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";
import "./exportData.scss";

export default function ExportData() {
  return (
    <>
      <Header />
      <Hero title={"Data exports"} />
      <section className="data-exports__section">
        <div className="data-exports__container">
          <div className="data-exports__columns">
            <div className="data-exports__description">CSV showing crewID alongside competitor names</div>
            <DataExportComponent url={"api/competitor-data-export/"} buttonText={"Export competitor data"} />
          </div>

          <div className="data-exports__columns">
            <div className="data-exports__description">
              CSV of crew data and results in correct format for import into British Rowing Website
            </div>
            <DataExportComponent url={"api/crew-data-export/"} buttonText={"Export results to BROE"} />
          </div>

          <div className="data-exports__columns">
            <div className="data-exports__description">CSV of results</div>
            <DataExportComponent url={"api/results-export/"} buttonText={"Export results data"} />
          </div>

          <div className="data-exports__columns">
            <div className="data-exports__description">CSV of start order (contains bib number from BROE)</div>
            <DataExportComponent
              url={"api/crew-start-order-data-export-after-broe-import/"}
              buttonText={"Export start order"}
            />
          </div>

          <div className="data-exports__columns">
            <div className="data-exports__description">CSV for import into Webscorer</div>
            <DataExportComponent url={"api/crew-web-scorer-data/"} buttonText={"Export crew data for Webscorer"} />
          </div>
        </div>
      </section>
    </>
  );
}
