import { ScrollView, View } from 'react-native';
import { FileIcon } from '@/components/icons';
import { Button } from '@/components/general/button';
import { Text } from '@/components/general/text';

export default function RnpScreen() {
  return (
    <ScrollView className="flex-1 bg-layer">
      <View className="gap-2">
        <Button>
          <Text>Button</Text>
        </Button>
        <Button variant="secondary">
          <Text>Secondary</Text>
        </Button>
        <Button variant="danger">
          <Text>Danger</Text>
        </Button>
        <Button variant="outline">
          <Text>Outline</Text>
        </Button>
        <Button variant="ghost">
          <Text>Ghost</Text>
        </Button>
        <Button variant="link">
          <Text>Link</Text>
        </Button>
        <Button variant="outline" size="icon">
          <FileIcon size={20} />
        </Button>
        <Button>
          <FileIcon size={20} />
          <Text>Login with Email</Text>
        </Button>
        <Button disabled>
          <Text>Please wait</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
