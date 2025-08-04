// SequenceComparisonTable.tsx - Organism Component
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
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import "./sequenceComparisonTable.scss";
import { FormSelect } from "../../atoms/FormSelect/FormSelect";
import { IconSuccess } from "../../atoms/IconSuccess/IconSuccess";
import { IconFail } from "../../atoms/IconFail/IconFail";

// Types
interface CrewInfo {
  id: number;
  bib_number: string | number | null;
  name: string;
  competitor_names?: string;
  club?: string;
}

interface RaceTimeData {
  sequence: number;
  time_tap: number;
  bib_number: string | number | null;
  sequences?: number[]; // For multiple sequences
  time_taps?: number[]; // For multiple sequences
}

interface RaceInfo {
  name: string;
  race_id: string;
  is_reference: boolean;
}

interface SequenceComparisonRow {
  crew: CrewInfo | null;
  sequences: Record<number, number | number[] | null>; // race_id -> sequence(s)
  race_times: Record<number, RaceTimeData | null>; // race_id -> race_time_data
  sequences_agree: boolean | null;
  missing_races: number[];
  multiple_sequences: Record<number, boolean>;
  race_id?: number; // For unassigned times
}

interface SequenceComparisonData {
  tap: string;
  races: Record<number, RaceInfo>;
  race_coverage: Record<number, {
    crews_count: number;
    unassigned_count: number;
    total_sequences: number;
    coverage_percentage: number;
  }>;
  comparison_data: SequenceComparisonRow[];
  unassigned_data: SequenceComparisonRow[];
  total_crews: number;
  total_unassigned: number;
  agreements: number;
  disagreements: number;
  agreement_percentage: number;
  summary: {
    total_races: number;
    crews_with_data: number;
    unassigned_times: number;
  };
}

interface SequenceComparisonTableProps {
  tap: 'Start' | 'Finish';
  onDataChanged?: () => void;
}

// API function
const fetchSequenceComparison = async (tap: string): Promise<SequenceComparisonData> => {
  const params = new URLSearchParams();
  params.append('tap', tap);
  
  const response: AxiosResponse = await axios.get(`/api/race-sequence-comparison/?${params.toString()}`);
  return response.data;
};

// Custom filter functions
const agreementFilterFn = (row: any, columnId: string, filterValue: string) => {
  const cellValue = row.getValue(columnId);
  if (filterValue === 'all') return true;
  if (filterValue === 'agree') return cellValue === true;
  if (filterValue === 'disagree') return cellValue === false;
  if (filterValue === 'unassigned') return cellValue === null;
  return true;
};

