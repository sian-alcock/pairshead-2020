import React from "react";
import { useFileDownload } from "../../hooks/useFileDownload";
import TextButton from "../../atoms/TextButton/TextButton";
import "./dataExportComponent.scss";

interface DataExportComponentProps {
  url: string;
  buttonText: string;
  filename?: string;
  className?: string;
  variant?: "primary" | "secondary" | "success" | "danger";
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: any;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const DataExportComponent: React.FC<DataExportComponentProps> = ({
  url,
  buttonText,
  filename,
  className = "",
  method = "GET",
  headers,
  body,
  onSuccess,
  onError,
  disabled = false
}) => {
  const { downloadFile, isDownloading, error, progress } = useFileDownload();

  const handleExport = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      await downloadFile(url, {
        filename,
        method,
        headers,
        body
      });

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Download failed";
      onError?.(errorMessage);
    }
  };

  const isDisabled = disabled || isDownloading;

  return (
    <div className={`data-export ${className}`}>
      <TextButton
        label={isDownloading ? buttonText + "..." : buttonText}
        disabled={isDisabled}
        onClick={handleExport}
      />
      {progress !== null && (
        <div className="data-export__progress">
          <div className="data-export__progress-info">
            <span className="data-export__progress-text">Downloading...</span>
            <span className="data-export__progress-percentage">{progress}%</span>
          </div>
          <div className="data-export__progress-bar">
            <div className="data-export__progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="data-export__error" role="alert">
          <span className="data-export__error-icon" aria-hidden="true">
            ⚠
          </span>
          <span className="data-export__error-message">Error: {error}</span>
        </div>
      )}
    </div>
  );
};

export default DataExportComponent;
