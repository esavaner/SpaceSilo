'use client';

import { Button } from '@repo/ui';

export default function Web() {
  return (
    <div>
      <h1>Web</h1>
      <Button onPress={() => console.log('Pressed!')}>Boop</Button>
    </div>
  );
}
