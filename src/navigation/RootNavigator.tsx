/**
 * Root Navigator
 * Routes between Onboarding -> Auth -> App based on persisted auth state.
 *
 * Waits for the persisted auth state to REHYDRATE before rendering, so reopening
 * the app goes straight to where you were (no flash of the Sign-In screen).
 */

import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import AuthNavigator from './AuthNavigator';
import AppStackNavigator from './AppStackNavigator';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import {useAuthStore} from '../store/authStore';
import {colors} from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const hasSeenOnboarding = useAuthStore(state => state.hasSeenOnboarding);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Block the first frame until the persisted session is loaded from storage.
  const [hydrated, setHydrated] = useState<boolean>(
    () => useAuthStore.persist?.hasHydrated?.() ?? false,
  );
  useEffect(() => {
    if (hydrated) return;
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist?.onFinishHydration?.(() =>
      setHydrated(true),
    );
    return unsub;
  }, [hydrated]);

  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!hasSeenOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="App" component={AppStackNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.default,
  },
});
