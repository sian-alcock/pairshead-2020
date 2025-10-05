// RawTimeComparisonTable.tsx - Organism Component
import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
  SortingState
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
import Icon from "../../atoms/Icons/Icons";

// Types
interface CrewInfo {
  id: number;
  bib_number: string | number | null;
  name: string;
  competitor_names?: string;
  club?: string;
  event_band?: string;
  status: string;
  time_only: boolean;
  penalty: number;
}

interface RaceTimeDetails {
  start_id?: number | null;
  finish_id?: number | null;
  start_time?: number | null;
  finish_time?: number | null;
  raw_time?: number | null;
  incomplete?: boolean;
  positions?: {
    category?: number;
    overall?: number;
  } | null;
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
  raw_times: Record<number, number | null>;
  race_time_details: Record<number, RaceTimeDetails>;
  missing_races: number[];
  incomplete_races: number[];
  confidence: ConfidenceInfo;
  positions_match: boolean | "None";
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
  filtered_crews: number;
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
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

interface RawTimeComparisonTableProps {
  onDataChanged?: () => void;
}

interface CategoryResponseDataProps {
  override_name: string;
  [key: string]: any;
}

interface SelectOption {
  label: string;
  value: string;
}

// API function
const fetchRawTimeComparison = async (
  page: number,
  pageSize: number,
  search: string,
  ordering: string,
  confidenceLevel: string,
  eventBand: string
): Promise<RawTimeComparisonData> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });

  if (search) params.append("search", search);
  if (ordering) params.append("ordering", ordering);
  if (confidenceLevel && confidenceLevel !== "all") params.append("confidence_level", confidenceLevel);
  if (eventBand && eventBand !== "all") params.append("event_band", eventBand);

  const response: AxiosResponse = await axios.get(`/api/raw-time-comparison/?${params.toString()}`);
  return response.data;
};

