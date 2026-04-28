import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
} from '@expo-google-fonts/tajawal';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator, StyleSheet, I18nManager } from 'react-native';
import { Colors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';
import '../i18n'; // Initialize i18n

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { effectiveTheme, isHydrated: themeHydrated } = useThemeStore();
  const { isRTL, isHydrated: langHydrated } = useLanguageStore();
  const isDark = effectiveTheme === 'dark';

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
  });

  useEffect(() => {
    if ((fontsLoaded || fontError) && themeHydrated && langHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, themeHydrated, langHydrated]);

  // Apply RTL if needed
  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(true);
    }
  }, [isRTL]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.loadingContainerDark]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: isRTL ? 'slide_from_left' : 'slide_from_right',
              contentStyle: {
                backgroundColor: isDark ? Colors.slate[900] : Colors.cream[100],
              },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cream[100],
  },
  loadingContainerDark: {
    backgroundColor: Colors.slate[900],
  },
});
