// Enhanced CrewTimeCompare.tsx with TanStack Table and dynamic tabs
import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import Header from "../../organisms/Header/Header";
import { CrewProps, RaceProps } from "../../components.types";
import "./crewManagementDashboard.scss";
import CrewTimeCompareTable from "../../organisms/CrewTimeCompareTable/CrewTimeCompareTable";
import ResultsComparison from "../../organisms/ResultsComparison/ResultsComparison";
import RaceTimesTable from "../../organisms/RaceTimesTable/RaceTimesTable";
import SequenceComparisonTable from "../../organisms/SequenceComparisonTable/SequenceComparisonTable";
import MissingTimesTable from "../../organisms/MissingTimesTable/MissingTimesTable";
import MastersCrewsTable from "../../organisms/MastersCrewsTable/MastersCrewsTable";
import StatBlock, { StatBlockProps } from "../../organisms/StatBlock/StatBlock";
import CrewsTable from "../../organisms/CrewsTable/CrewsTable";


// Types
interface RaceTimeProps {
  id: number;
  sequence: number;
  bib_number?: number;
  tap: string;
  time_tap: number;
  synchronized_time: number;
  crew?: CrewProps;
  race?: RaceProps;
}

interface TabConfig {
  key: string;
  label: string;
  count?: number;
  component: 'crew-table' | 'crew-race-view' | 'compare-winners' | 'race-times' | 'sequence-comparison' | 'missing-times' | 'masters-crews';
  needsCrews?: boolean;
  needsRaces?: boolean;
  raceId?: string;
  tap?: 'Start' | 'Finish';
}

interface DataStats {
  races_count: number;
  crews_count: number;
  race_times_count: number;
  races_with_start_times: number;
  races_with_finish_times: number;
  missing_times_count: number;
  masters_crews_count: number;
  original_event_categories_imported: number;
  last_updated: string;
}

// API functions
const fetchDataStats = async (): Promise<DataStats> => {
  const response: AxiosResponse = await axios.get("/api/crews/stats/");
  return response.data;
};

const fetchCrews = async (): Promise<CrewProps[]> => {
  const response: AxiosResponse = await axios.get("/api/crews/");
  return response.data;
};

const fetchRaces = async (): Promise<RaceProps[]> => {
  const response: AxiosResponse = await axios.get("/api/races/");
  return response.data;
};

