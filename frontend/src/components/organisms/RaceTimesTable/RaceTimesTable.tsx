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
import { useHistory, Link } from "react-router-dom";
import axios, { AxiosResponse } from "axios";
import { formatTimes } from "../../../lib/helpers";
import { CrewProps, RaceProps, TimeProps } from "../../../types/components.types";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import "./raceTimesTable.scss";
import { useRaceTimes } from "../../../hooks/useRaceTimes";

interface RaceTimesTableProps {
  raceId: number;
  tap: "Start" | "Finish";
  raceName: string;
  onDataChanged?: () => void;
}

// Custom filter functions
const timeFilterFn = (row: any, columnId: string, filterValue: string) => {
  const cellValue = row.getValue(columnId);
  if (cellValue === null || cellValue === undefined) return false;

  const formattedTime = formatTimes(cellValue);
  return formattedTime.toLowerCase().includes(filterValue.toLowerCase());
};

const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
  const cellValue = row.getValue(columnId);

  if (cellValue === null || cellValue === undefined) return false;

  // Handle different data types
  if (typeof cellValue === "number") {
    // For time values, convert to formatted time
    if (columnId.includes("time")) {
      const formattedTime = formatTimes(cellValue);
      return formattedTime.toLowerCase().includes(filterValue.toLowerCase());
    }
    // For other numbers, convert to string
    return cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
  }

  if (typeof cellValue === "string") {
    return cellValue.toLowerCase().includes(filterValue.toLowerCase());
  }

  // Handle objects (like crew)
  if (typeof cellValue === "object" && cellValue !== null) {
    return JSON.stringify(cellValue).toLowerCase().includes(filterValue.toLowerCase());
  }

  return false;
};

// Custom sorting function for time columns
const timeSortingFn = (rowA: any, rowB: any, columnId: string) => {
  const a = rowA.getValue(columnId) as number | null;
  const b = rowB.getValue(columnId) as number | null;

  // Handle null values - put them at the end
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  return a - b;
};

export default function RaceTimesTable({ raceId, tap, raceName, onDataChanged }: RaceTimesTableProps) {
  const history = useHistory();
  const queryClient = useQueryClient();
  const columnHelper = createColumnHelper<TimeProps>();

  // Component state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  // Data fetching
  const {
    data: raceTimesData,
    isLoading,
    error
  } = useRaceTimes({
    race: raceId,
    tap
  });

  // Table columns
  const columns = useMemo<ColumnDef<TimeProps, any>[]>(
    () => [
      columnHelper.accessor("sequence", {
        header: "Sequence",
        cell: (info) => {
          const raceTime = info.row.original;
          return (
            <button
              className="race-times-table__sequence-link"
              onClick={() => history.push(`/race-times/${raceTime.id}/edit`)}
              title="Click to edit this race time"
            >
              <span className="race-times-table__cell race-times-table__cell--sequence">{info.getValue()}</span>
            </button>
          );
        },
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor((row) => row.crew?.bib_number || "--", {
        id: "bib_number",
        header: "Bib",
        cell: (info) => (
          <span className="race-times-table__cell race-times-table__cell--bib">{info.getValue() || "--"}</span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor((row) => row.crew?.competitor_names || row.crew?.name || "Unassigned", {
        id: "competitor_names",
        header: "Crew",
        cell: (info) => (
          <span className="race-times-table__cell race-times-table__cell--competitors">{info.getValue()}</span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("tap", {
        header: "Tap",
        cell: (info) => <span className="race-times-table__cell race-times-table__cell--tap">{info.getValue()}</span>,
        enableSorting: true,
        sortingFn: timeSortingFn,
        filterFn: timeFilterFn
      }),
      columnHelper.accessor("time_tap", {
        header: "Time tap",
        cell: (info) => (
          <span className="race-times-table__cell race-times-table__cell--time">{formatTimes(info.getValue())}</span>
        ),
        enableSorting: true,
        sortingFn: timeSortingFn,
        filterFn: timeFilterFn
      })
    ],
    [history]
  );

  // Create column groups for grouped headers
  const columnGroups = useMemo(
    () => [
      { header: "Sequence", columns: ["sequence"] },
      { header: "Bib", columns: ["bib_number"] },
      { header: "Crew Info", columns: ["crew_name", "competitor_names", "club"] },
      { header: "Timing", columns: ["time_tap", "synchronized_time"] }
    ],
    []
  );

  // Table instance
  const table = useReactTable({
    data: raceTimesData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn,
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
          id: "sequence",
          desc: false
        }
      ]
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="race-times-table__loading">
        <div className="race-times-table__loading-content">
          <div className="race-times-table__spinner"></div>
          <p>
            Loading {tap.toLowerCase()} times for {raceName}...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="race-times-table__error">
        <div className="race-times-table__error-content">
          <h4>Error loading race times</h4>
          <p>
            Failed to load {tap.toLowerCase()} times for {raceName}
          </p>
        </div>
      </div>
    );
  }

  const totalRows = raceTimesData?.length || 0;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const displayedRows = table.getRowModel().rows.length;

  return (
    <div className="race-times-table">
      <div className="race-times-table__header">
        <div className="race-times-table__title-section">
          <h3 className="race-times-table__title">
            {raceName} - {tap} times
          </h3>
        </div>

        <div className="race-times-table__controls">
          <div className="race-times-table__search-wrapper">
            <SearchInput
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Search times, crews, bibs..."
              className="race-times-table__search"
            />
          </div>
        </div>
      </div>

      <div className="race-times-table__table-container">
        <table className="race-times-table__table">
          <TableHeader headerGroups={table.getHeaderGroups()} columnGroups={columnGroups} />
          <TableBody rows={table.getRowModel().rows} />
        </table>
      </div>

      <div className="race-times-table__footer">
        <div className="race-times-table__results-info">
          <p className="race-times-table__results-text">
            Showing {displayedRows} of {filteredRows} records
            {globalFilter && filteredRows !== totalRows && <span> (filtered from {totalRows} total)</span>}
          </p>
        </div>

        <TablePagination
          table={table}
          className="race-times-table__pagination"
          showRowInfo={false}
          showPageSizeSelector={true}
        />
      </div>
    </div>
  );
}
