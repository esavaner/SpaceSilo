import { forwardRef, useId, useState } from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';
import { theme, useThemeColors } from '../config/theme';
import { Text } from './text';
import { getFieldA11y, Input, type InputProps } from './input';
import { Check, ChevronDown, X } from '../assets/icons';
import { OverflowFade } from './overflow-fade';
import { DropdownMenu, DropdownOption } from './dropdown';
import { webSpaceActivation } from './component-utils';

const Trigger = styled.Pressable`
  min-height: 44px;
  justify-content: center;
  padding: ${theme.spacing[100]} 0 ${theme.spacing[200]};
`;
const SelectedValues = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[100]};
`;
const SelectedValueChip = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[200]};
  padding: ${theme.spacing[100]} ${theme.spacing[200]};
  border-radius: ${theme.radius[200]};
  border: 1px solid ${theme.colors.border.default};
  background-color: ${theme.colors.surface.stronger};
  min-height: 32px;
`;
const ChipRemove = styled.Pressable`
  padding: ${theme.spacing[50]};
  border-radius: ${theme.radius.full};
  cursor: pointer;
  &:hover,
  &:focus-visible {
    background-color: ${theme.colors.surface.darker};
    outline: none;
  }
  &:active {
    opacity: 0.7;
  }
`;

type SelectValue = string | number | readonly string[];

const parseValue = (rawValue: SelectValue | undefined, multiple?: boolean): string[] => {
  if (rawValue === undefined || rawValue === '') return [];
  if (typeof rawValue === 'string') {
    return multiple
      ? rawValue
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [rawValue];
  }
  if (typeof rawValue === 'number') return [String(rawValue)];
  return [...rawValue];
};

export type SelectOption = {
  label: string;
  value: string;
};

export type SelectProps = Omit<InputProps, 'onChange' | 'onBlur' | 'value' | 'defaultValue'> & {
  name?: string;
  value?: SelectValue;
  defaultValue?: SelectValue;
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  noOptionsLabel?: string;
  closeLabel?: string;
  removeLabel?: (label: string) => string;
  onBlur?: () => void;
  onValueChange?: (value: string) => void;
  onValuesChange?: (values: string[]) => void;
  onOptionChange?: (option: SelectOption) => void;
  onOptionsChange?: (options: SelectOption[]) => void;
  containerStyle?: ViewProps['style'];
};

