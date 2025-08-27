import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatTimeDate } from '../../../lib/helpers';
import { CSVDragDrop } from '../CSVDragDrop/CsvDragDrop';
import './csvdataloader.scss';

interface CSVDataLoaderProps {
  title?: string;
  description?: string;
  url: string;
  lines?: boolean;
  queryKeysToInvalidate?: string[]; // Changed to array of query keys to invalidate
  queryParams?: Record<string, string | number>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  maxFileSizeMB?: number;
  acceptedFileTypes?: string[];
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
  formData.append('file', file);

  // Build URL with query parameters if provided
  const urlWithParams = new URL(url, window.location.origin);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      urlWithParams.searchParams.append(key, value.toString());
    });
  }

  const response = await fetch(urlWithParams.toString(), {
    method: 'POST',
    body: formData,
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
      data: errorData,
    };
    throw error;
  }

  const responseData = await response.json();
  return responseData;
};

const CSVDataLoader: React.FC<CSVDataLoaderProps> = ({
  title,
  description,
  url,
  lines = false,
  queryKeysToInvalidate = [], // Default to empty array
  queryParams,
  onSuccess,
  onError,
  maxFileSizeMB = 10,
  acceptedFileTypes = ['.csv', '.xlsx', '.xls'],
}) => {
  const [lastUploadTime, setLastUploadTime] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Use React Query mutation with better configuration
  const uploadMutation = useMutation<UploadResponse, UploadError, UploadVariables>({
    mutationFn: uploadCSVFile,
    onSuccess: (data) => {
      console.log('Upload successful:', data);
      setLastUploadTime(Date.now());
      
      // Invalidate specific queries only if they exist
      if (queryKeysToInvalidate.length > 0) {
        queryKeysToInvalidate.forEach(queryKey => {
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
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
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
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const handleFileUpload = async (file: File): Promise<void> => {
    // Clear any previous errors
    uploadMutation.reset();
    
    return new Promise((resolve, reject) => {
      uploadMutation.mutate(
        {
          file,
          url,
          queryParams,
        },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        }
      );
    });
  };

  // Helper function to get user-friendly error message
  const getErrorMessage = (error: UploadError) => {
    // Check if it's a fetch error with status
    if (error.status) {
      if (error.status === 413) {
        return 'File is too large. Please choose a smaller file.';
      }
      if (error.status === 415) {
        return 'File type not supported. Please check the accepted file types.';
      }
      if (error.status === 400) {
        return error.message || 'Invalid file format or data.';
      }
      if (error.status === 500) {
        return 'Server error. Please try again later.';
      }
    }
    
    if (error.message) {
      if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        return 'Upload timed out. Please try again with a smaller file.';
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return 'Network error. Please check your connection and try again.';
      }
      
      return error.message;
    }
    
    return 'Upload failed. Please try again.';
  };

  return (
    <section className={`csv-data-loader ${lines ? 'csv-data-loader--lines' : ''}`}>
      {title && (
        <div className="csv-data-loader__header">
          <h2 className="csv-data-loader__title">{title}</h2>
          {description && <p className="csv-data-loader__description">{description}</p>}
        </div>
      )}

      <div className="csv-data-loader__upload-area">
        <CSVDragDrop
          onFileUpload={handleFileUpload}
          disabled={uploadMutation.isPending}
          maxFileSizeMB={maxFileSizeMB}
          acceptedFileTypes={acceptedFileTypes}
          className="csv-data-loader__drag-drop"
        />
      </div>
      
      <div className="csv-data-loader__status">
        {/* Success State */}
        {uploadMutation.isSuccess && lastUploadTime && (
          <div className="csv-data-loader__success">
            <p className="csv-data-loader__updated">
              <small>✅ Updated: {formatTimeDate(lastUploadTime)}</small>
            </p>
            {uploadMutation.data?.created_count !== undefined && (
              <p className="csv-data-loader__count">
                <small>Records processed: {uploadMutation.data.created_count}</small>
              </p>
            )}
          </div>
        )}
        
        {/* Loading State */}
        {uploadMutation.isPending && (
          <p className="csv-data-loader__loading">
            <small>🔄 Uploading and processing file...</small>
          </p>
        )}
        
        {/* Error State */}
        {uploadMutation.isError && (
          <div className="csv-data-loader__error">
            <p className="csv-data-loader__error-message">
              <small>❌ Error: {getErrorMessage(uploadMutation.error)}</small>
            </p>
            <button
              onClick={() => uploadMutation.reset()}
              className="csv-data-loader__retry-button"
            >
              Clear Error
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CSVDataLoader;