// RawTimeComparisonTable.tsx - Organism Component
import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
  createColumnHelper,
  SortingState,
  ColumnFiltersState
} from "@tanstack/react-table";
import axios, { AxiosResponse } from "axios";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import "./rawTimeComparisonTable.scss";
import { FormSelect } from "../../atoms/FormSelect/FormSelect";
import Stat from "../../molecules/Stat/Stat";
import { formatTimes } from "../../../lib/helpers";
import { Link } from "react-router-dom";

// Types
interface CrewInfo {
  id: number;
  bib_number: string | number | null;
  name: string;
  competitor_names?: string;
  club?: string;
}

interface RaceTimeDetails {
  start_id?: number | null;
  finish_id?: number | null;
  start_time?: number | null;
  finish_time?: number | null;
  raw_time?: number | null;
  incomplete?: boolean;
}

interface ConfidenceInfo {
  level: "high" | "medium" | "low" | "single" | "none";
  score: number;
  time_spread?: number;
  max_time?: number;
  min_time?: number;
  avg_time?: number;
}

interface RaceInfo {
  name: string;
  race_id: string;
  is_reference: boolean;
}

interface RawTimeComparisonRow {
  crew: CrewInfo;
  raw_times: Record<number, number | null>; // race_id -> raw_time in centiseconds
  race_time_details: Record<number, RaceTimeDetails>;
  missing_races: number[];
  incomplete_races: number[];
  confidence: ConfidenceInfo;
}

interface RawTimeComparisonData {
  races: Record<number, RaceInfo>;
  race_coverage: Record<
    number,
    {
      complete_count: number;
      incomplete_count: number;
      missing_count: number;
      coverage_percentage: number;
    }
  >;
  comparison_data: RawTimeComparisonRow[];
  total_crews: number;
  confidence_summary: {
    high: number;
    medium: number;
    low: number;
    single: number;
    none: number;
    high_percentage: number;
  };
  summary: {
    total_races: number;
    crews_with_data: number;
  };
}

interface RawTimeComparisonTableProps {
  onDataChanged?: () => void;
}

// API function
const fetchRawTimeComparison = async (): Promise<RawTimeComparisonData> => {
  const response: AxiosResponse = await axios.get(`/api/raw-time-comparison/`);
  return response.data;
};

// Custom filter functions
const confidenceFilterFn = (row: any, columnId: string, filterValue: string) => {
  const cellValue = row.getValue(columnId);
  if (filterValue === "all") return true;
  return cellValue?.level === filterValue;
};

