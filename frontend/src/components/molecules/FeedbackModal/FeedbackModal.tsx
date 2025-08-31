import React, { useEffect, useRef, ReactElement, ReactNode, useState } from "react";
import { motion } from "framer-motion";
import "./feedbackModal.scss";
import { IconButton } from "../../atoms/IconButton/IconButton";
import FocusTrap from "../../hooks/useFocusTrap";

export interface FeedbackModalProps {
  children: ReactNode;
  closeModal: () => void;
  isOpen: boolean;

  // Auto-close functionality
  autoClose?: boolean; // Enable auto-close feature
  autoCloseDelay?: number; // Delay in milliseconds (default: 2000)
  autoCloseMessage?: string; // Custom message to show during countdown
  onAutoCloseStart?: () => void; // Callback when auto-close countdown starts
}

/**
 * Primary UI component for user interaction with optional auto-close functionality
 */

export const FeedbackModal = ({
  isOpen,
  closeModal,
  children,
  autoClose = false,
  autoCloseDelay = 2000,
  autoCloseMessage = "Closing...",
  onAutoCloseStart
}: FeedbackModalProps): ReactElement => {
  const ref = useRef<HTMLDialogElement | null>(null);
  const [isAutoClosing, setIsAutoClosing] = useState(false);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to trigger auto-close
  const triggerAutoClose = () => {
    if (!autoClose || isAutoClosing) return;

    setIsAutoClosing(true);
    if (onAutoCloseStart) {
      onAutoCloseStart();
    }

    autoCloseTimeoutRef.current = setTimeout(() => {
      setIsAutoClosing(false);
      closeModal();
    }, autoCloseDelay);
  };

  // Function to cancel auto-close
  const cancelAutoClose = () => {
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    setIsAutoClosing(false);
  };

  // Close menu on esc key (but not during auto-close countdown)
  const closeModalOnEscape = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && isOpen && !isAutoClosing) {
      closeModal();
    }
  };

  // Handle manual close (also cancels auto-close)
  const handleCloseModal = () => {
    cancelAutoClose();
    closeModal();
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
    } else {
      ref.current?.close();
      // Clean up auto-close when modal closes
      cancelAutoClose();
    }
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, []);

  // Clone children and inject auto-close trigger function if needed
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && autoClose) {
      // Look for components that might need the auto-close trigger
      // This allows child components to trigger auto-close by calling the injected function
      return React.cloneElement(child as React.ReactElement<any>, {
        ...child.props,
        onAutoCloseTrigger: triggerAutoClose,
        isModalAutoClosing: isAutoClosing
      });
    }
    return child;
  });

  return (
    <motion.dialog
      className={`feedback-modal ${isAutoClosing ? "feedback-modal--auto-closing" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={ref}
    >
      <FocusTrap>
        <div className="feedback-modal__outer-wrapper">
          <div className="feedback-modal__container">
            <div className="feedback-modal__content">
              {enhancedChildren}

              {/* Auto-close indicator */}
              {isAutoClosing && autoCloseMessage && (
                <div className="feedback-modal__auto-close-indicator">
                  <small>{autoCloseMessage}</small>
                </div>
              )}
            </div>
          </div>
          <div className="feedback-modal__close-wrapper">
            <div className="feedback-modal__close">
              <IconButton title="Close" icon="cross" onClick={handleCloseModal} disabled={isAutoClosing} />
            </div>
          </div>
        </div>
      </FocusTrap>
    </motion.dialog>
  );
};
