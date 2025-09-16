import React, { useState, useMemo, useCallback, useRef } from "react";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from "@tanstack/react-table";
import "./eventMeetingKeyManager.scss";
import { IconButton } from "../../atoms/IconButton/IconButton";
import TextButton from "../../atoms/TextButton/TextButton";
import { FormInput } from "../../atoms/FormInput/FormInput";
import { useEventMeetingKeyManager } from "../../../hooks/useEventKeys";
import { EventMeetingKey } from "../../../types/components.types";

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

  if (column.id === "current_event_meeting") {
    return (
      <div className="event-meeting-manager__radio-container">
        <input
          id="current_event_meeting"
          type="radio"
          name="current_event_meeting"
          checked={value || false}
          onChange={(e) => {
            setValue(e.target.checked);
            table.options.meta?.updateData(row.index, column.id, e.target.checked);
          }}
          className="event-meeting-manager__radio"
        />
        <label htmlFor={"current_event_meeting"} className="sr-only"></label>
      </div>
    );
  }

  return (
    <FormInput
      type={"text"}
      value={value || ""}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      fieldName={column.id}
      label={column.id === "event_meeting_key" ? "Meeting Key" : "Meeting Name"}
      placeholder={column.id === "event_meeting_key" ? "Enter meeting key" : "Enter meeting name"}
      hiddenLabel={true}
    />
  );
};

