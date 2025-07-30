// Enhanced CrewTimeCompare.tsx with multiple component types
import React, { useState, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import Header from "../../organisms/Header/Header";
import { CrewProps, RaceProps } from "../../components.types";
import CrewTimeCompareTable from "../../organisms/CrewTimeCompareTable/CrewTimeCompareTable";
import "./crewManagementDashboard.scss";
import RaceTimesManager from "../../organisms/RaceTimesManager/RaceTimesManager";
import TimingOffsetManager from "../../organisms/TimingOffsetManager/TimingOffsetManager";
import ResultsComparison from "../../organisms/ResultsComparison/ResultsComparison";

// Shared API functions (can be reused across components)
const fetchCrews = async (): Promise<CrewProps[]> => {
  const response: AxiosResponse = await axios.get("/api/crews/");
  return response.data;
};

const fetchRaces = async (): Promise<RaceProps[]> => {
  const response: AxiosResponse = await axios.get("/api/races/");
  return response.data;
};

export default function CrewManagementDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();


  // Shared queries (only fetch when needed)
  const {
    data: crewsData,
    isLoading: crewsLoading,
    error: crewsError,
  } = useQuery({
    queryKey: ["crews"],
    queryFn: () => {
      console.log("Fetching crews...");
      const startTime = Date.now();
      return fetchCrews().then(result => {
        console.log(`Crews fetch took ${Date.now() - startTime}ms`);
        return result;
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Only fetch when tab needs this data
    enabled: ["all", "high-variance", "missing-times"].includes(activeTab),
  });

  const {
    data: racesData,
    isLoading: racesLoading,
    error: racesError,
  } = useQuery({
    queryKey: ["races"],
    queryFn: () => {
      console.log("Fetching races...");
      const startTime = Date.now();
      return fetchRaces().then(result => {
        console.log(`Races fetch took ${Date.now() - startTime}ms`);
        return result;
      });
    },
    staleTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Only fetch when tab needs this data
    enabled: ["all", "high-variance", "missing-times", "statistics"].includes(activeTab),
  });

  // Filter crews based on active tab
  // const getFilteredCrews = (crews: CrewProps[], tabKey: string): CrewProps[] => {
  //   switch (tabKey) {
  //     case "all":
  //       return crews;
  //     case "high-variance":
  //       return crews.filter(crew => {
  //         // Example: Check if any time variance exceeds threshold
  //         return crew.times.length > 1; // Placeholder logic
  //       });
  //     case "missing-times":
  //       return crews.filter(crew => crew.times.length < 2);
  //     default:
  //       return crews;
  //   }
  // };

  // Tab configuration with component types
  const tabs = [
    { 
      key: "get-data", 
      label: "Get data", 
      count: null,
      component: "data",
      needsCrews: false,
      needsRaces: true
    },
    { 
      key: "all", 
      label: "All Crews", 
      count: crewsData?.length || 0,
      component: "table",
      needsCrews: true,
      needsRaces: true
    },
    {
      key: 'compare-winners',
      label: 'Compare winners',
      count: null,
      component: 'compare-winners',
      needsCrews: false,
      needsRaces: true
    }
  ];

   // ✅ Invalidation handlers (called from child components)
  const handleRaceDataChanged = () => {
    console.log("Race data changed - invalidating related queries");
    // Invalidate all race-dependent data
    queryClient.invalidateQueries({ queryKey: ["races"] });
    queryClient.invalidateQueries({ queryKey: ["crews"] });
    queryClient.invalidateQueries({ queryKey: ["winners-comparison"] });
  };

  const handleCrewDataChanged = () => {
    console.log("Crew data changed - invalidating crew queries");
    // Invalidate crew-dependent data
    queryClient.invalidateQueries({ queryKey: ["crews"] });
    queryClient.invalidateQueries({ queryKey: ["winners-comparison"] });
  };

  // ✅ Tab switching with data refresh
  const handleTabChange = (tabKey: string) => {
    console.log(`Switching to tab: ${tabKey}`);
    setActiveTab(tabKey);
    
    // Force refresh if switching to data-dependent tabs
    const tab = tabs.find(t => t.key === tabKey);
    if (tab?.needsCrews) {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
    }
  };

  // Render the appropriate component based on active tab
  const renderTabContent = () => {
    const currentTab = tabs.find(tab => tab.key === activeTab);
    const isTableTab = ["all"].includes(activeTab);
    const isLoading = isTableTab && (crewsLoading || racesLoading);
    const hasError = isTableTab && (crewsError || racesError);

    switch (currentTab?.component) {
      case "data":
        return (
          <>
            <RaceTimesManager title={"Race times manager"} onDataChanged={handleRaceDataChanged}/>
            <TimingOffsetManager />
          </>
        );
      case "table":
        // const filteredCrews = crewsData ? getFilteredCrews(crewsData, activeTab) : [];
        return (
          // <Suspense fallback={<LoadingSpinner />}>
            <CrewTimeCompareTable 
              crews={crewsData || []}
              races={racesData || []}
              isLoading={isLoading}
              error={!!hasError}
              onDataChanged={handleRaceDataChanged}
            />
          // </Suspense>
        );
      case "compare-winners":
        return (
          <ResultsComparison />
        )
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <>
      <Header />
      <Hero title={"Crew Management Dashboard"} />
      <section className="crew-manager__section">
        <div className="crew-manager__container">
          <div className="crew-manager__tab-wrapper">
            <ul className="crew-manager__tabs">
              {tabs.map((tab) => (
                <li key={tab.key} className={activeTab === tab.key ? "crew-manager__tab is-active" : "crew-manager__tab"}>
                  <a onClick={() => setActiveTab(tab.key)}>
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className="crew-manager__tag">{tab.count}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </section>
    </>
  );
}