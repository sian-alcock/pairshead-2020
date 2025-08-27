import React, { ReactElement } from "react";
import './stat.scss'

export interface StatProps {
  statKey: string;
  statValue: string | number;
}

export default function Stat({statKey, statValue}: StatProps): ReactElement {
  return (
    <div className="stat">
        <span className="stat__key">{statKey}</span>
        <span className="stat__value">: {statValue}</span>
    </div>
  );
}