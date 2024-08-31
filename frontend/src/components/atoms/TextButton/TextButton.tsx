import React, { ReactElement } from 'react';
import { Link } from 'react-router-dom'
import Icon from '../Icons/Icons';
import './textButton.scss';

export interface TextButtonProps {

  label: string;
  onClick?: () => void;
  pathName?: string;
  isSubmit?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export default function TextButton({
  label,
  onClick,
  isSubmit = false,
  disabled = false,
  pathName,
  loading
}: TextButtonProps): ReactElement {
  return onClick || isSubmit ? (
    <button
      className="text-button"
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
        pathname: pathName
      }}>
      {label}
    </Link>
  );
}
