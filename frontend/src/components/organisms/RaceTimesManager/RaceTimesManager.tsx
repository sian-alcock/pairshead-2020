import React, { ReactElement, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getExpandedRowModel,
  ExpandedState
} from "@tanstack/react-table";
import { RaceProps } from "../../../types/components.types";
import "./raceTimesManager.scss";
import TextButton from "../../atoms/TextButton/TextButton";
import { IconButton } from "../../atoms/IconButton/IconButton";
import { Link } from "react-router-dom";
import Icon from "../../atoms/Icons/Icons";
import CSVDataLoader from "../../molecules/CSVDataLoader/CSVDataLoader";
import { useDeleteRace, useRaces, useUpdateRace } from "../../../hooks/useRaces";

interface RadioSelection {
  raceId: number;
  type: "default-start" | "default-finish";
}

const refreshRaceData = async (raceId: number) => {
  const response: AxiosResponse = await axios.get(`/api/crew-race-times-import-webscorer/${raceId}`);
  console.log(response.data);
  return response.data;
};

const columnHelper = createColumnHelper<RaceProps>();

export default function RaceTimesManager(): ReactElement {
  const [radioSelections, setRadioSelections] = useState<RadioSelection[]>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [refreshingRaceId, setRefreshingRaceId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: raceDetails = [], isLoading, error } = useRaces();

  // Mutations
  const updateRaceMutation = useUpdateRace();

  const deleteRaceMutation = useDeleteRace();

  const refreshRaceMutation = useMutation({
    mutationFn: refreshRaceData,
    onMutate: (raceId: number) => {
      setRefreshingRaceId(raceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["races"] });
      setRefreshingRaceId(null);
    },
    onError: () => {
      setRefreshingRaceId(null);
    }
  });

  const handleSubmit = async () => {
    try {
      // Group selections by raceId to make single API call per race
      const raceUpdates = new Map<number, Partial<RaceProps>>();

      // Build updates for selected races
      radioSelections.forEach((selection) => {
        const existing = raceUpdates.get(selection.raceId) || {};
        raceUpdates.set(selection.raceId, {
          ...existing,
          [selection.type.replace("-", "_")]: true
        });
      });

      // Make API calls sequentially to avoid race conditions
      // (Django's save() method handles setting other races to false)
      for (const [raceId, updateData] of raceUpdates.entries()) {
        console.log(`Updating race ${raceId} with:`, updateData);
        await updateRaceMutation.mutateAsync({
          id: raceId,
          raceData: updateData
        });
      }

      // Clear selections after successful submission
      setRadioSelections([]);
      console.log("All updates completed successfully");
    } catch (error: any) {
      console.error("Error updating races:", error);
      console.error("Error details:", error.response?.data);
    }
  };

  const handleDelete = async (raceId: number) => {
    try {
      await deleteRaceMutation.mutateAsync(raceId);
    } catch (error) {
      console.error("Error deleting race:", error);
    }
  };

  const handleRefresh = async (raceId: number) => {
    try {
      await refreshRaceMutation.mutateAsync(raceId);
    } catch (error) {
      console.error("Error refreshing race data:", error);
    }
  };

  // Table columns definition
  const columns = [
    columnHelper.display({
      id: "expander",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => row.toggleExpanded()}
          className={row.getIsExpanded() ? "race-times-manager__expand open" : "race-times-manager__expand"}
        >
          <Icon icon={"chevron-right"} />
        </button>
      )
    }),
    columnHelper.accessor("id", {
      header: "Id",
      cell: (info) => (
        <span className="race-times-manager__link">
          <Link to={`/manage-race-times/${info.getValue()}/edit`}>{info.getValue()}</Link>
        </span>
      )
    }),
    columnHelper.accessor("race_id", {
      header: "Race id"
    }),
    columnHelper.accessor("name", {
      header: "Name"
    }),
    columnHelper.accessor("default_start", {
      header: "Default start",
      cell: ({ row }) => {
        // Check if this race is selected for default-start
        const isSelected =
          radioSelections.some(
            (selection) => selection.raceId === row.original.id && selection.type === "default-start"
          ) ||
          (!radioSelections.some((s) => s.type === "default-start") && row.original.default_start);

        return (
          <div className="td-center">
            <label>
              <input
                type="radio"
                name="default-start" // Same name for all default-start radios
                checked={isSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Remove any existing default-start selection and add new one
                    setRadioSelections((prev) => [
                      ...prev.filter((s) => s.type !== "default-start"),
                      { raceId: row.original.id, type: "default-start" }
                    ]);
                  }
                }}
              />
            </label>
          </div>
        );
      }
    }),

    columnHelper.accessor("default_finish", {
      header: "Default finish",
      cell: ({ row }) => {
        // Check if this race is selected for default-finish
        const isSelected =
          radioSelections.some(
            (selection) => selection.raceId === row.original.id && selection.type === "default-finish"
          ) ||
          (!radioSelections.some((s) => s.type === "default-finish") && row.original.default_finish);

        return (
          <div className="td-center">
            <label>
              <input
                type="radio"
                name="default-finish" // Same name for all default-finish radios
                checked={isSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Remove any existing default-finish selection and add new one
                    setRadioSelections((prev) => [
                      ...prev.filter((s) => s.type !== "default-finish"),
                      { raceId: row.original.id, type: "default-finish" }
                    ]);
                  }
                }}
              />
            </label>
          </div>
        );
      }
    }),
    columnHelper.display({
      id: "upload",
      header: "Upload CSV",
      cell: ({ row }) => (
        <div className="td-center">
          <IconButton title={"Upload from CSV"} icon={"upload"} smaller onClick={() => row.toggleExpanded()} />
        </div>
      )
    }),
    columnHelper.display({
      id: "fetch",
      header: "Fetch data",
      cell: ({ row }) => {
        const isRefreshing = refreshingRaceId === row.original.id;

        return (
          <div className="td-center">
            <IconButton
              title={"Fetch data from webscorer"}
              icon={isRefreshing ? "clock-spinner" : "refresh"}
              smaller
              onClick={() => handleRefresh(row.original.id)}
              disabled={isRefreshing}
            />
          </div>
        );
      }
    }),
    columnHelper.display({
      id: "delete",
      header: "Delete",
      cell: ({ row }) => (
        <div className="td-center">
          <IconButton
            title={"Delete data for race"}
            icon={"delete"}
            smaller
            onClick={() => handleDelete(row.original.id)}
            disabled={deleteRaceMutation.isPending}
          />
        </div>
      )
    })
  ];

  const table = useReactTable({
    data: raceDetails,
    columns,
    state: {
      expanded
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true
  });

  if (isLoading) return <div>Loading races...</div>;
  if (error) return <div>Error loading races: {error.message}</div>;

  return (
    <section className="race-times-manager no-print">
      <form className="race-times-manager__form">
        <table className="race-times-manager__table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <tr data-race={row.original.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
                {row.getIsExpanded() && (
                  <tr>
                    <td colSpan={columns.length}>
                      <CSVDataLoader url={"/api/crew-race-times-import/"} queryParams={{ id: `${row.original.id}` }} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
        <div className="race-times-manager__button-wrapper">
          <p className="control">
            <TextButton
              label={"Submit"}
              onClick={handleSubmit}
              disabled={updateRaceMutation.isPending || radioSelections.length === 0}
            />
          </p>
          <p className="control">
            <TextButton label={"Add new"} pathName={"/manage-race-times/new"} />
          </p>
        </div>
      </form>
    </section>
  );
}
