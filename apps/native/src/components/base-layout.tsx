import { ScrollView } from 'react-native';

type Props = ScrollView['props'] & {
  children?: React.ReactNode;
};

export const BaseLayout = ({ children, ...props }: Props) => {
  return (
    <ScrollView className="flex-1 bg-background p-4 relative" {...props}>
      {children}
    </ScrollView>
  );
};
