import { CSVUploadModal } from "../../molecules/CSVUploadModal/CSVUploadModal";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";

import "./managePenalties.scss";

export default function ManagePenalties() {
  return (
    <>
      <Header />
      <Hero title="Manage penalties" />
      <section className="settings__section">
        <div className="settings__container">
          <h1>Add export template here</h1>
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
      </section>
    </>
  );
}
