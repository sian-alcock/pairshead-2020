// CrewTimeCompareTable.tsx
import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@tanstack/react-table";
import axios, { AxiosResponse } from "axios";
import { Link } from "react-router-dom";
import { formatTimes, formatVarianceTime } from "../../../lib/helpers";
import { CrewProps, RaceProps } from "../../../types/components.types";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import TextButton from "../../atoms/TextButton/TextButton";
import './crewTimeCompareTable.scss'

interface CrewOverrideUpdate {
  crew_id: number;
  race_id_start_override?: number;
  race_id_finish_override?: number;
}

interface CrewTimeCompareTableProps {
  crews: CrewProps[];
  races: RaceProps[];
  isLoading: boolean;
  error: boolean;
  onDataChanged: () => void; 
}

// API function for updating overrides
const updateCrewOverrides = async (updates: CrewOverrideUpdate[]): Promise<any> => {
  const response: AxiosResponse = await axios.patch("/api/crews/bulk-update-overrides/", {
    updates
  });
  return response.data;
};

// Custom filter function for time values
const timeFilterFn = (row: any, columnId: string, filterValue: string) => {
  const cellValue = row.getValue(columnId);
  if (cellValue === null || cellValue === undefined) return false;
  
  // Convert milliseconds to formatted time string for filtering
  const formattedTime = formatTimes(cellValue);
  return formattedTime.toLowerCase().includes(filterValue.toLowerCase());
};

// Custom global filter function
const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
  const cellValue = row.getValue(columnId);
  
  if (cellValue === null || cellValue === undefined) return false;
  
  // Handle different data types
  if (typeof cellValue === 'number') {
    // For time values (milliseconds), convert to formatted time
    if (columnId.includes('time') || columnId.includes('raw_time')) {
      const formattedTime = formatTimes(cellValue);
      return formattedTime.toLowerCase().includes(filterValue.toLowerCase());
    }
    // For other numbers, convert to string
    return cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
  }
  
  if (typeof cellValue === 'string') {
    return cellValue.toLowerCase().includes(filterValue.toLowerCase());
  }
  
  // Handle objects (like club)
  if (typeof cellValue === 'object') {
    return JSON.stringify(cellValue).toLowerCase().includes(filterValue.toLowerCase());
  }
  
  return false;
};

