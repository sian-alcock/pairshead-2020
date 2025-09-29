import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  PaginationState
} from "@tanstack/react-table";
import axios from "axios";
import Hero from "../../organisms/Hero/Hero";
import { formatTimes } from "../../../lib/helpers";
import { CrewProps } from "../../../types/components.types";
import BladeImage from "../../atoms/BladeImage/BladeImage";
import { genderOptions } from "./defaultProps";
import TrophyImage from "../../atoms/Trophy/Trophy";
import PennantImage from "../../atoms/Pennant/Pennant";
import Header from "../../organisms/Header/Header";

import "./resultIndex.scss";
import SearchInput from "../../molecules/SearchInput/SearchInput";
import { FormSelect } from "../../atoms/FormSelect/FormSelect";
import Checkbox from "../../atoms/Checkbox/Checkbox";
import { TableHeader } from "../../molecules/TableHeader/TableHeader";
import { TableBody } from "../../molecules/TableBody/TableBody";
import TablePagination from "../../molecules/TablePagination/TablePagination";
import { TableFooter } from "../../molecules/TableFooter/TableFooter";
import TextButton from "../../atoms/TextButton/TextButton";

interface CategoryResponseDataProps {
  override_name: string;
}

interface CrewsApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CrewProps[];
  // Aggregates from your custom pagination
  fastest_open_2x_time?: number;
  fastest_female_2x_time?: number;
  fastest_open_sweep_time?: number;
  fastest_female_sweep_time?: number;
  fastest_mixed_2x_time?: number;
  num_accepted_crews?: number;
  num_scratched_crews?: number;
  requires_ranking_update?: number;
  aggregates_skipped?: boolean;
}

type SelectOption = {
  label: string | undefined;
  value: string | undefined;
};

const columnHelper = createColumnHelper<CrewProps>();

