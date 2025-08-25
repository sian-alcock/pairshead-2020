import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Header from '../../organisms/Header/Header';
import Hero from '../../organisms/Hero/Hero';
import StatBlock, { StatBlockProps } from "../../organisms/StatBlock/StatBlock";
import './home.scss'
import axios, { AxiosResponse } from 'axios';

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


export default function Home () {

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
    </>
  )
}