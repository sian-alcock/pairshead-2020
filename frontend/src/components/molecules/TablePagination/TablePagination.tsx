import React from 'react';
import { Table } from '@tanstack/react-table';
import './tablePagination.scss'
import TextButton from '../../atoms/TextButton/TextButton';
import { FormInput } from '../../atoms/FormInput/FormInput';
import { FormSelect } from '../../atoms/FormSelect/FormSelect';

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

  const options = pageSizeOptions.map((option) => ({
    label: `Show ${option} rows`,
    value: option,
  }))

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = e.target.value ? Number(e.target.value) - 1 : 0;
    table.setPageIndex(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    table.setPageSize(Number(e.target.value));
  };

  return (
    <div className={`table-pagination ${className}`}>
      <div className="table-pagination__wrapper">
        <TextButton label={'First page'} disabled={!table.getCanPreviousPage()} onClick={() => table.firstPage()}/>
        <TextButton label={'Previous page'} disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}/>
        <TextButton label={'Next page'} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}/>
        <TextButton label={'Last page'} disabled={!table.getCanNextPage()} onClick={() => table.lastPage()}/>


        Page {table.getState().pagination.pageIndex + 1} of{' '}
        {table.getPageCount().toLocaleString()}
        <span className="table-pagination__page-input">
          <FormInput
            fieldName={'page'}
            label={'Go to page'}
            type={'number'}
            min={1}
            max={table.getPageCount()}
            value={table.getState().pagination.pageIndex + 1}
            onChange={handlePageInputChange}
          />
        </span>

        {showPageSizeSelector && (
          <FormSelect
            label={'Rows'}
            value={table.getState().pagination.pageSize.toString()}
            fieldName={'select_page'}
            title={'Page'}
            selectOptions={options}
            onChange={handlePageSizeChange}
          />
        )}
      </div>

      {showRowInfo && (
        <div className="table-pagination__row-info">
          Showing {table.getRowModel().rows.length.toLocaleString()} of{' '}
          {table.getRowCount().toLocaleString()} rows
        </div>
      )}
    </div>
  );
}