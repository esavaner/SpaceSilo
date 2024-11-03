import React from 'react';
import { View, Pressable } from 'react-native';
import FIcon from '@expo/vector-icons/Feather';
import MIcon from '@expo/vector-icons/MaterialIcons';
import { Link } from 'expo-router';
import { Text } from '@repo/ui';

type HeaderProps = {
  title?: string;
};

export const Header = ({ title }: HeaderProps) => {
  return (
    <View className="p-6 mt-10 flex gap-4 flex-row items-center">
      <Pressable>
        <FIcon name="menu" size={24} className="text-gray-50" />
      </Pressable>
      <Text className="text-gray-50 text-lg">{title}</Text>
      <Pressable className="ml-auto">
        <FIcon name="search" size={24} className="text-gray-50" />
      </Pressable>
      <Link href="/login" className="h-8 w-8 flex items-center justify-center rounded-md border-gray-50 border">
        <MIcon name="person" size={24} className="text-lg text-gray-50" />
      </Link>
    </View>
  );
};
