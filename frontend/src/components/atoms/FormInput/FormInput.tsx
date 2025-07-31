import React, { ReactElement } from 'react';
import './formInput.scss';

export interface FormInputProps {
  fieldName: string;
  label: string;
  hiddenLabel?: boolean;
  value?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type: 'text' | 'number',
  min?: string;
  max?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

/**
 * Primary UI component for user interaction
 */
export const FormInput = ({
  fieldName,
  hiddenLabel = false,
  label,
  value,
  placeholder,
  required = false,
  onChange,
  onBlur,
  type = 'text',
  min,
  max,
  disabled=false,
  readOnly=false
}: FormInputProps): ReactElement => (
  <div className={'form-input'}>
    <label htmlFor={fieldName} className={hiddenLabel ? 'form-input__label sr-only' : 'form-input__label'}>
      {label}
    </label>
    <input
      className="form-input__input"
      id={fieldName}
      name={fieldName}
      type={type}
      required={required}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      onBlur={onBlur}
      min={min}
      max={max}
      disabled={disabled}
      readOnly={readOnly}
    />
  </div>
);
