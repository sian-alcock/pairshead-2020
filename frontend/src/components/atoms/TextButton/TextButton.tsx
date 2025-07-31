import React, { ReactElement } from 'react';
import { Link } from 'react-router-dom'
import Icon from '../Icons/Icons';
import './textButton.scss';

export interface TextButtonProps {
  label: string;
  onClick?: (() => void) | ((e: React.MouseEvent<HTMLButtonElement>) => void);
  pathName?: string;
  isSubmit?: boolean;
  disabled?: boolean;
  loading?: boolean;
  isCancel?: boolean;
  stateProps?: {};
  style?: 'primary' | 'secondary' | 'tertiary';
}

export default function TextButton({
  label,
  style = 'primary',
  onClick,
  isSubmit = false,
  disabled = false,
  pathName,
  loading,
  stateProps
}: TextButtonProps): ReactElement {
  return onClick || isSubmit ? (
    <button
      className={`text-button text-button--${style} ${loading ? 'text-button--loading' : 'text-'}`}
      type={isSubmit ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
      {loading && <Icon icon={"clock-spinner"} />}
    </button>
  ) : (
    <Link
      className="text-button"
      to={{
        pathname: pathName,
        state: stateProps
      }}>
      {label}
    </Link>
  );
}
