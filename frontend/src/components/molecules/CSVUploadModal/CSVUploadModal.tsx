import React, { useEffect, useRef, ReactElement, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatTimeDate } from "../../../lib/helpers";
import { CSVDragDrop } from "../CSVDragDrop/CsvDragDrop";
import { IconButton } from "../../atoms/IconButton/IconButton";
import FocusTrap from "../../hooks/useFocusTrap";
import "./csvUploadModal.scss";

interface CSVUploadModalProps {
  isOpen: boolean;
  closeModal: () => void;
  title?: string;
  description?: string;
  url: string;
  queryKeysToInvalidate?: string[];
  queryParams?: Record<string, string | number>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  maxFileSizeMB?: number;
  acceptedFileTypes?: string[];
  autoCloseDelay?: number; // milliseconds to wait before auto-closing on success
}

interface UploadResponse {
  data: any;
  message?: string;
  status?: string;
  created_count?: number;
}

interface UploadError extends Error {
  status?: number;
  statusText?: string;
  response?: {
    status: number;
    statusText: string;
    data: any;
  };
}

interface UploadVariables {
  file: File;
  url: string;
  queryParams?: Record<string, string | number>;
}

// Separate upload function using Fetch API
const uploadCSVFile = async ({ file, url, queryParams }: UploadVariables): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  // Build URL with query parameters if provided
  const urlWithParams = new URL(url, window.location.origin);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      urlWithParams.searchParams.append(key, value.toString());
    });
  }

  const response = await fetch(urlWithParams.toString(), {
    method: "POST",
    body: formData
    // Don't set Content-Type header - let the browser set it with boundary
  });

  if (!response.ok) {
    const errorData = await response.text();
    let errorMessage: string;

    try {
      const parsedError = JSON.parse(errorData);
      errorMessage = parsedError.message || parsedError.detail || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      errorMessage = errorData || `HTTP ${response.status}: ${response.statusText}`;
    }

    const error = new Error(errorMessage) as UploadError;
    error.status = response.status;
    error.statusText = response.statusText;
    error.response = {
      status: response.status,
      statusText: response.statusText,
      data: errorData
    };
    throw error;
  }

  const responseData = await response.json();
  return responseData;
};

