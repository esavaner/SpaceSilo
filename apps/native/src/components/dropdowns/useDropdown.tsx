import { TriggerRef } from '@rn-primitives/dropdown-menu';
import { useRef } from 'react';

export const useDropdown = () => {
  const ref = useRef<TriggerRef>(null);

  const openDropdown = () => {
    ref.current?.open();
  };

  const closeDropdown = () => {
    ref.current?.close();
  };

  return { ref, openDropdown, closeDropdown };
};
