import React from "react";

export const UseSelector: React.FC<{
  name: string;
  raceId: number;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}> = ({ name, raceId, checked, onChange, disabled }) => (
  <label className="race-times-table__radio-label">
    <input
      className="race-times-table__radio-input"
      type="radio"
      name={name}
      value={raceId}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    <span className="race-times-table__radio-text">Use</span>
  </label>
);
