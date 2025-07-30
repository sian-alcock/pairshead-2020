import React, { useState, ReactElement } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { formatTimeDate } from '../../../lib/helpers';
import './csvdataloader.scss';
import { CSVDragDrop } from '../CSVDragDrop/CsvDragDrop';

interface CSVDataLoaderProps {
  title?: string;
  description?: string;
  url: string;
  lines?: boolean;
  queryKey?: string; // Optional query key to invalidate after successful upload
  queryParams?: Record<string, string | number>; // Optional query parameters
  onSuccess?: (data: any) => void; // Optional success callback
  onError?: (error: any) => void; // Optional error callback
  maxFileSizeMB?: number; // Optional file size limit
  acceptedFileTypes?: string[]; // Optional accepted file types
}

interface UploadResponse {
  data: any;
  message?: string;
}

interface UploadVariables {
  file: File;
  url: string;
  queryParams?: Record<string, string | number>;
}

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

  const response = await axios.post(urlWithParams.toString(), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

const CSVDataLoader: React.FC<CSVDataLoaderProps> = ({
  title,
  description,
  url,
  lines = false,
  queryKey,
  queryParams,
  onSuccess,
  onError,
  maxFileSizeMB = 10,
  acceptedFileTypes = ['.csv', '.xlsx', '.xls'],
}): ReactElement => {
  const [updated, setUpdated] = useState<number | null>(null);
  
  const queryClient = useQueryClient();

  const uploadMutation = useMutation<UploadResponse, Error, UploadVariables>({
    mutationFn: uploadCSVFile,
    onSuccess: (data) => {
      console.log(data);
      setUpdated(Date.now());
      
      // Invalidate related queries if queryKey is provided
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      
      // Call optional success callback
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      
      // Call optional error callback
      if (onError) {
        onError(error);
      }
    },
  });

  const handleFileUpload = async (file: File): Promise<void> => {
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

  return (
    <section className={`csv-data-loader ${lines ? 'csv-data-loader--lines' : ''}`}>
      {title && <div className="csv-data-loader__header">
        <h2 className="csv-data-loader__title">{title}</h2>
        {description && <p className="csv-data-loader__description">{description}</p>}
      </div>}

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
        {updated && (
          <p className="csv-data-loader__updated">
            <small>Updated: {formatTimeDate(updated)}</small>
          </p>
        )}
        
        {uploadMutation.isError && (
          <p className="csv-data-loader__error">
            <small>Error: {uploadMutation.error?.message}</small>
          </p>
        )}
      </div>
    </section>
  );
};

export default CSVDataLoader;