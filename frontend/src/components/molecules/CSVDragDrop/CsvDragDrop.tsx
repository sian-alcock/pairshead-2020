import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import Icon from "../../atoms/Icons/Icons";
import "./csvDragDrop.scss";
import TextButton from "../../atoms/TextButton/TextButton";

interface UploadState {
  isUploading: boolean;
  isDragOver: boolean;
  progress: number;
  error?: string;
  success?: boolean;
  fileName?: string;
}

interface CSVUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  disabled?: boolean;
  maxFileSizeMB?: number;
  className?: string;
  acceptedFileTypes?: string[];
}

export const CSVDragDrop: React.FC<CSVUploadProps> = ({
  onFileUpload,
  disabled = false,
  maxFileSizeMB = 10,
  className = "",
  acceptedFileTypes = [".csv"]
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isDragOver: false,
    progress: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `Please select a valid file type: ${acceptedFileTypes.join(", ")}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      return `File size must be less than ${maxFileSizeMB}MB`;
    }

    return null;
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState((prev) => ({
        ...prev,
        error: validationError,
        success: false
      }));
      return;
    }

    setUploadState({
      isUploading: true,
      isDragOver: false,
      progress: 0,
      fileName: file.name,
      error: undefined,
      success: false
    });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 20, 90)
        }));
      }, 200);

      await onFileUpload(file);

      clearInterval(progressInterval);
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        progress: 100,
        success: true
      }));
    } catch (error) {
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : "Upload failed",
        success: false
      }));
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;

    if (!disabled && !uploadState.isUploading) {
      setUploadState((prev) => ({ ...prev, isDragOver: true }));
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;

    if (dragCounter.current === 0) {
      setUploadState((prev) => ({ ...prev, isDragOver: false }));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;

    setUploadState((prev) => ({ ...prev, isDragOver: false }));

    if (disabled || uploadState.isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input value to allow re-selecting the same file
    e.target.value = "";
  };

  const openFileDialog = () => {
    if (!disabled && !uploadState.isUploading) {
      fileInputRef.current?.click();
    }
  };

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      isDragOver: false,
      progress: 0
    });
  };

  const getDropZoneClasses = () => {
    let classes = "csv-drag-drop__drop-zone";

    if (disabled || uploadState.isUploading) {
      classes += " is-uploading ";
    } else if (uploadState.isDragOver) {
      classes += " is-active ";
    } else if (uploadState.error) {
      classes += " is-error ";
    } else if (uploadState.success) {
      classes += " is-success ";
    } else {
      classes += " is-idle ";
    }

    return classes + className;
  };

  return (
    <div className="csv-drag-drop">
      <div
        className={getDropZoneClasses()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploadState.isUploading}
        />

        {/* Upload States */}
        {!uploadState.isUploading && !uploadState.success && !uploadState.error && (
          <div className="csv-drag-drop__zone-wrapper">
            <div className={`csv-drag-drop ${uploadState.isDragOver ? "text-blue-500" : "text-gray-400"}`}>
              <Icon icon={"upload"} />
            </div>
            <div>
              <p className={`text-sm font-medium ${uploadState.isDragOver ? "text-blue-700" : "text-gray-900"}`}>
                {uploadState.isDragOver ? "Drop your CSV file here" : "Drop CSV file here or click to browse"}
              </p>
            </div>
            {!uploadState.isDragOver && <TextButton label={"Choose file"} disabled={disabled} />}
          </div>
        )}

        {uploadState.isUploading && (
          <div className="csv-drag-drop__zone-wrapper">
            <div className="csv-drag-drop__icon-wrapper">
              <Icon icon={"clock-spinner"} />
              <Icon icon={"file"} />
            </div>
            <div>
              <p className="csv-drag-drop__status csv-drag-drop__status--uploading">Uploading {uploadState.fileName}</p>
              <div className="csv-drag-drop__progress-bar-wrapper">
                <div className="csv-drag-drop__progress-bar" style={{ width: `${uploadState.progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round(uploadState.progress)}% complete</p>
            </div>
          </div>
        )}

        {uploadState.success && (
          <div className="csv-drag-drop__zone-wrapper">
            <div className="csv-drag-drop__icon-wrapper">
              <Icon icon={"success"} />
            </div>
            <div>
              <p className="csv-drag-drop__status csv-drag-drop__status--success">Upload successful!</p>
              <p className="csv-drag-drop__message csv-drag-drop__message--success">
                {uploadState.fileName} has been processed
              </p>
            </div>
            <TextButton
              label={"Upload another"}
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
            />
          </div>
        )}

        {uploadState.error && (
          <div className="csv-drag-drop__zone-wrapper">
            <div className="">
              <Icon icon={"warning"} />
            </div>
            <div>
              <p className="csv-drag-drop__status csv-drag-drop__status--error">Upload failed</p>
              <p className="csv-drag-drop__message csv-drag-drop__message--error">{uploadState.error}</p>
            </div>
            <div className="csv-drag-drop__button-wrapper">
              <TextButton
                label={"Try again"}
                onClick={(e) => {
                  e.stopPropagation();
                  resetUpload();
                }}
              />
              <TextButton
                label={"Cancel"}
                onClick={(e) => {
                  e.stopPropagation();
                  resetUpload();
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* File requirements */}
      <div className="csv-drag-drop__file-requirements">
        <p>Accepted formats: {acceptedFileTypes.join(", ")}</p>
        <p>Maximum size: {maxFileSizeMB}MB</p>
      </div>
    </div>
  );
};
