import React, { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Hero from "../../organisms/Hero/Hero";
import Header from "../../organisms/Header/Header";
import "./crewManagementDashboard.scss";
import ResultsComparison from "../../organisms/ResultsComparison/ResultsComparison";
import RaceTimesTable from "../../organisms/RaceTimesTable/RaceTimesTable";
import SequenceComparisonTable from "../../organisms/SequenceComparisonTable/SequenceComparisonTable";
import MastersCrewsTable from "../../organisms/MastersCrewsTable/MastersCrewsTable";
import CrewsTable from "../../organisms/CrewsTable/CrewsTable";
import CloseTimesReport from "../../organisms/CloseTimesReport/CloseTimesReport";
import { useRaces } from "../../../hooks/useRaces";

interface TabConfig {
  key: string;
  label: string;
  count?: number;
  component: "crew-table" | "compare-winners" | "race-times" | "sequence-comparison" | "masters-crews" | "close-times";
  raceId?: number;
  tap?: "Start" | "Finish";
}

export default function CrewManagementDashboard() {
  // Initialize activeTab from sessionStorage or default to "all"
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem("crew-dashboard-active-tab") || "all";
  });

  const queryClient = useQueryClient();
  const { data: racesData, isLoading: racesLoading, error: racesError } = useRaces();

  // Generate dynamic tabs based on available races
  const tabs = useMemo<TabConfig[]>(() => {
    const baseTabs: TabConfig[] = [
      {
        key: "sequence-comparison-start",
        label: "Sequence compare - start",
        component: "sequence-comparison",
        tap: "Start"
      },
      {
        key: "sequence-comparison-finish",
        label: "Sequence compare - finish",
        component: "sequence-comparison",
        tap: "Finish"
      },
      {
        key: "all",
        label: "All crews",
        component: "crew-table"
      },
      {
        key: "masters-crews",
        label: "Masters",
        component: "masters-crews"
      },
      {
        key: "compare-winners",
        label: "Compare winners",
        component: "compare-winners"
      },
      {
        key: "close-times",
        label: "Close 1st/2nd",
        component: "close-times"
      }
    ];

    // Add dynamic race timing tabs (insert at beginning)
    if (racesData && Array.isArray(racesData)) {
      racesData.forEach((race) => {
        baseTabs.unshift(
          {
            key: `race-${race.id}-start`,
            label: ` Start taps - ${race.name}`,
            component: "race-times",
            raceId: race.id,
            tap: "Start"
          },
          {
            key: `race-${race.id}-finish`,
            label: `Finish taps - ${race.name}`,
            component: "race-times",
            raceId: race.id,
            tap: "Finish"
          }
        );
      });
    }

    return baseTabs;
  }, [racesData]);

  // Handle tab validation when tabs are fully loaded
  useEffect(() => {
    // Only validate tabs after races have loaded (when we have dynamic tabs)
    if (racesData && !racesLoading) {
      const savedTab = sessionStorage.getItem("crew-dashboard-active-tab");

      if (savedTab && !tabs.find((tab) => tab.key === savedTab)) {
        setActiveTab("all");
        sessionStorage.setItem("crew-dashboard-active-tab", "all");
      }
    }
  }, [tabs, racesData, racesLoading]);

  // Event handlers
  const handleDataChanged = () => {
    queryClient.invalidateQueries({ queryKey: ["races"] });
    queryClient.invalidateQueries({ queryKey: ["crews"] });
    queryClient.invalidateQueries({ queryKey: ["winners-comparison"] });
    queryClient.invalidateQueries({ queryKey: ["raceTimes"] });
  };

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    sessionStorage.setItem("crew-dashboard-active-tab", tabKey);
  };

  // Render tab content
  const renderTabContent = () => {
    const currentTab = tabs.find((tab) => tab.key === activeTab);
    if (!currentTab) return <div className="crew-manager__error">Tab not found</div>;

    switch (currentTab.component) {
      case "crew-table":
        // CrewsTable now handles its own data fetching - no props needed!
        return <CrewsTable onDataChanged={handleDataChanged} />;

      case "compare-winners":
        return <ResultsComparison />;

      case "sequence-comparison":
        if (!currentTab.tap) {
          return <div className="crew-manager__error">Invalid sequence comparison configuration</div>;
        }

        return <SequenceComparisonTable tap={currentTab.tap} onDataChanged={handleDataChanged} />;

      case "masters-crews":
        return <MastersCrewsTable onDataChanged={handleDataChanged} />;

      case "race-times":
        if (!currentTab.raceId || !currentTab.tap) {
          return <div className="crew-manager__error">Invalid race configuration</div>;
        }

        const race = racesData?.find((r) => r.id === currentTab.raceId);
        return (
          <RaceTimesTable
            raceId={currentTab.raceId}
            tap={currentTab.tap}
            raceName={race?.name || "Unknown Race"}
            onDataChanged={handleDataChanged}
          />
        );
      case "close-times":
        return <CloseTimesReport />;

      default:
        return <div className="crew-manager__error">Unknown component type</div>;
    }
  };

  // console.log("Current tabs:", tabs);
  // console.log("Active tab:", activeTab);
  // console.log(racesData);

  return (
    <>
      <Header />
      <Hero title={"Crew management dashboard"} />

      <section className="crew-manager__section">
        <div className="crew-manager__container">
          <div className="crew-manager__tab-wrapper">
            <ul className="crew-manager__tabs">
              {tabs.map((tab) => (
                <li
                  key={tab.key}
                  className={`crew-manager__tab ${activeTab === tab.key ? "crew-manager__tab--active" : ""}`}
                >
                  <button className="crew-manager__tab-button" onClick={() => handleTabChange(tab.key)}>
                    <span className="crew-manager__tab-label">{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="crew-manager__content">{renderTabContent()}</div>
        </div>
      </section>
    </>
  );
}
