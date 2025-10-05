import React, { useMemo } from "react";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";
import StatBlock, { StatBlockProps } from "../../organisms/StatBlock/StatBlock";
import { useCurrentRaceMode } from "../../hooks/useGlobalSettings";
import PreRaceDashboard from "../../organisms/RacePhaseDashboard/PreRaceDashboard";
import RaceDashboard from "../../organisms/RacePhaseDashboard/RaceDashboard";
import { useDataStats } from "../../../hooks/useDataStats";
import "./home.scss";

export default function Home() {
  const { raceMode } = useCurrentRaceMode();

  // Convert raceMode to phase format for API
  const phase = useMemo(() => {
    switch (raceMode) {
      case "PRE_RACE":
        return "pre-race";
      case "RACE":
        return "race";
      default:
        return "pre-race";
    }
  }, [raceMode]);

  // Fetch stats for current phase
  const { data: statsData, isLoading: statsLoading, error: statsError } = useDataStats(phase);

  const statBlocks = useMemo(() => {
    if (!statsData) return [];

    const blocks: StatBlockProps[] = [];

    // Phase-specific stat blocks
    if (phase === "pre-race") {
      blocks.push(
        {
          value: statsData.total_crews_count,
          subtitle: "total crews registered",
          status: statsData.total_crews_count > 0 ? "good" : "warning"
        },
        {
          value: statsData.scratched_crews_count,
          subtitle: "scratched crews",
          status: "neutral"
        },
        {
          value: statsData.withdrawn_crews_count,
          subtitle: "withdrawn crews",
          status: "neutral"
        },
        {
          value: statsData.submitted_crews_count,
          subtitle: "submitted crews",
          status: statsData.submitted_crews_count > 0 ? "good" : "warning"
        },
        {
          value: statsData.accepted_crews_count,
          subtitle: "accepted crews",
          status: statsData.accepted_crews_count > 0 ? "good" : "warning"
        },
        {
          value: statsData.event_order_count,
          subtitle: "event orders configured",
          status: statsData.event_order_count > 0 ? "good" : "warning"
        },
        {
          value: statsData.marshalling_divisions_count,
          subtitle: "marshalling divisions",
          status: statsData.marshalling_divisions_count > 0 ? "good" : "warning"
        },
        {
          value: statsData.number_locations_count,
          subtitle: "host clubs",
          status: statsData.number_locations_count > 0 ? "good" : "warning"
        }
      );
    } else if (phase === "race") {
      blocks.push(
        {
          value: statsData.accepted_crews_count,
          subtitle: "crews racing",
          status: statsData.accepted_crews_count > 0 ? "good" : "warning"
        },
        {
          value: statsData.race_times_count,
          subtitle: statsData.race_times_count > 0 ? "times recorded" : "No times yet",
          status: statsData.race_times_count > 0 ? "good" : "neutral"
        },
        {
          value: statsData.races_count,
          subtitle: "total races",
          status: "good"
        },
        {
          value: statsData.original_event_categories_imported,
          subtitle: "original event categories",
          status: statsData.original_event_categories_imported > 0 ? "good" : "warning"
        },
        {
          value: statsData.masters_crews_count,
          subtitle: "masters crews",
          status: "neutral"
        },
        {
          value: statsData.crews_with_penalties,
          subtitle: "crews with penalties",
          status: "neutral"
        }
      );
    }

    return blocks;
  }, [statsData, phase]);

  // Calculate number of skeleton blocks based on phase
  const skeletonBlockCount = useMemo(() => {
    switch (phase) {
      case "pre-race":
        return 9;
      case "race":
        return 5;
      default:
        return 9;
    }
  }, [phase]);

  return (
    <>
      <Header />
      <Hero title="Home" />
      <section className="home__section">
        <div className="home__container">
          <div className="crew-manager__stat-blocks-grid">
            {statsLoading ? (
              // Show loading skeleton blocks based on phase
              Array.from({ length: skeletonBlockCount }).map((_, index) => (
                <StatBlock key={index} value="Loading..." status="neutral" loading={true} />
              ))
            ) : statsError ? (
              <StatBlock value="Error" subtitle="Unable to load data overview" status="error" />
            ) : (
              statBlocks.map((block, index) => <StatBlock key={index} {...block} />)
            )}
          </div>
        </div>
      </section>
      <section className="home__section">
        <div className="home__container">
          {raceMode === "PRE_RACE" && <PreRaceDashboard />}
          {raceMode === "RACE" && <RaceDashboard />}
        </div>
      </section>
    </>
  );
}
