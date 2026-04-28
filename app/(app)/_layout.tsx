import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useThemeStore } from '../../store/themeStore';
import { useLanguageStore } from '../../store/languageStore';

export default function AppLayout() {
  const { effectiveTheme } = useThemeStore();
  const { isRTL } = useLanguageStore();
  const isDark = effectiveTheme === 'dark';

  // Adjust animation direction based on RTL
  const slideAnimation = isRTL ? 'slide_from_left' : 'slide_from_right';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: slideAnimation,
        contentStyle: {
          backgroundColor: isDark ? Colors.slate[900] : Colors.cream[100],
        },
      }}
    >
      {/* Main Tabs */}
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />

      {/* Chat */}
      <Stack.Screen name="chat/[id]" options={{ animation: slideAnimation }} />

      {/* Expenses */}
      <Stack.Screen name="expenses/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="expenses/[id]" />

      {/* Tasks */}
      <Stack.Screen name="tasks/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="tasks/[id]" />

      {/* Recipes */}
      <Stack.Screen name="recipes/index" />
      <Stack.Screen name="recipes/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="recipes/[id]" />

      {/* Goals */}
      <Stack.Screen name="goals/index" />
      <Stack.Screen name="goals/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="goals/[id]" />

      {/* Calendar */}
      <Stack.Screen name="calendar/index" />
      <Stack.Screen name="calendar/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="calendar/[id]" />

      {/* Islamic Features */}
      <Stack.Screen name="islamic/prayer-times" />
      <Stack.Screen name="islamic/qibla" />
      <Stack.Screen name="islamic/zakat" />
      <Stack.Screen name="islamic/adhkar" />
      <Stack.Screen name="islamic/adhkar/[category]" />
      <Stack.Screen name="islamic/quran" />
      <Stack.Screen name="islamic/fasting" />

      {/* Social Circles */}
      <Stack.Screen name="sisters-circle/index" />
      <Stack.Screen name="sisters-circle/post" options={{ presentation: 'modal' }} />
      <Stack.Screen name="brothers-circle/index" />
      <Stack.Screen name="brothers-circle/post" options={{ presentation: 'modal' }} />

      {/* Finance */}
      <Stack.Screen name="finance/budgets" />
      <Stack.Screen name="finance/debts" />
      <Stack.Screen name="finance/reports" />
      <Stack.Screen name="finance/investments" />
      <Stack.Screen name="finance/emergency-fund" />

      {/* Community */}
      <Stack.Screen name="village/index" />
      <Stack.Screen name="forum/index" />
      <Stack.Screen name="halaqat/index" />
      <Stack.Screen name="knowledge/index" />
      <Stack.Screen name="emergency/index" />

      {/* Documents */}
      <Stack.Screen name="documents/index" />

      {/* Settings */}
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/profile" />
      <Stack.Screen name="settings/family" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy" />
      <Stack.Screen name="settings/language" />

      {/* Help */}
      <Stack.Screen name="help/index" />
    </Stack>
  );
}
