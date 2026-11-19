// Test page: keep example text here; do not add translations for this file.
import { useRootNavigationState } from 'expo-router';
import { BaseLayout } from '@/components/base-layout';
import { useState } from 'react';
import { Text } from '@repo/shared/components/text';
import { Input } from '@repo/shared/components/input';
import { Textarea } from '@repo/shared/components/textarea';
import { SetPasswordInput } from '@repo/shared/components/set-password-input';
import { Eye } from 'lucide-react-native';
import styled from 'styled-components/native';

const Section = styled.View`
  margin-bottom: 16px;
  border: 1px solid grey;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const SectionHeader = styled.Text`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

export default function IndexPage() {
  const rootNavigationState = useRootNavigationState();
  const [name, setName] = useState('');
  const [invalidValue, setInvalidValue] = useState('Invalid value');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');

  if (!rootNavigationState?.key) return null;

  return (
    <BaseLayout className="bg-white">
      <Section>
        <SectionHeader>Shared text</SectionHeader>
        <Text.S center italic weight={700} color="#307467">
          Centered, italic, bold, and colored.
        </Text.S>
        <Text.M em="primary">Primary emphasis</Text.M>
        <Text.M em="underline">Underline emphasis</Text.M>
        <Text.M em="circle">Circle emphasis</Text.M>
        <Text.M em="divider">Divider emphasis</Text.M>
      </Section>

      <Section>
        <SectionHeader>Input</SectionHeader>
        <Input
          label="Display name"
          placeholder="Enter a display name"
          info="This is how your name appears to others."
          value={name}
          onChangeText={setName}
          required
        />
        <Input
          label="Invalid input"
          error="This value is invalid."
          value={invalidValue}
          onChangeText={setInvalidValue}
          leftIcon={<Eye />}
        />
        <Input label="Disabled input" disabled icon={<Eye />} />
      </Section>

      <Section>
        <SectionHeader>Textarea</SectionHeader>
        <Textarea
          label="Description"
          placeholder="Write more than one line"
          info="Try entering multiple lines."
          value={description}
          onChangeText={setDescription}
        />
        <Textarea label="Textarea with error" defaultValue="Example text" error="This text is invalid." />
        <Textarea label="Disabled textarea" defaultValue="Cannot edit this text" disabled />
      </Section>

      <Section>
        <SectionHeader>Set password</SectionHeader>
        <SetPasswordInput label="New password" value={password} onChangeText={setPassword} />
        <SetPasswordInput label="Uncontrolled password" defaultValue="Example1" error="Example error." />
        <SetPasswordInput label="Disabled password" disabled />
      </Section>
    </BaseLayout>
  );
}
