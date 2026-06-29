/**
 * Usrah - Muslim Family Management App
 * Main Application Component (Fully Native)
 */

import React, {useEffect} from 'react';
import {AppState, StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {PaperProvider} from 'react-native-paper';

import RootNavigator from './navigation/RootNavigator';
import AppDialogHost from './components/ui/AppDialogHost';
import {paperTheme, colors} from './theme';
// Initialise i18n (Arabic / English with RTL). Importing runs i18n.init().
import {loadPersistedLanguage} from '../i18n';
// Offline-first: local SQLite DB + automatic background sync.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {initDatabase} from './db/database';
import {startAutoSync, syncNow, markAllLocalDirty} from './sync/syncEngine';
import {useAuthStore} from './store/authStore';
import {
  startNotificationCenter,
  stopNotificationCenter,
  pokeNotificationCenter,
} from './services/notificationCenter';
import {useSettingsStore} from './store/settingsStore';
import {scheduleReminders} from './services/reminders';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (react-query v5 renamed cacheTime -> gcTime)
    },
  },
});

function App() {
  // Apply the user's saved language choice (if any) on launch.
  useEffect(() => {
    loadPersistedLanguage();
  }, []);

  // Offline-first: open + migrate the local DB, start automatic background
  // sync on connectivity changes, and re-sync when the app returns to the
  // foreground. All network access is internally guarded, so this never
  // crashes when offline.
  useEffect(() => {
    try {
      initDatabase();
    } catch (e) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('initDatabase failed', e);
      }
    }

    const stopAutoSync = startAutoSync();

    // Pull the user's data from the server on launch. The persisted auth/family
    // context rehydrates ASYNCHRONOUSLY, and syncAll() no-ops without a family,
    // so a bare syncNow() here would fire too early and restore nothing (which
    // looked like "all my data was deleted" on every restart). Wait for the
    // store to finish hydrating, then sync; also sync immediately if it already
    // hydrated, and again whenever the active family changes.
    const runSync = async () => {
      if (!useAuthStore.getState().currentFamilyId) {
        return;
      }
      // One-time recovery: re-push ALL local data to the server once. Some rows
      // never reached the cloud (created while the API was rate-limiting sync),
      // so they sit "clean" locally and would never re-push — meaning other
      // family members never see them. Force them dirty once, then sync.
      try {
        const done = await AsyncStorage.getItem('resync_local_v1');
        if (!done) {
          markAllLocalDirty();
          await AsyncStorage.setItem('resync_local_v1', '1');
        }
      } catch {
        /* non-fatal */
      }
      void syncNow();
      // Pull the config-driven module catalog + preferences.
      void useSettingsStore.getState().load();
    };
    if (useAuthStore.persist?.hasHydrated?.()) {
      runSync();
    }
    const unsubHydrate = useAuthStore.persist?.onFinishHydration?.(runSync);
    const unsubFamily = useAuthStore.subscribe((s, prev) => {
      if (s.currentFamilyId && s.currentFamilyId !== prev.currentFamilyId) {
        void syncNow();
      }
    });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void syncNow();
        pokeNotificationCenter();
        void scheduleReminders();
      }
    });

    // Schedule local reminders shortly after launch.
    void scheduleReminders();

    return () => {
      stopAutoSync();
      unsubHydrate?.();
      unsubFamily();
      appStateSub.remove();
    };
  }, []);

  // Phone notifications (no Firebase) — driven by our own usrah-api over a
  // WebSocket + polling. Runs while signed in, stops on sign-out.
  useEffect(() => {
    const refresh = () => {
      if (useAuthStore.getState().token) {
        void startNotificationCenter();
      } else {
        stopNotificationCenter();
      }
    };
    if (useAuthStore.persist?.hasHydrated?.()) {
      refresh();
    }
    const unsubHydrate = useAuthStore.persist?.onFinishHydration?.(refresh);
    const unsubToken = useAuthStore.subscribe((s, prev) => {
      if (s.token !== prev.token) {
        refresh();
      }
    });
    return () => {
      unsubHydrate?.();
      unsubToken();
      stopNotificationCenter();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={paperTheme as React.ComponentProps<typeof PaperProvider>['theme']}>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={colors.background.default}
            />
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            {/* Custom confirm/alert dialogs (replaces native Alert.alert). */}
            <AppDialogHost />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
