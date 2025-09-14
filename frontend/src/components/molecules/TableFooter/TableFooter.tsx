import React from "react";
import { flexRender, HeaderGroup, Row, Cell } from "@tanstack/react-table";

// Reusable Table Footer Component
interface TableFooterProps<T = any> {
  headerGroups: HeaderGroup<T>[];
  className?: string;
  columnGroups?: Array<{
    header: string;
    columns: string[];
  }>;
}

export const TableFooter = <T,>({ headerGroups, className = "", columnGroups }: TableFooterProps<T>) => {
  return (
    <tfoot className={className}>
      {/* Grouped Headers Row (if provided) */}
      {columnGroups && (
        <tr>
          {columnGroups.map((group, index) => (
            <th key={index} colSpan={group.columns.length} className="grouped-footer">
              {group.columns.length > 1 ? group.header : ""}
            </th>
          ))}
        </tr>
      )}

      {/* Regular Headers */}
      {headerGroups.map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            return (
              <th key={header.id}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            );
          })}
        </tr>
      ))}
    </tfoot>
  );
};
