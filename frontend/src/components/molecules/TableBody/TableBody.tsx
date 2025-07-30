import React from 'react';
import { flexRender, HeaderGroup, Row, Cell } from '@tanstack/react-table';

interface TableRowProps<T = any> {
  row: Row<T>;
  className?: string;
  cellClassName?: string;
}

export const TableRow = <T,>({ 
  row, 
  className = "",
  cellClassName = "" 
}: TableRowProps<T>) => {
  return (
    <tr key={row.id} className={className}>
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className={cellClassName}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
};

interface TableBodyProps<T = any> {
  rows: Row<T>[];
  className?: string;
  rowClassName?: string;
  cellClassName?: string;
}

export const TableBody = <T,>({ 
  rows, 
  className = "",
  rowClassName = "",
  cellClassName = "" 
}: TableBodyProps<T>) => {
  return (
    <tbody className={className}>
      {rows.map((row) => (
        <TableRow 
          key={row.id}
          row={row} 
          className={rowClassName}
          cellClassName={cellClassName}
        />
      ))}
    </tbody>
  );
};