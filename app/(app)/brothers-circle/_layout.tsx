/**
 * Brothers Circle Layout
 */
import { Stack } from 'expo-router';

export default function BrothersCircleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_left',
      }}
    />
  );
}
