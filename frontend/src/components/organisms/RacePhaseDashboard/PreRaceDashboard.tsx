import { useState } from "react";
import BROELoader from "../../molecules/BROEDataLoader/BROELoader";
import TextButton from "../../atoms/TextButton/TextButton";
import ActionCard from "../../molecules/ActionCard/ActionCard";
import { CSVUploadModal } from "../../molecules/CSVUploadModal/CSVUploadModal";
import DataExportButton from "../../molecules/DataExportComponent/DataExportComponent";

import "./racePhaseDashboard.scss";

export default function PreRaceDashboard() {
  return (
    <div className="pre-race">
      <div className="actions">
        <ActionCard
          title={"Import BROE data"}
          icon={"refresh"}
          description={"Fetch crew & race data directly from British Rowing."}
        >
          <BROELoader importPersonalData={true} />
        </ActionCard>

        <ActionCard
          title="Download event order template"
          icon={"download"}
          description="Get a CSV template to structure your event order."
        >
          <DataExportButton
            url="api/event-order-template-export/"
            buttonText="Event order template"
            filename="event-order.csv"
          />
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
          <TextButton pathName="/crew-start-order" label={"Start order"} />
        </ActionCard>

        <ActionCard
          title="Export bibs for BROE"
          icon={"download"}
          description="Export calculated start order as bib numbers for import into British Rowing."
        >
          <DataExportButton url="api/bib-data-export/" buttonText="Export Bib Data" filename="bib-data.csv" />
        </ActionCard>
        <ActionCard
          title="Setup marshalling divisions"
          icon={"person"}
          description="Assign crews to marshalling divisions"
        >
          <TextButton pathName={"/marshalling-divisions"} label={"Marshalling divisions"} />
        </ActionCard>

        <ActionCard title="Number locations" icon={"numbers"} description="Inspect or modify number locations">
          <TextButton pathName={"/set-number-locations"} label={"Number locations"} />
        </ActionCard>
        <ActionCard
          title="Reports and data exports"
          icon={"report"}
          description="Logistics reports eg crew labels, OTD contact details and data exports"
        >
          <TextButton pathName={"/reports"} label={"Reports and data exports"} />
        </ActionCard>
      </div>
    </div>
  );
}
