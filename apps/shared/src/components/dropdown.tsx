import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import styled from 'styled-components';
import { theme } from '../config/theme';
import { Text } from './text';

export type DropdownItem =
  | {
      label: React.ReactNode;
      onClick: () => void;
      icon?: ReactNode;
      color?: string;
    }
  | undefined;

const Root = styled.div`
  position: relative;
  display: inline-block;
`;

const Trigger = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: ${theme.zIndex.dropdown};
  min-width: 150px;
  padding: 0;
  border-radius: ${theme.radius[400]};
  background: ${theme.colors.surface.weak};
  box-shadow: 0 4px 24px rgba(162, 174, 169, 0.46);
  overflow: hidden;
`;

const ItemButton = styled.button`
  display: grid;
  grid-template-columns: 22px 1fr;
  align-items: center;
  gap: ${theme.spacing[400]};
  width: 100%;
  padding: ${theme.spacing[400]} ${theme.spacing[800]} ${theme.spacing[300]};
  border: 0;
  border-bottom: 1px solid ${theme.colors.border.default};
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.1s ease-in-out;

  &:last-child {
    border-bottom: none;
  }

  &:hover,
  &:focus-visible {
    background: ${theme.colors.surface.medium};
    outline: none;
  }

  svg {
    width: 22px;
    height: 22px;
    color: inherit;
    flex-shrink: 0;
  }
`;

const Label = styled(Text)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[200]};
  white-space: nowrap;
  color: inherit;
  font-size: 14px;
  line-height: 1.5;
  padding-bottom: 2px;
`;

const MoreOptions = styled.span`
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
`;

type Props = {
  items: DropdownItem[];
  onSelect?: (data: React.ReactNode) => void;
  trigger?: ReactNode;
};

export const Dropdown = ({ items, onSelect, trigger }: Props) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      setIsVisible(false);
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible]);

  const toggle = () => {
    setIsVisible((prevState) => !prevState);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }

    if (event.key === 'Escape') {
      setIsVisible(false);
    }
  };

  const handleItemClick = (item: DropdownItem) => () => {
    item!.onClick();
    setIsVisible(false);
    onSelect?.(item!.label);
  };

  return (
    <Root>
      <Trigger
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isVisible}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
      >
        {trigger ?? <MoreOptions>&#x22EE;</MoreOptions>}
      </Trigger>
      {isVisible ? (
        <Menu ref={menuRef} role="menu">
          {items.filter(Boolean).map((item, index) => (
            <ItemButton
              key={index}
              type="button"
              role="menuitem"
              onClick={handleItemClick(item!)}
              style={{ color: item!.color ?? theme.colors.text.default }}
            >
              {item!.icon}
              <Label as="span">{item!.label}</Label>
            </ItemButton>
          ))}
        </Menu>
      ) : null}
    </Root>
  );
};
