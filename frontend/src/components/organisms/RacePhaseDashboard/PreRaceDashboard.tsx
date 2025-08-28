import { useState } from "react";
import BROELoader from "../../molecules/BROEDataLoader/BROELoader";
import TextButton from "../../atoms/TextButton/TextButton";
import { CSVUploadModal } from "../../molecules/CSVUploadModal/CSVUploadModal";
import ActionCard from "../../molecules/ActionCard/ActionCard";
import "./racePhaseDashboard.scss";

export default function PreRaceDashboard() {
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
          title="Setup marshalling divisions"
          icon={"search"}
          description="Assign crews to marshalling divisions"
        >
          <TextButton pathName={"/generate-start-order/marshalling-divisions"} label={"Marshalling divisions"} />
        </ActionCard>

        <ActionCard title="Number locations" icon={"add"} description="Inspect or modify number locations">
          <TextButton pathName={"/generate-start-order/set-number-locations"} label={"Number locations"} />
        </ActionCard>
        <ActionCard
          title="Logistics reports"
          icon={"add"}
          description="Create logistics reports eg crew labels, OTD contact details etc"
        >
          <TextButton pathName={"/logistics"} label={"Logistics"} />
        </ActionCard>
      </div>
    </div>
  );
}
