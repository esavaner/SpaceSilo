import { Redirect, useRootNavigationState } from 'expo-router';

export default function IndexPage() {
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  return <Redirect href="/files" />;
}
