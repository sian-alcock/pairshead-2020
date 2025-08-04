import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import axios from "axios";
import Hero from "../../organisms/Hero/Hero";
import Header from "../../organisms/Header/Header";
import { Link } from "react-router-dom";
import { formatTimes } from "../../../lib/helpers";
import BladeImage from "../../atoms/BladeImage/BladeImage";
import TextButton from "../../atoms/TextButton/TextButton";
import CrewTimeCalculatedFieldsUpdate from "../../molecules/UpdateCrews/UpdateCrewTimeCalculatedFields";
import { CrewProps } from "../../components.types";
import "./crewIndex.scss";

interface CrewQueryParams {
  page_size: string;
  page: number;
  order: string;
  status: string | string[];
  masters?: boolean;
  search?: string;
  start_time?: string;
  finish_time?: string;
}

const columnHelper = createColumnHelper<CrewProps>();

export default function CrewIndex() {
  // State for filters and pagination
  const [pageSize, setPageSize] = useState(20);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchTerm, setSearchTerm] = useState(
    sessionStorage.getItem("crewIndexSearch") || ""
  );
  const [scratchedCrewsBoolean, setScratchedCrewsBoolean] = useState(
    sessionStorage.getItem("showScratchedCrews") === "true" || false
  );
  const [crewsWithoutStartTimeBoolean, setCrewsWithoutStartTimeBoolean] = useState(false);
  const [crewsWithoutFinishTimeBoolean, setCrewsWithoutFinishTimeBoolean] = useState(false);
  const [mastersAdjustmentsBoolean, setMastersAdjustmentsBoolean] = useState(false);
  
  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: "bib_number", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Build query parameters
  const queryParams: CrewQueryParams = useMemo(() => {
    let params: CrewQueryParams = {
      page_size: pageSize.toString(),
      page: pageNumber,
      order: sorting[0]?.id || "bib_number",
      status: scratchedCrewsBoolean ? "Accepted" : ["Accepted", "Scratched"],
    };

    if (mastersAdjustmentsBoolean) params.masters = true;
    if (searchTerm) params.search = searchTerm;
    if (crewsWithoutStartTimeBoolean) params.start_time = "0";
    if (crewsWithoutFinishTimeBoolean) params.finish_time = "0";

    return params;
  }, [
    pageSize,
    pageNumber,
    sorting,
    scratchedCrewsBoolean,
    mastersAdjustmentsBoolean,
    searchTerm,
    crewsWithoutStartTimeBoolean,
    crewsWithoutFinishTimeBoolean,
  ]);

  // TanStack Query
  const {
    data: crews = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["crews", queryParams],
    queryFn: async () => {
      const response = await axios.get("/api/crews", { params: queryParams });
      return response.data as CrewProps[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Define columns
  const columns = useMemo<ColumnDef<CrewProps>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: "ID",
        cell: (info) => (
          <Link to={`/generate-results/crews/${info.getValue()}/edit`}>
            {info.getValue() as string}
          </Link>
        ),
        size: 80,
      },
      {
        id: "competitor_names",
        accessorKey: "competitor_names",
        header: "Name",
        cell: (info) => {
          const crew = info.row.original;
          const name = info.getValue() as string || crew.name;
          const hasMultipleTimes = crew.times?.length > 2;
          return hasMultipleTimes ? `${name}❗️` : name;
        },
        size: 200,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        size: 100,
      },
      {
        id: "blade",
        header: "Blade",
        cell: (info) => <BladeImage crew={info.row.original} />,
        size: 60,
        enableSorting: false,
      },
      {
        id: "bib_number",
        accessorKey: "bib_number",
        header: "Bib",
        cell: (info) => info.getValue() as string || "",
        size: 80,
      },
      {
        id: "club_index_code",
        accessorFn: (row) => row.club?.index_code,
        header: "Club",
        size: 100,
      },
      {
        id: "event_band",
        accessorKey: "event_band",
        header: "Event Band",
        size: 120,
      },
      {
        id: "start_sequence",
        accessorKey: "start_sequence",
        header: "Start Seq",
        cell: (info) => info.getValue() as string || "⚠️",
        size: 100,
      },
      {
        id: "finish_sequence",
        accessorKey: "finish_sequence",
        header: "Finish Seq",
        cell: (info) => info.getValue() as string || "⚠️",
        size: 100,
      },
      {
        id: "penalty",
        accessorKey: "penalty",
        header: "Penalty",
        size: 80,
      },
      {
        id: "start_time",
        accessorKey: "start_time",
        header: "Start Time",
        cell: (info) => {
          const value = info.getValue() as number;
          return value ? formatTimes(value) : "⚠️";
        },
        size: 120,
      },
      {
        id: "finish_time",
        accessorKey: "finish_time",
        header: "Finish Time",
        cell: (info) => {
          const value = info.getValue() as number;
          return value ? formatTimes(value) : "⚠️";
        },
        size: 120,
      },
      {
        id: "raw_time",
        accessorKey: "raw_time",
        header: "Raw Time",
        cell: (info) => {
          const crew = info.row.original;
          if (crew.disqualified || crew.did_not_start || crew.did_not_finish) {
            return "❌";
          }
          const value = info.getValue() as number;
          return value ? formatTimes(value) : "⚠️";
        },
        size: 120,
      },
      {
        id: "race_time",
        accessorKey: "race_time",
        header: "Race Time",
        cell: (info) => {
          const crew = info.row.original;
          if (crew.disqualified) return "Disqualified";
          if (crew.did_not_start) return "Did not start";
          if (crew.did_not_finish) return "Did not finish";
          
          const value = info.getValue() as number;
          return value ? formatTimes(value) : "⚠️";
        },
        size: 120,
      },
      {
        id: "event_original",
        header: "Event Original",
        cell: (info) => {
          const crew = info.row.original;
          return crew.event.type === "Master" && crew.event_original?.[0]
            ? crew.event_original[0].event_original
            : "";
        },
        size: 120,
        enableSorting: false,
      },
      {
        id: "masters_adjustment",
        accessorKey: "masters_adjustment",
        header: "Masters Adj",
        cell: (info) => {
          const crew = info.row.original;
          const value = info.getValue() as number;
          return crew.event.type === "Master" && value ? formatTimes(value) : "";
        },
        size: 120,
      },
      {
        id: "masters_adjusted_time",
        accessorKey: "masters_adjusted_time",
        header: "Masters Adj Time",
        cell: (info) => {
          const crew = info.row.original;
          const value = info.getValue() as number;
          return crew.event.type === "Master" && value ? formatTimes(value) : "";
        },
        size: 140,
      },
      {
        id: "manual_override_time",
        accessorKey: "manual_override_time",
        header: "Manual Override",
        cell: (info) => {
          const value = info.getValue() as number;
          return value ? formatTimes(value) : "";
        },
        size: 140,
      },
      {
        id: "time_only",
        accessorKey: "time_only",
        header: "Time Only",
        cell: (info) => (info.getValue() as boolean ? "TO" : ""),
        size: 100,
      },
      {
        id: "overall_rank",
        accessorKey: "overall_rank",
        header: "Overall Rank",
        cell: (info) => info.getValue() as string || "",
        size: 120,
      },
      {
        id: "category_rank",
        accessorKey: "category_rank",
        header: "Category Rank",
        cell: (info) => info.getValue() as string || "",
        size: 120,
      },
    ],
    []
  );

  // Initialize table
  const table = useReactTable({
    data: crews,
    columns,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(crews.length / pageSize),
  });

  // Event handlers
  const handleSearchKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const term = (e.target as HTMLInputElement).value;
    sessionStorage.setItem("crewIndexSearch", term);
    setSearchTerm(term);
    setPageNumber(1);
  };

  const handleCrewsWithoutStartTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCrewsWithoutStartTimeBoolean(e.target.checked);
    setCrewsWithoutFinishTimeBoolean(false);
    setSearchTerm("");
    setPageNumber(1);
  };

  const handleCrewsWithoutFinishTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCrewsWithoutFinishTimeBoolean(e.target.checked);
    setCrewsWithoutStartTimeBoolean(false);
    setSearchTerm("");
    setPageNumber(1);
  };

  const handleScratchedCrews = (e: React.ChangeEvent<HTMLInputElement>) => {
    sessionStorage.setItem("showScratchedCrews", e.target.checked ? "true" : "false");
    setScratchedCrewsBoolean(e.target.checked);
  };

  const refreshData = () => {
    refetch();
  };

  if (error) {
    return <div>Error loading crews: {(error as Error).message}</div>;
  }

  return (
    <>
      <Header />
      <Hero title="All crews" />
      
      {/* Update component placeholder */}
      <div className="box">
        <CrewTimeCalculatedFieldsUpdate 
          refreshData={refreshData} 
          updateRequired={0} 
        />
      </div>

      <section className="crew-index__section">
        <div className="crew-index__container">
          {/* Filters Row */}
          <div className="columns is-vtop">
            <div className="column">
              <div className="field">
                <label className="label has-text-left">Search</label>
                <div className="control has-icons-left">
                  <span className="icon is-left">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    className="input"
                    placeholder="search"
                    defaultValue={searchTerm}
                    onKeyUp={handleSearchKeyUp}
                  />
                </div>
              </div>
            </div>

            <div className="column">
              <div className="field">
                <label className="label has-text-left">Page Size</label>
                <div className="select control-full-width">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPageNumber(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="column has-text-left">
              <div className="field">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    className="checkbox"
                    onChange={handleCrewsWithoutStartTime}
                    checked={crewsWithoutStartTimeBoolean}
                  />
                  <small>⚠️ Crews without start time</small>
                </label>
              </div>
              <div className="field">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    className="checkbox"
                    onChange={handleCrewsWithoutFinishTime}
                    checked={crewsWithoutFinishTimeBoolean}
                  />
                  <small>⚠️ Crews without finish time</small>
                </label>
              </div>
            </div>

            <div className="column">
              <div className="field">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={scratchedCrewsBoolean}
                    onChange={handleScratchedCrews}
                  />
                  <small>Hide scratched crews</small>
                </label>
              </div>
            </div>

            <div className="crew-index__buttons column">
              <TextButton label="Race times" pathName="/generate-results/race-times" />
              <TextButton label="Add race offset" pathName="/settings/race-info" />
            </div>
          </div>

          {/* Column Visibility Controls */}
          <div className="crew-index__box">
            <h4 className="crew-index__box-title">Show/Hide Columns</h4>
            <div className="crew-index__column-options">
              {table.getAllLeafColumns().map((column) => (
                <div key={column.id} className="column is-narrow">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                    />
                    <small>{column.columnDef.header as string}</small>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="has-text-centered">
              <div className="loader">Loading...</div>
            </div>
          )}

          {/* Table */}
          <div className="crew-index__table-container">
            <table className="crew-index__table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={header.column.getCanSort() ? "is-clickable" : ""}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="is-flex is-align-items-center">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <span className="ml-1">
                                {{
                                  asc: " 🔼",
                                  desc: " 🔽",
                                }[header.column.getIsSorted() as string] ?? " ↕️"}
                              </span>
                            )}
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
                      <td key={cell.id} style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          <div className="level">
            <div className="level-left">
              <div className="level-item">
                <span className="is-size-7">
                  Showing {table.getRowModel().rows.length} of {crews.length} crews
                </span>
              </div>
            </div>
            <div className="level-right">
              <div className="level-item">
                <div className="buttons">
                  <button
                    className="button is-small"
                    onClick={() => setPageNumber(1)}
                    disabled={pageNumber === 1}
                  >
                    First
                  </button>
                  <button
                    className="button is-small"
                    onClick={() => setPageNumber(pageNumber - 1)}
                    disabled={pageNumber === 1}
                  >
                    Previous
                  </button>
                  <span className="button is-small is-static">
                    Page {pageNumber}
                  </span>
                  <button
                    className="button is-small"
                    onClick={() => setPageNumber(pageNumber + 1)}
                    disabled={pageNumber * pageSize >= crews.length}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}