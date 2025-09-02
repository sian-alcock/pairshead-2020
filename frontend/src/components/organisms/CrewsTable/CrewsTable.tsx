import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  ColumnFiltersState,
  VisibilityState
} from "@tanstack/react-table";
import { formatTimes } from "../../../lib/helpers";
import { CrewProps } from "../../../types/components.types";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import { Link } from "react-router-dom";
import "./crewsTable.scss";
import Checkbox from "../../atoms/Checkbox/Checkbox";
import TextButton from "../../atoms/TextButton/TextButton";

interface CrewsTableProps {
  crews: CrewProps[];
  isLoading: boolean;
  error: boolean;
  onDataChanged?: () => void;
}

// Custom filter functions
const timeFilterFn = (row: any, columnId: string, filterValue: string) => {
  const cellValue = row.getValue(columnId);
  if (cellValue === null || cellValue === undefined || cellValue === 0) return false;

  const formattedTime = formatTimes(cellValue);
  return formattedTime.toLowerCase().includes(filterValue.toLowerCase());
};

const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
  const cellValue = row.getValue(columnId);

  if (cellValue === null || cellValue === undefined) return false;

  // Handle different data types
  if (typeof cellValue === "number") {
    // For time values, convert to formatted time
    if (columnId.includes("time") || columnId.includes("Time")) {
      if (cellValue === 0) return false; // Skip zero times
      const formattedTime = formatTimes(cellValue);
      return formattedTime.toLowerCase().includes(filterValue.toLowerCase());
    }
    // For other numbers, convert to string
    return cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
  }

  if (typeof cellValue === "string") {
    return cellValue.toLowerCase().includes(filterValue.toLowerCase());
  }

  if (typeof cellValue === "boolean") {
    return cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
  }

  // Handle objects (like event, club)
  if (typeof cellValue === "object" && cellValue !== null) {
    return JSON.stringify(cellValue).toLowerCase().includes(filterValue.toLowerCase());
  }

  return false;
};

// Custom sorting function for time columns
const timeSortingFn = (rowA: any, rowB: any, columnId: string) => {
  const a = rowA.getValue(columnId) as number | null;
  const b = rowB.getValue(columnId) as number | null;

  // Handle null/zero values - put them at the end
  if ((a === null || a === 0) && (b === null || b === 0)) return 0;
  if (a === null || a === 0) return 1;
  if (b === null || b === 0) return -1;

  return a - b;
};

// Column visibility presets
const COLUMN_PRESETS = {
  essential: {
    name: true,
    bib_number: true,
    event_band: true,
    club: true,
    race_time: true,
    overall_rank: true
  },
  all: {}
};

