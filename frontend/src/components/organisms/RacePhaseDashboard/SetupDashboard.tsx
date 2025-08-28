import { useState } from "react";
import BROELoader from "../../molecules/BROEDataLoader/BROELoader";
import TextButton from "../../atoms/TextButton/TextButton";
import { CSVUploadModal } from "../../molecules/CSVUploadModal/CSVUploadModal";
import ActionCard from "../../molecules/ActionCard/ActionCard";
import "./racePhaseDashboard.scss";

export default function SetupDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const exportEventOrderTemplate = (e: { preventDefault: any }) => {
    e.preventDefault;
    window.open("api/event-order-template-export/");
  };

  const exportBibData = (e: { preventDefault: any }) => {
    e.preventDefault;
    window.open("api/bib-data-export/");
  };

  return (
    <div className="race-setup">
      {/* Action cards */}
      <div className="actions">
        <ActionCard
          title={"Import BROE data"}
          icon={"refresh"}
          description={"Fetch crew & race data directly from British Rowing."}
        >
          <BROELoader />
        </ActionCard>

        <ActionCard
          title="Download event order template"
          icon={"download"}
          description="Get a CSV template to structure your event order."
        >
          <TextButton onClick={exportEventOrderTemplate} label={"Export event order template"} />
        </ActionCard>

        <ActionCard title="Import event order" icon={"upload"} description="Import event order from CSV">
          <CSVUploadModal
            title="Import event order"
            description="Upload a CSV file to import the order in which event categories will race"
            url="/api/event-order-import/"
            acceptedFileTypes={[".csv"]}
            autoCloseDelay={3000}
            onSuccess={(data) => {
              console.log("Event order imported:", data);
            }}
            onError={(error) => {
              console.error("Import failed:", error);
            }}
          />
        </ActionCard>

        <ActionCard
          title="Calculate start order"
          icon={"flag"}
          description="Create the official start order for the event."
        >
          <TextButton pathName="/generate-start-order/crew-start-order" label={"Start order"} />
        </ActionCard>

        <ActionCard
          title="Export bibs for BROE"
          icon={"download"}
          description="Export calculated start order as bib numbers for import into British Rowing."
        >
          <TextButton onClick={exportBibData} label={"Export event order template"} />
        </ActionCard>
      </div>
    </div>
  );
}
