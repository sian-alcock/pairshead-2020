import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  PaginationState,
  createColumnHelper,
  SortingState,
  VisibilityState
} from "@tanstack/react-table";
import { formatTimes } from "../../../lib/helpers";
import { CrewProps } from "../../../types/components.types";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import { Link } from "react-router-dom";
import Checkbox from "../../atoms/Checkbox/Checkbox";
import TextButton from "../../atoms/TextButton/TextButton";
import "./crewsTable.scss";
import { TableFooter } from "../../molecules/TableFooter/TableFooter";

// Backend response structure
interface CrewsApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CrewProps[];
}

interface CrewsTableProps {
  onDataChanged?: () => void;
}

// Function to fetch crews from backend
const fetchCrews = async ({
  page = 1,
  pageSize = 25,
  search = "",
  ordering = "overall_rank",
  hideScratched = true,
  showMissingTimesOnly = false,
  ...filters
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  hideScratched?: boolean;
  showMissingTimesOnly?: boolean;
  [key: string]: any;
}): Promise<CrewsApiResponse> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("page_size", pageSize.toString());

  if (search) {
    params.append("search", search);
  }

  if (ordering) {
    params.append("ordering", ordering);
  }

  if (showMissingTimesOnly) {
    params.append("missing_times", "true");
  }

  if (hideScratched) {
    params.append("status[]", "Accepted");
  } else {
    params.append("status[]", "Accepted");
    params.append("status[]", "Scratched");
  }

  // Add any additional filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const url = `/api/crews/?${params.toString()}`;
  // console.log("Fetching crews with URL:", url);
  // console.log("Ordering parameter:", ordering);
  // console.log("Hide scratched:", hideScratched);

  const response = await fetch(url);

  if (!response.ok) {
    console.error("API Error:", response.status, response.statusText);
    throw new Error(`Failed to fetch crews: ${response.status}`);
  }

  const data = await response.json();
  console.log("API Response:", data);
  return data;
};

// Column visibility presets
const COLUMN_PRESETS = {
  essential: {
    id: true,
    name: true,
    bib_number: true,
    event_band: true,
    club: true,
    status: true,
    start_time: true,
    finish_time: true,
    start_sequence: true,
    finish_sequence: true,
    raw_time: true,
    race_time: true,
    published_time: true,
    overall_rank: true
  },
  all: {}
};

