import React from "react";

export const FormRadioButton: React.FC<{
  id?: string;
  name: string;
  label?: string;
  raceId: number;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}> = ({ id, name, label = "Use", raceId, checked, onChange, disabled }) => (
  <label className="form-radio-button__radio-label">
    <input
      id={id ?? name}
      className="form-radio-button__radio-input"
      type="radio"
      name={name}
      value={raceId}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    <span className="form-radio-button__radio-text">{label}</span>
  </label>
);
