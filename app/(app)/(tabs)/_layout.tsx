import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, MessageCircle, Wallet, CheckSquare, BookOpen } from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';

export default function TabsLayout() {
  const { effectiveTheme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const isDark = effectiveTheme === 'dark';
  const fontFamily = 'Tajawal_500Medium';

  const theme = {
    background: isDark ? Colors.slate[800] : Colors.white,
    border: isDark ? Colors.slate[700] : Colors.slate[200],
    inactive: isDark ? Colors.slate[400] : Colors.slate[400],
    active: Colors.primary[500],
  };

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 20);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.active,
        tabBarInactiveTintColor: theme.inactive,
        tabBarLabelStyle: {
          fontFamily,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'المحادثات',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'المصروفات',
          tabBarIcon: ({ color, size }) => <Wallet size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'المهام',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'إسلاميات',
          tabBarIcon: ({ color, size }) => <BookOpen size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