export default function SequenceComparisonTable({ 
  tap, 
  onDataChanged 
}: SequenceComparisonTableProps) {
  const queryClient = useQueryClient();
  const columnHelper = createColumnHelper<SequenceComparisonRow>();

  // Component state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [agreementFilter, setAgreementFilter] = useState<string>('all');
  const [showUnassigned, setShowUnassigned] = useState<boolean>(true);

  // Data fetching
  const {
    data: comparisonData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sequenceComparison", tap],
    queryFn: () => {
      console.log(`Fetching sequence comparison for ${tap}...`);
      return fetchSequenceComparison(tap);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });

  // Combine crew data and unassigned data
  const tableData = useMemo(() => {
    if (!comparisonData) return [];
    
    let data = [...comparisonData.comparison_data];
    
    if (showUnassigned) {
      data = [...data, ...comparisonData.unassigned_data];
    }
    
    return data;
  }, [comparisonData, showUnassigned]);

  // Dynamic columns with group headers
  const columns = useMemo<ColumnDef<SequenceComparisonRow, any>[]>(() => {
    if (!comparisonData) return [];

    const baseColumns: ColumnDef<SequenceComparisonRow, any>[] = [
      // Crew info column
      columnHelper.accessor("crew", {
        id: "crew_info",
        header: "Crew",
        cell: (info) => {
          const crew = info.getValue();
          if (!crew) {
            return (
              <div className="sequence-comparison__crew-info sequence-comparison__crew-info--unassigned">
                <div className="sequence-comparison__crew-name">Unassigned</div>
                <div className="sequence-comparison__crew-details">No crew assigned</div>
              </div>
            );
          }
          return (
            <div className="sequence-comparison__crew-info">
              <div className="sequence-comparison__crew-name">
                {crew.competitor_names || crew.name}
              </div>
              <div className="sequence-comparison__crew-details">
                Bib: {crew.bib_number} • {crew.club}
              </div>
            </div>
          );
        },
        enableSorting: true,
        size: 250,
      }),
      
      // Agreement column
      columnHelper.accessor("sequences_agree", {
        header: "Agreement",
        cell: (info) => {
          const agrees = info.getValue();
          if (agrees === null) {
            return (
              <span className="sequence-comparison__cell sequence-comparison__cell--na">
                N/A
              </span>
            );
          }
          return (
            <span className={`sequence-comparison__cell sequence-comparison__cell--agreement ${
              agrees ? 'sequence-comparison__cell--agree' : 'sequence-comparison__cell--disagree'
            }`}>
              {agrees ? <IconSuccess /> : <IconFail />}
            </span>
          );
        },
        enableSorting: true,
        filterFn: agreementFilterFn,
        size: 120,
      }),
    ];

    // Add sequence columns for each race
    const raceColumns: ColumnDef<SequenceComparisonRow, any>[] = [];
    Object.entries(comparisonData.races).forEach(([raceId, raceInfo]) => {
      const numericRaceId = parseInt(raceId);
      raceColumns.push(
        columnHelper.accessor((row) => row.sequences[numericRaceId], {
          id: `race_${raceId}`,
          header: () => (
            <div className="sequence-comparison__race-header">
              <div className="sequence-comparison__race-name">
                {raceInfo.name}
              </div>
              <div className="sequence-comparison__race-id">
                ({raceInfo.race_id})
              </div>
              <div className="sequence-comparison__coverage">
                {comparisonData.race_coverage[numericRaceId]?.crews_count || 0} crews, {comparisonData.race_coverage[numericRaceId]?.unassigned_count || 0} unassigned
              </div>
            </div>
          ),
          cell: (info) => {
            const row = info.row.original;
            const sequence = info.getValue();
            const raceTimeData = row.race_times[numericRaceId];
            
            if (sequence === null || sequence === undefined) {
              return (
                <span className="sequence-comparison__cell sequence-comparison__cell--missing">
                  Missing
                </span>
              );
            }
            
            // Handle multiple sequences (shouldn't normally happen but just in case)
            if (Array.isArray(sequence)) {
              return (
                <div className="sequence-comparison__sequence-multiple">
                  {sequence.map((seq, idx) => (
                    <span key={idx} className="sequence-comparison__sequence-item">
                      {seq}
                    </span>
                  ))}
                </div>
              );
            }
            
            return (
              <div className="sequence-comparison__sequence-info">
                <div className="sequence-comparison__sequence-number">
                  {sequence}
                </div>
                {raceTimeData && (
                  <div className="sequence-comparison__sequence-details">
                    {raceTimeData.time_tap}ms
                  </div>
                )}
              </div>
            );
          },
          enableSorting: true,
          size: 120,
        })
      );
    });

    // Create grouped columns
    const groupedColumns: ColumnDef<SequenceComparisonRow, any>[] = [
      ...baseColumns,
      columnHelper.group({
        id: "race_sequences",
        header: "Sequences by Race",
        columns: raceColumns,
      }),
    ];

    return groupedColumns;
  }, [comparisonData]);

  // Table instance
  const table = useReactTable({
    data: tableData,
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
          id: "crew_info",
          desc: false,
        },
      ],
    },
  });

  // Refresh data handler
  const handleRefreshData = () => {
    refetch();
    onDataChanged?.();
  };

  // Handle agreement filter change
  const handleAgreementFilterChange = (value: string) => {
    setAgreementFilter(value);
    if (value === 'all') {
      setColumnFilters(prev => prev.filter(f => f.id !== 'sequences_agree'));
    } else {
      setColumnFilters(prev => [
        ...prev.filter(f => f.id !== 'sequences_agree'),
        { id: 'sequences_agree', value }
      ]);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="sequence-comparison__loading">
        <div className="sequence-comparison__loading-content">
          <div className="sequence-comparison__spinner"></div>
          <p>Loading sequence comparison for {tap} times...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="sequence-comparison__error">
        <div className="sequence-comparison__error-content">
          <h4>Error loading sequence comparison</h4>
          <p>Failed to load comparison data for {tap} times</p>
          <button 
            className="sequence-comparison__retry-button"
            onClick={handleRefreshData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return <div className="sequence-comparison__no-data">No comparison data available</div>;
  }

  const totalRows = tableData.length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const displayedRows = table.getRowModel().rows.length;

  return (
    <div className="sequence-comparison">
      {/* Header and Controls */}
      <div className="sequence-comparison__header">
        <div className="sequence-comparison__title-section">
          <h3 className="sequence-comparison__title">
            Crew Sequence Comparison: {tap} Times
          </h3>
        </div>
        
        <div className="sequence-comparison__controls">
          <div className="sequence-comparison__stats">
            <span className="sequence-comparison__stat sequence-comparison__stat--total">
              Total Crews: {comparisonData.total_crews}
            </span>
            <span className="sequence-comparison__stat sequence-comparison__stat--agree">
              Agreements: {comparisonData.agreements} ({comparisonData.agreement_percentage}%)
            </span>
            <span className="sequence-comparison__stat sequence-comparison__stat--disagree">
              Disagreements: {comparisonData.disagreements}
            </span>
            <span className="sequence-comparison__stat sequence-comparison__stat--unassigned">
              Unassigned: {comparisonData.total_unassigned}
            </span>
          </div>

          <div className="sequence-comparison__filter-group">
            <FormSelect
              value={agreementFilter}
              onChange={(e) => handleAgreementFilterChange(e.target.value)}
              selectOptions={[
                { label: 'All', value: 'all' },
                { label: 'Agreements only', value: 'agree' },
                { label: 'Disagreements only', value: 'disagree' },
                { label: 'Unassigned only', value: 'unassigned' }
              ]}
              fieldName={"filter_agreements"}
              title={"Filter by agreement"}
            />
            
            <label className="sequence-comparison__checkbox-label">
              <input
                type="checkbox"
                checked={showUnassigned}
                onChange={(e) => setShowUnassigned(e.target.checked)}
                className="sequence-comparison__checkbox"
              />
              Show unassigned times
            </label>
          </div>
          
          <div className="sequence-comparison__search-wrapper">
            <SearchInput
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Search crews, bib numbers..."
              className="sequence-comparison__search"
            />
          </div>
        </div>
      </div>

      {/* Race Summary */}
      <div className="sequence-comparison__race-summary">
        {Object.entries(comparisonData.races).map(([raceId, raceInfo]) => {
          const coverage = comparisonData.race_coverage[parseInt(raceId)];
          return (
            <div key={raceId} className="sequence-comparison__race-summary-item">
              <strong>{raceInfo.name} ({raceInfo.race_id})</strong>
              <span>{coverage?.crews_count} crews, {coverage?.unassigned_count} unassigned</span>
              <span>({coverage?.coverage_percentage}% crew coverage)</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <TablePagination 
        table={table}
        className="sequence-comparison__pagination"
        showRowInfo={false}
        showPageSizeSelector={true}
      />
      <div className="sequence-comparison__table-container">
        <table className="sequence-comparison__table">
          <TableHeader 
            headerGroups={table.getHeaderGroups()}
          />
          <TableBody 
            rows={table.getRowModel().rows}
          />
        </table>
      </div>

      {/* Results Info and Pagination */}
      <div className="sequence-comparison__footer">
        <div className="sequence-comparison__results-info">
          <p className="sequence-comparison__results-text">
            Showing {displayedRows} of {filteredRows} entries
            {globalFilter && filteredRows !== totalRows && (
              <span> (filtered from {totalRows} total)</span>
            )}
          </p>
        </div>

        <TablePagination 
          table={table}
          className="sequence-comparison__pagination"
          showRowInfo={false}
          showPageSizeSelector={true}
        />
      </div>
    </div>
  );
}