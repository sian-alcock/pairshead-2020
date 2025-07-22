import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  PaginationState,
  createColumnHelper,
} from "@tanstack/react-table";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import { Link } from "react-router-dom";
import { formatTimes } from "../../../lib/helpers";
import { CrewProps, RaceProps } from "../../components.types";
import "././crewTimeCompare.scss";
import Header from "../../organisms/Header/Header";
import TablePagination from "../../molecules/TablePagination/TablePagination"; // Import the new component

interface CrewOverrideUpdate {
  crew_id: string;
  race_id_start_override?: string;
  race_id_finish_override?: string;
}

// API functions
const fetchCrews = async (): Promise<CrewProps[]> => {
  const response: AxiosResponse = await axios.get("/api/crews/");
  return response.data;
};

const fetchRaces = async (): Promise<RaceProps[]> => {
  const response: AxiosResponse = await axios.get("/api/races/");
  return response.data;
};

const updateCrewOverrides = async (updates: CrewOverrideUpdate[]): Promise<any> => {
  const response: AxiosResponse = await axios.patch("/api/crews/bulk-update-overrides/", {
    updates
  });
  return response.data;
};

export default function CrewTimeCompare() {
  const queryClient = useQueryClient();
  const columnHelper = createColumnHelper<CrewProps>();

  // State for tracking override changes
  const [pendingOverrides, setPendingOverrides] = useState<Map<string, CrewOverrideUpdate>>(new Map());
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  // Queries
  const {
    data: crewsData,
    isLoading: crewsLoading,
    error: crewsError,
  } = useQuery({
    queryKey: ["crews"],
    queryFn: () => {
      console.log("Fetching crews with params:");
      const startTime = Date.now();
      return fetchCrews().then(result => {
        console.log(`Crews fetch took ${Date.now() - startTime}ms`);
        return result;
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: racesData,
    isLoading: racesLoading,
    error: racesError,
  } = useQuery({
    queryKey: ["races"],
    queryFn: () => {
      console.log("Fetching races...");
      const startTime = Date.now();
      return fetchRaces().then(result => {
        console.log(`Races fetch took ${Date.now() - startTime}ms`);
        return result;
      });
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - races change less frequently
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation for updating overrides
  const updateOverridesMutation = useMutation({
    mutationFn: updateCrewOverrides,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      setPendingOverrides(new Map());
    },
    onError: (error) => {
      console.error("Failed to update overrides:", error);
    },
  });

  // Get race data
  const races = racesData || [];
  const defaultStartRace = races.find((race) => race.default_start);
  const defaultFinishRace = races.find((race) => race.default_finish);

  // Handle radio button changes
  const handleOverrideChange = (crewId: string, type: 'start' | 'finish', raceId: string) => {
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
  const getCurrentOverride = (crew: CrewProps, type: 'start' | 'finish'): string => {
    const pending = pendingOverrides.get(crew.id);
    if (pending) {
      if (type === 'start' && pending.race_id_start_override) {
        return pending.race_id_start_override.toString();
      }
      if (type === 'finish' && pending.race_id_finish_override) {
        return pending.race_id_finish_override.toString();
      }
    }

    // Return existing override or default
    if (type === 'start') {
      // Use the Django PK id, not race_id
      return crew.race_id_start_override?.toString() || defaultStartRace?.id?.toString() || '';
    } else {
      return crew.race_id_finish_override?.toString() || defaultFinishRace?.id?.toString() || '';
    }
  };

  // Calculate raw time based on selected races
  const calculateRawTime = (crew: CrewProps, race: RaceProps): number | null => {
    const startTime = crew.times.find(
      time => time.tap === 'Start' && time.race.id === race.id
    );
    const finishTime = crew.times.find(
      time => time.tap === 'Finish' && time.race.id === race.id
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
  const formatVariance = (variance: number | null): { display: string; isHighVariance: boolean } => {
    if (variance === null) {
      return { display: '--', isHighVariance: false };
    }

    const isHighVariance = Math.abs(variance) > 5000; // 5 seconds
    const formattedTime = formatTimes(Math.abs(variance));
    const sign = variance >= 0 ? '+' : '-';
    const display = `${sign}${formattedTime}`;

    return { display, isHighVariance };
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
      }),
      columnHelper.accessor("competitor_names", {
        header: "Crew",
        cell: (info) => {
          const crew = info.row.original;
          if (!crew.competitor_names) return crew.name;
          return crew.competitor_names;
        },
      }),
      columnHelper.accessor("bib_number", {
        header: "Bib",
        cell: (info) => info.getValue() || "",
      }),
      columnHelper.accessor((row) => row.club.index_code, {
        id: "club",
        header: "Club",
      }),
      columnHelper.accessor("event_band", {
        header: "Category",
      }),
    ];

    // Generate race columns
    const raceColumns: ColumnDef<CrewProps, any>[] = [];
    
    races.forEach((race, idx) => {
      // Start time column
      raceColumns.push(columnHelper.display({
        id: `race_${race.race_id}_start`,
        header: "Start",
        cell: (info) => {
          const crew = info.row.original;
          const time = crew.times.find(
            (time) => time.tap === 'Start' && time.race.race_id === race.race_id
          );
          return formatTimes(time?.time_tap);
        },
      }));

      // Start use radio button column
      raceColumns.push(columnHelper.display({
        id: `race_${race.race_id}_start_use`,
        header: "Use",
        cell: (info) => {
          const crew = info.row.original;
          const isSelected = getCurrentOverride(crew, 'start') === race.id.toString();
          return (
            <input
              type="radio"
              name={`start_${crew.id}`}
              checked={isSelected}
              onChange={() => handleOverrideChange(crew.id, 'start', race.id.toString())}
            />
          );
        },
      }));

      // Finish time column
      raceColumns.push(columnHelper.display({
        id: `race_${race.race_id}_finish`,
        header: "Finish",
        cell: (info) => {
          const crew = info.row.original;
          const time = crew.times.find(
            (time) => time.tap === 'Finish' && time.race.race_id === race.race_id
          );
          return formatTimes(time?.time_tap);
        },
      }));

      // Finish use radio button column
      raceColumns.push(columnHelper.display({
        id: `race_${race.race_id}_finish_use`,
        header: "Use",
        cell: (info) => {
          const crew = info.row.original;
          const isSelected = getCurrentOverride(crew, 'finish') === race.id.toString();
          return (
            <input
              type="radio"
              name={`finish_${crew.id}`}
              checked={isSelected}
              onChange={() => handleOverrideChange(crew.id, 'finish', race.id.toString())}
            />
          );
        },
      }));

      // Calculated time column
      raceColumns.push(columnHelper.display({
        id: `race_${race.race_id}_time`,
        header: `Raw time ${race.name}`,
        cell: (info) => {
          const crew = info.row.original;
          return formatTimes(calculateRawTime(crew, race));
        },
      }));

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
            cell: (info) => {
              const variance = info.getValue() as number | null;
              const { display, isHighVariance } = formatVariance(variance);
              
              if (isHighVariance) {
                return (
                  <span 
                    style={{
                      color: '#e74c3c',
                      fontWeight: 'bold',
                      backgroundColor: '#fdf2f2',
                      padding: '2px 4px',
                      borderRadius: '3px'
                    }}
                  >
                    {display}
                  </span>
                );
              }
              
              return <span>{display}</span>;
            },
            sortingFn: (rowA, rowB, columnId) => {
              const a = rowA.getValue(columnId) as number | null;
              const b = rowB.getValue(columnId) as number | null;
              
              // Handle null values - put them at the end
              if (a === null && b === null) return 0;
              if (a === null) return 1;
              if (b === null) return -1;
              
              // Sort by actual variance value (not absolute)
              // This will sort from most negative to most positive
              return a - b;
            }
          }
        ));
      }
    });

    const finalColumns = [
      columnHelper.display({
        id: "final_raw_time",
        header: "Raw Time (based on use)",
        cell: (info) => {
          const crew = info.row.original;
          return formatTimes(crew.raw_time);
        },
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
    data: crewsData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: false,
    manualSorting: false,
    state: {
      pagination,
    },
  });
  
  console.log(crewsData)
  
  if (crewsLoading || racesLoading) return <div>Loading...</div>;
  if (crewsError || racesError) return <div>Error loading data</div>;

  return (
    <>
      <Header />
      <Hero title={"All crews"} />
      <section className="section">
        <div className="container">
          {/* Save Changes Button */}
          {
            <div className="save-controls" style={{ marginBottom: '20px' }}>
              <button
                className="button is-primary"
                onClick={handleSaveChanges}
                disabled={updateOverridesMutation.isPending}
              >
                {updateOverridesMutation.isPending ? 'Saving...' : `Save Changes (${pendingOverrides.size} crews)`}
              </button>
            </div>
          }

          <div className="crew-index__table-container">
            <table className="crew-index__table">
              <thead>
                {/* Grouped Headers */}
                <tr>
                  {columnGroups.map((group, index) => (
                    <th key={index} colSpan={group.columns.length} className="grouped-header">
                      {group.columns.length > 1 ? group.header : ''}
                    </th>
                  ))}
                </tr>
                {/* Regular Headers */}
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : ""
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: " 🔼",
                              desc: " 🔽",
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Component - Much cleaner! */}
          <TablePagination 
            table={table}
            className="mt-4"
            showRowInfo={true}
            showPageSizeSelector={true}
          />
        </div>
      </section>
    </>
  );
}