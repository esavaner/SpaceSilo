import { Redirect, useRootNavigationState } from 'expo-router';

export default function FilesPage() {
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  return <Redirect href="/files" />;
}
