import React, { useState, useMemo, useEffect } from "react";
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
import { formatTimes } from "../../../lib/helpers";
import { CrewProps, RaceProps, TimeProps } from "../../../types/components.types";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import "./raceTimesTable.scss";
import { useRaceTimes, useAllRaceTimes } from "../../../hooks/useRaceTimes";
import Checkbox from "../../atoms/Checkbox/Checkbox";

interface RaceTimesTableProps {
  raceId: number;
  tap: "Start" | "Finish";
  raceName: string;
  onDataChanged?: () => void;
  // New props to control behavior
  enableGlobalSearch?: boolean; // Enable/disable global search
  initialPageSize?: number;
}

export default function RaceTimesTable({
  raceId,
  tap,
  raceName,
  onDataChanged,
  enableGlobalSearch = true,
  initialPageSize = 25
}: RaceTimesTableProps) {
  const history = useHistory();
  const queryClient = useQueryClient();
  const columnHelper = createColumnHelper<TimeProps>();

  // Component state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [showUnassignedOnly, setShowUnassignedOnly] = useState<boolean>(false);

  // Debounced search for server-side filtering
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  // Convert sorting state to backend ordering format
  const getOrderingParam = (sorting: SortingState): string => {
    if (sorting.length === 0) return "sequence";

    const sort = sorting[0];
    let orderField = sort.id;

    // Map frontend column IDs to backend field names
    switch (orderField) {
      case "bib_number":
        orderField = "crew__bib_number";
        break;
      case "competitor_names":
        orderField = "crew__competitor_names";
        break;
      case "sequence":
        orderField = "sequence";
        break;
      case "time_tap":
        orderField = "time_tap";
        break;
      default:
        // Handle other mappings as needed
        break;
    }

    const ordering = sort.desc ? `-${orderField}` : orderField;
    return ordering;
  };

  const {
    data: paginatedRaceTimesData,
    isLoading,
    error
  } = useRaceTimes({
    race: raceId,
    tap,
    page: pagination.pageIndex + 1, // Convert to 1-based
    pageSize: pagination.pageSize,
    search: debouncedGlobalFilter,
    ordering: getOrderingParam(sorting),
    unassignedOnly: showUnassignedOnly,
    enabled: true
  });

  // Determine which data to use
  const raceTimesData = paginatedRaceTimesData?.results;
  const totalCount = paginatedRaceTimesData?.count;

  // Table columns (same as before)
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
      columnHelper.accessor((row) => row.crew?.bib_number || "⚠️", {
        id: "bib_number", // This ID will be mapped to crew__bib_number in getOrderingParam
        header: "Bib",
        cell: (info) => (
          <span className="race-times-table__cell race-times-table__cell--bib">{info.getValue() || "⚠️"}</span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor((row) => row.crew?.competitor_names || row.crew?.name || "Unassigned", {
        id: "competitor_names", // This ID will be mapped to crew__competitor_names in getOrderingParam
        header: "Crew",
        cell: (info) => (
          <span className="race-times-table__cell race-times-table__cell--competitors">{info.getValue()}</span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("tap", {
        header: "Tap",
        cell: (info) => <span className="race-times-table__cell race-times-table__cell--tap">{info.getValue()}</span>
      }),
      columnHelper.accessor("time_tap", {
        header: "Time tap",
        cell: (info) => (
          <span className="race-times-table__cell race-times-table__cell--time">{formatTimes(info.getValue())}</span>
        ),
        enableSorting: true
      })
    ],
    [history]
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
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.ceil((totalCount || 0) / pagination.pageSize),
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter: true ? "" : globalFilter // Only use client-side global filter when not using server pagination
    },
    initialState: {
      pagination: {
        pageSize: initialPageSize
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

  const displayedRows = table.getRowModel().rows.length;
  const filteredRows = true ? totalCount : table.getFilteredRowModel().rows.length;
  console.log(paginatedRaceTimesData);

  return (
    <div className="race-times-table">
      <div className="race-times-table__header">
        <div className="race-times-table__title-section">
          <h3 className="race-times-table__title">
            {raceName} - {tap} times
          </h3>
        </div>

        <div className="race-times-table__controls">
          {enableGlobalSearch && (
            <div className="race-times-table__search-wrapper">
              <SearchInput
                value={globalFilter}
                onChange={setGlobalFilter}
                placeholder="Search times, crews, bibs..."
                className="race-times-table__search"
              />
            </div>
          )}

          <div className="race-times-table__filters">
            <Checkbox
              name={"unassigned"}
              label={
                tap === "Start"
                  ? `⚠️ Show unassigned only (${paginatedRaceTimesData.start_times_no_crew})`
                  : `⚠️ Show unassigned only (${paginatedRaceTimesData.finish_times_no_crew})`
              }
              id={"unassigned"}
              checked={showUnassignedOnly}
              onChange={(e) => setShowUnassignedOnly(e.target.checked)}
            />
          </div>
        </div>
      </div>

      <TablePagination
        table={table}
        className="race-times-table__pagination"
        showRowInfo={true}
        showPageSizeSelector={true}
        totalRowCount={filteredRows}
      />
      <div className="race-times-table__table-container">
        <table className="race-times-table__table">
          <TableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody rows={table.getRowModel().rows} />
        </table>
      </div>

      <div className="race-times-table__footer">
        <TablePagination
          table={table}
          className="race-times-table__pagination"
          showRowInfo={true}
          showPageSizeSelector={true}
          totalRowCount={filteredRows}
        />
      </div>
    </div>
  );
}
