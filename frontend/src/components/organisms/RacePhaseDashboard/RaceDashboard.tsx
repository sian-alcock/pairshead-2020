import { useState } from "react";
import BROELoader from "../../molecules/BROEDataLoader/BROELoader";
import TextButton from "../../atoms/TextButton/TextButton";
import { CSVUploadModal } from "../../molecules/CSVUploadModal/CSVUploadModal";
import ActionCard from "../../molecules/ActionCard/ActionCard";
import "./racePhaseDashboard.scss";

export default function RaceDashboard() {
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
          title={"Manage races and times"}
          icon={"flag"}
          description={"Set up race (or races) and import race times."}
        >
          <TextButton pathName="/manage-race-times" label="Manage race times" />
        </ActionCard>

        <ActionCard
          title="Add penalties / disqualifications"
          icon={"warning"}
          description="Import penalties - time only, did not start, did not finish and disqualified."
        >
          <TextButton pathName="/manage-penalties" label={"Manage penalties"} />
        </ActionCard>
        <ActionCard
          title="Add original event categories"
          icon={"category"}
          description="The original event category is essential for masters crews to calculate the handicaps"
        >
          <TextButton pathName="/manage-original-event-categories" label={"Original categories"} />
        </ActionCard>
        <ActionCard title="Inspect crews and results" icon={"search"} description="Review crew data and race times">
          <TextButton pathName="/crew-management-dashboard" label={"Inspect crew data"} />
        </ActionCard>
        <ActionCard title="Final results" icon={"success"} description="Final results">
          <TextButton pathName="/results" label={"Results"} />
        </ActionCard>
        <ActionCard title="Reports and data exports" icon={"report"} description="Final results">
          <TextButton pathName="/export" label={"Reports and exports"} />
        </ActionCard>
      </div>
    </div>
  );
}
