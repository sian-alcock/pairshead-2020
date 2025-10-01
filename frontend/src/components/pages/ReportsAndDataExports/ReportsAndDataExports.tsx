import TextButton from "../../atoms/TextButton/TextButton";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";
import DataExportComponent from "../../molecules/DataExportComponent/DataExportComponent";
import "./reportsAndDataExports.scss";
import ActionCard from "../../molecules/ActionCard/ActionCard";

export default function ReportsAndDataExports() {
  return (
    <>
      <Header />
      <Hero title="Reports and data exports" />
      <section className="reports-data-exports__section">
        <div className="reports-data-exports__container">
          <div className="reports-data-exports__grid">
            <ActionCard title={"Crew labels"} icon={"report"} description={"Crew labels ready for race packs"}>
              <TextButton label="View report" pathName="/reports/crew-labels" />
            </ActionCard>

            <ActionCard
              title={"Export final start order"}
              icon={"download"}
              description={"Export csv of start data for publishing"}
            >
              <DataExportComponent url={"api/start-order-data-export/"} buttonText={"Export csv"} />
            </ActionCard>

            <ActionCard
              title={"Crew draw report - timing team"}
              icon={"report"}
              description={"Crew list for timing teams"}
            >
              <TextButton label="View report" pathName="/reports/crew-draw-reports" stateProps={{ view: "timing" }} />
            </ActionCard>
            <ActionCard title={"Crew draw report - marshals"} icon={"report"} description={"Crew list for marshals"}>
              <TextButton label="View report" pathName="/reports/crew-draw-reports" stateProps={{ view: "marshall" }} />
            </ActionCard>
            <ActionCard
              title={"Crew draw report - marshal finish"}
              icon={"report"}
              description={"Crew list for finish marshals"}
            >
              <TextButton
                label="View report"
                pathName="/reports/crew-draw-reports"
                stateProps={{ view: "marshall-finish" }}
              />
            </ActionCard>
            <ActionCard
              title={"Lightweight weigh-in checklist"}
              icon={"report"}
              description={"List of lightweight crews for weigh in"}
            >
              <TextButton
                label="View report"
                pathName="/reports/crew-draw-reports"
                stateProps={{ view: "lightweight" }}
              />
            </ActionCard>

            <ActionCard
              title={"Start order by number location"}
              icon={"report"}
              description={"List of lightweight crews for weigh in"}
            >
              <TextButton label="View report" pathName="/reports/start-order-by-number-location" />
            </ActionCard>

            <ActionCard
              title={"On the day contact"}
              icon={"report"}
              description={"List of all crews with contact details"}
            >
              <TextButton label="View report" pathName="/reports/crew-on-the-day-contact" />
            </ActionCard>

            <ActionCard title={"Export competitor data"} icon={"download"} description={"Csv list of competitors"}>
              <DataExportComponent url={"api/competitor-data-export/"} buttonText={"Export csv"} />
            </ActionCard>

            <ActionCard
              title={"Export results to BROE"}
              icon={"download"}
              description={"Crew data and results in correct format for import to BROE"}
            >
              <DataExportComponent url={"api/crew-data-export/"} buttonText={"Export csv"} />
            </ActionCard>

            <ActionCard title={"CSV of results"} icon={"report"} description={"Results for google sheets"}>
              <DataExportComponent url={"api/results-export/"} buttonText={"Export csv"} />
            </ActionCard>

            <ActionCard
              title={"Export start order"}
              icon={"download"}
              description={"CSV of start order (contains bib number from BROE)"}
            >
              <DataExportComponent
                url={"api/crew-start-order-data-export-after-broe-import/"}
                buttonText={"Export csv"}
              />
            </ActionCard>

            <ActionCard
              title={"Export for Webscorer"}
              icon={"download"}
              description={"CSV of data for import into Webscorer)"}
            >
              <DataExportComponent url={"api/crew-web-scorer-data/"} buttonText={"Export csv"} />
            </ActionCard>
          </div>
        </div>
      </section>
    </>
  );
}
