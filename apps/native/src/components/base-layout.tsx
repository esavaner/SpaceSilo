import { cn } from '@/utils/cn';
import type { ComponentProps, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

type Props = ComponentProps<typeof ScrollView> & {
  children?: ReactNode;
  header?: ReactNode;
  headerClassName?: string;
  scrollable?: boolean;
};

export const BaseLayout = ({ children, className, header, headerClassName, scrollable = true, ...props }: Props) => {
  const content = (
    <View className={cn('mx-auto max-w-7xl w-full p-4', !scrollable && 'flex-1', className)}>{children}</View>
  );

  return (
    <View className="relative flex-1 bg-background">
      {header ? (
        <View className="z-10 border-b border-border bg-background">
          <View className={cn('mx-auto max-w-7xl w-full p-4', headerClassName)}>{header}</View>
        </View>
      ) : null}

      {scrollable ? (
        <ScrollView {...props} className="relative flex-1 bg-background">
          {content}
        </ScrollView>
      ) : (
        <View className="flex-1">{content}</View>
      )}
    </View>
  );
};
