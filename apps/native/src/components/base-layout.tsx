import { cn } from '@/utils/cn';
import { ScrollView, View } from 'react-native';

type Props = ScrollView['props'] & {
  children?: React.ReactNode;
};

export const BaseLayout = ({ children, className, ...props }: Props) => {
  return (
    <ScrollView className="flex-1 bg-background p-4 relative">
      <View {...props} className={cn('mx-auto max-w-7xl w-full', className)}>
        {children}
      </View>
    </ScrollView>
  );
};