export default function RawTimeComparisonTable({ onDataChanged }: RawTimeComparisonTableProps) {
  const queryClient = useQueryClient();
  const columnHelper = createColumnHelper<RawTimeComparisonRow>();

  // Component state - now managing server-side pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "confidence_level", desc: false }]);
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [eventBandFilter, setEventBandFilter] = useState<string>("");

  // Fetch event bands (categories) for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<SelectOption[]> => {
      const response = await axios.get("/api/events/");
      const responseData: CategoryResponseDataProps[] = response.data;
      let eventBands = responseData.map((event) => event.override_name);
      eventBands = Array.from(new Set(eventBands)).sort();
      const options = eventBands.map((option) => ({
        label: option,
        value: option
      }));
      return [{ label: "All events", value: "" }, ...options];
    }
  });

  // Convert TanStack sorting state to Django ordering parameter
  const ordering = React.useMemo(() => {
    if (sorting.length === 0) return "confidence_score";

    const sortConfig = sorting[0];
    const fieldMap: Record<string, string> = {
      crew_info: "name",
      event_band: "event_band",
      confidence_level: "confidence_score"
    };

    const field = fieldMap[sortConfig.id] || sortConfig.id;
    return sortConfig.desc ? `-${field}` : field;
  }, [sorting]);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Data fetching
  const {
    data: comparisonData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["rawTimeComparison", page, pageSize, debouncedSearch, ordering, confidenceFilter, eventBandFilter],
    queryFn: () => {
      console.log(`Fetching raw time comparison... page ${page}`);
      return fetchRawTimeComparison(page, pageSize, debouncedSearch, ordering, confidenceFilter, eventBandFilter);
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    placeholderData: (previousData) => previousData // This replaces keepPreviousData
  });

  // Get unique event bands for filter dropdown - use categoriesData if available
  const eventBandOptions = useMemo(() => {
    if (categoriesData) {
      return categoriesData;
    }
    // Fallback to empty array if categories haven't loaded yet
    return [{ label: "All events", value: "" }];
  }, [categoriesData]);

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
              {crew.time_only && <span className="raw-time-comparison__flag">Time Only</span>}
              {crew.penalty > 0 && (
                <>
                  <span className="raw-time-comparison__flag">Penalty</span>
                  <span>{` (${crew.penalty}s)`}</span>
                </>
              )}
            </div>
          );
        },
        enableSorting: true,
        size: 250
      }),
      // Event
      columnHelper.accessor("crew.event_band", {
        id: "event_band",
        header: "Event",
        cell: (info) => {
          return <span>{info.getValue()}</span>;
        },
        enableSorting: true
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
        size: 150
      }),

      // Matching postion in category column
      columnHelper.accessor("positions_match", {
        id: "postions_match",
        header: "Rank match",
        cell: (info) => {
          const match = info.getValue();
          switch (match) {
            case true:
              return (
                <i className="raw-time-comparison__icon raw-time-comparison__icon--success">
                  <Icon icon={"success-tick"} />
                </i>
              );
            case false:
              return (
                <i className="raw-time-comparison__icon raw-time-comparison__icon--fail">
                  <Icon icon={"fail-cross"} />
                </i>
              );
            case "None":
              return "N/a";
          }
        },
        enableSorting: true,
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
                deviationClass = "raw-time-comparison__time--high-deviation";
              } else if (diff > 100) {
                deviationClass = "raw-time-comparison__time--medium-deviation";
              }
            }

            const position = details?.positions?.category;

            return (
              <div className={`raw-time-comparison__time-info ${deviationClass}`}>
                <div className="raw-time-comparison__raw-time">
                  {formatTimes(rawTime)}
                  {position && ` (#${position})`}
                </div>
              </div>
            );
          },
          enableSorting: false,
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
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: comparisonData?.pagination.total_pages || 0,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: pageSize
      },
      sorting
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function" ? updater({ pageIndex: page - 1, pageSize: pageSize }) : updater;

      setPage(newPagination.pageIndex + 1);
      setPageSize(newPagination.pageSize);
    },
    onSortingChange: setSorting
  });

  // Reset to first page when sorting or filtering changes
  React.useEffect(() => {
    setPage(1);
  }, [sorting, confidenceFilter, eventBandFilter]);

  // Filter handlers
  const handleConfidenceFilterChange = (value: string) => {
    setConfidenceFilter(value);
    setPage(1); // Reset to first page
  };

  const handleEventBandFilterChange = (value: string) => {
    setEventBandFilter(value);
    setPage(1); // Reset to first page
  };

  // Refresh data handler
  const handleRefreshData = () => {
    refetch();
    onDataChanged?.();
  };

  // Loading state
  if (isLoading && !comparisonData) {
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

  console.log(comparisonData);

  return (
    <div className="raw-time-comparison">
      <div className="raw-time-comparison__header">
        <div className="raw-time-comparison__title-section">
          <div>
            <h3 className="raw-time-comparison__title">Raw time comparison (Finish - Start)</h3>
            <p className="raw-time-comparison__description no-print">
              Compare the raw time (ie the time <u>before</u> penalties are applied) and position in category for each
              crew from the different sets of race times to help validate the accuracy of the results and assess
              confidence. The position in category (shown in brackets) <u>includes</u> penalties.
            </p>
          </div>
          <div className="raw-time-comparison__stats">
            <Stat statKey={"Total crews"} statValue={comparisonData.total_crews} />
            <Stat
              statKey={"High confidence <=1s"}
              statValue={`${comparisonData.confidence_summary.high} (${comparisonData.confidence_summary.high_percentage}%)`}
              ragColor={"green"}
            />
            <Stat
              statKey={"Medium confidence <=5s"}
              statValue={comparisonData.confidence_summary.medium}
              ragColor={"amber"}
            />
            <Stat statKey={"Low confidence >5s"} statValue={comparisonData.confidence_summary.low} ragColor={"red"} />
          </div>
        </div>

        <div className="raw-time-comparison__controls">
          <div className="raw-time-comparison__filter-group">
            <FormSelect
              value={confidenceFilter}
              onChange={(e) => handleConfidenceFilterChange(e.target.value)}
              selectOptions={[
                { label: "All confidence levels", value: "all" },
                { label: "High confidence", value: "high" },
                { label: "Medium confidence", value: "medium" },
                { label: "Low confidence", value: "low" },
                { label: "Single race only", value: "single" }
              ]}
              fieldName={"filter_confidence"}
              title={"Filter by confidence"}
            />
          </div>

          {eventBandOptions.length > 0 && (
            <div className="raw-time-comparison__filter-group">
              <FormSelect
                value={eventBandFilter}
                onChange={(e) => handleEventBandFilterChange(e.target.value)}
                selectOptions={eventBandOptions}
                fieldName={"filter_event_band"}
                title={"Filter by event"}
              />
            </div>
          )}

          <div className="raw-time-comparison__search-wrapper">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search crews, bib numbers..."
              className="raw-time-comparison__search"
            />
          </div>
        </div>
      </div>

      <TablePagination
        table={table}
        className="raw-time-comparison__pagination"
        showRowInfo={true}
        showPageSizeSelector={true}
        pageSizeOptions={[10, 25, 50, 100]}
        rowTypeName="crews"
        totalRowCount={comparisonData.filtered_crews}
      />

      <div className="raw-time-comparison__table-container">
        <table className="raw-time-comparison__table">
          <TableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody rows={table.getRowModel().rows} />
        </table>
        {isLoading && (
          <div className="raw-time-comparison__loading-overlay">
            <div className="raw-time-comparison__spinner"></div>
          </div>
        )}
      </div>

      <div className="raw-time-comparison__footer">
        <TablePagination
          table={table}
          className="raw-time-comparison__pagination"
          showRowInfo={true}
          showPageSizeSelector={true}
          pageSizeOptions={[10, 25, 50, 100]}
          rowTypeName="crews"
          totalRowCount={comparisonData.filtered_crews}
        />
      </div>
    </div>
  );
}
