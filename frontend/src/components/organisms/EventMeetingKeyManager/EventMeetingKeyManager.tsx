import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import './eventMeetingKeyManager.scss'
import { IconButton } from '../../atoms/IconButton/IconButton';
import TextButton from '../../atoms/TextButton/TextButton';
import { FormInput } from '../../atoms/FormInput/FormInput';

// Type definitions
interface EventMeetingKey {
  id?: number;
  event_meeting_key: string;
  event_meeting_name: string;
  current_event_meeting: boolean;
}

// API functions
const fetchEventMeetingKeys = async (): Promise<EventMeetingKey[]> => {
  const response = await fetch('/api/event-meeting-key-list/');
  if (!response.ok) throw new Error('Failed to fetch event meeting keys');
  return response.json();
};

const createEventMeetingKeys = async (data: Partial<EventMeetingKey>[]): Promise<EventMeetingKey[]> => {
  const response = await fetch('/api/event-meeting-key-bulk-update/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create event meeting keys');
  return response.json();
};

const updateEventMeetingKeys = async (data: EventMeetingKey[]): Promise<any> => {
  const response = await fetch('/api/event-meeting-key-bulk-update/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update event meeting keys');
  return response.json();
};

const deleteEventMeetingKey = async (id: number): Promise<any> => {
  // Using the correct detail endpoint pattern without trailing slash
  const url = `/api/event-meeting-key-list/${String(id).trim()}`;
  console.log('DELETE URL:', url); // Debug log
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Delete error:', response.status, errorText);
    throw new Error(`Failed to delete event meeting key: ${response.status} ${errorText}`);
  }
  
  // Some DELETE endpoints return empty response, handle both cases
  if (response.status === 204) {
    return null;
  }
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

  if (column.id === 'current_event_meeting') {
    return (
      <input
        type="radio"
        name="current_event_meeting"
        checked={value || false}
        onChange={(e) => {
          setValue(e.target.checked);
          table.options.meta?.updateData(row.index, column.id, e.target.checked);
        }}
        className="event-meeting-table__radio"
      />
    );
  }

  return (
    <FormInput
      type={'text'}
      value={value || ''}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      fieldName={column.id}
      label={column.id === 'event_meeting_key' ? 'Meeting Key' : 'Meeting Name'}
      placeholder={column.id === 'event_meeting_key' ? 'Enter meeting key' : 'Enter meeting name'}
      hiddenLabel={true}
    />
  );
};

