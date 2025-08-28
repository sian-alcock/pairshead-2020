import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Header from '../../organisms/Header/Header';
import Hero from '../../organisms/Hero/Hero';
import StatBlock, { StatBlockProps } from "../../organisms/StatBlock/StatBlock";
import './home.scss'
import axios, { AxiosResponse } from 'axios';
import { Link } from "react-router-dom";
import BROELoader from "../../molecules/BROEDataLoader/BROELoader";
import { useCurrentRaceMode } from "../../hooks/useGlobalSettings";

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


export default function Home() {
  const { raceMode } = useCurrentRaceMode();
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

  const statBlocks = useMemo(() => {
    if (!statsData) return [];

    const blocks: StatBlockProps[] = [
      {
        value: statsData.crews_count,
        subtitle: 'accepted crews',
        status: statsData.crews_count > 0 ? 'good' : 'warning',
        link: '/generate-results/crew-management-dashboard',
        linkText: 'View crews'
      },
      {
        value: statsData.races_count,
        subtitle: statsData.races_count === 0 ? "Import races first" : "races configured",
        status: statsData.races_count > 0 ? 'good' : 'error',
        link: '/generate-results',
        linkText: 'View races'
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

  return (
    <>
      <Header />
      <Hero title="Home" />
      <section className="home__section">
        <div className="home__container">
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
        </div>
      </section>
      <section className="home__section">
        <div className="home__container">

          {raceMode === 'SETUP' &&

            <>
              <div className="step-card">
                <h3>1. Import Data</h3><BROELoader
                  importPersonalData={false} />
                <ul>
                  <li><Link to="/generate-results/import-broe-data">Get data from British Rowing</Link></li>
                  <li><Link to="/generate-results/import-penalties">Import penalties</Link></li>
                  <li><Link to="/generate-results/import-original-events">Import original event categories</Link></li>
                  <li><Link to="/generate-results/import-masters-adjustments">Import masters adjustments</Link></li>
                </ul>
              </div><div className="step-card">
                <h3>2. Configure Times & Offsets</h3>
                <ul>
                  <li><Link to="/generate-results/manage-race-times">Manage race times</Link></li>
                  <li><Link to="/generate-results/manage-timing-offsets">Manage timing offsets</Link></li>
                </ul>
              </div><div className="step-card">
                <h3>3. Calculate Results</h3>
                <ul>
                  <li><Link to="/generate-results/update-calculations">Update all calculations</Link></li>
                </ul>
              </div><div className="step-card">
                <h3>4. Generate Reports</h3>
                <ul>
                  <li><Link to="/generate-results/reports">View all reports</Link></li>
                </ul>
              </div></>}

          {raceMode === 'PRE_RACE' &&

            <>
              <div className="step-card">
                <h3>1. Import Data</h3><BROELoader
                  importPersonalData={true} />
                <ul>
                  <li><Link to="/generate-results/import-broe-data">Get data from British Rowing</Link></li>
                  <li><Link to="/generate-results/import-penalties">Import penalties</Link></li>
                  <li><Link to="/generate-results/import-original-events">Import original event categories</Link></li>
                  <li><Link to="/generate-results/import-masters-adjustments">Import masters adjustments</Link></li>
                </ul>
              </div><div className="step-card">
                <h3>2. Configure Times & Offsets</h3>
                <ul>
                  <li><Link to="/generate-results/manage-race-times">Manage race times</Link></li>
                  <li><Link to="/generate-results/manage-timing-offsets">Manage timing offsets</Link></li>
                </ul>
              </div><div className="step-card">
                <h3>3. Calculate Results</h3>
                <ul>
                  <li><Link to="/generate-results/update-calculations">Update all calculations</Link></li>
                </ul>
              </div><div className="step-card">
                <h3>4. Generate Reports</h3>
                <ul>
                  <li><Link to="/generate-results/reports">View all reports</Link></li>
                </ul>
              </div>
            </>}

          {raceMode === 'RACE' &&

            <>
              <div className="step-card">
                <h3>1. Import Data</h3><BROELoader
                  importPersonalData={true} />
                <ul>
                  <li><Link to="/generate-results/import-broe-data">Get data from British Rowing</Link></li>
                  <li><Link to="/generate-results/import-penalties">Import penalties</Link></li>
                  <li><Link to="/generate-results/import-original-events">Import original event categories</Link></li>
                  <li><Link to="/generate-results/import-masters-adjustments">Import masters adjustments</Link></li>
                </ul>
              </div><div className="step-card">
                <h3>2. Configure Times & Offsets</h3>
                <ul>
                  <li><Link to="/generate-results/manage-race-times">Manage race times</Link></li>
                  <li><Link to="/generate-results/manage-timing-offsets">Manage timing offsets</Link></li>
                </ul>
              </div><div className="step-card">
                <h3>3. Calculate Results</h3>
                <ul>
                  <li><Link to="/generate-results/update-calculations">Update all calculations</Link></li>
                </ul>
              </div><div className="step-card">
                <h3>4. Generate Reports</h3>
                <ul>
                  <li><Link to="/generate-results/reports">View all reports</Link></li>
                </ul>
              </div></>}
        </div>
      </section>
    </>
  )
}