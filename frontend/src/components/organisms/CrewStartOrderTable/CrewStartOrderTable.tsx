import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  PaginationState,
  createColumnHelper,
  SortingState
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { CrewProps } from "../../../types/components.types";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import "./crewStartOrderTable.scss";
import Checkbox from "../../atoms/Checkbox/Checkbox";
import TextButton from "../../atoms/TextButton/TextButton";

interface CrewStartOrderTableProps {
  onDataChanged?: () => void;
}

interface duplicate {
  id: number;
  name: string;
  club: string;
  event_band: string;
  calculated_start_order: number;
}

interface DuplicateCheckResponse {
  has_duplicates: boolean;
  duplicates: duplicate[];
  summary: {
    total_accepted_crews: number;
    unique_start_orders: number;
    duplicate_start_orders: number;
    crews_with_duplicates: number;
  };
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CrewProps[];
}

// API function to fetch crews
const fetchCrews = async (params: {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  status?: string[];
}): Promise<ApiResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.page_size) searchParams.set("page_size", params.page_size.toString());
  if (params.search) searchParams.set("search", params.search);
  if (params.ordering) searchParams.set("ordering", params.ordering);

  // Handle status filter - backend expects status[] format
  if (params.status && params.status.length > 0) {
    params.status.forEach((status) => {
      searchParams.append("status[]", status);
    });
  }

  const response = await fetch(`/api/crews/?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const fetchDuplicateCheck = async (): Promise<DuplicateCheckResponse> => {
  const response = await fetch("/api/crew-start-order-duplicates/");

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default function CrewStartOrderTable({ onDataChanged }: CrewStartOrderTableProps) {
  const columnHelper = createColumnHelper<CrewProps>();

  // Component state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: "calculated_start_order", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [isUpdatingStartOrders, setIsUpdatingStartOrders] = useState(false);

  const [hideScratched, setHideScratched] = useState(() => {
    const saved = localStorage.getItem("crew-start-order-hide-scratched");
    return saved ? JSON.parse(saved) : true; // Default to hiding scratched
  });

  // Convert TanStack Table sorting to Django REST Framework ordering format
  const getOrderingParam = useCallback((sorting: SortingState): string => {
    if (sorting.length === 0) return "calculated_start_order";

    const sort = sorting[0];
    const fieldMap: { [key: string]: string } = {
      name: "competitor_names",
      club: "club__name",
      event_band: "event_band",
      sculling_CRI: "sculling_CRI",
      rowing_CRI: "rowing_CRI",
      draw_start_score: "draw_start_score",
      calculated_start_order: "calculated_start_order",
      status: "status"
    };

    const field = fieldMap[sort.id] || sort.id;
    return sort.desc ? `-${field}` : field;
  }, []);

  // Get status filter array
  const getStatusFilter = useCallback((): string[] => {
    if (hideScratched) {
      return ["Accepted"];
    }
    return ["Accepted", "Scratched"];
  }, [hideScratched]);

  // Build query parameters
  const queryParams = useMemo(
    () => ({
      page: pagination.pageIndex + 1, // Django uses 1-based pagination
      page_size: pagination.pageSize,
      search: globalFilter || undefined,
      ordering: getOrderingParam(sorting),
      status: getStatusFilter()
    }),
    [pagination.pageIndex, pagination.pageSize, globalFilter, sorting, getOrderingParam, getStatusFilter]
  );

  // React Query to fetch data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["crews", queryParams],
    queryFn: () => fetchCrews(queryParams)
    // keepPreviousData: true // Keep showing old data while fetching new data
  });

  const {
    data: duplicateData,
    isLoading: isDuplicateLoading,
    error: duplicateError,
    refetch: refetchDuplicates
  } = useQuery({
    queryKey: ["start-order-duplicates"],
    queryFn: fetchDuplicateCheck, // <-- This calls the API
    refetchOnWindowFocus: false
  });

  // Function to update start orders via API
  const updateStartOrders = async () => {
    setIsUpdatingStartOrders(true);
    try {
      const response = await fetch("/api/crew-update-start-orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`Updated start orders for ${result.updated_crews} crews`);
        // Refetch the data to show updated start orders
        await refetch();
        // Call the parent's data refresh function
        if (onDataChanged) {
          onDataChanged();
        }
      } else {
        console.error("Failed to update start orders:", result.message);
        alert(`Error updating start orders: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating start orders:", error);
      alert("Failed to update start orders. Please try again.");
    } finally {
      setIsUpdatingStartOrders(false);
    }
  };

  // Table columns focused on start order information
  const columns = useMemo<ColumnDef<CrewProps, any>[]>(
    () => [
      columnHelper.accessor("event_order", {
        header: "Event order",
        cell: (info) => (
          <span className="crew-start-order-table__cell crew-start-order-table__cell--event">
            {info.getValue() || "--"}
          </span>
        ),
        enableSorting: false
      }),
      columnHelper.accessor("event_band", {
        header: "Event",
        cell: (info) => (
          <span className="crew-start-order-table__cell crew-start-order-table__cell--event">
            {info.getValue() || "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor((row) => row.competitor_names || row.name, {
        id: "name",
        header: "Crew",
        cell: (info) => (
          <span className="crew-start-order-table__cell crew-start-order-table__cell--name">{info.getValue()}</span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor((row) => row.club?.index_code || "--", {
        id: "club",
        header: "Club",
        cell: (info) => (
          <span className="crew-start-order-table__cell crew-start-order-table__cell--club">{info.getValue()}</span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("sculling_CRI", {
        header: "Sculling CRI",
        cell: (info) => (
          <span className={"crew-start-order-table__cell crew-start-order-table__cell--sculling-cri"}>
            {info.getValue() || "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("rowing_CRI", {
        header: "Rowing CRI",
        cell: (info) => (
          <span className={"crew-start-order-table__cell crew-start-order-table__cell--rowing-cri"}>
            {info.getValue() || "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("draw_start_score", {
        header: "Draw start score",
        cell: (info) => (
          <span className={"crew-start-order-table__cell crew-start-order-table__cell--draw-start-score"}>
            {info.getValue() || "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("calculated_start_order", {
        header: "Calculated start order",
        cell: (info) => (
          <span className={"crew-start-order-table__cell crew-start-order-table__cell--draw-start-score"}>
            {info.getValue() || "--"}
          </span>
        ),
        enableSorting: true
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <span
            className={`crew-start-order-table__cell crew-start-order-table__cell--status crew-start-order-table__cell--status-${info.getValue()?.toLowerCase().replace(" ", "-")}`}
          >
            {info.getValue() || "--"}
          </span>
        ),
        enableSorting: true
      })
    ],
    []
  );

  // Save hideScratched preference
  useEffect(() => {
    localStorage.setItem("crew-start-order-hide-scratched", JSON.stringify(hideScratched));
  }, [hideScratched]);

  // Calculate page count from server response
  const pageCount = useMemo(() => {
    if (!data?.count) return 0;
    return Math.ceil(data.count / pagination.pageSize);
  }, [data?.count, pagination.pageSize]);

  // Table instance with server-side configuration
  const table = useReactTable({
    data: data?.results || [],
    columns,
    pageCount, // Server-provided page count
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Server handles pagination
    manualSorting: true, // Server handles sorting
    manualFiltering: true, // Server handles filtering
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      pagination,
      sorting,
      globalFilter
    }
  });

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="crew-start-order-table__loading">
        <div className="crew-start-order-table__loading-content">
          <div className="crew-start-order-table__spinner"></div>
          <p>Loading start order...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="crew-start-order-table__error">
        <div className="crew-start-order-table__error-content">
          <h4>Error loading start order</h4>
          <p>Failed to load crew start order data: {error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </div>
    );
  }

  const totalRows = data?.count || 0;
  const displayedRows = data?.results?.length || 0;

  return (
    <section className="crew-start-order-table">
      <div className="crew-start-order-table__header">
        <h3 className="crew-start-order-table__title">Calculated start order</h3>

        {/* Global duplicate status from server */}
        {isDuplicateLoading && (
          <div className="crew-start-order-table__alert crew-start-order-table__alert--info">
            🔄 Checking for duplicate start orders...
          </div>
        )}

        {duplicateError && (
          <div className="crew-start-order-table__alert crew-start-order-table__alert--error">
            ❌ Error checking for duplicates:{" "}
            {duplicateError instanceof Error ? duplicateError.message : "Unknown error"}
          </div>
        )}

        {duplicateData?.has_duplicates && (
          <div className="crew-start-order-table__alert crew-start-order-table__alert--warning">
            <strong>⚠️ Duplicate Start Orders Detected Across All Data:</strong>
            <div className="crew-start-order-table__duplicate-summary">
              {duplicateData.summary.duplicate_start_orders} duplicate start orders affecting{" "}
              {duplicateData.summary.crews_with_duplicates} crews out of {duplicateData.summary.total_accepted_crews}{" "}
              total accepted crews.
            </div>
            {/* {Object.entries(duplicateData.duplicates).map(([startOrder, crews]) => (
              <div key={startOrder} className="crew-start-order-table__duplicate-detail">
                <strong>Start Order {startOrder}:</strong> {crews.map((c) => `${c.name} (${c.club})`).join(", ")}
              </div>
            ))} */}
          </div>
        )}

        {duplicateData && !duplicateData.has_duplicates && (
          <div className="crew-start-order-table__alert crew-start-order-table__alert--success">
            ✅ All start orders are unique across the entire dataset ({duplicateData.summary.total_accepted_crews}{" "}
            accepted crews)
          </div>
        )}
      </div>

      <div className="crew-start-order-table__controls">
        <SearchInput
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Search crews, names, events..."
          className="crew-start-order-table__search"
        />

        <Checkbox
          name={"scratched-crews"}
          label={"Hide scratched crews"}
          id={"scratched-crews"}
          checked={hideScratched}
          onChange={(e) => setHideScratched(e.target.checked)}
        />

        <TextButton
          onClick={updateStartOrders}
          disabled={isUpdatingStartOrders}
          label={isUpdatingStartOrders ? "Updating" : "Update start orders"}
        />
      </div>

      <div className="crew-start-order-table__table-container">
        {isLoading && (
          <div className="crew-start-order-table__loading-overlay">
            <div className="crew-start-order-table__spinner"></div>
          </div>
        )}
        <TablePagination
          table={table}
          className="crew-start-order-table__pagination"
          showRowInfo={false}
          showPageSizeSelector={true}
        />
        <table className="crew-start-order-table__table">
          <TableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody rows={table.getRowModel().rows} />
        </table>
      </div>

      {/* Results Info and Pagination */}
      <div className="crew-start-order-table__footer">
        <div className="crew-start-order-table__results-info">
          <p className="crew-start-order-table__results-text">
            Showing {displayedRows} of {totalRows} crews
            {globalFilter && <span> (filtered by search)</span>}
          </p>
        </div>

        <TablePagination
          table={table}
          className="crew-start-order-table__pagination"
          showRowInfo={false}
          showPageSizeSelector={true}
        />
      </div>
    </section>
  );
}
