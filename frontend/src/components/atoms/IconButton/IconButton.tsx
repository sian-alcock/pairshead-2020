import React, { ReactElement, forwardRef } from 'react';
import Icon, { IconType } from '../Icons/Icons';

import './iconButton.scss';

export interface IconButtonProps {
  url?: string;
  title: string;
  icon: IconType;
  externalLink?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  ariaControls?: string;
  ariaExpanded?: boolean;
  isSubmit?: boolean;
  disabled?: boolean;
  sitsInTable?: boolean;
}

type Ref = HTMLButtonElement | null;

export const IconButton = forwardRef<Ref, IconButtonProps>(
  (
    {
      url,
      title,
      icon,
      externalLink = false,
      onClick,
      ariaControls,
      isSubmit = false,
      disabled = false,
      ariaExpanded,
      sitsInTable = false
    },
    ref
  ): ReactElement =>
    onClick || isSubmit ? (
      <button
        className={sitsInTable ? "icon-button icon-button--small" : "icon-button"}
        disabled={disabled}
        onClick={onClick}
        aria-controls={ariaControls}
        type={isSubmit ? 'submit' : 'button'}
        ref={ref}
        aria-expanded={ariaExpanded}
      >
        <i className="icon-button__icon">
          <Icon icon={icon} ariaHidden={true} />
        </i>
        <span className="sr-only">{title}</span>
      </button>
    ) : (
      <a
        className={sitsInTable ? "icon-button icon-button--small" : "icon-button"}
        href={url}
        target={externalLink ? '_blank' : '_self'}
        rel={externalLink ? 'noopener noreferrer' : ''}
      >
        <i className="icon-button__icon">
          <Icon icon={icon} ariaHidden={true} />
        </i>

        <span className="sr-only">{title}</span>
      </a>
    )
);
IconButton.displayName = 'IconButton';