export default function CrewsTable({ crews, isLoading, error, onDataChanged }: CrewsTableProps) {
  const columnHelper = createColumnHelper<CrewProps>();

  // Component state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: "overall_rank", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [showColumnToggles, setShowColumnToggles] = useState(false);

  // Initialize with essential preset
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const saved = localStorage.getItem("crews-table-column-visibility");
    return saved ? JSON.parse(saved) : COLUMN_PRESETS.essential;
  });
  const [hideScratched, setHideScratched] = useState(() => {
    const saved = localStorage.getItem("crews-table-hide-scratched");
    return saved ? JSON.parse(saved) : true; // Default to hiding scratched
  });

  // Table columns
  const columns = useMemo<ColumnDef<CrewProps, any>[]>(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => (
          <Link
            to={`/crew-management-dashboard/${info.getValue()}/edit`}
            className="crews-table__cell crews-table__cell--id"
          >
            {info.getValue() as string}
          </Link>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor((row) => row.competitor_names || row.name, {
        id: "name",
        header: "Name",
        cell: (info) => <span className="crews-table__cell crews-table__cell--name">{info.getValue()}</span>,
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("bib_number", {
        header: "Bib",
        cell: (info) => <span className="crews-table__cell crews-table__cell--bib">{info.getValue() || "--"}</span>,
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("event_band", {
        header: "Event",
        cell: (info) => <span className="crews-table__cell crews-table__cell--event">{info.getValue() || "--"}</span>,
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor((row) => row.club?.name || "--", {
        id: "club",
        header: "Club",
        cell: (info) => <span className="crews-table__cell crews-table__cell--club">{info.getValue()}</span>,
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <span
            className={`crews-table__cell crews-table__cell--status crews-table__cell--status-${info.getValue()?.toLowerCase().replace(" ", "-")}`}
          >
            {info.getValue() || "--"}
          </span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("race_time", {
        header: "Race Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true,
        sortingFn: timeSortingFn,
        filterFn: timeFilterFn
      }),
      columnHelper.accessor("raw_time", {
        header: "Raw Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true,
        sortingFn: timeSortingFn,
        filterFn: timeFilterFn
      }),
      columnHelper.accessor("start_time", {
        header: "Start Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true,
        sortingFn: timeSortingFn,
        filterFn: timeFilterFn
      }),
      columnHelper.accessor("finish_time", {
        header: "Finish Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true,
        sortingFn: timeSortingFn,
        filterFn: timeFilterFn
      }),
      columnHelper.accessor("start_sequence", {
        header: "Start Seq",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--sequence">{info.getValue() || "--"}</span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("finish_sequence", {
        header: "Finish Seq",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--sequence">{info.getValue() || "--"}</span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("overall_rank", {
        header: "Overall Rank",
        cell: (info) => <span className="crews-table__cell crews-table__cell--rank">{info.getValue() || "--"}</span>,
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("category_rank", {
        header: "Category Rank",
        cell: (info) => <span className="crews-table__cell crews-table__cell--rank">{info.getValue() || "--"}</span>,
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("gender_rank", {
        header: "Gender Rank",
        cell: (info) => <span className="crews-table__cell crews-table__cell--rank">{info.getValue() || "--"}</span>,
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("penalty", {
        header: "Penalty",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--penalty">
            {info.getValue() ? `+${info.getValue()}s` : "--"}
          </span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("manual_override_time", {
        header: "Manual Override",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true,
        sortingFn: timeSortingFn,
        filterFn: timeFilterFn
      }),
      columnHelper.accessor("masters_adjustment", {
        header: "Masters Adj",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--adjustment">
            {info.getValue() ? `${info.getValue()}s` : "--"}
          </span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("masters_adjusted_time", {
        header: "Masters Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true,
        sortingFn: timeSortingFn,
        filterFn: timeFilterFn
      }),
      columnHelper.accessor("published_time", {
        header: "Published Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true,
        sortingFn: timeSortingFn,
        filterFn: timeFilterFn
      }),
      columnHelper.accessor("composite_code", {
        header: "Composite Code",
        cell: (info) => <span className="crews-table__cell crews-table__cell--code">{info.getValue() || "--"}</span>,
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("time_only", {
        header: "Time Only",
        cell: (info) => (
          <span
            className={`crews-table__cell crews-table__cell--boolean ${info.getValue() ? "crews-table__cell--boolean-true" : "crews-table__cell--boolean-false"}`}
          >
            {info.getValue() ? "Yes" : "No"}
          </span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("did_not_start", {
        header: "DNS",
        cell: (info) => (
          <span
            className={`crews-table__cell crews-table__cell--boolean ${info.getValue() ? "crews-table__cell--boolean-true" : "crews-table__cell--boolean-false"}`}
          >
            {info.getValue() ? "DNS" : "--"}
          </span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("did_not_finish", {
        header: "DNF",
        cell: (info) => (
          <span
            className={`crews-table__cell crews-table__cell--boolean ${info.getValue() ? "crews-table__cell--boolean-true" : "crews-table__cell--boolean-false"}`}
          >
            {info.getValue() ? "DNF" : "--"}
          </span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("disqualified", {
        header: "DSQ",
        cell: (info) => (
          <span
            className={`crews-table__cell crews-table__cell--boolean ${info.getValue() ? "crews-table__cell--boolean-true" : "crews-table__cell--boolean-false"}`}
          >
            {info.getValue() ? "DSQ" : "--"}
          </span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      })
    ],
    []
  );

  useEffect(() => {
    localStorage.setItem("crews-table-column-visibility", JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  useEffect(() => {
    localStorage.setItem("crews-table-hide-scratched", JSON.stringify(hideScratched));
  }, [hideScratched]);

  // Create filtered data with the scratched filter applied
  const filteredData = React.useMemo(() => {
    const baseData = crews || [];
    return hideScratched
      ? baseData.filter((crew) => {
          const status = crew.status;
          return status !== "Scratched" && status !== "scratched" && status !== "SCRATCHED";
        })
      : baseData;
  }, [crews, hideScratched]);

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: globalFilterFn,
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility
    },
    initialState: {
      pagination: {
        pageSize: 25
      },
      sorting: [
        {
          id: "overall_rank",
          desc: false
        }
      ]
    }
  });

  if (isLoading) {
    return (
      <div className="crews-table__loading">
        <div className="crews-table__loading-content">
          <div className="crews-table__spinner"></div>
          <p>Loading crews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crews-table__error">
        <div className="crews-table__error-content">
          <h4>Error loading crews</h4>
          <p>Failed to load crew data</p>
        </div>
      </div>
    );
  }

  const totalRows = crews?.length || 0;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const displayedRows = table.getRowModel().rows.length;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="crews-table">
      <h3 className="crews-table__title">All crews</h3>
      <div className="crews-table__controls">
        <SearchInput
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Search crews, names, clubs..."
          className="crews-table__search"
        />
        <Checkbox
          name={"scratched-crews"}
          label={"Hide scratched crews"}
          id={"scratched-crews"}
          checked={hideScratched}
          onChange={(e) => setHideScratched(e.target.checked)}
        />

        <div className="crews-table__column-controls">
          <div className="crews-table__column-toggles">
            <TextButton
              label={showColumnToggles ? "Hide column selector" : "Show column selector"}
              onClick={() => setShowColumnToggles(!showColumnToggles)}
            />
          </div>
        </div>
      </div>

      <div
        className={`crews-table__column-checkboxes ${showColumnToggles ? "crews-table__column-checkboxes--expanded" : "crews-table__column-checkboxes--collapsed"}`}
      >
        {table.getAllLeafColumns().map((column) => (
          <label key={column.id} className="crews-table__column-checkbox">
            <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
            <span>{column.columnDef.header as string}</span>
          </label>
        ))}
      </div>

      <div className="crews-table__table-container">
        <table className="crews-table__table">
          <TableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody rows={table.getRowModel().rows} />
        </table>
      </div>

      <div className="crews-table__footer">
        <div className="crews-table__results-info">
          <p className="crews-table__results-text">
            Showing {displayedRows} of {filteredRows} crews
            {globalFilter && filteredRows !== totalRows && <span> (filtered from {totalRows} total)</span>}
          </p>
        </div>

        <TablePagination
          table={table}
          className="crews-table__pagination"
          showRowInfo={false}
          showPageSizeSelector={true}
        />
      </div>
    </div>
  );
}
