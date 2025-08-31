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

interface ResponseParamsProps {
  status?: string | string[];
  masters?: boolean;
}

// API function
const fetchCrews = async (params: ResponseParamsProps): Promise<CrewProps[]> => {
  const response: AxiosResponse<CrewProps[]> = await axios.get("/api/crews", {
    params
  });
  return response.data;
};

// Column helper for type safety
const columnHelper = createColumnHelper<CrewProps>();

export default function CrewStartByNumberLocation() {
  const [showHostClubBoolean, setShowHostClubBoolean] = useState(false);

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
        order: "bib_number",
        status: "Accepted"
      }
    ],
    queryFn: () =>
      fetchCrews({
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
        header: "☐",
        cell: () => "☐"
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
        <table className="table crew-start-by-number-location__table has-text-left">
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
          <tfoot className="no-print">
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <td key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tfoot>
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
              <Checkbox name={"host-club"} label={"Show host club"} id={"host-club"} onChange={showHostClubColumn} />
            </div>
          </div>
          <h2 className="crew-start-by-number-location__title">Pairs Head {new Date().getFullYear()} - Start order</h2>

          {isLoading ? <p>Loading...</p> : null}

          {groupedCrews.map((group, i) => (
            <div className="block" key={`${group.location}-${i}`}>
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