export default function CrewManagementDashboard() {
  // Initialize activeTab from sessionStorage or default to "all"
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('crew-dashboard-active-tab') || "all";
  });
  
  const queryClient = useQueryClient();

  // Fetch stats
    const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["data-stats"],
    queryFn: fetchDataStats,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
    // Always fetch stats for dashboard overview
    enabled: true,
  });

  // Fetch crews
  const {
    data: crewsData,
    isLoading: crewsLoading,
    error: crewsError,
  } = useQuery({
    queryKey: ["crews"],
    queryFn: fetchCrews,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    enabled: ["all"].includes(activeTab),
  });

  // Fetch races
  const {
    data: racesData,
    isLoading: racesLoading,
    error: racesError,
  } = useQuery({
    queryKey: ["races"],
    queryFn: fetchRaces,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  });

    const statBlocks = useMemo(() => {
    if (!statsData) return [];

    const blocks: StatBlockProps[] = [
      {
        value: statsData.crews_count,
        subtitle: 'accepted crews',
        status: statsData.crews_count > 0 ? 'good' : 'warning',
      },
      {
        value: statsData.races_count,
        subtitle: statsData.races_count === 0 ? "Import races first" : "races configured",
        status: statsData.races_count > 0 ? 'good' : 'error',
      },
      {
        value: statsData.race_times_count,
        subtitle: statsData.race_times_count > 0 ? "times recorded" : "No times yet",
        status: statsData.race_times_count > 0 ? 'good' : 'warning',
      },
      {
        value: statsData.masters_crews_count,
        subtitle: 'masters crews',
        status: statsData.masters_crews_count > 0 ? 'good' : 'warning',
      },
      {
        value: statsData.original_event_categories_imported,
        subtitle: 'original event categories',
        status: statsData.original_event_categories_imported > 0 ? 'good' : 'warning',
      },
    ];

    return blocks;
  }, [statsData]);

  // Generate dynamic tabs based on available races
  const tabs = useMemo<TabConfig[]>(() => {
    const baseTabs: TabConfig[] = [
      {
        key: "all",
        label: "All Crews",
        count: crewsData?.length || 0,
        component: "crew-table",
        needsCrews: true,
        needsRaces: true,
      },
      {
        key: "crew-race-view",
        label: "Crews / race view",
        count: crewsData?.length || 0,
        component: "crew-race-view",
        needsCrews: true,
        needsRaces: true,
      },
      {
        key: "compare-winners",
        label: "Compare Winners",
        component: "compare-winners",
        needsCrews: false,
        needsRaces: true,
      },
      {
        key: "sequence-comparison-start",
        label: "Sequence Compare - Start",
        component: "sequence-comparison",
        tap: "Start",
      },
      {
        key: "sequence-comparison-finish", 
        label: "Sequence Compare - Finish",
        component: "sequence-comparison",
        tap: "Finish",
      },
      {
        key: "missing-times",
        label: "Missing Times",
        component: "missing-times",
      },
      {
        key: "masters-crews",
        label: "Masters",
        component: "masters-crews",
      },
    ];

    // Add dynamic race timing tabs
    if (racesData) {
      racesData.forEach((race) => {
        baseTabs.push(
          {
            key: `race-${race.id}-start`,
            label: `${race.name} - Start`,
            component: "race-times",
            raceId: race.id,
            tap: "Start",
          },
          {
            key: `race-${race.id}-finish`,
            label: `${race.name} - Finish`,
            component: "race-times",
            raceId: race.id,
            tap: "Finish",
          }
        );
      });
    }

    return baseTabs;
  }, [racesData, crewsData]);

  // Handle tab validation when tabs are fully loaded
  useEffect(() => {
    // Only validate tabs after races have loaded (when we have dynamic tabs)
    if (racesData && !racesLoading) {
      const savedTab = sessionStorage.getItem('crew-dashboard-active-tab');
      
      if (savedTab && !tabs.find(tab => tab.key === savedTab)) {
        console.log(`Saved tab '${savedTab}' no longer exists, resetting to 'all'`);
        setActiveTab("all");
        sessionStorage.setItem('crew-dashboard-active-tab', "all");
      }
    }
  }, [tabs, racesData, racesLoading]);

  // Event handlers
  const handleDataChanged = () => {
    console.log("Race data changed - invalidating related queries");
    queryClient.invalidateQueries({ queryKey: ["data-stats"] });
    queryClient.invalidateQueries({ queryKey: ["races"] });
    queryClient.invalidateQueries({ queryKey: ["crews"] });
    queryClient.invalidateQueries({ queryKey: ["winners-comparison"] });
    queryClient.invalidateQueries({ queryKey: ["raceTimes"] });
  };

  const handleTabChange = (tabKey: string) => {
    console.log(`Switching to tab: ${tabKey}`);
    setActiveTab(tabKey);
    sessionStorage.setItem('crew-dashboard-active-tab', tabKey);
  };

  // Render tab content
  const renderTabContent = () => {
    const currentTab = tabs.find(tab => tab.key === activeTab);
    if (!currentTab) return <div className="crew-manager__error">Tab not found</div>;

    switch (currentTab.component) {
      case "crew-table":  
        return (
          <CrewsTable />
        );

      case "crew-race-view":
        const isLoading = crewsLoading || racesLoading;
        const hasError = crewsError || racesError;
        
        return (
          <CrewTimeCompareTable
            crews={crewsData || []}
            races={racesData || []}
            isLoading={isLoading}
            error={!!hasError}
            onDataChanged={handleDataChanged}
          />
        );

      case "compare-winners":
        return <ResultsComparison />;

      case "sequence-comparison":
        if (!currentTab.tap) {
          return <div className="crew-manager__error">Invalid sequence comparison configuration</div>;
        }
        
        return (
          <SequenceComparisonTable
            tap={currentTab.tap}
            onDataChanged={handleDataChanged}
          />
        );

      case "missing-times":
        return (
          <MissingTimesTable
            onDataChanged={handleDataChanged}
          />
        );

      case "masters-crews":
        return (
          <MastersCrewsTable
            onDataChanged={handleDataChanged}
          />
        );

      case "race-times":
        if (!currentTab.raceId || !currentTab.tap) {
          return <div className="crew-manager__error">Invalid race configuration</div>;
        }
        
        const race = racesData?.find(r => r.id === currentTab.raceId);
        return (
          <RaceTimesTable
            raceId={currentTab.raceId}
            tap={currentTab.tap}
            raceName={race?.name || 'Unknown Race'}
            onDataChanged={handleDataChanged}
          />
        );

      default:
        return <div className="crew-manager__error">Unknown component type</div>;
    }
  };

  console.log("Current tabs:", tabs);
  console.log("Active tab:", activeTab);

  return (
    <>
      <Header />
      <Hero title={"Crew management dashboard"} />

      <section className="crew-manager__stats-section">
        <div className="crew-manager__container">
          <>
            <div className="crew-manager__stat-blocks-grid">
              {statsLoading ? (
                // Show loading skeleton blocks
                Array.from({ length: 5 }).map((_, index) => (
                  <StatBlock 
                    key={index}
                    value="Loading..."
                    status="neutral"
                    loading={true}
                  />
                ))
              ) : statsError ? (
                <StatBlock
                  value="Error"
                  subtitle="Unable to load data overview"
                  status="error"
                />
              ) : (
                statBlocks.map((block, index) => (
                  <StatBlock key={index} {...block} />
                ))
              )}
            </div>
            {statsData?.last_updated && !statsLoading && (
              <div className="crew-manager__last-updated">
                <small>Last updated: {new Date(statsData.last_updated).toLocaleString()}</small>
              </div>
            )}
          </>
        </div>
      </section>

      <section className="crew-manager__section">
        <div className="crew-manager__container">
          <div className="crew-manager__tab-wrapper">
            <ul className="crew-manager__tabs">
              {tabs.map((tab) => (
                <li
                  key={tab.key}
                  className={`crew-manager__tab ${
                    activeTab === tab.key ? "crew-manager__tab--active" : ""
                  }`}
                >
                  <button
                    className="crew-manager__tab-button"
                    onClick={() => handleTabChange(tab.key)}
                  >
                    <span className="crew-manager__tab-label">{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="crew-manager__content">
            {renderTabContent()}
          </div>
        </div>
      </section>
    </>
  );
}