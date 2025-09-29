import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatTimes } from "../../../lib/helpers";
import "./closeTimesReport.scss";
import { report } from "process";

interface CrewData {
  penalty: number;
  competitor_names: string;
  bib_number: number;
  club_name: string;
  published_time: number;
}

interface OverallData {
  first_place: CrewData & { event_band: string };
  second_place: CrewData & { event_band: string };
  time_difference: number;
  closeness: "very-close" | "close" | "normal";
}

interface ReportRow {
  event_band: string;
  first_place: CrewData;
  second_place: CrewData;
  time_difference: number;
  closeness: "very-close" | "close" | "normal";
}

interface CloseTimesReportResponse {
  overall: OverallData | null;
  categories: ReportRow[];
  total_categories: number;
  very_close_count: number;
  close_count: number;
  overall_is_close: boolean;
}

const fetchCloseTimesReport = async (): Promise<CloseTimesReportResponse> => {
  const response = await fetch("/api/crew-close-times/");

  if (!response.ok) {
    throw new Error(`Failed to fetch close times report: ${response.status}`);
  }

  return await response.json();
};

export default function CloseTimesReport() {
  const {
    data: reportData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["close-times-report"],
    queryFn: fetchCloseTimesReport,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="close-times-report__loading">
        <div className="close-times-report__loading-content">
          <div className="close-times-report__spinner"></div>
          <p>Loading close times report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="close-times-report__error">
        <div className="close-times-report__error-content">
          <h4>Error loading report</h4>
          <p>Failed to load close times report</p>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const getClosenessLabel = (closeness: string): string => {
    switch (closeness) {
      case "very_close":
        return "Very close (≤0.5s)";
      case "close":
        return "Close (≤1s)";
      default:
        return "Normal (>1s)";
    }
  };

  const formatTimeDifference = (seconds: number): string => {
    return `${seconds.toFixed(2)}s`;
  };

  console.log(reportData);

  return (
    <div className="close-times-report">
      <div className="close-times-report__header">
        <h2 className="close-times-report__title">Close times report</h2>
        <div className="close-times-report__summary">
          <div className="close-times-report__stat">
            <span className="close-times-report__stat-label">Total categories:</span>
            <span className="close-times-report__stat-value">{reportData?.total_categories || 0}</span>
          </div>
          <div className="close-times-report__stat close-times-report__stat--very-close">
            <span className="close-times-report__stat-label">Very close (≤0.5s):</span>
            <span className="close-times-report__stat-value">{reportData?.very_close_count || 0}</span>
          </div>
          <div className="close-times-report__stat close-times-report__stat--close">
            <span className="close-times-report__stat-label">Close (≤1s):</span>
            <span className="close-times-report__stat-value">{reportData?.close_count || 0}</span>
          </div>
          {reportData?.overall_is_close && (
            <div className="close-times-report__stat close-times-report__stat--overall-close">
              <span className="close-times-report__stat-label">🏆 Overall race:</span>
              <span className="close-times-report__stat-value">Close!</span>
            </div>
          )}
        </div>
      </div>

      {/* Overall Winners Section */}
      {reportData?.overall && (
        <div className="close-times-report__overall-section">
          <h3 className="close-times-report__section-title">Overall winners</h3>
          <div className="close-times-report__table-container">
            <table className="close-times-report__table">
              <thead className="close-times-report__header-group">
                <tr className="close-times-report__header-row">
                  <th className="close-times-report__header-cell">Position</th>
                  <th className="close-times-report__header-cell">Crew</th>
                  <th className="close-times-report__header-cell">Event band</th>
                  <th className="close-times-report__header-cell">Time</th>
                  <th className="close-times-report__header-cell">Difference</th>
                  <th className="close-times-report__header-cell">Status</th>
                </tr>
              </thead>
              <tbody className="close-times-report__body">
                <tr className={`close-times-report__row close-times-report__row--${reportData.overall.closeness}`}>
                  <td className="close-times-report__cell close-times-report__cell--position">🥇 1st</td>
                  <td className="close-times-report__cell close-times-report__cell--crew">
                    <div className="close-times-report__crew-info">
                      <div className="close-times-report__crew-name">
                        {reportData.overall.first_place.competitor_names}
                      </div>
                      <div className="close-times-report__crew-details">
                        <span className="close-times-report__bib">#{reportData.overall.first_place.bib_number}</span>
                        <span className="close-times-report__club">{reportData.overall.first_place.club_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="close-times-report__cell close-times-report__cell--event-band">
                    {reportData.overall.first_place.event_band}
                  </td>
                  <td className="close-times-report__cell close-times-report__cell--time">
                    {formatTimes(reportData.overall.first_place.published_time)}
                  </td>
                  <td className="close-times-report__cell close-times-report__cell--difference">—</td>
                  <td className="close-times-report__cell close-times-report__cell--status">Winner</td>
                </tr>
                <tr className={`close-times-report__row close-times-report__row--${reportData.overall.closeness}`}>
                  <td className="close-times-report__cell close-times-report__cell--position">🥈 2nd</td>
                  <td className="close-times-report__cell close-times-report__cell--crew">
                    <div className="close-times-report__crew-info">
                      <div className="close-times-report__crew-name">
                        {reportData.overall.second_place.competitor_names}
                      </div>
                      <div className="close-times-report__crew-details">
                        <span className="close-times-report__bib">#{reportData.overall.second_place.bib_number}</span>
                        <span className="close-times-report__club">{reportData.overall.second_place.club_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="close-times-report__cell close-times-report__cell--event-band">
                    {reportData.overall.second_place.event_band}
                  </td>
                  <td className="close-times-report__cell close-times-report__cell--time">
                    {formatTimes(reportData.overall.second_place.published_time)}
                  </td>
                  <td className="close-times-report__cell close-times-report__cell--difference">
                    +{formatTimeDifference(reportData.overall.time_difference)}
                  </td>
                  <td
                    className={`close-times-report__cell close-times-report__cell--status close-times-report__cell--status-${reportData.overall.closeness}`}
                  >
                    {getClosenessLabel(reportData.overall.closeness)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Results Section */}
      <div className="close-times-report__category-section">
        <h3 className="close-times-report__section-title">Category results</h3>
        <div className="close-times-report__table-container">
          <table className="close-times-report__table">
            <thead className="close-times-report__header-group">
              <tr className="close-times-report__header-row">
                <th className="close-times-report__header-cell">Event band</th>
                <th className="close-times-report__header-cell">1st place</th>
                <th className="close-times-report__header-cell">Time</th>
                <th className="close-times-report__header-cell">Penalty</th>
                <th className="close-times-report__header-cell">2nd place</th>
                <th className="close-times-report__header-cell">Time</th>
                <th className="close-times-report__header-cell">Penalty</th>
                <th className="close-times-report__header-cell">Difference</th>
                <th className="close-times-report__header-cell">Status</th>
              </tr>
            </thead>
            <tbody className="close-times-report__body">
              {reportData?.categories.map((row, index) => (
                <tr
                  key={`${row.event_band}-${index}`}
                  className={`close-times-report__row close-times-report__row--${row.closeness}`}
                >
                  <td className="close-times-report__cell close-times-report__cell--event-band">{row.event_band}</td>

                  {/* First Place */}
                  <td className="close-times-report__cell close-times-report__cell--crew">
                    <div className="close-times-report__crew-info">
                      <div className="close-times-report__crew-name">{row.first_place.competitor_names}</div>
                      <div className="close-times-report__crew-details">
                        <span className="close-times-report__bib">#{row.first_place.bib_number}</span>
                        <span className="close-times-report__club">{row.first_place.club_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="close-times-report__cell close-times-report__cell--time">
                    {formatTimes(row.first_place.published_time)}
                  </td>
                  <td className="close-times-report__cell close-times-report__cell--penalty">
                    {row.first_place.penalty}
                  </td>

                  {/* Second Place */}
                  <td className="close-times-report__cell close-times-report__cell--crew">
                    <div className="close-times-report__crew-info">
                      <div className="close-times-report__crew-name">{row.second_place.competitor_names}</div>
                      <div className="close-times-report__crew-details">
                        <span className="close-times-report__bib">#{row.second_place.bib_number}</span>
                        <span className="close-times-report__club">{row.second_place.club_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="close-times-report__cell close-times-report__cell--time">
                    {formatTimes(row.second_place.published_time)}
                  </td>
                  <td className="close-times-report__cell close-times-report__cell--penalty">
                    {row.second_place.penalty}
                  </td>

                  <td className="close-times-report__cell close-times-report__cell--difference">
                    {formatTimeDifference(row.time_difference)}
                  </td>
                  <td
                    className={`close-times-report__cell close-times-report__cell--status close-times-report__cell--status-${row.closeness}`}
                  >
                    {getClosenessLabel(row.closeness)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(!reportData?.categories || reportData.categories.length === 0) && !reportData?.overall && (
        <div className="close-times-report__empty">
          <p>No data available for close times report.</p>
        </div>
      )}
    </div>
  );
}