const EventMeetingKeyManager = () => {
  const {
    data: fetchedData,
    isLoading,
    isSaving,
    isDeleting,
    error,
    saveNewItems,
    saveExistingItems,
    deleteItem
  } = useEventMeetingKeyManager();

  const [data, setData] = useState<EventMeetingKey[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [newItems, setNewItems] = useState<EventMeetingKey[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Use ref to track if we're currently saving to avoid resetting state
  const isSavingRef = useRef(false);

  React.useEffect(() => {
    // Only update local state if we're not currently saving
    if (fetchedData && !isSavingRef.current) {
      setData(fetchedData);
      setHasChanges(false); // Reset changes flag when fresh data arrives
    }
  }, [fetchedData]);

  // Track saving state
  React.useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  // Combine existing data with new items for display
  const tableData = useMemo(() => {
    return [...data, ...newItems];
  }, [data, newItems]);

  // Update data handler
  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: any) => {
      const totalExistingItems = data.length;

      if (rowIndex < totalExistingItems) {
        // Updating existing item
        setData((prevData) => {
          const newData = [...prevData];

          // Special handling for current_event_meeting - only one can be true
          if (columnId === "current_event_meeting" && value === true) {
            // Set all other items to false
            newData.forEach((item, index) => {
              if (index !== rowIndex) {
                item.current_event_meeting = false;
              }
            });
            // Also update new items
            setNewItems((prevNewItems) => prevNewItems.map((item) => ({ ...item, current_event_meeting: false })));
          }

          newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
          return newData;
        });
        setHasChanges(true);
      } else {
        // Updating new item
        const newItemIndex = rowIndex - totalExistingItems;
        setNewItems((prevItems) => {
          const newItems = [...prevItems];

          // Special handling for current_event_meeting - only one can be true
          if (columnId === "current_event_meeting" && value === true) {
            // Set all other new items to false
            newItems.forEach((item, index) => {
              if (index !== newItemIndex) {
                item.current_event_meeting = false;
              }
            });
            // Also update existing data
            setData((prevData) => prevData.map((item) => ({ ...item, current_event_meeting: false })));
            setHasChanges(true);
          }

          newItems[newItemIndex] = { ...newItems[newItemIndex], [columnId]: value };
          return newItems;
        });
      }
    },
    [data.length]
  );

  // Add new meeting key
  const handleAddNew = () => {
    const newEventMeetingKey: EventMeetingKey = {
      event_meeting_key: "",
      event_meeting_name: "",
      current_event_meeting: false
    };
    setNewItems((prev) => [...prev, newEventMeetingKey]);
  };

  // Remove meeting key
  const removeEventMeetingKey = useCallback(
    async (index: number) => {
      const totalExistingItems = data.length;

      if (index < totalExistingItems) {
        // Removing existing item
        const itemToDelete = data[index];
        if (itemToDelete.id) {
          setDeletingId(itemToDelete.id);
          try {
            await deleteItem(itemToDelete.id);
          } catch (error) {
            console.error("Delete failed:", error);
          } finally {
            setDeletingId(null);
          }
        }
      } else {
        // Removing new item (no API call needed)
        const newItemIndex = index - totalExistingItems;
        setNewItems((prev) => prev.filter((_, i) => i !== newItemIndex));
      }
    },
    [data, deleteItem]
  );

  // Save changes
  const saveChanges = async () => {
    try {
      isSavingRef.current = true;
      const promises: Promise<any>[] = [];

      // Save existing changes
      if (hasChanges && data.some((item) => item.id)) {
        promises.push(saveExistingItems(data.filter((item) => item.id)));
      }

      // Save new items
      if (newItems.length > 0) {
        promises.push(saveNewItems(newItems));
      }

      await Promise.all(promises);

      // Reset local state after successful save
      setNewItems([]);
      // Don't reset hasChanges here - let the useEffect handle it when fresh data arrives
    } catch (error) {
      console.error("Save failed:", error);
      isSavingRef.current = false;
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
  const columnHelper = createColumnHelper<EventMeetingKey>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("event_meeting_key", {
        header: "Meeting key",
        cell: EditableCell
      }),
      columnHelper.accessor("event_meeting_name", {
        header: "Meeting name",
        cell: EditableCell
      }),
      columnHelper.accessor("current_event_meeting", {
        header: "Current meeting",
        cell: EditableCell
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const handleDelete = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            removeEventMeetingKey(row.index);
          };

          const totalExistingItems = data.length;
          const isExistingItem = row.index < totalExistingItems;
          const currentItem = isExistingItem ? data[row.index] : null;
          const isThisRowDeleting = currentItem?.id === deletingId;

          return (
            <div className="event-meeting-manager__table-actions">
              <IconButton
                title={"Delete key"}
                icon={"delete"}
                onClick={handleDelete}
                disabled={isThisRowDeleting || isDeleting}
                smaller
              />
            </div>
          );
        }
      })
    ],
    [removeEventMeetingKey, data, deletingId, isDeleting]
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
    return <div className="event-meeting-manager__loading">Loading...</div>;
  }

  if (error) {
    return <div className="event-meeting-manager__error">Error: {error.message}</div>;
  }

  const hasAnyChanges = hasChanges || newItems.length > 0;
  const currentMeeting = tableData.find((item) => item.current_event_meeting);

  return (
    <div className="event-meeting-manager">
      <div className="event-meeting-manager__header-wrapper">
        <h2 className="event-meeting-manager__title">Event meeting keys</h2>
        {currentMeeting && (
          <div className="event-meeting-manager__current">
            Current meeting: <strong>{currentMeeting.event_meeting_name}</strong>
          </div>
        )}
        <div className="event-meeting-manager__actions">
          <TextButton onClick={handleAddNew} label={"Add new key"} />
          {hasAnyChanges && (
            <>
              <TextButton
                onClick={saveChanges}
                disabled={isSaving}
                loading={isSaving}
                label={isSaving ? "Saving..." : "Save changes"}
              />
              <TextButton onClick={resetChanges} label={"Reset"} style={"secondary"} />
            </>
          )}
        </div>
      </div>

      <div className="event-meeting-manager">
        <table className="event-meeting-manager__table">
          <thead className="event-meeting-manager__thead">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="event-meeting-manager__header-row">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="event-meeting-manager__header">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="event-meeting-manager__tbody">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="event-meeting-manager__row">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="event-meeting-manager__cell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {tableData.length === 0 && (
          <div className="event-meeting-manager__empty">
            No event meeting keys found. Click "Add new key" to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default EventMeetingKeyManager;
