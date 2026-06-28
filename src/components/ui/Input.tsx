/**
 * Input Component
 * Styled text input with icons and validation
 */

import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import {colors, spacing, borderRadius, typography, fontFamilies} from '../../theme';
import {isCurrentLanguageRTL, getTextAlign} from '../../../i18n';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  /** Override the inner bordered box (e.g. make it transparent over a gradient). */
  inputContainerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputContainerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          inputContainerStyle,
        ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            // Right-align + RTL writing direction when the app is in Arabic so
            // typed Arabic flows correctly (was left-aligned before).
            {
              textAlign: getTextAlign(),
              writingDirection: isCurrentLanguageRTL() ? 'rtl' : 'ltr',
            },
            style,
          ] as TextInputProps['style']}
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {helperText && !error && <Text style={styles.helper}>{helperText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
  },
  inputContainerFocused: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: 16,
    fontFamily: fontFamilies.latin.regular,
    color: colors.text.primary,
  },
  inputWithLeftIcon: {
    marginLeft: spacing[2],
  },
  leftIcon: {
    marginRight: spacing[2],
  },
  rightIcon: {
    marginLeft: spacing[2],
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing[1],
  },
  helper: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
});
