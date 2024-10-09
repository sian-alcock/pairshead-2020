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
}

export default function TextButton({
  label,
  onClick,
  isSubmit = false,
  disabled = false,
  pathName,
  loading,
  stateProps
}: TextButtonProps): ReactElement {
  return onClick || isSubmit ? (
    <button
      className={loading ? 'text-button text-button--loading' : 'text-button'}
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
