import { CSVUploadModal } from "../../molecules/CSVUploadModal/CSVUploadModal";
import DataExportComponent from "../../molecules/DataExportComponent/DataExportComponent";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";

import "./managePenalties.scss";

export default function ManagePenalties() {
  return (
    <>
      <Header />
      <Hero title="Manage penalties" />
      <section className="manage-penalties__section">
        <div className="manage-penalties__container">
          <div className="manage-penalties__wrapper">
            <DataExportComponent url={"api/crew-penalties-template/"} buttonText={"Penalties template"} />
            <CSVUploadModal
              title="Import penalties"
              description="Upload a CSV file to penalties"
              url="/api/crew-import-penalties/"
              acceptedFileTypes={[".csv"]}
              autoCloseDelay={3000}
              onSuccess={(data) => {
                console.log("Penalties imported:", data);
              }}
              onError={(error) => {
                console.error("Import failed:", error);
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
