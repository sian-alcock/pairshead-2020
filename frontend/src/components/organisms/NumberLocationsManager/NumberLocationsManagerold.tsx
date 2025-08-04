import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  Row,
} from '@tanstack/react-table';
import './numberLocationsManager.scss'
import { IconButton } from '../../atoms/IconButton/IconButton';
import TextButton from '../../atoms/TextButton/TextButton';

// Type definitions
interface NumberLocation {
  id: number | string;
  club: string;
  number_location: string;
  isNew?: boolean;
}

const fetchNumberLocations = async (): Promise<NumberLocation[]> => {
  const response = await fetch('/api/number-locations/');
  if (!response.ok) throw new Error('Failed to fetch number locations');
  return response.json();
};

const createNumberLocations = async (data: Partial<NumberLocation>[]): Promise<NumberLocation[]> => {
  const response = await fetch('/api/number-location-bulk-update/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create number locations');
  return response.json();
};

const updateNumberLocations = async (data: NumberLocation[]): Promise<any> => {
  const response = await fetch('/api/number-location-bulk-update/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update number locations');
  return response.json();
};

const deleteNumberLocation = async (id: number | string): Promise<any> => {
  const response = await fetch(`/api/number-locations/${id}/`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete number location');
  return response.json();
};

const NumberLocationsManagerold = () => {
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set());
  const [newRows, setNewRows] = useState<NumberLocation[]>([]);
  const [editData, setEditData] = useState<Record<number, Partial<NumberLocation>>>({});
  const queryClient = useQueryClient();

  // Fetch data
  const { data: numberLocations = [], isLoading, error } = useQuery<NumberLocation[]>({
    queryKey: ['numberLocations'],
    queryFn: fetchNumberLocations,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createNumberLocations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numberLocations'] });
      setNewRows([]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateNumberLocations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numberLocations'] });
      setEditingRows(new Set());
      setEditData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNumberLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numberLocations'] });
    },
  });

  // Table data combining existing and new rows
  const tableData = useMemo(() => {
    return [...numberLocations, ...newRows];
  }, [numberLocations, newRows]);

  // Column helper
  const columnHelper = createColumnHelper<NumberLocation>();

  const columns = useMemo(() => [
    columnHelper.accessor('club', {
      header: 'Club',
      cell: ({ row, getValue }) => {
        const isEditing = editingRows.has(row.index) || row.original.isNew;
        const currentValue = editData[row.index]?.club ?? getValue();
        
        if (isEditing) {
          return (
            <input
              type="text"
              className="number-location-table__input"
              value={currentValue || ''}
              onChange={(e) => setEditData(prev => ({
                ...prev,
                [row.index]: { ...prev[row.index], club: e.target.value }
              }))}
              placeholder="Enter club name"
            />
          );
        }
        return <span className="number-location-table__cell-text">{currentValue}</span>;
      },
    }),
    columnHelper.accessor('number_location', {
      header: 'Number Location',
      cell: ({ row, getValue }) => {
        const isEditing = editingRows.has(row.index) || row.original.isNew;
        const currentValue = editData[row.index]?.number_location ?? getValue();
        
        if (isEditing) {
          return (
            <input
              type="text"
              className="number-location-table__input"
              value={currentValue || ''}
              onChange={(e) => setEditData(prev => ({
                ...prev,
                [row.index]: { ...prev[row.index], number_location: e.target.value }
              }))}
              placeholder="Enter number location"
            />
          );
        }
        return <span className="number-location-table__cell-text">{currentValue}</span>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isEditing = editingRows.has(row.index) || row.original.isNew;
        const isNew = row.original.isNew;
        
        return (
          <div className="number-location-table__actions">
            {isEditing ? (
              <>
                <IconButton
                  onClick={() => handleSave(row)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  icon={'save'}
                  title={'Save number location'}
                />
                <IconButton
                  onClick={() => handleCancel(row)}
                  icon={'cross'}
                  title={'Cancel edit'}
                />
              </>
            ) : (
              <>
                <IconButton
                  title={'Edit number location'}
                  icon={'edit'}
                  onClick={() => handleEdit(row)}
                  smaller
                />
                <IconButton
                  title={'Delete number location'}
                  icon={'delete'}
                  onClick={() => handleDelete(row.original.id)}
                  disabled={deleteMutation.isPending}
                  smaller
                />
              </>
            )}
          </div>
        );
      },
    }),
  ], [editingRows, editData, createMutation.isPending, updateMutation.isPending, deleteMutation.isPending]);

  const table = useReactTable<NumberLocation>({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Event handlers
  const handleAddNew = () => {
    const newRow: NumberLocation = {
      id: `new_${Date.now()}`,
      club: '',
      number_location: '',
      isNew: true,
    };
    setNewRows(prev => [...prev, newRow]);
    setEditData(prev => ({
      ...prev,
      [tableData.length]: { club: '', number_location: '' }
    }));
  };

  const handleEdit = (row: any) => {
    setEditingRows(prev => new Set([...prev, row.index]));
    setEditData(prev => ({
      ...prev,
      [row.index]: {
        club: row.original.club,
        number_location: row.original.number_location,
      }
    }));
  };

  const handleSave = async (row: any) => {
    const rowData = editData[row.index];
    if (!rowData?.club || !rowData?.number_location) {
      alert('Please fill in all fields');
      return;
    }

    if (row.original.isNew) {
      // Create new - send only the required fields
      const newLocationData = {
        club: rowData.club,
        number_location: rowData.number_location,
      };
      await createMutation.mutateAsync([newLocationData]);
    } else {
      // Update existing - include the ID
      const updateLocationData: NumberLocation = {
        id: row.original.id,
        club: rowData.club,
        number_location: rowData.number_location,
      };
      await updateMutation.mutateAsync([updateLocationData]);
    }
  };

  const handleCancel = (row: Row<NumberLocation>) => {
    if (row.original.isNew) {
      setNewRows(prev => prev.filter(r => r.id !== row.original.id));
    } else {
      setEditingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(row.index);
        return newSet;
      });
    }
    setEditData(prev => {
      const newData = { ...prev };
      delete newData[row.index];
      return newData;
    });
  };

  const handleDelete = async (id: string | number) => {
    if (confirm('Are you sure you want to delete this number location?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="number-location-manager__loading">Loading...</div>;
  }

  if (error) {
    return <div className="number-location-manager__error">Error: {error.message}</div>;
  }

  return (
    <div className="number-location-manager">
      <div className="number-location-manager__header">
        <h2 className="number-location-manager__title">Number Location Manager</h2>
        <TextButton onClick={handleAddNew} label={'Add new location'}/>
      </div>

      <div className="number-location-table">
        <table className="number-location-table__table">
          <thead className="number-location-table__thead">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="number-location-table__header-row">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="number-location-table__header">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())
                    }
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="number-location-table__tbody">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="number-location-table__row">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="number-location-table__cell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tableData.length === 0 && (
        <div className="number-location-manager__empty">
          No number locations found. Click "Add New Location" to get started.
        </div>
      )}
    </div>
  );
};

export default NumberLocationsManagerold;