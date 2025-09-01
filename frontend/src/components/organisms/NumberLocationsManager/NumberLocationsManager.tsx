import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from "@tanstack/react-table";
import { IconButton } from "../../atoms/IconButton/IconButton";
import TextButton from "../../atoms/TextButton/TextButton";
import { FormInput } from "../../atoms/FormInput/FormInput";
import DataExportComponent from "../../molecules/DataExportComponent/DataExportComponent";
import { CSVUploadModal } from "../../molecules/CSVUploadModal/CSVUploadModal";
import "./numberLocationsManager.scss";

// Type definitions
interface NumberLocation {
  id?: number;
  club: string;
  number_location: string;
}

// API functions
const fetchNumberLocations = async (): Promise<NumberLocation[]> => {
  const response = await fetch("/api/number-locations/");
  if (!response.ok) throw new Error("Failed to fetch number locations");
  return response.json();
};

const createNumberLocations = async (data: Partial<NumberLocation>[]): Promise<NumberLocation[]> => {
  const response = await fetch("/api/number-location-bulk-update/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to create number locations");
  return response.json();
};

const updateNumberLocations = async (data: NumberLocation[]): Promise<any> => {
  const response = await fetch("/api/number-location-bulk-update/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to update number locations");
  return response.json();
};

const deleteNumberLocation = async (id: number): Promise<any> => {
  const response = await fetch(`/api/number-locations/${id}/`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Failed to delete number location");
  return response.json();
};

// Editable Cell Component
const EditableCell: React.FC<{
  getValue: () => any;
  row: { index: number };
  column: { id: string };
  table: any;
}> = ({ getValue, row, column, table }) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);

  const onBlur = () => {
    table.options.meta?.updateData(row.index, column.id, value);
  };

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <FormInput
      type={"text"}
      value={value || ""}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      fieldName={column.id}
      label={column.id === "club" ? "Club name" : "Number location"}
      placeholder={column.id === "club" ? "Enter club name" : "Enter number location"}
      hiddenLabel={true}
    />
  );
};

const NumberLocationsManager = () => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<NumberLocation[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [newItems, setNewItems] = useState<NumberLocation[]>([]);

  // Fetch data
  const {
    data: fetchedData,
    isLoading,
    error
  } = useQuery<NumberLocation[]>({
    queryKey: ["numberLocations"],
    queryFn: fetchNumberLocations
  });

  // Process fetched data
  React.useEffect(() => {
    if (fetchedData) {
      setData(fetchedData);
    }
  }, [fetchedData]);

  // Combine existing data with new items for display
  const tableData = useMemo(() => {
    return [...data, ...newItems];
  }, [data, newItems]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createNumberLocations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["numberLocations"] });
      setNewItems([]);
      setHasChanges(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateNumberLocations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["numberLocations"] });
      setHasChanges(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNumberLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["numberLocations"] });
    }
  });

  // Update data handler
  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: any) => {
      const totalExistingItems = data.length;

      if (rowIndex < totalExistingItems) {
        // Updating existing item
        setData((prevData) => {
          const newData = [...prevData];
          newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
          setHasChanges(true);
          return newData;
        });
      } else {
        // Updating new item
        const newItemIndex = rowIndex - totalExistingItems;
        setNewItems((prevItems) => {
          const newItems = [...prevItems];
          newItems[newItemIndex] = { ...newItems[newItemIndex], [columnId]: value };
          return newItems;
        });
      }
    },
    [data.length]
  );

  // Add new location
  const handleAddNew = () => {
    const newLocation: NumberLocation = {
      club: "",
      number_location: ""
    };
    setNewItems((prev) => [...prev, newLocation]);
  };

  // Remove location
  const removeLocation = useCallback(
    (index: number) => {
      const totalExistingItems = data.length;

      if (index < totalExistingItems) {
        // Removing existing item - just mark for deletion and save
        const itemToDelete = data[index];
        if (itemToDelete.id && window.confirm("Are you sure you want to delete this number location?")) {
          deleteMutation.mutate(itemToDelete.id);
        }
      } else {
        // Removing new item
        const newItemIndex = index - totalExistingItems;
        setNewItems((prev) => prev.filter((_, i) => i !== newItemIndex));
      }
    },
    [data, deleteMutation]
  );

  // Save changes
  const saveChanges = () => {
    // Save existing changes
    if (hasChanges && data.some((item) => item.id)) {
      updateMutation.mutate(data.filter((item) => item.id));
    }

    // Save new items
    if (newItems.length > 0) {
      const validNewItems = newItems.filter((item) => item.club && item.number_location);
      if (validNewItems.length > 0) {
        createMutation.mutate(validNewItems);
      }
    }
  };

  // Reset changes
  const resetChanges = () => {
    if (fetchedData) {
      setData(fetchedData);
      setNewItems([]);
      setHasChanges(false);
    }
  };

  // Table columns
  const columnHelper = createColumnHelper<NumberLocation>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("club", {
        header: "Club",
        cell: EditableCell
      }),
      columnHelper.accessor("number_location", {
        header: "Number location",
        cell: EditableCell
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="number-location-manager__table-actions">
            <IconButton
              title={"Delete number location"}
              icon={"delete"}
              onClick={() => removeLocation(row.index)}
              disabled={deleteMutation.isPending}
              smaller
            />
          </div>
        )
      })
    ],
    [removeLocation, deleteMutation.isPending]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData
    }
  });

  if (isLoading) {
    return <div className="number-location-manager__loading">Loading...</div>;
  }

  if (error) {
    return <div className="number-location-manager__error">Error: {error.message}</div>;
  }

  const hasAnyChanges = hasChanges || newItems.length > 0;

  return (
    <div className="number-location-manager">
      <div className="number-location-manager__header">
        <h2 className="number-location-manager__title">Number location manager</h2>
        <div className="number-location-manager__actions">
          <TextButton onClick={handleAddNew} label={"Add new location"} />
          {hasAnyChanges && (
            <>
              <TextButton
                onClick={saveChanges}
                disabled={createMutation.isPending || updateMutation.isPending}
                loading={createMutation.isPending || updateMutation.isPending}
                label={createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save changes"}
              />
              <TextButton onClick={resetChanges} label={"Reset"} style={"secondary"} />
            </>
          )}
        </div>
      </div>

      <div className="number-location-manager">
        <table className="number-location-manager__table">
          <thead className="number-location-manager__thead">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="number-location-manager__header-row">
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="number-location-manager__tbody">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="number-location-manager__row">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="number-location-manager__cell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="number-location-manager__import-wrapper">
        <DataExportComponent url={"/api/number-location-template/"} buttonText={"Export template"} />
        <CSVUploadModal url={"api/number-location-import/"} />
      </div>

      {tableData.length === 0 && (
        <div className="number-location-manager__empty">
          No number locations found. Click "Add New Location" to get started.
        </div>
      )}
    </div>
  );
};

export default NumberLocationsManager;