const EventMeetingKeyManager = () => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<EventMeetingKey[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [newItems, setNewItems] = useState<EventMeetingKey[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch data
  const { data: fetchedData, isLoading, error } = useQuery<EventMeetingKey[]>({
    queryKey: ['eventMeetingKeys'],
    queryFn: fetchEventMeetingKeys,
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
    mutationFn: createEventMeetingKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventMeetingKeys'] });
      setNewItems([]);
      setHasChanges(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEventMeetingKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventMeetingKeys'] });
      setHasChanges(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEventMeetingKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventMeetingKeys'] });
      setDeletingId(null);
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      setDeletingId(null);
    },
  });

  // Update data handler
  const updateData = useCallback((rowIndex: number, columnId: string, value: any) => {
    const totalExistingItems = data.length;
    
    if (rowIndex < totalExistingItems) {
      // Updating existing item
      setData((prevData) => {
        const newData = [...prevData];
        
        // Special handling for current_event_meeting - only one can be true
        if (columnId === 'current_event_meeting' && value === true) {
          // Set all other items to false
          newData.forEach((item, index) => {
            if (index !== rowIndex) {
              item.current_event_meeting = false;
            }
          });
          // Also update new items
          setNewItems(prevNewItems => 
            prevNewItems.map(item => ({ ...item, current_event_meeting: false }))
          );
        }
        
        newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
        setHasChanges(true);
        return newData;
      });
    } else {
      // Updating new item
      const newItemIndex = rowIndex - totalExistingItems;
      setNewItems((prevItems) => {
        const newItems = [...prevItems];
        
        // Special handling for current_event_meeting - only one can be true
        if (columnId === 'current_event_meeting' && value === true) {
          // Set all other new items to false
          newItems.forEach((item, index) => {
            if (index !== newItemIndex) {
              item.current_event_meeting = false;
            }
          });
          // Also update existing data
          setData(prevData => 
            prevData.map(item => ({ ...item, current_event_meeting: false }))
          );
          setHasChanges(true);
        }
        
        newItems[newItemIndex] = { ...newItems[newItemIndex], [columnId]: value };
        return newItems;
      });
    }
  }, [data.length]);

  // Add new meeting key
  const handleAddNew = () => {
    const newEventMeetingKey: EventMeetingKey = {
      event_meeting_key: '',
      event_meeting_name: '',
      current_event_meeting: false,
    };
    setNewItems(prev => [...prev, newEventMeetingKey]);
  };

  // Remove meeting key
  const removeEventMeetingKey = useCallback((index: number) => {
    const totalExistingItems = data.length;
    
    if (index < totalExistingItems) {
      // Removing existing item
      const itemToDelete = data[index];
      if (itemToDelete.id) {
        setDeletingId(itemToDelete.id);
        deleteMutation.mutate(itemToDelete.id);
      }
    } else {
      // Removing new item (no API call needed)
      const newItemIndex = index - totalExistingItems;
      setNewItems(prev => prev.filter((_, i) => i !== newItemIndex));
    }
  }, [data, deleteMutation]);

  // Save changes
  const saveChanges = () => {
    // Save existing changes
    if (hasChanges && data.some(item => item.id)) {
      updateMutation.mutate(data.filter(item => item.id));
    }
    
    // Save new items
    if (newItems.length > 0) {
      const validNewItems = newItems.filter(item => 
        item.event_meeting_key && item.event_meeting_name
      );
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
  const columnHelper = createColumnHelper<EventMeetingKey>();

  const columns = useMemo(() => [
    columnHelper.accessor('event_meeting_key', {
      header: 'Meeting Key',
      cell: EditableCell,
    }),
    columnHelper.accessor('event_meeting_name', {
      header: 'Meeting Name',
      cell: EditableCell,
    }),
    columnHelper.accessor('current_event_meeting', {
      header: 'Current Meeting',
      cell: EditableCell,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const handleDelete = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          removeEventMeetingKey(row.index);
        };
        
        // Check if this specific row is being deleted
        const totalExistingItems = data.length;
        const isExistingItem = row.index < totalExistingItems;
        const currentItem = isExistingItem ? data[row.index] : null;
        const isThisRowDeleting = currentItem?.id === deletingId;
        
        return (
          <div className="event-meeting-table__actions">
            <IconButton
              title={'Delete event meeting key'}
              icon={'delete'}
              onClick={handleDelete}
              disabled={isThisRowDeleting}
              smaller
            />
          </div>
        );
      },
    }),
  ], [removeEventMeetingKey, data, deletingId]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
    },
  });

  if (isLoading) {
    return <div className="event-meeting-manager__loading">Loading...</div>;
  }

  if (error) {
    return <div className="event-meeting-manager__error">Error: {error.message}</div>;
  }

  const hasAnyChanges = hasChanges || newItems.length > 0;
  const currentMeeting = tableData.find(item => item.current_event_meeting);

  return (
    <div className="event-meeting-manager">
      <div className="event-meeting-manager__header">
        <h2 className="event-meeting-manager__title">Event Meeting Key Manager</h2>
        {currentMeeting && (
          <div className="event-meeting-manager__current">
            Current Meeting: <strong>{currentMeeting.event_meeting_name}</strong>
          </div>
        )}
        <div className="event-meeting-manager__actions">
          <TextButton onClick={handleAddNew} label={'Add new meeting key'}/>
          {hasAnyChanges && (
            <>
              <TextButton
                onClick={saveChanges}
                disabled={createMutation.isPending || updateMutation.isPending}
                loading={createMutation.isPending || updateMutation.isPending}
                label={createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save changes'}
              />
              <TextButton
                onClick={resetChanges}
                label={'Reset'}
                style={'secondary'}
              />
            </>
          )}
        </div>
      </div>

      <div className="event-meeting-table">
        <table className="event-meeting-table__table">
          <thead className="event-meeting-table__thead">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="event-meeting-table__header-row">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="event-meeting-table__header">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())
                    }
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="event-meeting-table__tbody">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="event-meeting-table__row">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="event-meeting-table__cell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tableData.length === 0 && (
        <div className="event-meeting-manager__empty">
          No event meeting keys found. Click "Add New Meeting Key" to get started.
        </div>
      )}
    </div>
  );
};

export default EventMeetingKeyManager;