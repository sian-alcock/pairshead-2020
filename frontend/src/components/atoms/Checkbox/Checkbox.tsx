import React, { ReactElement, ChangeEvent } from 'react';
import './checkbox.scss';

export interface CheckboxProps {
  name: string;
  value?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  label: string;
  id: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function Checkbox({
  name,
  defaultChecked,
  checked,
  label,
  id,
  value,
  onChange
}: CheckboxProps): ReactElement {
  return (
    <div className='checkbox'>
      <input
        type="checkbox"
        value={value}
        id={id}
        name={name}
        className="checkbox__input"
        onChange={onChange}
        defaultChecked={defaultChecked}
        checked={checked}
      />
      <label htmlFor={id} className="checkbox__label">
        {label}
      </label>
    </div>
  );
}
