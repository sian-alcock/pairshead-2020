import React, { useState, ReactNode } from "react";
import { FeedbackModal } from "../FeedbackModal/FeedbackModal";
import CSVDataLoader from "../CSVDataLoader/CSVDataLoader";
import TextButton from "../../atoms/TextButton/TextButton";

interface CSVUploadModalProps {
  disabled?: boolean;
  title?: string;
  description?: string;
  url: string;
  queryKeysToInvalidate?: string[];
  queryParams?: Record<string, string | number>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  maxFileSizeMB?: number;
  acceptedFileTypes?: string[];
  autoCloseDelay?: number;
  autoCloseMessage?: string;
}

export const CSVUploadModal: React.FC<CSVUploadModalProps> = ({
  disabled = false,
  title = "Import data",
  description,
  url,
  queryKeysToInvalidate = [],
  queryParams,
  onSuccess,
  onError,
  maxFileSizeMB = 10,
  acceptedFileTypes = [".csv", ".xlsx", ".xls"],
  autoCloseDelay = 2000,
  autoCloseMessage = "Upload completed! Closing..."
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    if (!disabled) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <TextButton onClick={handleOpenModal} disabled={disabled} label={title} />

      <FeedbackModal
        isOpen={isModalOpen}
        closeModal={handleCloseModal}
        autoClose={true}
        autoCloseDelay={autoCloseDelay}
        autoCloseMessage={autoCloseMessage}
      >
        <CSVDataLoader
          title={title}
          description={description}
          url={url}
          queryKeysToInvalidate={queryKeysToInvalidate}
          queryParams={queryParams}
          onSuccess={onSuccess}
          onError={onError}
          maxFileSizeMB={maxFileSizeMB}
          acceptedFileTypes={acceptedFileTypes}
        />
      </FeedbackModal>
    </>
  );
};
