// MastersCrewsTable.tsx - Organism Component
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
  ColumnFiltersState,
} from "@tanstack/react-table";
import axios, { AxiosResponse } from "axios";
import { formatTimes } from "../../../lib/helpers";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import "./mastersCrewsTable.scss";
import { FormSelect } from "../../atoms/FormSelect/FormSelect";

// Types
interface AdjustmentDetails {
  master_category: string;
  standard_time_ms: number;
  adjustment_ms: number;
  found_in_table: boolean;
}

interface MastersCrew {
  crew_id: number;
  name: string;
  bib_number: number | null;
  club: string;
  event_band: string;
  original_event_category: string | null;
  raw_time: number | null;
  masters_adjustment: number;
  published_time: number | null;
  event_type: string | null;
  event_gender: string | null;
  fastest_time_category: string | null;
  applicable_fastest_time: number | null;
  adjustment_details: AdjustmentDetails | null;
  has_valid_times: boolean;
  status: string;
}

interface MastersCrewsData {
  masters_crews: MastersCrew[];
  fastest_times: Record<string, number | null>;
  summary: {
    total_masters_crews: number;
    crews_with_adjustments: number;
    crews_with_times: number;
    crews_without_times: number;
  };
}

interface MastersCrewsTableProps {
  onDataChanged?: () => void;
}

// API function
const fetchMastersCrews = async (): Promise<MastersCrewsData> => {
  const response: AxiosResponse = await axios.get('/api/crews/masters/');
  return response.data;
};

// Custom filter functions
const adjustmentFilterFn = (row: any, columnId: string, filterValue: string) => {
  const rowData = row.original as MastersCrew;
  
  switch (filterValue) {
    case 'with_adjustment':
      return rowData.masters_adjustment && rowData.masters_adjustment !== 0;
    case 'without_adjustment':
      return !rowData.masters_adjustment || rowData.masters_adjustment === 0;
    case 'with_times':
      return rowData.has_valid_times;
    case 'without_times':
      return !rowData.has_valid_times;
    case 'all':
    default:
      return true;
  }
};

