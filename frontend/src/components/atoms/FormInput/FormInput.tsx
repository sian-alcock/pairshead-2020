import React, { ReactElement } from 'react';
import './formInput.scss';

export interface FormInputProps {
  fieldName: string;
  label: string;
  hiddenLabel?: boolean;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type: 'text' | 'number' | 'email' | 'password',
  min?: number;
  max?: number;
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
  defaultValue,
  placeholder,
  required = false,
  onChange,
  onBlur,
  type = 'text',
  min,
  max,
  disabled = false,
  readOnly = false
}: FormInputProps): ReactElement => {
  // Determine if this is a controlled component
  const isControlled = value !== undefined;
  
  // Build the input props conditionally
  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    className: "form-input__input",
    id: fieldName,
    name: fieldName,
    type,
    required,
    placeholder,
    onChange,
    onBlur,
    min,
    max,
    disabled,
    readOnly
  };

  // Add either value or defaultValue, but not both
  if (isControlled) {
    inputProps.value = value;
  } else if (defaultValue !== undefined) {
    inputProps.defaultValue = defaultValue;
  }

  return (
    <div className={'form-input'}>
      <label htmlFor={fieldName} className={hiddenLabel ? 'form-input__label sr-only' : 'form-input__label'}>
        {label}
      </label>
      <input {...inputProps} />
    </div>
  );
};