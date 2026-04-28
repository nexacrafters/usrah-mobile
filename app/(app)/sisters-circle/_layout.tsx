/**
 * Sisters Circle Layout
 */
import { Stack } from 'expo-router';

export default function SistersCircleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_left',
      }}
    />
  );
}