export const CSVUploadModal = ({
  isOpen,
  closeModal,
  title = "Import Data",
  description = "Upload a CSV file to import your data",
  url,
  queryKeysToInvalidate = [],
  queryParams,
  onSuccess,
  onError,
  maxFileSizeMB = 10,
  acceptedFileTypes = [".csv", ".xlsx", ".xls"],
  autoCloseDelay = 2000
}: CSVUploadModalProps): ReactElement => {
  const [lastUploadTime, setLastUploadTime] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const ref = useRef<HTMLDialogElement | null>(null);
  const queryClient = useQueryClient();

  // Close modal on esc key
  const closeModalOnEscape = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && isOpen && !uploadMutation.isPending) {
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    if (!uploadMutation.isPending) {
      uploadMutation.reset();
      setLastUploadTime(null);
      setIsClosing(false);
      closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", closeModalOnEscape);
    return () => {
      document.removeEventListener("keydown", closeModalOnEscape);
    };
  });

  useEffect(() => {
    if (isOpen) {
      ref.current?.showModal();
      setIsClosing(false);
    } else {
      ref.current?.close();
    }
  }, [isOpen]);

  // Use React Query mutation with better configuration
  const uploadMutation = useMutation<UploadResponse, UploadError, UploadVariables>({
    mutationFn: uploadCSVFile,
    onSuccess: (data) => {
      console.log("Upload successful:", data);
      setLastUploadTime(Date.now());

      // Invalidate specific queries only if they exist
      if (queryKeysToInvalidate.length > 0) {
        queryKeysToInvalidate.forEach((queryKey) => {
          // Only invalidate queries that actually exist
          const queryCache = queryClient.getQueryCache();
          const existingQueries = queryCache.findAll({ queryKey: [queryKey] });

          if (existingQueries.length > 0) {
            console.log(`Invalidating query: ${queryKey}`);
            queryClient.invalidateQueries({
              queryKey: [queryKey],
              exact: false
            });
          } else {
            console.log(`No existing queries found for key: ${queryKey}, skipping invalidation`);
          }
        });
      }

      // Call optional success callback
      if (onSuccess) {
        onSuccess(data);
      }

      // Auto-close modal after delay
      if (autoCloseDelay > 0) {
        setIsClosing(true);
        setTimeout(() => {
          handleCloseModal();
        }, autoCloseDelay);
      }
    },
    onError: (error) => {
      console.error("Upload failed:", error);

      // Enhanced error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }

      // Call optional error callback
      if (onError) {
        onError(error);
      }
    },
    // Add retry logic for network errors
    retry: (failureCount, error: UploadError) => {
      // Don't retry on 4xx errors (client errors)
      if (error.status && error.status < 500) {
        return false;
      }
      // Retry up to 2 times for network/server errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
  });

  const handleFileUpload = async (file: File): Promise<void> => {
    // Clear any previous errors
    uploadMutation.reset();
    setIsClosing(false);

    return new Promise((resolve, reject) => {
      uploadMutation.mutate(
        {
          file,
          url,
          queryParams
        },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        }
      );
    });
  };

  // Helper function to get user-friendly error message
  const getErrorMessage = (error: UploadError) => {
    // Check if it's a fetch error with status
    if (error.status) {
      if (error.status === 413) {
        return "File is too large. Please choose a smaller file.";
      }
      if (error.status === 415) {
        return "File type not supported. Please check the accepted file types.";
      }
      if (error.status === 400) {
        return error.message || "Invalid file format or data.";
      }
      if (error.status === 500) {
        return "Server error. Please try again later.";
      }
    }

    if (error.message) {
      if (error.message.includes("timeout") || error.message.includes("AbortError")) {
        return "Upload timed out. Please try again with a smaller file.";
      }

      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        return "Network error. Please check your connection and try again.";
      }

      return error.message;
    }

    return "Upload failed. Please try again.";
  };

  return (
    <motion.dialog
      className="csv-upload-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={ref}
    >
      <FocusTrap>
        <div className="csv-upload-modal__outer-wrapper">
          <div className="csv-upload-modal__container">
            <div className="csv-upload-modal__header">
              <h2 className="csv-upload-modal__title">{title}</h2>
              {description && <p className="csv-upload-modal__description">{description}</p>}
            </div>

            <div className="csv-upload-modal__content">
              <div className="csv-upload-modal__upload-area">
                <CSVDragDrop
                  onFileUpload={handleFileUpload}
                  disabled={uploadMutation.isPending || isClosing}
                  maxFileSizeMB={maxFileSizeMB}
                  acceptedFileTypes={acceptedFileTypes}
                  className="csv-upload-modal__drag-drop"
                />
              </div>

              <div className="csv-upload-modal__status">
                {/* Success State */}
                {uploadMutation.isSuccess && lastUploadTime && (
                  <div className="csv-upload-modal__success">
                    <p className="csv-upload-modal__updated">
                      <small>✅ Updated: {formatTimeDate(lastUploadTime)}</small>
                    </p>
                    {uploadMutation.data?.created_count !== undefined && (
                      <p className="csv-upload-modal__count">
                        <small>Records processed: {uploadMutation.data.created_count}</small>
                      </p>
                    )}
                    {isClosing && (
                      <p className="csv-upload-modal__closing">
                        <small>Closing in a moment...</small>
                      </p>
                    )}
                  </div>
                )}

                {/* Loading State */}
                {uploadMutation.isPending && (
                  <p className="csv-upload-modal__loading">
                    <small>🔄 Uploading and processing file...</small>
                  </p>
                )}

                {/* Error State */}
                {uploadMutation.isError && (
                  <div className="csv-upload-modal__error">
                    <p className="csv-upload-modal__error-message">
                      <small>❌ Error: {getErrorMessage(uploadMutation.error)}</small>
                    </p>
                    <button onClick={() => uploadMutation.reset()} className="csv-upload-modal__retry-button">
                      Clear Error
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="csv-upload-modal__close-wrapper">
            <div className="csv-upload-modal__close">
              <IconButton title="Close" icon="cross" onClick={handleCloseModal} disabled={uploadMutation.isPending} />
            </div>
          </div>
        </div>
      </FocusTrap>
    </motion.dialog>
  );
};
