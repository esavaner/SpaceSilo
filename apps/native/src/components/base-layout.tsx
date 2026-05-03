import { cn } from '@/utils/cn';
import { ScrollView, View } from 'react-native';

type Props = ScrollView['props'] & {
  children?: React.ReactNode;
};

export const BaseLayout = ({ children, className, ...props }: Props) => {
  return (
    <ScrollView {...props} className="flex-1 bg-background relative">
      <View className={cn('mx-auto max-w-7xl w-full p-4', className)}>{children}</View>
    </ScrollView>
  );
};
