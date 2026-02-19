import { ScrollView, View, Appearance } from 'react-native';
import { Icon } from '@/components/general/icon';
import { Button } from '@/components/general/button';
import { Text } from '@/components/general/text';
import { useEffect, useState } from 'react';

export default function RnpScreen() {
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (!testLoading) return;
    setTimeout(() => {
      setTestLoading(false);
    }, 2000);
  }, [testLoading]);

  return (
    <ScrollView className="flex-1 bg-background p-8">
      <View className="grid grid-cols-3 gap-4 justify-items-center">
        <Button onPress={() => Appearance.setColorScheme('light')}>Primary</Button>
        <Button disabled>Primary</Button>
        <Button loading>Primary</Button>
        {/* secondary */}
        <Button variant="secondary" onPress={() => Appearance.setColorScheme('dark')}>
          Secondary
        </Button>
        <Button variant="secondary" disabled>
          Secondary
        </Button>
        <Button variant="secondary" loading>
          Secondary
        </Button>
        {/* destructive */}
        <Button variant="destructive">Destructive</Button>
        <Button variant="destructive" disabled>
          Destructive
        </Button>
        <Button variant="destructive" loading>
          Destructive
        </Button>
        {/* outline */}
        <Button variant="outline">Outline</Button>
        <Button variant="outline" disabled>
          Outline
        </Button>
        <Button variant="outline" loading>
          Outline
        </Button>
        {/* ghost */}
        <Button variant="ghost">Ghost</Button>
        <Button variant="ghost" disabled>
          Ghost
        </Button>
        <Button variant="ghost" loading>
          Ghost
        </Button>
        {/* link */}
        <Button variant="link">Link</Button>
        <Button variant="link" disabled>
          Link
        </Button>
        <Button variant="link" loading>
          Link
        </Button>
        {/* icon */}
        <Button variant="outline" size="icon">
          <Icon.File />
        </Button>
        <Button variant="outline" size="icon" disabled>
          <Icon.File />
        </Button>
        <Button>
          <Icon.File />
          <Text>Login with Email</Text>
        </Button>
        <Button onPress={() => setTestLoading(true)} loading={testLoading} className="col-span-3">
          Test loading button
        </Button>
      </View>
    </ScrollView>
  );
}
