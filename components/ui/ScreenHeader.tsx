/**
 * Screen Header Component
 */
import { View, Text, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../constants/colors';
import { useThemeStore } from '../../store/themeStore';
import { getFont, getTextAlign } from '../../utils/fonts';

interface RightAction {
  icon?: LucideIcon;
  label?: string;
  onPress: () => void;
}

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: RightAction;
}

export function ScreenHeader({ title, showBack = false, rightAction }: ScreenHeaderProps) {
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const isRTL = I18nManager.isRTL;
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      <View style={[styles.leftSection, isRTL && styles.rowReverse]}>
        {showBack && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <BackIcon size={24} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>

      <Text
        style={[
          styles.title,
          { color: theme.text, fontFamily: getFont('bold'), textAlign: 'center' },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={[styles.rightSection, isRTL && styles.rowReverse]}>
        {rightAction && (
          <TouchableOpacity style={styles.actionButton} onPress={rightAction.onPress}>
            {rightAction.icon && <rightAction.icon size={22} color={Colors.primary[500]} />}
            {rightAction.label && (
              <Text style={[styles.actionLabel, { color: Colors.primary[500], fontFamily: getFont('bold') }]}>
                {rightAction.label}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  leftSection: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 15,
  },
});
