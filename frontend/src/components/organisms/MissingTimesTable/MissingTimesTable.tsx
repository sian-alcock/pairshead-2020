// MissingTimesTable.tsx - Organism Component
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
import { formatTimes } from "../../../lib/helpers";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import "./missingTimesTable.scss";
import { FormSelect } from "../../atoms/FormSelect/FormSelect";
import { Link } from "react-router-dom";

// Types
interface CrewMissingTimes {
  crew_id: number;
  name: string;
  club: string;
  bib_number: number | null;
  start_time: number | null;
  finish_time: number | null;
  start_race: string | null;
  finish_race: string | null;
  missing_start: boolean;
  missing_finish: boolean;
  missing_both: boolean;
  status: string;
}

interface MissingTimesData {
  crews_missing_times: CrewMissingTimes[];
  summary: {
    total_crews_missing_times: number;
    missing_start_only: number;
    missing_finish_only: number;
    missing_both: number;
    total_crews_checked: number;
  };
}

interface MissingTimesTableProps {
  onDataChanged?: () => void;
}

// API function
const fetchMissingTimes = async (): Promise<MissingTimesData> => {
  const response: AxiosResponse = await axios.get("/api/crews/missing-times/");
  return response.data;
};

// Custom filter functions
const missingTypeFilterFn = (row: any, columnId: string, filterValue: string) => {
  const rowData = row.original as CrewMissingTimes;

  switch (filterValue) {
    case "start_only":
      return rowData.missing_start && !rowData.missing_finish;
    case "finish_only":
      return rowData.missing_finish && !rowData.missing_start;
    case "both":
      return rowData.missing_both;
    case "all":
    default:
      return true;
  }
};

