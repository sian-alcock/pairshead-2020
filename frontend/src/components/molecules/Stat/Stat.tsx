import React, { ReactElement } from "react";
import "./stat.scss";

export interface StatProps {
  statKey: string;
  statValue: string | number;
  ragColor?: "red" | "amber" | "green" | "neutral";
}

export default function Stat({ statKey, statValue, ragColor = "neutral" }: StatProps): ReactElement {
  return (
    <div className={`stat stat--${ragColor}`}>
      <span className="stat__key">{statKey}</span>
      <span className="stat__value">: {statValue}</span>
    </div>
  );
}
