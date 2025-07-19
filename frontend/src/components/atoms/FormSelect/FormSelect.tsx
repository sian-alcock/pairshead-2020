import React, { ReactElement } from 'react';
import Icon from '../Icons/Icons';

import './formSelect.scss';

export interface SelectOptionsProps {
  label: string;
  value: string;
  selected?: boolean;
}

export interface FormSelectProps {
  fieldName: string;
  title: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  ariaControls?: string;
  autoFocus?: boolean;
  selectOptions: SelectOptionsProps[];
  defaultValue: string | undefined;
  hiddenLabel?: boolean;
  label?: string;
}

export const FormSelect = ({
  fieldName,
  selectOptions,
  defaultValue = 'all',
  hiddenLabel = false,
  title,
  label,
  onChange
}: FormSelectProps): ReactElement => (
  <div className='form-select'>
    {label && (
      <label htmlFor={fieldName} className={hiddenLabel ? 'form-select__label sr-only' : 'form-select__label'}>
        {label}
      </label>
    )}
    <div className="form-select__select-wrapper">
      <select
        className="form-select__select"
        defaultValue={defaultValue}
        id={fieldName}
        name={fieldName}
        onChange={onChange}
      >
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
