import React, { ReactElement } from 'react';
import './formInput.scss';

export interface FormInputProps {
  fieldName: string;
  label: string;
  hiddenLabel?: boolean;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type: 'text' | 'number',
  min?: string;
  max?: string;
}

/**
 * Primary UI component for user interaction
 */
export const FormInput = ({
  fieldName,
  hiddenLabel = false,
  label,
  defaultValue,
  placeholder,
  required = false,
  onChange,
  type = 'text',
  min,
  max
}: FormInputProps): ReactElement => (
  <div className={'form-input'}>
    <label htmlFor={fieldName} className={hiddenLabel ? 'form-select__label sr-only' : 'form-select__label'}>
      {label}
    </label>
    <input
      className="form-input__input"
      id={fieldName}
      name={fieldName}
      type={type}
      required={required}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={onChange}
      min={min}
      max={max}
    />
  </div>
);
