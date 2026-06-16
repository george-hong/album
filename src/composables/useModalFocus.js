import { nextTick, onUnmounted, watch } from 'vue';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export const useModalFocus = ({ isOpen, panelRef, initialFocusRef, onClose }) => {
  let previousFocus = null;
  let previousOverflow = '';

  const getFocusableElements = () => (
    panelRef.value
      ? Array.from(panelRef.value.querySelectorAll(FOCUSABLE_SELECTOR))
      : []
  );

  const handleKeydown = (event) => {
    if (!isOpen.value) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) {
      event.preventDefault();
      panelRef.value?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const restorePage = () => {
    document.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = previousOverflow;
    previousFocus?.focus?.();
    previousFocus = null;
  };

  watch(isOpen, async (open) => {
    if (open) {
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeydown);
      await nextTick();
      const initialTarget = initialFocusRef?.value?.$el
        || initialFocusRef?.value
        || getFocusableElements()[0]
        || panelRef.value;
      initialTarget?.focus?.();
    } else {
      restorePage();
    }
  });

  onUnmounted(restorePage);
};
