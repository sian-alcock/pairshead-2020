import { CSVUploadModal } from "../../molecules/CSVUploadModal/CSVUploadModal";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";
import "./manageOriginalEventCategories.scss";

export default function ManagingOriginalEventCategories() {
  return (
    <>
      <Header />
      <Hero title="Manage original event categories" />
      <section className="settings__section">
        <div className="settings__container">
          <CSVUploadModal
            title="Import original event categories"
            description="Upload a CSV file to import original event categories"
            url="/api/original-event-import/"
            acceptedFileTypes={[".csv"]}
            autoCloseDelay={3000}
            onSuccess={(data) => {
              console.log("Categories imported:", data);
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
