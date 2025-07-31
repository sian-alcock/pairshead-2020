import React from 'react';
import { flexRender, HeaderGroup, Row, Cell } from '@tanstack/react-table';
import './tableHeader.scss'

// Reusable Table Header Component
interface TableHeaderProps<T = any> {
  headerGroups: HeaderGroup<T>[];
  className?: string;
  columnGroups?: Array<{
    header: string;
    columns: string[];
  }>;
}

export const TableHeader = <T,>({ 
  headerGroups, 
  className = "",
  columnGroups 
}: TableHeaderProps<T>) => {
  return (
    <thead className={className}>
      {/* Grouped Headers Row (if provided) */}
      {columnGroups && (
        <tr>
          {columnGroups.map((group, index) => (
            <th key={index} colSpan={group.columns.length} className="grouped-header">
              {group.columns.length > 1 ? group.header : ''}
            </th>
          ))}
        </tr>
      )}
      
      {/* Regular Headers */}
      {headerGroups.map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const sortDirection = header.column.getIsSorted();
            const canSort = header.column.getCanSort();
            
            return (
              <th key={header.id}>
                {header.isPlaceholder ? null : (
                  <div
                    className={`
                      table-header__content
                      ${canSort ? 'table-header--sortable' : ''}
                      ${sortDirection ? 'table-header--sorted' : ''}
                      ${sortDirection === 'asc' ? 'table-header--sorted-asc' : ''}
                      ${sortDirection === 'desc' ? 'table-header--sorted-desc' : ''}
                    `.trim()}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="table-header__text">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </span>
                    {canSort && (
                      <div className="table-header__sort-icon">
                        <div className="table-header__arrow table-header__arrow--up"></div>
                        <div className="table-header__arrow table-header__arrow--down"></div>
                      </div>
                    )}
                  </div>
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
};