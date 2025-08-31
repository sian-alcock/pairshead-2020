import { useState, useCallback } from "react";

interface DownloadOptions {
  filename?: string;
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  body?: any;
}

interface UseFileDownloadReturn {
  downloadFile: (url: string, options?: DownloadOptions) => Promise<void>;
  isDownloading: boolean;
  error: string | null;
  progress: number | null;
}

export const useFileDownload = (): UseFileDownloadReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const downloadFile = useCallback(async (url: string, options: DownloadOptions = {}) => {
    const { filename, headers = {}, method = "GET", body } = options;

    setIsDownloading(true);
    setError(null);
    setProgress(null);

    try {
      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers
        }
      };

      if (body && method !== "GET") {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get content length for progress tracking
      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : null;

      // Read the response as a stream for progress tracking
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          // Update progress if we know the total size
          if (total) {
            setProgress(Math.round((receivedLength / total) * 100));
          }
        }
      }

      // Combine chunks into a single Uint8Array
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      // Create blob from the chunks
      const blob = new Blob([chunksAll]);
      const downloadUrl = window.URL.createObjectURL(blob);

      // Determine filename
      let finalFilename = filename;
      if (!finalFilename) {
        // Try to get filename from Content-Disposition header
        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            finalFilename = filenameMatch[1].replace(/['"]/g, "");
          }
        }

        // Fallback to extracting from URL
        if (!finalFilename) {
          const urlParts = url.split("/");
          finalFilename = urlParts[urlParts.length - 1] || "download";
        }
      }

      // Create and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = finalFilename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setProgress(100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Download failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsDownloading(false);
      // Clear progress after a short delay
      setTimeout(() => setProgress(null), 1000);
    }
  }, []);

  return {
    downloadFile,
    isDownloading,
    error,
    progress
  };
};
