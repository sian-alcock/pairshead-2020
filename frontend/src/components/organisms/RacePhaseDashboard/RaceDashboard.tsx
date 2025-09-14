import BROELoader from "../../molecules/BROEDataLoader/BROELoader";
import TextButton from "../../atoms/TextButton/TextButton";
import ActionCard from "../../molecules/ActionCard/ActionCard";
import DataLoader from "../../common/DataLoader";
import "./racePhaseDashboard.scss";

export default function RaceDashboard() {
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
        <ActionCard
          title="Reports and data exports"
          icon={"report"}
          description="Logistics reports eg crew labels, OTD contact details and data exports"
        >
          <TextButton pathName={"/reports"} label={"Reports and data exports"} />
        </ActionCard>
        <ActionCard
          title="Refresh results calculations"
          icon={"refresh"}
          description="Initiate recalculation (should not be necessary but just in case)"
        >
          <DataLoader url="api/crew-update-rankings/" buttonText="Refresh calcs" />
        </ActionCard>
      </div>
    </div>
  );
}
