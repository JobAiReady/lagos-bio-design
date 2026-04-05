import { useEffect, useRef } from 'react';

/**
 * Hook for modal accessibility: Escape key to close, focus trap, body scroll lock.
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 */
export const useModalA11y = (isOpen, onClose) => {
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            // Focus trap: Tab and Shift+Tab cycle within modal
            if (e.key === 'Tab' && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        // Lock body scroll
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        // Focus the modal on open
        if (modalRef.current) {
            modalRef.current.focus();
        }

        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    return modalRef;
};
