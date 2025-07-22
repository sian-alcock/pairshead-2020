import React from 'react';
import { Table } from '@tanstack/react-table';
import './tablePagination.scss'

interface TablePaginationProps<T> {
  table: Table<T>;
  className?: string;
  showRowInfo?: boolean;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
}

export default function TablePagination<T>({
  table,
  className = "",
  showRowInfo = true,
  showPageSizeSelector = true,
  pageSizeOptions = [25, 50, 100, 500]
}: TablePaginationProps<T>) {
  return (
    <div className={`table-pagination ${className}`}>
      {/* Navigation Controls */}
      <div className="table-pagination__wrapper">
        <button
          className="table-pagination__button-first"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
          title="First page"
        >
          {'First'}
        </button>
        <button
          className="table-pagination__button-previous"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          title="Previous page"
        >
          {'Previous'}
        </button>
        <button
          className="table-pagination__button-next"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          title="Next page"
        >
          {'Next'}
        </button>
        <button
          className="table-pagination__button-last"
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
          title="Last page"
        >
          {'Last'}
        </button>

        {/* Page Info */}
        <span className="table-pagination__page-info">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount().toLocaleString()}
          </strong>
        </span>

        {/* Go to Page Input */}
        <span className="table-pagination__page-input">
          | Go to page:
          <input
            type="number"
            min="1"
            max={table.getPageCount()}
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className=""
            title="Go to specific page"
          />
        </span>

        {/* Page Size Selector */}
        {showPageSizeSelector && (
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
            className="table-pagination__select"
            title="Select page size"
          >
            {pageSizeOptions.map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Row Info */}
      {showRowInfo && (
        <div className="table-pagination__row-info">
          Showing {table.getRowModel().rows.length.toLocaleString()} of{' '}
          {table.getRowCount().toLocaleString()} rows
        </div>
      )}
    </div>
  );
}