export default function CrewsTable({ onDataChanged }: CrewsTableProps) {
  const columnHelper = createColumnHelper<CrewProps>();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: "overall_rank", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [showColumnToggles, setShowColumnToggles] = useState(false);

  // Debounced search to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState(globalFilter);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(globalFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalFilter]);

  // Initialize with essential preset
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const saved = localStorage.getItem("crews-table-column-visibility");
    return saved ? JSON.parse(saved) : COLUMN_PRESETS.essential;
  });

  const [hideScratched, setHideScratched] = useState(() => {
    const saved = localStorage.getItem("crews-table-hide-scratched");
    return saved ? JSON.parse(saved) : true;
  });

  const [showMissingTimesOnly, setShowMissingTimesOnly] = useState(() => {
    const saved = localStorage.getItem("crews-missing-times");
    return saved ? JSON.parse(saved) : false;
  });

  // Convert sorting state to backend ordering format
  const getOrderingParam = (sorting: SortingState): string => {
    if (sorting.length === 0) return "overall_rank";

    const sort = sorting[0];
    let orderField = sort.id;

    switch (orderField) {
      case "name":
        orderField = "competitor_names";
        break;
      default:
        // Handle other mappings as needed
        break;
    }

    const ordering = sort.desc ? `-${orderField}` : orderField;
    return ordering;
  };

  // React Query for fetching data
  const {
    data: crewsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [
      "crews",
      pagination.pageIndex + 1,
      pagination.pageSize,
      debouncedSearch,
      getOrderingParam(sorting),
      hideScratched,
      showMissingTimesOnly
    ],
    queryFn: () =>
      fetchCrews({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: debouncedSearch,
        ordering: getOrderingParam(sorting),
        hideScratched,
        showMissingTimesOnly
      }),
    placeholderData: (previousData) => previousData, // This replaces keepPreviousData
    staleTime: 30000,
    // Add this to prevent refocus issues
    refetchOnWindowFocus: false
  });

  // Effect to trigger onDataChanged when data updates
  useEffect(() => {
    if (crewsResponse && onDataChanged) {
      onDataChanged();
    }
  }, [crewsResponse, onDataChanged]);

  // Table columns (same as before)
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
        enableSorting: true
      }),
      columnHelper.accessor((row) => row.competitor_names || row.name, {
        id: "name",
        header: "Crew",
        cell: (info) => <span className="crews-table__cell crews-table__cell--name">{info.getValue()}</span>,
        enableSorting: true
      }),
      columnHelper.accessor("bib_number", {
        header: "Bib",
        cell: (info) => <span className="crews-table__cell crews-table__cell--bib">{info.getValue() || "--"}</span>,
        enableSorting: true
      }),
      columnHelper.accessor("event_band", {
        header: "Event",
        cell: (info) => <span className="crews-table__cell crews-table__cell--event">{info.getValue() || "--"}</span>,
        enableSorting: true
      }),
      columnHelper.accessor((row) => row.club?.name || "--", {
        id: "club",
        header: "Club",
        cell: (info) => <span className="crews-table__cell crews-table__cell--club">{info.getValue()}</span>,
        enableSorting: true
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
        enableSorting: true
      }),
      columnHelper.accessor("start_time", {
        header: "Start time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : <span>⚠️</span>}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("finish_time", {
        header: "Finish time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : <span>⚠️</span>}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("start_sequence", {
        header: "Start seq",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? info.getValue() : <span>⚠️</span>}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("finish_sequence", {
        header: "Finish seq",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? info.getValue() : <span>⚠️</span>}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("raw_time", {
        header: "Raw time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("race_time", {
        header: "Race time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("published_time", {
        header: "Published time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("overall_rank", {
        header: "Overall rank",
        cell: (info) => <span className="crews-table__cell crews-table__cell--rank">{info.getValue() || "--"}</span>,
        enableSorting: true
      }),
      columnHelper.accessor("category_rank", {
        header: "Category rank",
        cell: (info) => <span className="crews-table__cell crews-table__cell--rank">{info.getValue() || "--"}</span>,
        enableSorting: true
      }),
      columnHelper.accessor("gender_rank", {
        header: "Gender rank",
        cell: (info) => <span className="crews-table__cell crews-table__cell--rank">{info.getValue() || "--"}</span>,
        enableSorting: true
      }),
      columnHelper.accessor("penalty", {
        header: "Penalty",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--penalty">
            {info.getValue() ? `+${info.getValue()}s` : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("manual_override_time", {
        header: "Manual override",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("composite_code", {
        header: "Composite code",
        cell: (info) => <span className="crews-table__cell crews-table__cell--code">{info.getValue() || "--"}</span>,
        enableSorting: true
      }),
      columnHelper.accessor("time_only", {
        header: "Time only",
        cell: (info) => (
          <span
            className={`crews-table__cell crews-table__cell--boolean ${info.getValue() ? "crews-table__cell--boolean-true" : "crews-table__cell--boolean-false"}`}
          >
            {info.getValue() ? "Yes" : "No"}
          </span>
        ),
        enableSorting: true
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
        enableSorting: true
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
        enableSorting: true
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
        enableSorting: true
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

  useEffect(() => {
    localStorage.setItem("crews-missing-times", JSON.stringify(showMissingTimesOnly));
  }, [showMissingTimesOnly]);

  // Reset to first page when search or filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, hideScratched, showMissingTimesOnly]);

  // Table instance - now with manual pagination/sorting
  const table = useReactTable({
    data: crewsResponse?.results || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: crewsResponse ? Math.ceil(crewsResponse.count / pagination.pageSize) : -1,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      pagination,
      sorting,
      columnVisibility
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
          <button onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const totalRows = crewsResponse?.count || 0;

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
        <Checkbox
          name={"missing-times"}
          label={"Show crews with missing times only"}
          id={"missing-times"}
          checked={showMissingTimesOnly}
          onChange={(e) => setShowMissingTimesOnly(e.target.checked)}
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
      <TablePagination
        table={table}
        className="crews-table__pagination"
        showRowInfo={true}
        showPageSizeSelector={true}
        totalRowCount={totalRows}
      />

      <div className="crews-table__table-container">
        <table className="crews-table__table">
          <TableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody rows={table.getRowModel().rows} />
          <TableFooter headerGroups={table.getHeaderGroups()} />
        </table>
      </div>

      <div className="crews-table__footer">
        <TablePagination
          table={table}
          className="crews-table__pagination"
          showRowInfo={true}
          showPageSizeSelector={true}
          totalRowCount={totalRows}
        />
      </div>
    </div>
  );
}