export default function CrewTimeCompareTable({ 
  crews, 
  races, 
  isLoading, 
  error,
  onDataChanged
}: CrewTimeCompareTableProps) {
  const queryClient = useQueryClient();
  const columnHelper = createColumnHelper<CrewProps>();

  // State for tracking override changes
  const [pendingOverrides, setPendingOverrides] = useState<Map<number, CrewOverrideUpdate>>(new Map());
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [globalFilter, setGlobalFilter] = useState<string>('');

  // Get race data
  const defaultStartRace = races.find((race) => race.default_start);
  const defaultFinishRace = races.find((race) => race.default_finish);

  // Mutation for updating overrides
  const updateOverridesMutation = useMutation({
    mutationFn: updateCrewOverrides,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      setPendingOverrides(new Map());
      onDataChanged()
    },
    onError: (error) => {
      console.error("Failed to update overrides:", error);
    },
  });

  // Handle radio button changes
  const handleOverrideChange = (crewId: number, type: 'start' | 'finish', raceId: number) => {
    setPendingOverrides(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(crewId) || { crew_id: crewId };
      
      if (type === 'start') {
        existing.race_id_start_override = raceId;
      } else {
        existing.race_id_finish_override = raceId;
      }
      
      newMap.set(crewId, existing);
      return newMap;
    });
  };

  // Get current override value (either pending or existing)
  const getCurrentOverride = (crew: CrewProps, type: 'start' | 'finish'): number | null => {
    const pending = pendingOverrides.get(crew.id);
    if (pending) {
      if (type === 'start' && pending.race_id_start_override) {
        return pending.race_id_start_override;
      }
      if (type === 'finish' && pending.race_id_finish_override) {
        return pending.race_id_finish_override;
      }
    }

    // Return existing override or default
    if (type === 'start') {
      return crew.race_id_start_override || defaultStartRace?.id || null;
    } else {
      return crew.race_id_finish_override || defaultFinishRace?.id || null;
    }
  };

  // Calculate raw time based on selected races
  const calculateRawTime = (crew: CrewProps, race: RaceProps): number | null => {
    const startTime = crew.times.find(
      time => time.tap === 'Start' && time.race?.id === race.id
    );
    const finishTime = crew.times.find(
      time => time.tap === 'Finish' && time.race?.id === race.id
    );
    
    if (startTime?.time_tap && finishTime?.time_tap) {
      return finishTime.time_tap - startTime.time_tap;
    }
    
    return null;
  };

  // Handle save changes
  const handleSaveChanges = () => {
    const updates = Array.from(pendingOverrides.values());
    updateOverridesMutation.mutate(updates);
  };

  // Helper function to format variance display
  const formatVariance = (variance: number | null): { 
    display: string; 
    isHighVariance: boolean; 
    colorClass: 'green' | 'amber' | 'red' | 'neutral' 
  } => {
    if (variance === null) {
      return { display: '--', isHighVariance: false, colorClass: 'neutral' };
    }

    const absVariance = Math.abs(variance);
    const isHighVariance = absVariance > 5000; // Keep your existing logic
    const formattedTime = formatVarianceTime(variance); // Use the new function
    const sign = variance >= 0 ? '+' : '-';
    const display = `${sign}${formattedTime}`;

    // Determine color based on absolute variance
    let colorClass: 'green' | 'amber' | 'red' | 'neutral';
    if (absVariance < 1000) { // Under 1 second
      colorClass = 'green';
    } else if (absVariance <= 5000) { // 1-5 seconds
      colorClass = 'amber';
    } else { // Over 5 seconds
      colorClass = 'red';
    }

    return { display, isHighVariance, colorClass };
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

  // Table columns
  const columns = useMemo<ColumnDef<CrewProps, any>[]>(() => {
    const baseColumns = [
      columnHelper.accessor("id", {
        header: "Id",
        cell: (info) => (
          <Link to={`/generate-results/crews/${info.getValue()}/edit`}>
            {info.getValue()}
          </Link>
        ),
        enableSorting: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor("competitor_names", {
        header: "Crew",
        cell: (info) => {
          const crew = info.row.original;
          if (!crew.competitor_names) return crew.name;
          return crew.competitor_names;
        },
        enableSorting: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor("bib_number", {
        header: "Bib",
        cell: (info) => info.getValue() || "",
        enableSorting: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor((row) => row.club.index_code, {
        id: "club",
        header: "Club",
        enableSorting: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor("event_band", {
        header: "Category",
        enableSorting: true,
        filterFn: 'includesString',
      }),
    ];

    // Generate race columns
    const raceColumns: ColumnDef<CrewProps, any>[] = [];
    
    races.forEach((race, idx) => {
      // Start time column
      raceColumns.push(columnHelper.accessor(
        (row) => {
          const time = row.times.find(
            (time) => time.tap === 'Start' && time.race?.race_id === race.race_id
          );
          return time?.time_tap || null;
        },
        {
          id: `race_${race.race_id}_start`,
          header: "Start",
          cell: (info) => formatTimes(info.getValue()),
          enableSorting: true,
          sortingFn: timeSortingFn,
          filterFn: timeFilterFn,
        }
      ));

      // Start use radio button column
      raceColumns.push(columnHelper.display({
        id: `race_${race.race_id}_start_use`,
        header: "Use",
        cell: (info) => {
          const crew = info.row.original;
          const isSelected = getCurrentOverride(crew, 'start') === race.id;
          return (
            <input
              type="radio"
              name={`start_${crew.id}`}
              checked={isSelected}
              onChange={() => handleOverrideChange(crew.id, 'start', race.id)}
            />
          );
        },
        enableSorting: false,
        enableGlobalFilter: false,
      }));

      // Finish time column
      raceColumns.push(columnHelper.accessor(
        (row) => {
          const time = row.times.find(
            (time) => time.tap === 'Finish' && time.race?.race_id === race.race_id
          );
          return time?.time_tap || null;
        },
        {
          id: `race_${race.race_id}_finish`,
          header: "Finish",
          cell: (info) => formatTimes(info.getValue()),
          enableSorting: true,
          sortingFn: timeSortingFn,
          filterFn: timeFilterFn,
        }
      ));

      // Finish use radio button column
      raceColumns.push(columnHelper.display({
        id: `race_${race.race_id}_finish_use`,
        header: "Use",
        cell: (info) => {
          const crew = info.row.original;
          const isSelected = getCurrentOverride(crew, 'finish') === race.id;
          return (
            <input
              type="radio"
              name={`finish_${crew.id}`}
              checked={isSelected}
              onChange={() => handleOverrideChange(crew.id, 'finish', race.id)}
            />
          );
        },
        enableSorting: false,
        enableGlobalFilter: false,
      }));

      // Calculated time column
      raceColumns.push(columnHelper.accessor(
        (row) => calculateRawTime(row, race),
        {
          id: `race_${race.race_id}_time`,
          header: `Raw time ${race.name}`,
          cell: (info) => formatTimes(info.getValue()),
          enableSorting: true,
          sortingFn: timeSortingFn,
          filterFn: timeFilterFn,
        }
      ));

      // Variance column - only add for races after the first one
      if (idx > 0) {
        raceColumns.push(columnHelper.accessor(
          (row) => {
            // Get the first race (baseline)
            const firstRace = races[0];
            const currentRace = race;
            
            // Calculate raw times for both races
            const firstRaceTime = calculateRawTime(row, firstRace);
            const currentRaceTime = calculateRawTime(row, currentRace);
            
            // Return the raw variance in milliseconds for sorting
            if (firstRaceTime === null || currentRaceTime === null) {
              return null;
            }
            
            return currentRaceTime - firstRaceTime;
          },
          {
            id: `race_${race.race_id}_variance`,
            header: `Variance to ${races[0]?.name || 'Race 1'}`,
            enableSorting: true,
            sortingFn: timeSortingFn,
            cell: (info) => {
              const variance = info.getValue() as number | null;
              const { display, colorClass } = formatVariance(variance);
              
              return (
                <span className={`crew-time-compare__tag crew-time-compare__tag--${colorClass}`}>
                  {display}
                </span>
              );
            },
            filterFn: (row, columnId, filterValue) => {
              const variance = row.getValue(columnId) as number | null;
              if (variance === null) return false;
              const { display } = formatVariance(variance);
              return display.toLowerCase().includes(filterValue.toLowerCase());
            },
          }
        ));
      }
    });

    const finalColumns = [
      columnHelper.accessor("raw_time", {
        id: "final_raw_time",
        header: "Raw Time (based on use)",
        cell: (info) => formatTimes(info.getValue()),
        enableSorting: true,
        sortingFn: timeSortingFn,
        filterFn: timeFilterFn,
      }),
    ];

    return [...baseColumns, ...raceColumns, ...finalColumns];
  }, [races, pendingOverrides, defaultStartRace, defaultFinishRace]);

  // Create column groups for headers
  const columnGroups = useMemo(() => {
    const groups: any[] = [];
    
    // Base columns (no grouping)
    groups.push(
      { header: "Id", columns: ["id"] },
      { header: "Crew", columns: ["competitor_names"] },
      { header: "Bib", columns: ["bib_number"] },
      { header: "Club", columns: ["club"] },
      { header: "Category", columns: ["event_band"] }
    );

    // Race groups
    races.forEach((race, idx) => {
      const raceColumns = [
        `race_${race.race_id}_start`,
        `race_${race.race_id}_start_use`,
        `race_${race.race_id}_finish`,
        `race_${race.race_id}_finish_use`,
        `race_${race.race_id}_time`,
      ];
      
      // Add variance column for races after the first
      if (idx > 0) {
        raceColumns.push(`race_${race.race_id}_variance`);
      }

      groups.push({
        header: `Race - ${race.name} (${race.race_id})`,
        columns: raceColumns,
      });
    });

    // Final column
    groups.push({ header: "Final", columns: ["final_raw_time"] });

    return groups;
  }, [races]);

  // Table instance
  const table = useReactTable({
    data: crews,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn,
    manualPagination: false,
    manualSorting: false,
    state: {
      pagination,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="has-text-centered" style={{ padding: '2rem' }}>
        <div className="loader is-loading" style={{ width: '3rem', height: '3rem' }}></div>
        <p>Loading crew data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification is-danger">
        <p>Error loading data. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <>
      {/* Search and Save Controls */}
      <div className="crew-time-compare__control-wrapper">
        <div className="">
          <div className="">
            <SearchInput
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Search all columns..."
            />
          </div>
        </div>
        <div className="">
          <div className="">
            <TextButton
              onClick={handleSaveChanges}
              disabled={updateOverridesMutation.isPending}
              label=              {updateOverridesMutation.isPending 
                ? 'Saving...' 
                : `Save changes (${pendingOverrides.size} crews)`
              }
            />
          </div>
        </div>
      </div>

      <div className="crew-time-compare__table-container">
        <table className="crew-time-compare__table">
            <TableHeader 
              headerGroups={table.getHeaderGroups()}
              columnGroups={columnGroups}
            />
            <TableBody 
              rows={table.getRowModel().rows}
            />
          </table>
      </div>

      {/* Results Info and Pagination */}
      <div className="level mt-4">
        <div className="level-left">
          <div className="level-item">
            <p className="has-text-grey">
              Showing {table.getRowModel().rows.length} of {crews.length} crews
              {globalFilter && (
                <span> (filtered from {crews.length} total)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <TablePagination 
        table={table}
        className="mt-4"
        showRowInfo={true}
        showPageSizeSelector={true}
      />
    </>
  );
}