export default function RawTimeComparisonTable({ onDataChanged }: RawTimeComparisonTableProps) {
  const queryClient = useQueryClient();
  const columnHelper = createColumnHelper<RawTimeComparisonRow>();

  // Component state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");

  // Data fetching
  const {
    data: comparisonData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["rawTimeComparison"],
    queryFn: () => {
      console.log(`Fetching raw time comparison...`);
      return fetchRawTimeComparison();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - we invalidate on crew updates anyway
    retry: 3
  });

  // Dynamic columns
  const columns = useMemo<ColumnDef<RawTimeComparisonRow, any>[]>(() => {
    if (!comparisonData) return [];

    const baseColumns: ColumnDef<RawTimeComparisonRow, any>[] = [
      // Crew info column
      columnHelper.accessor("crew", {
        id: "crew_info",
        header: "Crew",
        cell: (info) => {
          const crew = info.getValue();
          return (
            <div className="raw-time-comparison__crew-info">
              <div className="raw-time-comparison__crew-name">
                <Link
                  to={`/crew-management-dashboard/${crew.id}/edit`}
                  className="raw-time-comparison__cell raw-time-comparison__cell--id"
                >
                  {crew.competitor_names || crew.name}
                </Link>
              </div>
              <div className="raw-time-comparison__crew-details">
                Bib: {crew.bib_number} • {crew.club}
              </div>
            </div>
          );
        },
        enableSorting: true,
        size: 250
      }),

      // Confidence column
      columnHelper.accessor("confidence", {
        id: "confidence_level",
        header: "Confidence",
        cell: (info) => {
          const confidence = info.getValue();
          const confidenceClass = `raw-time-comparison__confidence raw-time-comparison__confidence--${confidence.level}`;

          const labels: any = {
            high: "High",
            medium: "Medium",
            low: "Low",
            single: "Single race",
            none: "No data"
          };

          return (
            <div className={confidenceClass}>
              <span className="raw-time-comparison__confidence-label">{labels[confidence.level] + " "}</span>
              {confidence.time_spread !== undefined && confidence.time_spread > 0 && (
                <span className="raw-time-comparison__confidence-spread">
                  (Diff: {(confidence.time_spread / 100).toFixed(2)}s)
                </span>
              )}
            </div>
          );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          return rowA.original.confidence.score - rowB.original.confidence.score;
        },
        filterFn: confidenceFilterFn,
        size: 150
      })
    ];

    // Add raw time columns for each race
    const raceColumns: ColumnDef<RawTimeComparisonRow, any>[] = [];
    Object.entries(comparisonData.races).forEach(([raceId, raceInfo]) => {
      const numericRaceId = parseInt(raceId);
      raceColumns.push(
        columnHelper.accessor((row) => row.raw_times[numericRaceId], {
          id: `race_${raceId}`,
          header: () => (
            <div className="raw-time-comparison__race-header">
              <div className="raw-time-comparison__race-name">{raceInfo.name}</div>
              <div className="raw-time-comparison__race-id">({raceInfo.race_id})</div>
              <div className="raw-time-comparison__coverage">
                {comparisonData.race_coverage[numericRaceId]?.complete_count || 0} complete
              </div>
            </div>
          ),
          cell: (info) => {
            const row = info.row.original;
            const rawTime = info.getValue();
            const details = row.race_time_details[numericRaceId];

            if (!details) {
              return <span className="raw-time-comparison__cell raw-time-comparison__cell--missing">Missing</span>;
            }

            if (details.incomplete) {
              return (
                <div className="raw-time-comparison__time-incomplete">
                  <span className="raw-time-comparison__incomplete-label">Incomplete</span>
                  <div className="raw-time-comparison__incomplete-details">
                    {details.start_time ? `Start: ${formatTimes(details.start_time)}` : "No start"}
                    <br />
                    {details.finish_time ? `Finish: ${formatTimes(details.finish_time)}` : "No finish"}
                  </div>
                </div>
              );
            }

            if (rawTime === null || rawTime === undefined) {
              return <span className="raw-time-comparison__cell raw-time-comparison__cell--na">N/A</span>;
            }

            // Determine if this time deviates from average
            const avgTime = row.confidence.avg_time;
            let deviationClass = "";
            if (avgTime && row.confidence.level !== "single") {
              const diff = Math.abs(rawTime - avgTime);
              if (diff > 500) {
                // 5.0s in centiseconds
                deviationClass = "raw-time-comparison__time--high-deviation";
              } else if (diff > 100) {
                // 1.0s in centiseconds
                deviationClass = "raw-time-comparison__time--medium-deviation";
              }
            }

            return (
              <div className={`raw-time-comparison__time-info ${deviationClass}`}>
                <div className="raw-time-comparison__raw-time">{formatTimes(rawTime)}</div>
              </div>
            );
          },
          enableSorting: true,
          size: 150
        })
      );
    });

    // Create grouped columns
    const groupedColumns: ColumnDef<RawTimeComparisonRow, any>[] = [
      ...baseColumns,
      columnHelper.group({
        id: "race_times",
        header: "Raw times by race",
        columns: raceColumns
      })
    ];

    return groupedColumns;
  }, [comparisonData]);

  const table = useReactTable({
    data: comparisonData?.comparison_data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: false,
    manualSorting: false,
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 25
      },
      sorting: [
        {
          id: "confidence_level",
          desc: false
        }
      ]
    }
  });

  // Refresh data handler
  const handleRefreshData = () => {
    refetch();
    onDataChanged?.();
  };

  // Handle confidence filter change
  const handleConfidenceFilterChange = (value: string) => {
    setConfidenceFilter(value);
    if (value === "all") {
      setColumnFilters((prev) => prev.filter((f) => f.id !== "confidence_level"));
    } else {
      setColumnFilters((prev) => [
        ...prev.filter((f) => f.id !== "confidence_level"),
        { id: "confidence_level", value }
      ]);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="raw-time-comparison__loading">
        <div className="raw-time-comparison__loading-content">
          <div className="raw-time-comparison__spinner"></div>
          <p>Loading raw time comparison...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage = (error as any)?.response?.data?.error || "Failed to load comparison data";

    return (
      <div className="raw-time-comparison__error">
        <div className="raw-time-comparison__error-content">
          <h4>Error loading raw time comparison</h4>
          <p>{errorMessage}</p>
          <button className="raw-time-comparison__retry-button" onClick={handleRefreshData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return <div className="raw-time-comparison__no-data">No comparison data available</div>;
  }

  // Check if there's any actual data to display
  if (!comparisonData.races || Object.keys(comparisonData.races).length === 0) {
    return (
      <div className="raw-time-comparison__no-data">
        <p>No races with timing data found. Add races with Start and Finish times to see the comparison report.</p>
      </div>
    );
  }

  if (comparisonData.total_crews === 0) {
    return (
      <div className="raw-time-comparison__no-data">
        <p>No crews with complete timing data found. Assign crews to race times to see the comparison report.</p>
      </div>
    );
  }

  const totalRows = comparisonData.comparison_data.length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const displayedRows = table.getRowModel().rows.length;

  return (
    <div className="raw-time-comparison">
      <div className="raw-time-comparison__header">
        <div className="raw-time-comparison__title-section">
          <h3 className="raw-time-comparison__title">Raw Time Comparison (Finish - Start)</h3>
          <div className="raw-time-comparison__stats">
            <Stat statKey={"Total crews"} statValue={comparisonData.total_crews} />
            <Stat
              statKey={"High confidence <=1s"}
              statValue={`${comparisonData.confidence_summary.high} (${comparisonData.confidence_summary.high_percentage}%)`}
            />
            <Stat statKey={"Medium confidence <=5s"} statValue={comparisonData.confidence_summary.medium} />
            <Stat statKey={"Low confidence >5s"} statValue={comparisonData.confidence_summary.low} />
          </div>
        </div>

        <div className="raw-time-comparison__controls">
          <div className="raw-time-comparison__filter-group">
            <FormSelect
              value={confidenceFilter}
              onChange={(e) => handleConfidenceFilterChange(e.target.value)}
              selectOptions={[
                { label: "All", value: "all" },
                { label: "High confidence", value: "high" },
                { label: "Medium confidence", value: "medium" },
                { label: "Low confidence", value: "low" },
                { label: "Single race only", value: "single" }
              ]}
              fieldName={"filter_confidence"}
              title={"Filter by confidence"}
            />
          </div>

          <div className="raw-time-comparison__search-wrapper">
            <SearchInput
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Search crews, bib numbers..."
              className="raw-time-comparison__search"
            />
          </div>
        </div>
      </div>

      <TablePagination
        table={table}
        className="raw-time-comparison__pagination"
        showRowInfo={false}
        showPageSizeSelector={true}
      />
      <div className="raw-time-comparison__table-container">
        <table className="raw-time-comparison__table">
          <TableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody rows={table.getRowModel().rows} />
        </table>
      </div>

      <div className="raw-time-comparison__footer">
        <div className="raw-time-comparison__results-info">
          <p className="raw-time-comparison__results-text">
            Showing {displayedRows} of {filteredRows} entries
            {globalFilter && filteredRows !== totalRows && <span> (filtered from {totalRows} total)</span>}
          </p>
        </div>

        <TablePagination
          table={table}
          className="raw-time-comparison__pagination"
          showRowInfo={false}
          showPageSizeSelector={true}
        />
      </div>
    </div>
  );
}
