import { SText } from '@repo/ui';
import { Pressable, View } from 'react-native';
import MIcon from '@expo/vector-icons/MaterialIcons';

type FilePathProps = {
  pathItems: string[];
  handlePathClick: (newPath: string) => void;
};

export const FilePath = ({ pathItems, handlePathClick }: FilePathProps) => {
  console.log('FilePath', pathItems);

  const handleItemClick = (index: number) => {
    const newPath = pathItems.slice(0, index + 1).join('/');
    handlePathClick(newPath);
  };

  return (
    <View className="flex flex-row gap-1">
      {pathItems.map((item, index) => (
        <Pressable key={index} onPress={() => handleItemClick(index)} className="text-primary hover:text-primary-light">
          <SText className="flex items-center gap-2">
            {index === 0 ? (
              <MIcon name="home" size={24} />
            ) : (
              <>
                <MIcon name="navigate-next" size={12} />
                {item}
              </>
            )}
          </SText>
        </Pressable>
      ))}
    </View>
  );
};
