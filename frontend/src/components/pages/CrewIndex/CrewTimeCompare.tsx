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
} from "@tanstack/react-table";
import axios, { AxiosResponse } from "axios";
import Hero from "../../organisms/Hero/Hero";
import { Link } from "react-router-dom";
import { formatTimes } from "../../../lib/helpers";
import { pagingOptions, sortingOptions } from "./defaultProps";
import { CrewProps, RaceProps } from "../../components.types";
import CrewTimeCalculatedFieldsUpdate from "../../molecules/UpdateCrews/UpdateCrewTimeCalculatedFields";
import "./crewIndex.scss";
import Header from "../../organisms/Header/Header";
import TextButton from "../../atoms/TextButton/TextButton";

interface ResponseParamsProps {
  page_size?: string;
  page?: number;
  order?: string;
  status?: string | string[];
  masters?: boolean;
  search?: string;
  start_time?: number;
  finish_time?: number;
}

interface ResponseDataProps {
  count: number;
  requires_ranking_update: number;
  next: number | null;
  previous: number | null;
  results: CrewProps[];
  num_scratched_crews: number;
  num_accepted_crews: number;
  num_accepted_crews_no_start_time: number;
  num_accepted_crews_no_finish_time: number;
  fastest_open_2x_time: { raw_time__min: number };
  fastest_female_2x_time: { raw_time__min: number };
  fastest_open_sweep_time: { raw_time__min: number };
  fastest_female_sweep_time: { raw_time__min: number };
  fastest_mixed_2x_time: { raw_time__min: number };
  num_crews_masters_adjusted: boolean;
  num_crews_require_masters_adjusted: boolean;
}

interface RaceResponseDataProps {
  results: RaceProps[];
}

// API functions
const fetchCrews = async (params: ResponseParamsProps): Promise<ResponseDataProps> => {
  const response: AxiosResponse = await axios.get("/api/crews", { params });
  return response.data;
};

const fetchRaces = async (): Promise<RaceResponseDataProps> => {
  const response: AxiosResponse = await axios.get("/api/race-list");
  return response.data;
};

