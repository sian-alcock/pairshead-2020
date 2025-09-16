import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import axios, { AxiosResponse } from "axios";
import BladeImage from "../../atoms/BladeImage/BladeImage";
import Header from "../../organisms/Header/Header";
import Hero from "../../organisms/Hero/Hero";
import { CrewProps } from "../../../types/components.types";
import "./crewStartByNumberLocation.scss";
import Checkbox from "../../atoms/Checkbox/Checkbox";
import { PaginatedResponse } from "../../../types/components.types";

interface ResponseParamsProps {
  status?: string | string[];
  masters?: boolean;
  page_size?: string;
  page?: number;
  ordering?: string;
}

// API function
const fetchCrews = async (params: ResponseParamsProps): Promise<CrewProps[]> => {
  const response: AxiosResponse<PaginatedResponse<CrewProps>> = await axios.get("/api/crews", {
    params
  });
  return response.data.results;
};

// Column helper for type safety
const columnHelper = createColumnHelper<CrewProps>();

export default function CrewStartByNumberLocation() {
  const [showHostClubBoolean, setShowHostClubBoolean] = useState(true);

  // React Query for data fetching
  const {
    data: crews = [],
    isLoading,
    error
  } = useQuery({
    queryKey: [
      "crews",
      {
        page_size: "500",
        page: 1,
        ordering: "bib_number",
        status: "Accepted"
      }
    ],
    queryFn: () =>
      fetchCrews({
        page_size: "500",
        page: 1,
        ordering: "bib_number",
        status: "Accepted"
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Group crews by number location
  const groupedCrews = useMemo(() => {
    // Sort crews by bib_number client-side
    const sortedCrews = [...crews].sort((a, b) => {
      const bibA = Number(a.bib_number) || 0;
      const bibB = Number(b.bib_number) || 0;
      return bibA - bibB;
    });

    const numberLocations = Array.from(sortedCrews.map((crew) => crew.number_location)).sort();
    const uniqueNumberLocations = [...new Set(numberLocations)];

    return uniqueNumberLocations.map((location) => ({
      location,
      crews: sortedCrews.filter((crew) => crew.number_location === location)
    }));
  }, [crews]);

  // Define columns
  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor("bib_number", {
        header: "Bib number",
        cell: (info) => info.getValue() || ""
      }),
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => info.getValue()
      }),
      columnHelper.display({
        id: "blade",
        header: "Blade",
        cell: ({ row }) => <BladeImage crew={row.original} />
      }),
      columnHelper.accessor((row) => row.club?.index_code, {
        id: "club",
        header: "Club",
        cell: (info) => info.getValue() || ""
      }),
      columnHelper.accessor((row) => row.competitor_names || row.name, {
        id: "name",
        header: "Name",
        cell: (info) => info.getValue()
      }),
      columnHelper.accessor("event_band", {
        header: "Event band",
        cell: (info) => info.getValue()
      })
    ];

    // Conditionally add host club column
    if (showHostClubBoolean) {
      baseColumns.push(
        columnHelper.display({
          id: "host_club",
          header: "Host Club",
          cell: ({ row }) => row.original.host_club?.name || ""
        })
      );
    }

    baseColumns.push(
      columnHelper.display({
        id: "number_location",
        header: "Number Location",
        cell: ({ row }) => row.original.number_location || ""
      }),
      columnHelper.display({
        id: "checkbox",
        header: "",
        cell: () => <span className="crew-start-by-number-location__checkbox-cell">☐</span>
      })
    );

    return baseColumns;
  }, [showHostClubBoolean]);

  const showHostClubColumn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowHostClubBoolean(e.target.checked);
  };

  // Render table for each location group
  const CrewTable = ({ crews: groupCrews }: { crews: CrewProps[] }) => {
    const table = useReactTable({
      data: groupCrews,
      columns,
      getCoreRowModel: getCoreRowModel()
    });

    return (
      <div className="crew-start-by-number-location__table-container">
        <table className="crew-start-by-number-location__table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <td key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (error) {
    return (
      <>
        <Header />
        <Hero title={"Crews by number location"} />
        <section className="crew-start-by-number-location__section">
          <div className="crew-start-by-number-location__container">
            <p>Error loading crews: {error instanceof Error ? error.message : "Unknown error"}</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Header />
      <Hero title={"Crews by number location"} />
      <section className="crew-start-by-number-location__section">
        <div className="crew-start-by-number-location__container">
          <div className="no-print">
            <div className="crew-start-by-number-location__field">
              <Checkbox
                name={"host-club"}
                label={"Show host club"}
                id={"host-club"}
                onChange={showHostClubColumn}
                checked={showHostClubBoolean}
              />
            </div>
          </div>
          <h2 className="crew-start-by-number-location__title">Pairs Head {new Date().getFullYear()} - Start order</h2>

          {isLoading ? <p>Loading...</p> : null}
          {groupedCrews.length === 0 && (
            <tr>
              <td>No accepted crews found</td>
            </tr>
          )}
          {groupedCrews.map((group, i) => (
            <div className="crew-start-by-number-location__block" key={`${group.location}-${i}`}>
              <h3 className="crew-start-by-number-location__location-title">
                {group.location === null
                  ? `Crews with no host club / number locations (${group.crews.length} numbers)`
                  : `${group.location} (${group.crews.length} numbers)`}
              </h3>
              <CrewTable crews={group.crews} />
              {i < groupedCrews.length - 1 ? <div className="page-break"></div> : ""}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
