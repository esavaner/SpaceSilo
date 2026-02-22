import { ScrollView } from 'react-native';

type Props = {
  children?: React.ReactNode;
};

export const BaseLayout = ({ children }: Props) => {
  return <ScrollView className="flex-1 bg-background p-4 relative">{children}</ScrollView>;
};
