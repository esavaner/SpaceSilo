import { Slot } from 'expo-router';
import React from 'react';

import { View } from 'react-native';
import { Header } from '@/components/Header/Header';

export default function TabLayout() {
  return (
    <View className="bg-orange-500">
      <Header title="Files" />
      <View className="p-6 rounded-t-3xl bg-layer">
        <Slot />
      </View>
    </View>
  );
  // return (
  //   <Tabs
  //     screenOptions={{
  //       headerShown: false,
  //       tabBarStyle: {
  //         backgroundColor: 'transparent',
  //       },
  //       headerStyle: {
  //         backgroundColor: 'transparent',
  //       },
  //     }}
  //     sceneContainerStyle={{
  //       backgroundColor: 'transparent',
  //     }}
  //   >
  //     <Tabs.Screen
  //       name="index"
  //       options={{
  //         title: 'Home',
  //         tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />,
  //       }}
  //     />
  //     <Tabs.Screen
  //       name="explore"
  //       options={{
  //         title: 'Explore',
  //         tabBarIcon: ({ color, focused }) => (
  //           <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
  //         ),
  //       }}
  //     />
  //     <Tabs.Screen
  //       name="files"
  //       options={{
  //         title: 'Files',
  //         tabBarIcon: ({ color, focused }) => (
  //           <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
  //         ),
  //       }}
  //     />
  //   </Tabs>
  // );
}
