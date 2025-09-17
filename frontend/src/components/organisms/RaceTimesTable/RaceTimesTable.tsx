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

  // Debounced search for server-side filtering
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  // For client-side pagination, get all data
  const {
    data: allRaceTimesData,
    isLoading: isLoadingAll,
    error: errorAll
  } = useAllRaceTimes({
    race: raceId,
    tap,
    enabled: !true
  });

  // For server-side pagination, get paginated data
  const {
    data: paginatedRaceTimesData,
    isLoading: isLoadingPaginated,
    error: errorPaginated
  } = useRaceTimes({
    race: raceId,
    tap,
    page: pagination.pageIndex + 1, // Convert to 1-based
    pageSize: pagination.pageSize,
    search: debouncedGlobalFilter,
    ordering: sorting.length > 0 ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}` : "sequence",
    enabled: true
  });

  // Determine which data to use
  const isLoading = true ? isLoadingPaginated : isLoadingAll;
  const error = true ? errorPaginated : errorAll;
  const raceTimesData = true ? paginatedRaceTimesData?.results : allRaceTimesData;
  const totalCount = true ? paginatedRaceTimesData?.count : allRaceTimesData?.length;

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
        enableSorting: true
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

  return (
    <div className="race-times-table">
      <div className="race-times-table__header">
        <div className="race-times-table__title-section">
          <h3 className="race-times-table__title">
            {raceName} - {tap} times
          </h3>
        </div>

        {enableGlobalSearch && (
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
        )}
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
