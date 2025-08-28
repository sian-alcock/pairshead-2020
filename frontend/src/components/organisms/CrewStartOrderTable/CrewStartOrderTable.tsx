import React, { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  PaginationState,
  createColumnHelper,
  SortingState,
  ColumnFiltersState
} from "@tanstack/react-table";
import { formatTimes } from "../../../lib/helpers";
import { CrewProps } from "../../../types/components.types";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import "./crewStartOrderTable.scss";
import Checkbox from "../../atoms/Checkbox/Checkbox";
import TextButton from "../../atoms/TextButton/TextButton";

interface CrewStartOrderTableProps {
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
    if (columnId.includes("time") || columnId.includes("Time") || columnId.includes("sequence")) {
      if (cellValue === 0) return false; // Skip zero times
      const formattedTime = columnId.includes("sequence") ? cellValue.toString() : formatTimes(cellValue);
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

// Custom sorting function for sequence columns
const sequenceSortingFn = (rowA: any, rowB: any, columnId: string) => {
  const a = rowA.getValue(columnId) as number | null;
  const b = rowB.getValue(columnId) as number | null;

  // Handle null values - put them at the end
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  return a - b;
};

export default function CrewStartOrderTable({ crews, isLoading, error, onDataChanged }: CrewStartOrderTableProps) {
  const columnHelper = createColumnHelper<CrewProps>();

  // Component state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: "calculated_start_order", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [isUpdatingStartOrders, setIsUpdatingStartOrders] = useState(false);

  const [hideScratched, setHideScratched] = useState(() => {
    const saved = localStorage.getItem("crew-start-order-hide-scratched");
    return saved ? JSON.parse(saved) : true; // Default to hiding scratched
  });

  // Function to update start orders via API
  const updateStartOrders = async () => {
    setIsUpdatingStartOrders(true);
    try {
      const response = await fetch("/api/crew-update-start-orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
          // Add your auth header here if needed, e.g.:
          // 'Authorization': `Bearer ${getToken()}`,
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`Updated start orders for ${result.updated_crews} crews`);
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

  // Function to check for duplicate start orders
  const getDuplicateStartOrders = useMemo(() => {
    const startOrderCounts: { [key: number]: CrewProps[] } = {};
    const acceptedCrews = (crews || []).filter(
      (crew) =>
        crew.status === "Accepted" && crew.calculated_start_order != null && crew.calculated_start_order !== 9999999
    );

    // Group crews by their calculated_start_order
    acceptedCrews.forEach((crew) => {
      const startOrder = crew.calculated_start_order!;
      if (!startOrderCounts[startOrder]) {
        startOrderCounts[startOrder] = [];
      }
      startOrderCounts[startOrder].push(crew);
    });

    // Find duplicates
    const duplicates: { [key: number]: CrewProps[] } = {};
    Object.entries(startOrderCounts).forEach(([startOrder, crewsArray]) => {
      if (crewsArray.length > 1) {
        duplicates[parseInt(startOrder)] = crewsArray;
      }
    });

    return duplicates;
  }, [crews]);

  const hasDuplicates = Object.keys(getDuplicateStartOrders).length > 0;

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
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor("event_band", {
        header: "Event",
        cell: (info) => (
          <span className="crew-start-order-table__cell crew-start-order-table__cell--event">
            {info.getValue() || "--"}
          </span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor((row) => row.competitor_names || row.name, {
        id: "name",
        header: "Crew",
        cell: (info) => (
          <span className="crew-start-order-table__cell crew-start-order-table__cell--name">{info.getValue()}</span>
        ),
        enableSorting: true,
        filterFn: "includesString"
      }),
      columnHelper.accessor((row) => row.club?.index_code || "--", {
        id: "club",
        header: "Club",
        cell: (info) => (
          <span className="crew-start-order-table__cell crew-start-order-table__cell--club">{info.getValue()}</span>
        ),
        enableSorting: true,
        filterFn: "includesString"
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
        cell: (info) => {
          const startOrder = info.getValue();
          const isDuplicate =
            startOrder != null && startOrder !== 9999999 && getDuplicateStartOrders[startOrder]?.length > 1;

          return (
            <span
              className={`crew-start-order-table__cell crew-start-order-table__cell--calculated-start-order ${
                isDuplicate ? "crew-start-order-table__cell--duplicate" : ""
              }`}
            >
              {startOrder || "--"}
              {isDuplicate && <span className="crew-start-order-table__duplicate-indicator">⚠️</span>}
            </span>
          );
        },
        enableSorting: true
      }),
      // New duplicate check column
      columnHelper.display({
        id: "duplicate_check",
        header: "Duplicate Check",
        cell: (info) => {
          const crew = info.row.original;
          const startOrder = crew.calculated_start_order;
          const isDuplicate =
            startOrder != null && startOrder !== 9999999 && getDuplicateStartOrders[startOrder]?.length > 1;

          if (!isDuplicate) {
            return <span className="crew-start-order-table__cell crew-start-order-table__cell--no-duplicate">✅</span>;
          }

          const duplicateCrews = getDuplicateStartOrders[startOrder!];
          const otherCrews = duplicateCrews.filter((c) => c.id !== crew.id);

          return (
            <span
              className="crew-start-order-table__cell crew-start-order-table__cell--has-duplicate"
              title={`Duplicate with: ${otherCrews.map((c) => c.competitor_names || c.name).join(", ")}`}
            >
              ❌ ({duplicateCrews.length})
            </span>
          );
        },
        enableSorting: false
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
        enableSorting: true,
        filterFn: "includesString"
      })
    ],
    [getDuplicateStartOrders]
  );

  useEffect(() => {
    localStorage.setItem("crew-start-order-hide-scratched", JSON.stringify(hideScratched));
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
    globalFilterFn: globalFilterFn,
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 50
      },
      sorting: [
        {
          id: "calculated_start_order",
          desc: false
        }
      ]
    }
  });

  // Loading state
  if (isLoading) {
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
          <p>Failed to load crew start order data</p>
        </div>
      </div>
    );
  }

  const totalRows = crews?.length || 0;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const displayedRows = table.getRowModel().rows.length;

  return (
    <section className="crew-start-order-table">
      <div className="crew-start-order-table__header">
        <h3 className="crew-start-order-table__title">Calculated start order</h3>

        {/* Duplicate Status Alert */}
        {hasDuplicates && (
          <div className="crew-start-order-table__alert crew-start-order-table__alert--warning">
            <strong>⚠️ Duplicate Start Orders Detected:</strong>
            {Object.entries(getDuplicateStartOrders).map(([startOrder, crews]) => (
              <div key={startOrder} className="crew-start-order-table__duplicate-detail">
                Start Order {startOrder}: {crews.map((c) => c.competitor_names || c.name).join(", ")}
              </div>
            ))}
          </div>
        )}

        {!hasDuplicates && crews && crews.length > 0 && (
          <div className="crew-start-order-table__alert crew-start-order-table__alert--success">
            ✅ All start orders are unique
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
        <table className="crew-start-order-table__table">
          <TableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody rows={table.getRowModel().rows} />
        </table>
      </div>

      {/* Results Info and Pagination */}
      <div className="crew-start-order-table__footer">
        <div className="crew-start-order-table__results-info">
          <p className="crew-start-order-table__results-text">
            Showing {displayedRows} of {filteredRows} crews
            {globalFilter && filteredRows !== totalRows && <span> (filtered from {totalRows} total)</span>}
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
