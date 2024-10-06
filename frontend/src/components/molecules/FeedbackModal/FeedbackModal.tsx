import React, { useEffect, useRef, ReactElement, ReactNode } from 'react';
import { motion } from 'framer-motion';
import './feedbackModal.scss';
import { IconButton } from '../../atoms/IconButton/IconButton';
import FocusTrap from '../../hooks/useFocusTrap';

export interface FeedbackModalProps {
  children: ReactNode;
  closeModal: () => void;
  isOpen: boolean;
}

/**
 * Primary UI component for user interaction
 */

export const FeedbackModal = ({ isOpen, closeModal, children }: FeedbackModalProps): ReactElement => {
  const ref = useRef<HTMLDialogElement | null>(null);

  // Close menu on esc key
  const closeModalOnEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && isOpen) {
      closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', closeModalOnEscape);
    return () => {
      document.removeEventListener('keydown', closeModalOnEscape);
    };
  });

  useEffect(() => {
    if (isOpen) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [isOpen]);

  return (
    <motion.dialog
      className="feedback-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={ref}
    >
      <FocusTrap>
        <div className="feedback-modal__outer-wrapper">
          <div className="feedback-modal__container">
            <div className="feedback-modal__content">{children}</div>
          </div>
          <div className="feedback-modal__close-wrapper">
            <div className="feedback-modal__close">
              <IconButton title={'Close'} icon={'cross'} onClick={closeModal} />
            </div>
          </div>
        </div>
      </FocusTrap>
    </motion.dialog>
  );
};
