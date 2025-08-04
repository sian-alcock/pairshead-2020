import React, { ReactElement } from 'react';
import Icon from '../Icons/Icons';

import './formSelect.scss';

export interface SelectOptionsProps {
  label: string | number;
  value: string | number;
  selected?: boolean;
}

export interface FormSelectProps {
  fieldName: string;
  title: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  ariaControls?: string;
  autoFocus?: boolean;
  selectOptions: SelectOptionsProps[];
  value?: string | undefined;
  defaultValue?: string | undefined;
  hiddenLabel?: boolean;
  label?: string;
}

export const FormSelect = ({
  fieldName,
  selectOptions,
  value,
  defaultValue = 'all',
  hiddenLabel = false,
  title,
  label,
  onChange
}: FormSelectProps): ReactElement => {
  // Determine if this is a controlled component
  const isControlled = value !== undefined;
  
  // Build the select props conditionally
  const selectProps: React.SelectHTMLAttributes<HTMLSelectElement> = {
    className: "form-select__select",
    id: fieldName,
    name: fieldName,
    onChange
  };

  // Add either value or defaultValue, but not both
  if (isControlled) {
    selectProps.value = value;
  } else {
    selectProps.defaultValue = defaultValue;
  }

  return (
    <div className='form-select'>
      {label && (
        <label htmlFor={fieldName} className={hiddenLabel ? 'form-select__label sr-only' : 'form-select__label'}>
          {label}
        </label>
      )}
      <div className="form-select__select-wrapper">
        <select {...selectProps}>
          <option value="all">{title}</option>
          {selectOptions &&
            selectOptions.map((option, idx) => (
              <option value={option.value} key={idx}>
                {option.label}
              </option>
            ))}
        </select>
        <div className="form-select__icon">
          <Icon icon="chevron-down" />
        </div>
      </div>
    </div>
  );
};