export default function MastersCrewsTable({ onDataChanged }: MastersCrewsTableProps) {
  const queryClient = useQueryClient();
  const columnHelper = createColumnHelper<MastersCrew>();

  // Component state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [adjustmentFilter, setAdjustmentFilter] = useState<string>('all');

  // Data fetching
  const {
    data: mastersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["mastersCrews"],
    queryFn: () => {
      console.log('Fetching masters crews data...');
      return fetchMastersCrews();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });

  // Table columns
  const columns = useMemo<ColumnDef<MastersCrew, any>[]>(() => [
    columnHelper.accessor("crew_id", {
      header: "ID",
      cell: (info) => (
        <span className="masters-crews__cell masters-crews__cell--id">
          {info.getValue()}
        </span>
      ),
      enableSorting: true,
      size: 80,
    }),
    columnHelper.accessor("bib_number", {
      header: "Bib",
      cell: (info) => (
        <span className="masters-crews__cell masters-crews__cell--bib">
          {info.getValue() || '--'}
        </span>
      ),
      enableSorting: true,
      size: 80,
    }),
    columnHelper.accessor("name", {
      header: "Crew Name",
      cell: (info) => (
        <span className="masters-crews__cell masters-crews__cell--name">
          {info.getValue()}
        </span>
      ),
      enableSorting: true,
      size: 200,
    }),
    columnHelper.accessor("club", {
      header: "Club",
      cell: (info) => (
        <span className="masters-crews__cell masters-crews__cell--club">
          {info.getValue() || '--'}
        </span>
      ),
      enableSorting: true,
      size: 120,
    }),
    columnHelper.accessor("event_band", {
      header: "Category",
      cell: (info) => (
        <div className="masters-crews__category-cell">
          <span className="masters-crews__event-band">
            {info.getValue()}
          </span>
          {info.row.original.original_event_category && (
            <span className="masters-crews__original-event">
              ({info.row.original.original_event_category})
            </span>
          )}
        </div>
      ),
      enableSorting: true,
      size: 150,
    }),
    columnHelper.accessor("raw_time", {
      header: "Raw Time",
      cell: (info) => {
        const time = info.getValue();
        return (
          <span className="masters-crews__cell masters-crews__cell--time">
            {time ? formatTimes(time) : '--'}
          </span>
        );
      },
      enableSorting: true,
      size: 100,
    }),
    columnHelper.accessor("masters_adjustment", {
      header: "Adjustment",
      cell: (info) => {
        const adjustment = info.getValue();
        const row = info.row.original;
        
        if (!adjustment || adjustment === 0) {
          return (
            <span className="masters-crews__cell masters-crews__cell--no-adjustment">
              No adjustment
            </span>
          );
        }
        
        return (
          <div className="masters-crews__adjustment-cell">
            <span className={`masters-crews__adjustment ${
              adjustment > 0 ? 'masters-crews__adjustment--positive' : 'masters-crews__adjustment--negative'
            }`}>
              {adjustment > 0 ? '+' : ''}{formatTimes(Math.abs(adjustment))}
            </span>
            {row.adjustment_details && (
              <div className="masters-crews__adjustment-details">
                <span className="masters-crews__master-category">
                  {row.adjustment_details.master_category}
                </span>
                {!row.adjustment_details.found_in_table && (
                  <span className="masters-crews__not-found">⚠️</span>
                )}
              </div>
            )}
          </div>
        );
      },
      enableSorting: true,
      size: 120,
    }),
    columnHelper.accessor("published_time", {
      header: "Published Time",
      cell: (info) => {
        const time = info.getValue();
        return (
          <span className="masters-crews__cell masters-crews__cell--time masters-crews__cell--published">
            {time ? formatTimes(time) : '--'}
          </span>
        );
      },
      enableSorting: true,
      size: 120,
    }),
    columnHelper.accessor("applicable_fastest_time", {
      header: "Fastest Time Used",
      cell: (info) => {
        const fastestTime = info.getValue();
        const category = info.row.original.fastest_time_category;
        
        if (!fastestTime || !category) {
          return (
            <span className="masters-crews__cell masters-crews__cell--no-fastest">
              N/A
            </span>
          );
        }
        
        return (
          <div className="masters-crews__fastest-time-cell">
            <span className="masters-crews__fastest-time">
              {formatTimes(fastestTime)}
            </span>
            <span className="masters-crews__fastest-category">
              {category.replace('fastest_', '').replace('_', ' ')}
            </span>
          </div>
        );
      },
      enableSorting: true,
      size: 150,
    }),
  ], []);

  // Table instance
  const table = useReactTable({
    data: mastersData?.masters_crews || [],
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
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 25,
      },
      sorting: [
        {
          id: "event_band",
          desc: false,
        },
      ],
    },
  });

  // Handle adjustment filter change
  const handleAdjustmentFilterChange = (value: string) => {
    setAdjustmentFilter(value);
    if (value === 'all') {
      setColumnFilters(prev => prev.filter(f => f.id !== 'masters_adjustment'));
    } else {
      setColumnFilters(prev => [
        ...prev.filter(f => f.id !== 'masters_adjustment'),
        { id: 'masters_adjustment', value }
      ]);
    }
  };

  // Refresh data handler
  const handleRefreshData = () => {
    refetch();
    onDataChanged?.();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="masters-crews__loading">
        <div className="masters-crews__loading-content">
          <div className="masters-crews__spinner"></div>
          <p>Loading masters crews...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="masters-crews__error">
        <div className="masters-crews__error-content">
          <h4>Error loading masters crews</h4>
          <p>Failed to load masters crews data</p>
          <button 
            className="masters-crews__retry-button"
            onClick={handleRefreshData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!mastersData) {
    return <div className="masters-crews__no-data">No masters crews data available</div>;
  }

  const totalRows = mastersData.masters_crews.length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const displayedRows = table.getRowModel().rows.length;

  return (
    <div className="masters-crews">
      {/* Header and Controls */}
      <div className="masters-crews__header">
        <div className="masters-crews__title-section">
          <h3 className="masters-crews__title">
            Masters Crews & Handicaps
          </h3>
          <div className="masters-crews__stats">
            <span className="masters-crews__stat masters-crews__stat--total">
              Total: {mastersData.summary.total_masters_crews}
            </span>
            <span className="masters-crews__stat masters-crews__stat--with-adj">
              With Adjustments: {mastersData.summary.crews_with_adjustments}
            </span>
            <span className="masters-crews__stat masters-crews__stat--with-times">
              With Times: {mastersData.summary.crews_with_times}
            </span>
            <span className="masters-crews__stat masters-crews__stat--without-times">
              No Times: {mastersData.summary.crews_without_times}
            </span>
          </div>
        </div>
        
        <div className="masters-crews__controls">
          <div className="masters-crews__filter-group">
            <FormSelect fieldName={"masters-select"}
              title={"Select"}
              selectOptions={[
                {label: 'All Masters', value: 'all'},
                {label: 'With adjustments', value: 'with_adjustments'},
                {label: 'No adjustments', value: 'without_adjustments'},
                {label: 'With times', value: 'with_times'},
                {label: 'No times', value: 'without_times'},
              ]}
              onChange={(e) => handleAdjustmentFilterChange(e.target.value)}
            />
          </div>
          
          <div className="masters-crews__search-wrapper">
            <SearchInput
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Search crews, clubs, categories..."
              className="masters-crews__search"
            />
          </div>
        </div>
      </div>

      {/* Fastest Times Reference */}
      <div className="masters-crews__fastest-times">
        <h4>Reference Fastest Times:</h4>
        <div className="masters-crews__fastest-times-grid">
          {Object.entries(mastersData.fastest_times).map(([category, time]) => (
            <div key={category} className="masters-crews__fastest-time-item">
              <span className="masters-crews__fastest-category-name">
                {category.replace('fastest_', '').replace('_', ' ').toUpperCase()}:
              </span>
              <span className="masters-crews__fastest-time-value">
                {time ? formatTimes(time) : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="masters-crews__table-container">
        <table className="masters-crews__table">
          <TableHeader 
            headerGroups={table.getHeaderGroups()}
          />
          <TableBody 
            rows={table.getRowModel().rows}
          />
        </table>
      </div>

      {/* Results Info and Pagination */}
      <div className="masters-crews__footer">
        <div className="masters-crews__results-info">
          <p className="masters-crews__results-text">
            Showing {displayedRows} of {filteredRows} crews
            {globalFilter && filteredRows !== totalRows && (
              <span> (filtered from {totalRows} total)</span>
            )}
          </p>
        </div>

        <TablePagination 
          table={table}
          className="masters-crews__pagination"
          showRowInfo={false}
          showPageSizeSelector={true}
        />
      </div>
    </div>
  );
}