export default function CrewTimeCompare() {
  const queryClient = useQueryClient();

  // State for filters and pagination
  const [globalFilter, setGlobalFilter] = useState(
    sessionStorage.getItem("crewIndexSearch") || ""
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: "bib_number", desc: false },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 500,
  });

  // Filter states
  const [scratchedCrewsBoolean, setScratchedCrewsBoolean] = useState(
    sessionStorage.getItem("showScratchedCrews") === "true" || false
  );
  const [crewsWithoutStartTimeBoolean, setCrewsWithoutStartTimeBoolean] = useState(false);
  const [crewsWithoutFinishTimeBoolean, setCrewsWithoutFinishTimeBoolean] = useState(false);
  const [mastersAdjustmentsBoolean, setMastersAdjustmentsBoolean] = useState(false);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: ResponseParamsProps = {
      page_size: pagination.pageSize.toString(),
      page: pagination.pageIndex + 1,
      order: sorting.length > 0 ? sorting[0].id : "bib_number",
      status: scratchedCrewsBoolean ? "Accepted" : ["Accepted", "Scratched"],
      masters: mastersAdjustmentsBoolean,
    };

    if (globalFilter) {
      params.search = globalFilter;
    }

    if (crewsWithoutStartTimeBoolean) {
      params.start_time = 0;
    }

    if (crewsWithoutFinishTimeBoolean) {
      params.finish_time = 0;
    }

    return params;
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    scratchedCrewsBoolean,
    crewsWithoutStartTimeBoolean,
    crewsWithoutFinishTimeBoolean,
    mastersAdjustmentsBoolean,
    globalFilter,
  ]);

  // Queries
  const {
    data: crewsData,
    isLoading: crewsLoading,
    error: crewsError,
  } = useQuery({
    queryKey: ["crews", queryParams],
    queryFn: () => fetchCrews(queryParams),
    // keepPreviousData: true,
  });

  const {
    data: racesData,
    isLoading: racesLoading,
    error: racesError,
  } = useQuery({
    queryKey: ["races"],
    queryFn: fetchRaces,
  });

  // Mutation for refreshing data
  const refreshDataMutation = useMutation({
    mutationFn: fetchCrews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
    },
  });

  const refreshData = (customParams?: ResponseParamsProps) => {
    const params = customParams || queryParams;
    refreshDataMutation.mutate(params);
  };

  // Get race data
  const races = racesData?.results || [];
  const defaultStart = races.find((race) => race.default_start)?.race_id;
  const defaultFinish = races.find((race) => race.default_finish)?.race_id;
  const otherStart = races.find((race) => !race.default_start)?.race_id;
  const otherFinish = races.find((race) => !race.default_finish)?.race_id;

  // Table columns
  const columns = useMemo<ColumnDef<CrewProps, any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Id",
        cell: (info) => (
          <Link to={`/generate-results/crews/${info.getValue()}/edit`}>
            {info.getValue()}
          </Link>
        ),
      },
      {
        accessorKey: "competitor_names",
        header: "Crew",
        cell: (info) => {
          const crew = info.row.original;
          if (!crew.competitor_names) return crew.name;
          return crew.times.length && crew.times.length > 2
            ? crew.competitor_names + "❗️"
            : crew.competitor_names;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        accessorKey: "bib_number",
        header: "Bib",
        cell: (info) => info.getValue() || "",
      },
      {
        accessorFn: (row) => row.club.index_code,
        id: "club",
        header: "Club",
      },
      {
        accessorKey: "event_band",
        header: "Category",
      },
      {
        id: "start_default",
        header: `Start (default race) - ${defaultStart}`,
        cell: (info) => {
          const crew = info.row.original;
          const time = crew.times.find((time) => time.race.race_id === defaultStart);
          return formatTimes(time?.time_tap);
        },
      },
      {
        id: "finish_default",
        header: `Finish (default race) - ${defaultFinish}`,
        cell: (info) => {
          const crew = info.row.original;
          const time = crew.times.find((time) => time.race.race_id === defaultFinish);
          return formatTimes(time?.time_tap);
        },
      },
      {
        id: "start_other",
        header: `Start (other) - ${otherStart}`,
        cell: (info) => {
          const crew = info.row.original;
          const time = crew.times.find((time) => time.race.race_id !== defaultStart);
          return formatTimes(time?.time_tap);
        },
      },
      {
        id: "finish_other",
        header: `Finish (other) - ${otherFinish}`,
        cell: (info) => {
          const crew = info.row.original;
          const time = crew.times.find((time) => time.race.race_id !== defaultFinish);
          return formatTimes(time?.time_tap);
        },
      },
    ],
    [defaultStart, defaultFinish, otherStart, otherFinish]
  );

  // Table instance
  const table = useReactTable({
    data: crewsData?.results || [],
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil((crewsData?.count || 0) / pagination.pageSize),
  });

  // Event handlers
  const handleSearchKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    sessionStorage.setItem("crewIndexSearch", value);
    setGlobalFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSorting([{ id: e.target.value, desc: false }]);
  };

  const handlePagingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPagination({
      pageIndex: 0,
      pageSize: Number(e.target.value),
    });
  };

  const handleCrewsWithoutStartTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCrewsWithoutStartTimeBoolean(e.target.checked);
    setCrewsWithoutFinishTimeBoolean(false);
    setGlobalFilter("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleCrewsWithoutFinishTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCrewsWithoutFinishTimeBoolean(e.target.checked);
    setCrewsWithoutStartTimeBoolean(false);
    setGlobalFilter("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleScratchedCrews = (e: React.ChangeEvent<HTMLInputElement>) => {
    sessionStorage.setItem("showScratchedCrews", e.target.checked ? "true" : "false");
    setScratchedCrewsBoolean(e.target.checked);
  };

  if (crewsLoading || racesLoading) return <div>Loading...</div>;
  if (crewsError || racesError) return <div>Error loading data</div>;

  return (
    <>
      <Header />
      <Hero title={"All crews"} />
      <section className="section">
        <div className="container">
          <div className="columns is-vtop">
            <div className="column">
              <div className="field">
                <label className="label has-text-left" htmlFor="searchControl">
                  Search
                </label>
                <div className="control has-icons-left" id="searchControl">
                  <span className="icon is-left">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    className="input"
                    placeholder="search"
                    defaultValue={globalFilter}
                    onKeyUp={handleSearchKeyUp}
                  />
                </div>
              </div>
            </div>

            <div className="column">
              <div className="field">
                <label className="label has-text-left" htmlFor="paging">
                  Select page size
                </label>
                <div className="select control-full-width">
                  <select
                    className="control-full-width"
                    value={pagination.pageSize}
                    onChange={handlePagingChange}
                  >
                    <option value=""></option>
                    {pagingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="column">
              <div className="field">
                <label className="label has-text-left" htmlFor="selectSort">
                  Sort by
                </label>
                <div className="select control-full-width" id="selectSort">
                  <select
                    className="control-full-width"
                    value={sorting[0]?.id || ""}
                    onChange={handleSortChange}
                  >
                    <option value=""></option>
                    {sortingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="crew-index__buttons column">
              <TextButton label={"Race times"} pathName="/generate-results/race-times" />
              <TextButton label={"Add race offset"} pathName="/settings/race-info" />
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {"<<"}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"<"}
            </button>
            <span>
              Page{" "}
              <strong>
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </strong>
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {">>"}
            </button>
          </div>

          {/* Page Totals */}
          <div className="page-totals">
            <p>
              Showing {table.getState().pagination.pageIndex * pagination.pageSize + 1} to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * pagination.pageSize,
                crewsData?.count || 0
              )}{" "}
              of {crewsData?.count || 0} crews
            </p>
          </div>

          {/* Table */}
          <div className="crew-index__table-container">
            <table className="crew-index__table table">
              <thead>
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
              <tfoot>
                {table.getFooterGroups().map((footerGroup) => (
                  <tr key={footerGroup.id}>
                    {footerGroup.headers.map((header) => (
                      <th key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.footer,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </tfoot>
            </table>
          </div>

          {/* Bottom Pagination */}
          <div className="pagination-controls">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {"<<"}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"<"}
            </button>
            <span>
              Page{" "}
              <strong>
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </strong>
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {">>"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}