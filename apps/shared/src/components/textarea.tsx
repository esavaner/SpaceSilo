import { forwardRef } from 'react';
import { type TextInput } from 'react-native';
import styled from 'styled-components/native';
import { Input, type InputProps } from './input';

export type TextareaProps = Omit<InputProps, 'multiline'>;

const StyledTextarea = styled(Input)`
  min-height: 132px;
  resize: vertical;
`;

export const Textarea = forwardRef<TextInput, TextareaProps>((props, ref) => (
  <StyledTextarea ref={ref} textAlignVertical="top" {...props} multiline />
));

Textarea.displayName = 'Textarea';
