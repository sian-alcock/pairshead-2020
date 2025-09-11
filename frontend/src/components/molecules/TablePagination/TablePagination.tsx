import React from "react";
import { Table } from "@tanstack/react-table";
import "./tablePagination.scss";
import TextButton from "../../atoms/TextButton/TextButton";
import { FormInput } from "../../atoms/FormInput/FormInput";
import { FormSelect } from "../../atoms/FormSelect/FormSelect";

interface TablePaginationProps<T> {
  table: Table<T>;
  className?: string;
  showRowInfo?: boolean;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  rowTypeName?: string;
  totalRowCount?: number;
}

export default function TablePagination<T>({
  table,
  className = "",
  showRowInfo = true,
  showPageSizeSelector = true,
  pageSizeOptions = [25, 50, 100, 500],
  rowTypeName = "crews",
  totalRowCount
}: TablePaginationProps<T>) {
  const options = pageSizeOptions.map((option) => ({
    label: `Show ${option} crews`,
    value: option
  }));

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = e.target.value ? Number(e.target.value) - 1 : 0;
    table.setPageIndex(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    table.setPageSize(Number(e.target.value));
  };

  // Calculate the range of rows being shown
  const getCurrentRowRange = () => {
    const currentPage = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;

    // Use totalRowCount if provided (for server-side pagination), otherwise fall back to table's row count
    const totalRows = totalRowCount !== undefined ? totalRowCount : table.getRowCount();

    if (totalRows === 0) {
      return { start: 0, end: 0, total: 0 };
    }

    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalRows);

    return { start, end, total: totalRows };
  };

  return (
    <div className={`table-pagination ${className}`}>
      <div className="table-pagination__wrapper">
        <TextButton label={"First page"} disabled={!table.getCanPreviousPage()} onClick={() => table.firstPage()} />
        <TextButton
          label={"Previous page"}
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        />
        <TextButton label={"Next page"} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} />
        <TextButton label={"Last page"} disabled={!table.getCanNextPage()} onClick={() => table.lastPage()} />
        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount().toLocaleString()}
        <span className="table-pagination__page-input">
          <FormInput
            fieldName={"page"}
            label={"Go to page"}
            type={"number"}
            min={1}
            max={table.getPageCount()}
            value={table.getState().pagination.pageIndex + 1}
            onChange={handlePageInputChange}
          />
        </span>
        {showPageSizeSelector && (
          <FormSelect
            label={"Rows"}
            value={table.getState().pagination.pageSize.toString()}
            fieldName={"select_page"}
            title={"Page"}
            selectOptions={options}
            onChange={handlePageSizeChange}
          />
        )}
      </div>

      {showRowInfo &&
        (() => {
          const { start, end, total } = getCurrentRowRange();

          if (total === 0) {
            return <div className="table-pagination__row-info">No {rowTypeName} to display</div>;
          }

          return (
            <div className="table-pagination__row-info">
              Showing {start.toLocaleString()} to {end.toLocaleString()} of {total.toLocaleString()} {rowTypeName}
            </div>
          );
        })()}
    </div>
  );
}
