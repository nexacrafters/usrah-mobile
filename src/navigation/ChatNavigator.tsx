/**
 * Chat Navigator
 * Chat stack navigation (List -> Detail)
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';

export type ChatStackParamList = {
  ChatList: undefined;
  ChatDetail: {
    conversationId: string;
    name: string;
  };
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export default function ChatNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatDetail" component={ChatScreen} />
    </Stack.Navigator>
  );
}
