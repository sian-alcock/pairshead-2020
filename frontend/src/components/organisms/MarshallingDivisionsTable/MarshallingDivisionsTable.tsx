import React, { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  CellContext,
} from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './marshallingDivisionsTable.scss'
import TextButton from '../../atoms/TextButton/TextButton';
import { FormInput } from '../../atoms/FormInput/FormInput';
import { IconButton } from '../../atoms/IconButton/IconButton';

// Types
interface MarshallingDivision {
  id?: number;
  name: string;
  bottom_range: number;
  top_range: number;
  order: number;
}

// API functions
const fetchMarshallingDivisions = async (): Promise<MarshallingDivision[]> => {
  const response = await fetch('/api/marshalling-divisions/');
  if (!response.ok) throw new Error('Failed to fetch divisions');
  return response.json();
};

const bulkUpdateDivisions = async (divisions: MarshallingDivision[]) => {
  const response = await fetch('/api/marshalling-divisions/bulk-update/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ divisions }),
  });
  if (!response.ok) throw new Error('Failed to update divisions');
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

  if (column.id === 'bottom_range') {
    // Bottom range is calculated automatically, so make it read-only
    return (
      <FormInput
        value={value}
        readOnly
        fieldName={column.id}
        label={'Bottom of range'}
        type={'number'}
        hiddenLabel={true}
      />
    );
  }

  return (
    <FormInput
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      type={column.id === 'top_range' ? 'number' : 'text'}
      min={column.id === 'top_range' ? '1' : undefined}
      fieldName={column.id}
      label={column.id === 'name' ? 'Name' : 'Top of range'}
      hiddenLabel={true}
    />
  );
};

const MarshallingDivisionsTable: React.FC = () => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<MarshallingDivision[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch data
  const { data: fetchedData, isLoading, error } = useQuery({
    queryKey: ['marshallingDivisions'],
    queryFn: fetchMarshallingDivisions,
  });

  // Process fetched data
  React.useEffect(() => {
    if (fetchedData) {
      const processedData = fetchedData.map((item, index) => ({
        ...item,
        order: index,
      }));
      setData(processedData);
    }
  }, [fetchedData]);

  // Mutation for bulk update
  const updateMutation = useMutation({
    mutationFn: bulkUpdateDivisions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marshallingDivisions'] });
      setHasChanges(false);
    },
  });

  // Calculate ranges when data changes
  const calculateRanges = useCallback((divisions: MarshallingDivision[]) => {
    let currentBottom = 1;
    
    return divisions.map((division, index) => {
      const bottom = currentBottom;
      let top = division.top_range;
      
      // Ensure top is at least equal to bottom
      if (top < bottom) {
        top = bottom;
      }
      
      const updatedDivision = {
        ...division,
        bottom_range: bottom,
        top_range: top,
        order: index,
      };
      
      // Next division starts where this one ends + 1
      currentBottom = top + 1;
      
      return updatedDivision;
    });
  }, []);

  // Update data handler
  const updateData = useCallback((rowIndex: number, columnId: string, value: any) => {
    setData((prevData) => {
      const newData = [...prevData];
      
      if (columnId === 'top_range') {
        newData[rowIndex] = { ...newData[rowIndex], [columnId]: parseInt(value) || 1 };
      } else {
        newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
      }
      
      // Recalculate all ranges
      const recalculatedData = calculateRanges(newData);
      setHasChanges(true);
      
      return recalculatedData;
    });
  }, [calculateRanges]);

  // Add new division
  const addDivision = () => {
    const newDivision: MarshallingDivision = {
      name: `Division ${data.length + 1}`,
      bottom_range: 1,
      top_range: 100,
      order: data.length,
    };
    
    const newData = [...data, newDivision];
    const recalculatedData = calculateRanges(newData);
    setData(recalculatedData);
    setHasChanges(true);
  };

  // Remove division
  const removeDivision = useCallback((index: number) => {
    setData((prevData) => {
      if (prevData.length <= 1) {
        // Don't allow deleting the last division
        alert('You must have at least one division');
        return prevData;
      }
      
      const newData = prevData.filter((_, i) => i !== index);
      const recalculatedData = calculateRanges(newData);
      setHasChanges(true);
      return recalculatedData;
    });
  }, [calculateRanges]);

  // Save changes
  const saveChanges = () => {
    updateMutation.mutate(data);
  };

  // Reset changes
  const resetChanges = () => {
    if (fetchedData) {
      const processedData = fetchedData.map((item, index) => ({
        ...item,
        order: index,
      }));
      setData(processedData);
      setHasChanges(false);
    }
  };

  // Table columns
  const columnHelper = createColumnHelper<MarshallingDivision>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Division name',
      cell: EditableCell,
    }),
    columnHelper.accessor('bottom_range', {
      header: 'Bottom range',
      cell: EditableCell,
    }),
    columnHelper.accessor('top_range', {
      header: 'Top range',
      cell: EditableCell,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Delete range',
      cell: ({ row }) => (
        <div style={{display:"flex", justifyContent:"center"}}>
          <IconButton title={'Remove division'} icon={'delete'} onClick={() => removeDivision(row.index)} smaller/>
        </div>
      ),
    }),
  ], []);

  console.log(data)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
    },
  });

  if (isLoading) return <div className="marshalling-table__loading">Loading...</div>;
  if (error) return <div className="marshalling-table__error">Error loading data</div>;

  return (
    <div className="marshalling-table">
      <div className="marshalling-table__header">
        <h2 className="marshalling-table__title">Marshalling divisions</h2>
        <p className="marshalling-table__description">Bottom ranges are calculated to be sequential. Each division starts where the previous one ends + 1.</p>
        <div className="marshalling-table__actions">
          <TextButton onClick={addDivision} label={'Add division'}/>
          {hasChanges && (
            <>
              <TextButton
                onClick={saveChanges}
                disabled={updateMutation.isPending}
                loading={updateMutation.isPending}
                label={updateMutation.isPending ? 'Saving...' : 'Save changes'}
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

      <table className="marshalling-table__table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="marshalling-table__header-row">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="marshalling-table__header-cell">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="marshalling-table__row">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="marshalling-table__cell">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="marshalling-table__empty">
          No divisions found. Click "Add division" to create one.
        </div>
      )}
    </div>
  );
};

export default MarshallingDivisionsTable;