export default function MissingTimesTable({ onDataChanged }: MissingTimesTableProps) {
  const queryClient = useQueryClient();
  const columnHelper = createColumnHelper<CrewMissingTimes>();

  // Component state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [missingTypeFilter, setMissingTypeFilter] = useState<string>("all");

  // Data fetching
  const {
    data: missingTimesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["missingTimes"],
    queryFn: () => {
      console.log("Fetching missing times data...");
      return fetchMissingTimes();
    },
    staleTime: 0, // 1 minute
    retry: 3
  });

  // Table columns
  const columns = useMemo<ColumnDef<CrewMissingTimes, any>[]>(
    () => [
      columnHelper.accessor("crew_id", {
        header: "ID",
        cell: (info) => (
          <Link
            to={`/crew-management-dashboard/${info.getValue()}/edit`}
            className="missing-times__cell missing-times__cell--id"
          >
            {info.getValue() as string}
          </Link>
        ),
        enableSorting: true,
        size: 80
      }),

      columnHelper.accessor("bib_number", {
        header: "Bib",
        cell: (info) => <span className="missing-times__cell missing-times__cell--bib">{info.getValue() || "--"}</span>,
        enableSorting: true,
        size: 80
      }),
      columnHelper.accessor("name", {
        header: "Crew Name",
        cell: (info) => <span className="missing-times__cell missing-times__cell--name">{info.getValue()}</span>,
        enableSorting: true,
        size: 200
      }),
      columnHelper.accessor("club", {
        header: "Club",
        cell: (info) => (
          <span className="missing-times__cell missing-times__cell--club">{info.getValue() || "--"}</span>
        ),
        enableSorting: true,
        size: 150
      }),
      columnHelper.accessor("start_time", {
        header: "Start Time",
        cell: (info) => {
          const time = info.getValue();
          const row = info.row.original;

          if (row.missing_start) {
            return <span className="missing-times__cell missing-times__cell--missing">❌ Missing</span>;
          }

          return (
            <div className="missing-times__time-cell">
              <span className="missing-times__time">{time ? formatTimes(time) : "--"}</span>
              {row.start_race && <span className="missing-times__race-name">{row.start_race}</span>}
            </div>
          );
        },
        enableSorting: true,
        size: 150
      }),
      columnHelper.accessor("finish_time", {
        header: "Finish Time",
        cell: (info) => {
          const time = info.getValue();
          const row = info.row.original;

          if (row.missing_finish) {
            return <span className="missing-times__cell missing-times__cell--missing">❌ Missing</span>;
          }

          return (
            <div className="missing-times__time-cell">
              <span className="missing-times__time">{time ? formatTimes(time) : "--"}</span>
              {row.finish_race && <span className="missing-times__race-name">{row.finish_race}</span>}
            </div>
          );
        },
        enableSorting: true,
        size: 150
      }),
      columnHelper.accessor(
        (row) => {
          if (row.missing_both) return "Both Missing";
          if (row.missing_start) return "Start Missing";
          if (row.missing_finish) return "Finish Missing";
          return "Complete";
        },
        {
          id: "missing_status",
          header: "Status",
          cell: (info) => {
            const status = info.getValue();
            const row = info.row.original;

            let className = "missing-times__status";
            if (row.missing_both) className += " missing-times__status--both";
            else if (row.missing_start || row.missing_finish) className += " missing-times__status--partial";
            else className += " missing-times__status--complete";

            return <span className={className}>{status}</span>;
          },
          enableSorting: true,
          filterFn: missingTypeFilterFn,
          size: 120
        }
      )
    ],
    []
  );

  // Table instance
  const table = useReactTable({
    data: missingTimesData?.crews_missing_times || [],
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
          id: "crew_id",
          desc: false
        }
      ]
    }
  });

  // Handle missing type filter change
  const handleMissingTypeFilterChange = (value: string) => {
    setMissingTypeFilter(value);
    if (value === "all") {
      setColumnFilters((prev) => prev.filter((f) => f.id !== "missing_status"));
    } else {
      setColumnFilters((prev) => [...prev.filter((f) => f.id !== "missing_status"), { id: "missing_status", value }]);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="missing-times__loading">
        <div className="missing-times__loading-content">
          <div className="missing-times__spinner"></div>
          <p>Loading crews with missing times...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="missing-times__error">
        <div className="missing-times__error-content">
          <h4>Error loading missing times</h4>
          <p>Failed to load crews with missing times</p>
        </div>
      </div>
    );
  }

  if (!missingTimesData) {
    return <div className="missing-times__no-data">No data available</div>;
  }

  const totalRows = missingTimesData.crews_missing_times.length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const displayedRows = table.getRowModel().rows.length;

  return (
    <div className="missing-times">
      {/* Header and Controls */}
      <div className="missing-times__header">
        <div className="missing-times__title-section">
          <h3 className="missing-times__title">Crews Missing Times</h3>
          <div className="missing-times__stats">
            <span className="missing-times__stat missing-times__stat--total">
              Total Missing: {missingTimesData.summary.total_crews_missing_times}
            </span>
            <span className="missing-times__stat missing-times__stat--start">
              Start Only: {missingTimesData.summary.missing_start_only}
            </span>
            <span className="missing-times__stat missing-times__stat--finish">
              Finish Only: {missingTimesData.summary.missing_finish_only}
            </span>
            <span className="missing-times__stat missing-times__stat--both">
              Both: {missingTimesData.summary.missing_both}
            </span>
          </div>
        </div>

        <div className="missing-times__controls">
          <div className="missing-times__filter-group">
            <FormSelect
              value={missingTypeFilter}
              onChange={(e) => handleMissingTypeFilterChange(e.target.value)}
              fieldName={""}
              title={""}
              selectOptions={[
                { label: "All missing", value: "all" },
                { label: "Start only", value: "start_only" },
                { label: "Finish only", value: "finish_only" },
                { label: "Both", value: "both" }
              ]}
            />
          </div>

          <div className="missing-times__search-wrapper">
            <SearchInput
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Search crews, clubs, bibs..."
              className="missing-times__search"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="missing-times__table-container">
        <table className="missing-times__table">
          <TableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody rows={table.getRowModel().rows} />
        </table>
      </div>

      {/* Results Info and Pagination */}
      <div className="missing-times__footer">
        <div className="missing-times__results-info">
          <p className="missing-times__results-text">
            Showing {displayedRows} of {filteredRows} crews
            {globalFilter && filteredRows !== totalRows && <span> (filtered from {totalRows} total)</span>}
          </p>
        </div>

        <TablePagination
          table={table}
          className="missing-times__pagination"
          showRowInfo={false}
          showPageSizeSelector={true}
        />
      </div>
    </div>
  );
}
