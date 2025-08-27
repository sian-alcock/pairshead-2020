import React from "react";
import "./statBlock.scss";
import { Link } from "react-router-dom";

export interface StatBlockProps {
  value: string | number;
  subtitle?: string;
  status: 'good' | 'warning' | 'error' | 'neutral';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  link?: string;
  linkText?: string;
}

const StatBlock: React.FC<StatBlockProps> = ({
  value,
  subtitle,
  status = 'neutral',
  loading = false,
  onClick,
  className = '',
  link,
  linkText
}) => {
  const baseClasses = [
    'stat-block',
    `stat-block--${status}`,
    onClick ? 'stat-block--clickable' : '',
    loading ? 'stat-block--loading' : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (onClick && !loading) {
      onClick();
    }
  };

  return (
    <div className={baseClasses} onClick={handleClick}>
      <div className="stat-block__content">
        <div className="stat-block__value">
          {loading ? (
            <div className="stat-block__skeleton">
              <div className="stat-block__skeleton-bar stat-block__skeleton-bar--large"></div>
            </div>
          ) : (
            <span>{value}</span>
          )}
        </div>
        
        {subtitle && (
          <div className="stat-block__subtitle">
            {loading ? (
              <div className="stat-block__skeleton">
                <div className="stat-block__skeleton-bar stat-block__skeleton-bar--small"></div>
              </div>
            ) : (
              <span>{subtitle}</span>
            )}
          </div>
        )}
      </div>
      {link && <span className="stat-block__link">
        <Link to={link}>{linkText}</Link>
      </span>}
    </div>
  );
};

export default StatBlock;