/** The ref targets the pressable trigger; use value callbacks rather than DOM form events. */
export const Select = forwardRef<View, SelectProps>(
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
      closeLabel,
      removeLabel = (label) => `Remove ${label}`,
      disabled,
      onBlur,
      onChangeText,
      onValueChange,
      onValuesChange,
      onOptionChange,
      onOptionsChange,
      containerStyle,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const colors = useThemeColors();
    const selectId = id || rest.nativeID || name || `select-${generatedId.replace(/:/g, '')}`;
    const { describedBy, accessibilityHint } = getFieldA11y(selectId, { info: rest.info, error, disabled });
    const [search, setSearch] = useState('');
    const [internalValues, setInternalValues] = useState(() => parseValue(defaultValue, multiple));
    const selectedValues = value === undefined ? internalValues : parseValue(value, multiple);
    const valuesToOptions = (values: string[]) =>
      values.map((entry) => options.find((option) => option.value === entry)).filter((entry) => entry !== undefined);
    const selectedOptions = valuesToOptions(selectedValues);
    const filteredOptions =
      !searchable || !search.trim()
        ? options
        : options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()));

    const selectOption = (option: SelectOption) => {
      const nextValues = multiple
        ? selectedValues.includes(option.value)
          ? selectedValues.filter((entry) => entry !== option.value)
          : [...selectedValues, option.value]
        : [option.value];
      if (value === undefined) setInternalValues(nextValues);
      const nextValue = nextValues.join(',');
      onChangeText?.(nextValue);
      onValueChange?.(nextValue);
      onValuesChange?.(nextValues);
      onOptionChange?.(option);
      onOptionsChange?.(valuesToOptions(nextValues));
    };

    return (
      <DropdownMenu
        matchTriggerWidth
        label={label}
        closeLabel={closeLabel}
        style={containerStyle}
        onClose={() => {
          setSearch('');
          onBlur?.();
        }}
        trigger={({ isOpen, toggle, menuId }) => (
          <Input
            {...rest}
            id={selectId}
            label={label}
            error={error}
            disabled={disabled}
            icon={
              <ChevronDown
                color={disabled ? colors.text.disabled : colors.text.secondary}
                style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                aria-hidden
              />
            }
            wrapperOnPress={toggle}
            customInput={
              <Trigger
                ref={ref}
                role="combobox"
                accessibilityLabel={label}
                accessibilityHint={accessibilityHint}
                accessibilityState={{ expanded: isOpen, disabled }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? menuId : undefined}
                aria-invalid={!!error || undefined}
                aria-required={rest.required || undefined}
                aria-describedby={describedBy}
                disabled={disabled}
                {...webSpaceActivation}
                onPress={(event) => {
                  event.stopPropagation();
                  toggle();
                }}
              >
                {multiple && selectedOptions.length ? (
                  <SelectedValues>
                    {selectedOptions.map((option) => (
                      <SelectedValueChip key={option.value}>
                        <Text.Label color={disabled ? theme.colors.text.disabled : theme.colors.text.default}>
                          {option.label}
                        </Text.Label>
                        {!disabled && (
                          <ChipRemove
                            role="button"
                            accessibilityLabel={removeLabel(option.label)}
                            hitSlop={8}
                            onPress={(event) => {
                              event.stopPropagation();
                              selectOption(option);
                            }}
                            style={({ pressed }) => (pressed ? { backgroundColor: colors.surface.darker } : null)}
                          >
                            <X size={16} color={colors.text.secondary} aria-hidden />
                          </ChipRemove>
                        )}
                      </SelectedValueChip>
                    ))}
                  </SelectedValues>
                ) : (
                  <Text.FormPlaceholder
                    color={
                      disabled
                        ? theme.colors.text.disabled
                        : selectedOptions.length
                          ? theme.colors.text.default
                          : theme.colors.text.secondary
                    }
                  >
                    {selectedOptions[0]?.label || placeholder || label}
                  </Text.FormPlaceholder>
                )}
              </Trigger>
            }
          />
        )}
      >
        {({ close, isMobile, menuId }) => {
          // React Native Web supports listbox, but React Native's Role type omits it.
          const listProps = {
            nativeID: menuId,
            role: (Platform.OS === 'web' ? 'listbox' : 'list') as ViewProps['role'],
            accessibilityLabel: label,
            'aria-multiselectable': multiple || undefined,
          };
          const optionList = (
            <View {...listProps}>
              {filteredOptions.length === 0 && <Text.FormMessage>{noOptionsLabel}</Text.FormMessage>}
              {filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <DropdownOption
                    key={option.value}
                    role="option"
                    accessibilityState={{ selected: isSelected }}
                    aria-selected={isSelected}
                    $selected={isSelected}
                    onPress={() => {
                      selectOption(option);
                      if (!multiple) close();
                    }}
                  >
                    <Text.S style={{ flex: 1 }}>{option.label}</Text.S>
                    {isSelected && <Check size={20} color={colors.text.default} aria-hidden />}
                  </DropdownOption>
                );
              })}
            </View>
          );
          return (
            <View style={{ gap: 8 }}>
              {searchable && (
                <Input
                  hideLabel
                  label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  value={search}
                  onChangeText={setSearch}
                  inputMode="search"
                  autoFocus={!isMobile}
                />
              )}
              {isMobile ? optionList : <OverflowFade maxHeight={260}>{optionList}</OverflowFade>}
            </View>
          );
        }}
      </DropdownMenu>
    );
  }
);

Select.displayName = 'Select';
