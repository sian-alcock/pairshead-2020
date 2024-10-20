import React, { ReactElement } from 'react';
import './toggle.scss';

export interface ToggleProps {
  name: string;
  value?: boolean;
  checked: boolean;
  defaultChecked?: boolean;
  label: string;
  id: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Toggle({
  name,
  defaultChecked,
  label,
  id,
  value,
  checked,
  onChange
}: ToggleProps): ReactElement {
  return (
    <label htmlFor={id} className="toggle">
    <input         
        type="checkbox"
        checked={checked}
        id={id}
        name={name}
        className="toggle__input"
        onChange={onChange}
        defaultChecked={defaultChecked} />
    {label}
    <span className="toggle__display" hidden>
      <svg aria-hidden="true" focusable="false" className="toggle__icon toggle__icon--checkmark" width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.08471 10.6237L2.29164 6.83059L1 8.11313L6.08471 13.1978L17 2.28255L15.7175 1L6.08471 10.6237Z" fill="currentcolor" stroke="currentcolor" />
      </svg>
      <svg aria-hidden="true" focusable="false" className="toggle__icon toggle__icon--cross" width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.167 0L6.5 4.667L1.833 0L0 1.833L4.667 6.5L0 11.167L1.833 13L6.5 8.333L11.167 13L13 11.167L8.333 6.5L13 1.833L11.167 0Z" fill="currentcolor" />
      </svg>
    </span>
  </label>
  );
}
