import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../config/theme';
import { Text } from './text';
import { Input, InputIconButton, InputProps } from './input';
import { Modal } from './modal';
import { Check, ChevronDown, X } from '../assets/icons';
import { OverflowFade } from './overflow-fade';
const BREAKPOINT = theme.breakpointNumbers.sm;

type TriggerProps = {
  $open?: boolean;
  $disabled?: boolean;
};

const SelectContainer = styled.div`
  position: relative;
`;
const TriggerButton = styled.button<TriggerProps>`
  ${theme.text.formPlaceholder}
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: ${theme.spacing[100]} 0 ${theme.spacing[200]};
  min-height: 44px;
  &:disabled {
    cursor: not-allowed;
    color: ${theme.colors.text.disabled};
  }
`;
const ValueText = styled.span<{ $isPlaceholder?: boolean }>`
  color: ${({ $isPlaceholder }) => ($isPlaceholder ? theme.colors.text.secondary : theme.colors.text.default)};
`;
const SelectedValues = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[100]};
`;
const ChipRemoveButton = styled(X)`
  width: 22px;
  height: 22px;
  padding: ${theme.spacing[100]};
  cursor: pointer;
  &:hover,
  &:focus,
  &:focus-visible {
    outline: 2px solid ${theme.colors.border.input.hover};
    border-radius: ${theme.radius[100]};
  }
`;
const SelectedValueChip = styled(Text.Label)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing[200]};
  padding: ${theme.spacing[100]} ${theme.spacing[200]};
  border-radius: ${theme.radius[200]};
  border: 1px solid ${theme.colors.border.default};
  background: ${theme.colors.surface.stronger};
  min-height: 32px;
  &:has(${ChipRemoveButton}:is(:hover, :focus, :focus-visible)) {
    background: ${theme.colors.surface.darker};
  }
`;
const Dropdown = styled.div`
  position: absolute;
  z-index: ${theme.zIndex.dropdown};
  width: 100%;
  padding: ${theme.spacing[300]};
  padding-right: 0;
  margin-top: ${theme.spacing[100]};
  border-radius: ${theme.radius[300]};
  border: 1px solid ${theme.colors.border.default};
  background-color: ${theme.colors.surface.weak};
  box-shadow: 0 18px 30px rgba(63, 44, 38, 0.14);
  overflow: hidden;
`;
const OptionButton = styled.button<{ $selected?: boolean }>`
  ${theme.text.S}
  position: relative;
  width: 100%;
  border: 0;
  text-align: left;
  padding: ${theme.spacing[300]} ${theme.spacing[200]};
  margin-bottom: ${theme.spacing[200]};
  border-radius: ${theme.radius[200]};
  background: ${({ $selected }) => ($selected ? theme.colors.surface.stronger : theme.colors.surface.weak)};
  &:hover,
  &:focus-visible {
    background: ${theme.colors.surface.medium};
    outline: none;
  }
  &:disabled {
    color: ${theme.colors.text.disabled};
    cursor: not-allowed;
  }
`;
const Checkmark = styled(Check)`
  position: absolute;
  right: ${theme.spacing[200]};
  top: 50%;
  transform: translateY(-50%);
`;
const EmptyState = styled(Text.FormMessage)`
  display: block;
  padding: ${theme.spacing[400]};
  color: ${theme.colors.text.secondary};
`;
const Chevron = styled(ChevronDown)<{ $open?: boolean }>`
  display: block;
  transition: transform 160ms ease;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`;

const parseValue = (rawValue: SelectProps['value'], multiple?: boolean) => {
  if (!rawValue) {
    return [];
  }
  if (typeof rawValue === 'string') {
    return multiple
      ? rawValue
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [rawValue];
  }
  if (typeof rawValue === 'number') {
    return [String(rawValue)];
  }
  return rawValue.map((entry) => String(entry));
};

export type SelectOption = {
  label: string;
  value: string;
};

export type SelectProps = Omit<InputProps, 'onChange'> & {
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  noOptionsLabel?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  onValuesChange?: (values: string[]) => void;
  onOptionChange?: (option: SelectOption) => void;
  onOptionsChange?: (options: SelectOption[]) => void;
  containerStyle?: React.CSSProperties;
};

