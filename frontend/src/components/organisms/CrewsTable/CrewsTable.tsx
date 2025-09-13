import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
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
  ...filters
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  hideScratched?: boolean;
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

  // Add status filter for scratched crews
  if (hideScratched) {
    params.append("status__not", "Scratched,scratched,SCRATCHED");
  }

  // Add any additional filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const url = `/api/crews/?${params.toString()}`;
  console.log("Fetching crews with URL:", url);
  console.log("Ordering parameter:", ordering);

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
    name: true,
    bib_number: true,
    event_band: true,
    club: true,
    race_time: true,
    overall_rank: true
  },
  all: {}
};

export default function CrewsTable({ onDataChanged }: CrewsTableProps) {
  const columnHelper = createColumnHelper<CrewProps>();

  // Component state - these now control backend requests
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

  // Convert sorting state to backend ordering format
  const getOrderingParam = (sorting: SortingState): string => {
    if (sorting.length === 0) return "overall_rank";

    const sort = sorting[0];
    const direction = sort.desc ? "-" : "";
    return `${direction}${sort.id}`;
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
      hideScratched
    ],
    queryFn: () =>
      fetchCrews({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: debouncedSearch,
        ordering: getOrderingParam(sorting),
        hideScratched
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
        header: "Name",
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
      columnHelper.accessor("race_time", {
        header: "Race Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("raw_time", {
        header: "Raw Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("start_time", {
        header: "Start Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("finish_time", {
        header: "Finish Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("start_sequence", {
        header: "Start Seq",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--sequence">{info.getValue() || "--"}</span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("finish_sequence", {
        header: "Finish Seq",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--sequence">{info.getValue() || "--"}</span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("overall_rank", {
        header: "Overall Rank",
        cell: (info) => <span className="crews-table__cell crews-table__cell--rank">{info.getValue() || "--"}</span>,
        enableSorting: true
      }),
      columnHelper.accessor("category_rank", {
        header: "Category Rank",
        cell: (info) => <span className="crews-table__cell crews-table__cell--rank">{info.getValue() || "--"}</span>,
        enableSorting: true
      }),
      columnHelper.accessor("gender_rank", {
        header: "Gender Rank",
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
        header: "Manual Override",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("masters_adjustment", {
        header: "Masters Adj",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--adjustment">
            {info.getValue() ? `${info.getValue()}s` : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("masters_adjusted_time", {
        header: "Masters Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("published_time", {
        header: "Published Time",
        cell: (info) => (
          <span className="crews-table__cell crews-table__cell--time">
            {info.getValue() ? formatTimes(info.getValue()) : "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("composite_code", {
        header: "Composite Code",
        cell: (info) => <span className="crews-table__cell crews-table__cell--code">{info.getValue() || "--"}</span>,
        enableSorting: true
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

  // Reset to first page when search or filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, hideScratched]);

  // Table instance - now with manual pagination/sorting
  const table = useReactTable({
    data: crewsResponse?.results || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Important: tells table not to paginate client-side
    manualSorting: true, // Important: tells table not to sort client-side
    manualFiltering: true, // Important: tells table not to filter client-side
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
  const currentPageRows = crewsResponse?.results?.length || 0;
  const currentPage = pagination.pageIndex + 1;
  const totalPages = Math.ceil(totalRows / pagination.pageSize);

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
            Showing {currentPageRows} crews on page {currentPage} of {totalPages}
            <span> ({totalRows} total crews)</span>
            {globalFilter && <span> (search: "{globalFilter}")</span>}
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
