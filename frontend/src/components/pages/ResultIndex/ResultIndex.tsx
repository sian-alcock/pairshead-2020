import React, { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import axios from "axios"
import Hero from "../../organisms/Hero/Hero"
import { formatTimes } from "../../../lib/helpers"
import { CrewProps } from "../../components.types"
import BladeImage from "../../atoms/BladeImage/BladeImage"
import CrewTimeCalculatedFieldsUpdate from "../../molecules/UpdateCrews/UpdateCrewTimeCalculatedFields"
import { genderOptions } from "./defaultProps"
import TrophyImage from "../../atoms/Trophy/Trophy"
import PennantImage from "../../atoms/Pennant/Pennant"
import Header from "../../organisms/Header/Header"

import "./resultIndex.scss"
import SearchInput from "../../molecules/SearchInput/SearchInput"
import { FormSelect } from "../../atoms/FormSelect/FormSelect"
import Checkbox from "../../atoms/Checkbox/Checkbox"

interface CategoryResponseDataProps {
  override_name: string
}

type SelectOption = {
  label: string | undefined
  value: string | undefined
}

const columnHelper = createColumnHelper<CrewProps>()

export default function ResultIndex() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'rank', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [gender, setGender] = useState("all")
  const [firstAndSecondCrewsBoolean, setFirstAndSecondCrewsBoolean] = useState(false)
  const [closeFirstAndSecondCrewsBoolean, setCloseFirstAndSecondCrewsBoolean] = useState(false)

  // Fetch results data
  const {
    data: resultsData,
    isLoading: resultsLoading,
    error: resultsError,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ["results"],
    queryFn: async (): Promise<CrewProps[]> => {
      const response = await axios.get("/api/crews/")
      return response.data
    },
  })

  // Fetch categories data
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<SelectOption[]> => {
      const response = await axios.get("/api/events/")
      const responseData: CategoryResponseDataProps[] = response.data
      let eventBands = responseData.map((event) => event.override_name)
      eventBands = Array.from(new Set(eventBands)).sort()
      const options = eventBands.map((option) => ({
        label: option,
        value: option,
      }))
      return [{ label: "All cats", value: "" }, ...options]
    },
  })

  // Calculate fastest times for trophy display
  const fastestTimes = useMemo(() => {
    if (!resultsData) return {}
    
    const results = resultsData
    return {
      fastestMen2x: Math.min(...results.filter(c => c.event_band?.includes("Men") && c.event_band?.includes("2x")).map(c => c.published_time || Infinity)),
      fastestFemale2x: Math.min(...results.filter(c => c.event_band?.includes("Women") && c.event_band?.includes("2x")).map(c => c.published_time || Infinity)),
      fastestMenSweep: Math.min(...results.filter(c => c.event_band?.includes("Men") && !c.event_band?.includes("2x")).map(c => c.published_time || Infinity)),
      fastestFemaleSweep: Math.min(...results.filter(c => c.event_band?.includes("Women") && !c.event_band?.includes("2x")).map(c => c.published_time || Infinity)),
      fastestMixed2x: Math.min(...results.filter(c => c.event_band?.includes("Mixed")).map(c => c.published_time || Infinity)),
    }
  }, [resultsData])

  // Helper function to check if crews are close
  const getTopCrews = (eventBand: string | undefined, crews: CrewProps[]) => {
    const timeDifference = 2000
    const crewsInCategory = crews.filter(
      (crew) => crew.event_band === eventBand && !crew.time_only && crew.category_rank <= 2
    )
    const raceTimes = crewsInCategory.map((crew) => crew.category_position_time)
    const sorted = raceTimes.slice().sort((a, b) => a - b)
    return Math.abs(sorted[0] - sorted[1]) <= timeDifference
  }

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor(
        (row) => (!gender || gender === "all" ? row.overall_rank : row.gender_rank),
        {
          id: "rank",
          header: "Rank",
          cell: (info) => info.getValue(),
        }
      ),
      columnHelper.accessor("bib_number", {
        header: "Bib",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("published_time", {
        header: "Time",
        cell: (info) => formatTimes(info.getValue()),
      }),
      columnHelper.accessor("masters_adjusted_time", {
        header: "Masters Time",
        cell: (info) => (info.getValue() ? formatTimes(info.getValue()) : ""),
      }),
      columnHelper.display({
        id: "blade",
        header: "Blade",
        cell: (info) => <BladeImage crew={info.row.original} />,
      }),
      columnHelper.accessor("club.name", {
        header: "Club",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor(
        (row) => (!row.competitor_names ? row.name : row.competitor_names),
        {
          id: "crew_name",
          header: "Crew",
          cell: (info) => info.getValue(),
        }
      ),
      columnHelper.accessor("composite_code", {
        header: "Code",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("event_band", {
        header: "Event",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("category_rank", {
        header: "Cat Rank",
        cell: (info) => info.getValue() || "",
      }),
      columnHelper.display({
        id: "pennant",
        header: "Pennant",
        cell: (info) => (info.row.original.category_rank === 1 ? <PennantImage /> : ""),
      }),
      columnHelper.display({
        id: "trophy",
        header: "Trophy",
        cell: (info) => {
          const crew = info.row.original
          const isFastest =
            crew.overall_rank === 1 ||
            crew.published_time === fastestTimes.fastestFemale2x ||
            crew.published_time === fastestTimes.fastestFemaleSweep ||
            crew.published_time === fastestTimes.fastestMixed2x
          return isFastest ? <TrophyImage /> : ""
        },
      }),
      columnHelper.display({
        id: "close_crews",
        header: "Close",
        cell: (info) => {
          const crew = info.row.original
          return getTopCrews(crew.event_band, resultsData || []) &&
            closeFirstAndSecondCrewsBoolean
            ? "❓"
            : ""
        },
      }),
      columnHelper.accessor("penalty", {
        header: "Penalty",
        cell: (info) => (info.getValue() ? "P" : ""),
      }),
      columnHelper.accessor("time_only", {
        header: "Time Only",
        cell: (info) => (info.getValue() ? "TO" : ""),
      }),
    ],
    [gender, fastestTimes, closeFirstAndSecondCrewsBoolean, resultsData]
  )

  // Filter data based on filters
  const filteredData = useMemo(() => {
    if (!resultsData) return []

    let filtered = resultsData

    // Status filter - only show accepted crews
    filtered = filtered.filter((crew) => crew.status === 'Accepted' && crew.published_time && crew.published_time > 0)

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((crew) => crew.event_band === selectedCategory)
    }

    // Gender filter (assuming you have gender field on crew)
    if (gender && gender !== "all") {
      // You may need to adjust this based on your data structure
      filtered = filtered.filter((crew) => crew.event.gender === gender)
    }

    // First and second crews filter
    if (firstAndSecondCrewsBoolean) {
      filtered = filtered.filter((crew) => crew.category_rank <= 2)
    }

    return filtered
  }, [resultsData, selectedCategory, gender, firstAndSecondCrewsBoolean])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
  })

  const refreshData = () => {
    refetchResults()
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value)
  }

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGender(e.target.value)
  }

  const handleFirstAndSecondCrews = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('clicked')
    setFirstAndSecondCrewsBoolean(e.target.checked)
  }

  const handleCloseCrews = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCloseFirstAndSecondCrewsBoolean(e.target.checked)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value)
  }

  if (resultsLoading) {
    return (
      <>
        <Header />
        <Hero title={"Results"} />
        <section className="section">
          <div className="container">
            <div className="has-text-centered">Loading...</div>
          </div>
        </section>
      </>
    )
  }

  if (resultsError) {
    return (
      <>
        <Header />
        <Hero title={"Results"} />
        <section className="section">
          <div className="container">
            <div className="has-text-centered">Error loading results</div>
          </div>
        </section>
      </>
    )
  }

  console.log(resultsData)
  const categoryOptions = categoriesData?.map((option) => (
    {value: option.value, label: option.label}
  ))
  const options = genderOptions.map((option) => (
    {value: option.value, label: option.label}
  ))

  return (
    <>
      <Header />
      <Hero title={"Results"} />
      {/* {resultsData?.requires_ranking_update && resultsData.requires_ranking_update > 0 ? (
        <div className="box">
          <CrewTimeCalculatedFieldsUpdate
            refreshData={refreshData}
            updateRequired={resultsData.requires_ranking_update}
          />
        </div>
      ) : (
        ""
      )} */}


      <section className="result-index__section">
        <div className="result-index__container">
          <div className="result-index__controls">
            <div className="result-index__control">
              <SearchInput value={globalFilter} onChange={(e) => handleSearchChange} />
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

            <div className="result-index__control">
              <Checkbox
                name={"winners-get"}
                label={"Crews in 1st and 2nd place"}
                id={"winners-get"}
                checked={firstAndSecondCrewsBoolean}
                onChange={() => handleFirstAndSecondCrews}
                value={'foo'}
              />
              <Checkbox
                name={"winners-near"}
                label={"Highlight 1st/2nd crews within 2s&nbsp;❓"}
                id={"winners-near"}
                checked={closeFirstAndSecondCrewsBoolean}
                onChange={(e) => handleCloseCrews}
              />
            </div>
          </div>

          <div className="mb-4">
            <p className="has-text-grey">
              Showing {table.getRowModel().rows.length} of {filteredData.length} crews
            </p>
          </div>

          <div className="result-index__table-container">
            <table className="result-index__table table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? null}
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
          
          {table.getRowModel().rows.length === 0 && (
            <div className="has-text-centered mt-4">
              <p>No results found matching your filters.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}