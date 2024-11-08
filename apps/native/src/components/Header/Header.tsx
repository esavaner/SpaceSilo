import React from 'react';
import { View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Text } from '@repo/ui';
import { MenuIcon, PersonIcon, SearchIcon } from '@/assets/icons';

type HeaderProps = {
  title?: string;
  toggleNav: () => void;
};

export const Header = ({ title, toggleNav }: HeaderProps) => {
  return (
    <View className="p-6 mt-10 flex gap-4 flex-row items-center">
      <Pressable onPress={toggleNav}>
        <MenuIcon className="text-gray-50" />
      </Pressable>
      <Text className="text-gray-50 text-lg">{title}</Text>
      <Pressable className="ml-auto">
        <SearchIcon className="text-gray-50" />
      </Pressable>
      <Link href="/login" className="h-8 w-8 flex items-center justify-center rounded-md border-gray-50 border">
        <PersonIcon className="text-lg text-gray-50" />
      </Link>
    </View>
  );
};