// Custom hook for server-side crews data
const useServerCrews = ({
  page,
  pageSize,
  sorting,
  globalFilter,
  selectedCategory,
  gender
}: {
  page: number;
  pageSize: number;
  sorting: SortingState;
  globalFilter: string;
  selectedCategory: string;
  gender: string;
}) => {
  return useQuery({
    queryKey: ["crews", page, pageSize, sorting, globalFilter, selectedCategory, gender],
    queryFn: async (): Promise<CrewsApiResponse> => {
      const params = new URLSearchParams();

      params.append("status", "Accepted");

      // Pagination
      params.append("page", (page + 1).toString()); // TanStack uses 0-based, DRF uses 1-based
      params.append("page_size", pageSize.toString());

      // Sorting
      if (sorting.length > 0) {
        const sort = sorting[0];
        let orderField = sort.id;

        // Map frontend sort IDs to backend field names
        switch (sort.id) {
          case "rank":
            orderField = gender === "all" ? "overall_rank" : "gender_rank";
            break;
          case "club":
            orderField = "club__name";
            break;
          case "crew_name":
            orderField = "competitor_names";
            break;
          default:
            // Handle other mappings as needed
            break;
        }

        const ordering = sort.desc ? `-${orderField}` : orderField;
        params.append("ordering", ordering);
      }

      if (globalFilter) {
        params.append("search", globalFilter);
      }

      // Results page specific - only crews with published times > 0 and exclude DQS, DNS, DNF
      params.append("results_only", "true");

      if (selectedCategory) {
        params.append("event_band", selectedCategory);
      }

      if (gender && gender !== "all") {
        params.append("event__gender", gender);
      }

      const response = await axios.get(`/api/crews/?${params.toString()}`);
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};

export default function ResultIndex() {
  // Server-side state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: "rank", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [gender, setGender] = useState("all");

  // Debounced search to avoid too many API calls
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalFilter]);

  // Fetch crews data with server-side operations
  const {
    data: crewsResponse,
    isLoading,
    error,
    isPlaceholderData
  } = useServerCrews({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    globalFilter: debouncedGlobalFilter,
    selectedCategory,
    gender
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<SelectOption[]> => {
      const response = await axios.get("/api/events/");
      const responseData: CategoryResponseDataProps[] = response.data;
      let eventBands = responseData.map((event) => event.override_name);
      eventBands = Array.from(new Set(eventBands)).sort();
      const options = eventBands.map((option) => ({
        label: option,
        value: option
      }));
      return [{ label: "All events", value: "" }, ...options];
    }
  });

  const { data: genderOptionsData } = useQuery({
    queryKey: ["genderOptions"],
    queryFn: async (): Promise<SelectOption[]> => {
      const response = await axios.get("/api/gender-options/");
      return response.data;
    }
  });

  // Calculate fastest times from server response
  const fastestTimes = useMemo(() => {
    if (!crewsResponse) return {};

    return {
      fastestMen2x: crewsResponse.fastest_open_2x_time || Infinity,
      fastestFemale2x: crewsResponse.fastest_female_2x_time || Infinity,
      fastestMenSweep: crewsResponse.fastest_open_sweep_time || Infinity,
      fastestFemaleSweep: crewsResponse.fastest_female_sweep_time || Infinity,
      fastestMixed2x: crewsResponse.fastest_mixed_2x_time || Infinity
    };
  }, [crewsResponse]);

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => (gender === "all" ? row.overall_rank : row.gender_rank), {
        id: "rank",
        header: gender === "all" ? "Overall position" : `Position (${gender})`,
        cell: (info) => info.getValue()
      }),
      columnHelper.accessor("bib_number", {
        header: "Number",
        cell: (info) => info.getValue(),
        enableSorting: false
      }),
      columnHelper.accessor("published_time", {
        header: "Time",
        cell: (info) => formatTimes(info.getValue()),
        enableSorting: false
      }),
      columnHelper.accessor("masters_adjusted_time", {
        header: "Masters adjust",
        cell: (info) => (info.getValue() ? formatTimes(info.getValue()) : ""),
        enableSorting: false
      }),
      columnHelper.display({
        id: "blade",
        header: "Rowing club",
        cell: (info) => <BladeImage crew={info.row.original} />,
        enableSorting: false
      }),
      columnHelper.accessor("club.name", {
        id: "club",
        header: "",
        cell: (info) => info.getValue()
      }),
      columnHelper.accessor((row) => (!row.competitor_names ? row.name : row.competitor_names), {
        id: "crew_name",
        header: "Crew",
        cell: (info) => info.getValue()
      }),
      columnHelper.accessor("composite_code", {
        header: "Code",
        cell: (info) => info.getValue(),
        enableSorting: false
      }),
      columnHelper.accessor("event_band", {
        header: "Event",
        cell: (info) => info.getValue()
      }),
      columnHelper.accessor("category_rank", {
        header: "Position in category",
        cell: (info) => info.getValue() || "",
        enableSorting: true
      }),
      columnHelper.display({
        id: "trophy",
        header: "",
        cell: (info) => {
          const crew = info.row.original;
          const isFastest =
            crew.overall_rank === 1 ||
            crew.published_time === fastestTimes.fastestFemale2x ||
            crew.published_time === fastestTimes.fastestFemaleSweep ||
            crew.published_time === fastestTimes.fastestMixed2x;
          return isFastest ? <TrophyImage /> : "";
        },
        enableSorting: false
      }),
      columnHelper.display({
        id: "pennant",
        header: "",
        cell: (info) => (info.row.original.category_rank === 1 ? <PennantImage /> : ""),
        enableSorting: false
      }),
      columnHelper.accessor("penalty", {
        header: "Penalty",
        cell: (info) => (info.getValue() ? "P" : ""),
        enableSorting: false
      }),
      columnHelper.accessor("time_only", {
        header: "TO",
        cell: (info) => (info.getValue() ? "TO" : ""),
        enableSorting: false
      })
    ],
    [gender, fastestTimes, crewsResponse?.results]
  );

  const table = useReactTable({
    data: crewsResponse?.results || [],
    columns,
    pageCount: crewsResponse ? Math.ceil(crewsResponse.count / pagination.pageSize) : 0,
    state: {
      sorting,
      pagination
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to first page on sort
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    // Enable manual server-side operations
    manualPagination: true,
    manualSorting: true
  });

  // Event handlers
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGender = e.target.value;
    setGender(newGender);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

    // Reset sorting to use appropriate rank field
    setSorting([
      {
        id: "rank",
        desc: false
      }
    ]);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  if (isLoading && !isPlaceholderData) {
    return (
      <>
        <Header />
        <Hero title={"Results"} />
        <section className="result-index__section">
          <div className="result-index__container">
            <div className="result-index__table-container">
              <table className="crews-table__table">
                <tbody>
                  <tr>
                    <td>Loading..</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Hero title={"Results"} />
        <section className="result-index__section">
          <div className="result-index__container">
            <div className="has-text-centered">Error loading results</div>
          </div>
        </section>
      </>
    );
  }

  const categoryOptions = categoriesData?.map((option) => ({ value: option.value, label: option.label }));
  const options = genderOptionsData?.map((option) => ({ value: option.value, label: option.label }));
  console.log(crewsResponse);

  return (
    <>
      <Header />
      <Hero title={"Results"} />

      <section className="result-index__section">
        <div className="result-index__container">
          <div className="result-index__controls">
            <div className="result-index__control">
              <SearchInput
                value={globalFilter}
                onChange={setGlobalFilter}
                placeholder="Search crews, names, clubs..."
                className="crews-table__search"
              />
            </div>
            <div className="result-index__control">
              <FormSelect
                fieldName={"category"}
                title={"Select category"}
                value={selectedCategory}
                onChange={handleCategoryChange}
                selectOptions={categoryOptions}
              />
            </div>
            <div className="result-index__control">
              <FormSelect
                fieldName={"gender"}
                title={"Select gender"}
                value={gender}
                onChange={handleGenderChange}
                selectOptions={options}
              />
            </div>
            <TextButton label={"Crew dashboard"} pathName="/crew-management-dashboard" />
          </div>

          <TablePagination
            table={table}
            className="result-index__pagination"
            showRowInfo={true}
            showPageSizeSelector={true}
            totalRowCount={crewsResponse?.count}
            rowTypeName="crews"
          />

          <div className="result-index__table-container">
            <table className="result-index__table">
              <TableHeader headerGroups={table.getHeaderGroups()} />
              <TableBody rows={table.getRowModel().rows} />
              <TableFooter headerGroups={table.getHeaderGroups()} />
            </table>
          </div>

          <TablePagination
            table={table}
            className="result-index__pagination"
            showRowInfo={true}
            showPageSizeSelector={true}
            totalRowCount={crewsResponse?.count}
            rowTypeName="crews"
          />

          {table.getRowModel().rows.length === 0 && !isLoading && (
            <div className="has-text-centered mt-4">
              <p>No results found matching your filters.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
