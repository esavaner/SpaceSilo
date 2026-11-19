// Test page: keep example text here; do not add translations for this file.
import { useRootNavigationState } from 'expo-router';
import { BaseLayout } from '@/components/base-layout';
import { useState } from 'react';
import { Text } from '@repo/shared/components/text';
import { Input } from '@repo/shared/components/input';

export default function IndexPage() {
  const rootNavigationState = useRootNavigationState();
  const [name, setName] = useState('');
  const [invalidValue, setInvalidValue] = useState('Invalid value');

  if (!rootNavigationState?.key) return null;

  return (
    <BaseLayout>
      <Text.H1>Shared text</Text.H1>
      <Text.M>The same typography definition on web and native.</Text.M>
      <Text.S center italic weight={700} color="#307467">
        Centered, italic, bold, and colored.
      </Text.S>
      <Text.M em="primary">Primary emphasis</Text.M>
      <Text.M em="underline">Underline emphasis</Text.M>
      <Text.M em="circle">Circle emphasis</Text.M>
      <Text.M em="divider">Divider emphasis</Text.M>

      <Text.H1>Shared input</Text.H1>
      <Text.M>The same input component works on native and web.</Text.M>
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
      />
      <Input label="Disabled input" disabled />
    </BaseLayout>
  );
}
