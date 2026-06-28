/**
 * Search Bar Component
 * Search input with icon and clear button
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import {colors, spacing, typography, borderRadius} from '../../theme';

interface SearchBarProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

export default function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search...',
  style,
  containerStyle,
  ...props
}: SearchBarProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Search Icon */}
      <View style={styles.searchIcon}>
        <Text style={styles.iconText}>🔍</Text>
      </View>

      {/* Input */}
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        {...props}
      />

      {/* Clear Button */}
      {value.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClear || (() => onChangeText(''))}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  searchIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    padding: 0,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.slate[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 14,
    color: colors.white,
  },
});
