// SequenceList.tsx
import React from "react";
import { TimeProps } from "../../../../types/components.types";
import { formatTimes } from "../../../../lib/helpers";

export const SequenceList: React.FC<{ items: TimeProps[]; label: string }> = ({ items, label }) => {
  if (!items.length) return <span>No {label.toLowerCase()} times</span>;

  return (
    <ul className="race-times-table__list">
      {items.map((t, idx) => (
        <li key={t.id}>
          {formatTimes(t.time_tap)} <small>(#{t.sequence})</small>
        </li>
      ))}
    </ul>
  );
};