export const Select = forwardRef<HTMLInputElement, SelectProps>(
  (
    {
      id,
      name,
      label,
      options,
      value,
      defaultValue,
      multiple,
      placeholder,
      error,
      searchable,
      searchPlaceholder = 'Search options',
      noOptionsLabel = 'No matches found',
      disabled,
      onBlur,
      onChange,
      onValueChange,
      onValuesChange,
      onOptionChange,
      onOptionsChange,
      containerStyle,
      ...rest
    },
    ref
  ) => {
    const selectId = id || name || `select-${useId().replace(/:/g, '')}`;
    const listId = `${selectId}-list`;
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    const [dropdownOpened, setDropdownOpened] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [search, setSearch] = useState('');

    const [internalValues, setInternalValues] = useState(
      parseValue(value === undefined ? defaultValue : value, multiple)
    );

    const selectedValues = value === undefined ? internalValues : parseValue(value, multiple);

    const hiddenValue = selectedValues.join(',');
    const useCustomInput = isMobile || !searchable || !!multiple;

    const filteredOptions =
      !searchable || !search.trim()
        ? options
        : options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()));

    const valuesToOptions = (values: string[]) =>
      values.map((val) => options.find((opt) => opt.value === val)).filter((opt): opt is SelectOption => !!opt);

    const open = () => {
      if (disabled) {
        return;
      }
      setSearch('');
      setDropdownOpened(true);
    };

    const close = (blurValue = hiddenValue) => {
      onBlur?.({
        target: { name, value: blurValue },
        currentTarget: { name, value: blurValue },
      } as React.FocusEvent<HTMLInputElement>);
      setDropdownOpened(false);
      if (multiple) {
        setSearch('');
      } else {
        setSearch(blurValue ? options.find((option) => option.value === blurValue)?.label || '' : '');
      }
    };

    const toggleDropdown = () => {
      if (dropdownOpened) {
        close();
      } else {
        open();
      }
    };

    const selectOption = (option: SelectOption) => {
      if (multiple) {
        // toggle option in selected values
        const nextValues = selectedValues.find((val) => option.value === val)
          ? selectedValues.filter((val) => option.value !== val)
          : [...selectedValues, option.value];

        if (value === undefined) {
          setInternalValues(nextValues);
        }

        const nextHiddenValue = nextValues.join(',');
        onChange?.({
          target: { name, value: nextHiddenValue },
          currentTarget: { name, value: nextHiddenValue },
        } as React.ChangeEvent<HTMLInputElement>);
        onValueChange?.(nextHiddenValue);
        onValuesChange?.(nextValues);
        onOptionChange?.(option);
        onOptionsChange?.(valuesToOptions(nextValues));
      } else {
        if (!value || (Array.isArray(value) && !value.length)) {
          setInternalValues([option.value]);
        }
        onChange?.({
          target: { name, value: option.value },
          currentTarget: { name, value: option.value },
        } as React.ChangeEvent<HTMLInputElement>);
        onValueChange?.(option.value);
        onOptionChange?.(option);
        close(option.value);
      }
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value);
    };

    // keep internal state in sync with form libraries that set initial values via ref.
    useEffect(() => {
      if (value !== undefined || selectedValues.length) {
        return;
      }

      const initialValue = hiddenInputRef.current?.value;
      if (initialValue) {
        setInternalValues(parseValue(initialValue, multiple));
      }
    }, [multiple, selectedValues.length, value]);

    // track window width to switch to mobile dropdown
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < BREAKPOINT);
      };
      // measured after mount so SSR (Next) doesn't touch window
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    // close dropdown on outside click or on esc press
    useEffect(() => {
      if (!dropdownOpened || !containerRef.current || isMobile) {
        return;
      }
      const onOutsideClick = (event: MouseEvent) => {
        if (!containerRef.current?.contains(event.target as Node)) {
          close();
        }
      };
      const onEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          close();
        }
      };
      window.addEventListener('mousedown', onOutsideClick);
      window.addEventListener('keydown', onEsc);
      return () => {
        window.removeEventListener('mousedown', onOutsideClick);
        window.removeEventListener('keydown', onEsc);
      };
    }, [close, dropdownOpened, isMobile]);

    const dropdownContent = (
      <>
        {searchable && (isMobile || multiple) ? (
          <Input
            hideLabel
            placeholder={searchPlaceholder}
            value={search}
            onChange={handleSearchChange}
            wrapperStyle={{
              margin: `0 ${theme.spacing[300]} ${theme.spacing[200]} 0`,
            }}
            type="search"
          />
        ) : (
          <></>
        )}
        <OverflowFade
          role="listbox"
          id={listId}
          aria-label={label}
          aria-multiselectable={multiple || undefined}
          maxHeight={isMobile ? 560 : 260}
          rightPadding={`${theme.spacing[200]}`}
        >
          {filteredOptions.length === 0 && <EmptyState>{noOptionsLabel}</EmptyState>}
          {filteredOptions.map((option, index) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <OptionButton
                key={`${option.value}-${index}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                $selected={isSelected}
                onClick={() => selectOption(option)}
              >
                {option.label}
                {isSelected && <Checkmark />}
              </OptionButton>
            );
          })}
        </OverflowFade>
      </>
    );

    const selectedOptions = valuesToOptions(selectedValues);

    return (
      <SelectContainer ref={containerRef} style={containerStyle}>
        <input
          type="hidden"
          name={name}
          value={hiddenValue}
          readOnly
          disabled={disabled}
          ref={(node) => {
            hiddenInputRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
        />
        <Input
          {...rest}
          id={selectId}
          label={label}
          name={name}
          error={error}
          disabled={disabled}
          onClick={useCustomInput ? toggleDropdown : open}
          wrapperOnClick={toggleDropdown}
          iconComponent={
            <InputIconButton
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleDropdown}
              aria-label={dropdownOpened ? 'Close options' : 'Open options'}
              aria-expanded={dropdownOpened}
              aria-controls={dropdownOpened ? listId : undefined}
              aria-haspopup="listbox"
              disabled={disabled}
            >
              <Chevron $open={dropdownOpened} />
            </InputIconButton>
          }
          value={useCustomInput ? undefined : dropdownOpened ? search : selectedOptions[0]?.label || ''}
          onChange={useCustomInput ? undefined : handleSearchChange}
          placeholder={useCustomInput ? placeholder : dropdownOpened ? searchPlaceholder : placeholder}
          customInput={
            useCustomInput ? (
              <TriggerButton
                type="button"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpened}
                aria-controls={dropdownOpened ? listId : undefined}
                aria-invalid={!!error || undefined}
                disabled={disabled}
                $open={dropdownOpened}
                onClick={toggleDropdown}
              >
                {multiple ? (
                  <SelectedValues>
                    {selectedOptions.length ? (
                      selectedOptions.map((option, index) => (
                        <SelectedValueChip key={`${option.value}-${index}`}>
                          {option.label}
                          {!disabled && (
                            <ChipRemoveButton
                              role="button"
                              tabIndex={0}
                              aria-label={`Remove ${option.label}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                selectOption(option);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  selectOption(option);
                                }
                              }}
                            />
                          )}
                        </SelectedValueChip>
                      ))
                    ) : (
                      <ValueText $isPlaceholder>{placeholder || label}</ValueText>
                    )}
                  </SelectedValues>
                ) : (
                  <ValueText $isPlaceholder={!selectedValues.length || dropdownOpened}>
                    {selectedOptions[0]?.label || placeholder || label}
                  </ValueText>
                )}
              </TriggerButton>
            ) : undefined
          }
        />
        {dropdownOpened ? (
          isMobile ? (
            <Modal closeOverride={close}>
              <Text.H3>{label}</Text.H3>
              {dropdownContent}
            </Modal>
          ) : (
            <Dropdown>{dropdownContent}</Dropdown>
          )
        ) : (
          <></>
        )}
      </SelectContainer>
    );
  }
);

Select.displayName = 'Select';
