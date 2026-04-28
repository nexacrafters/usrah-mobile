/**
 * Premium Input Component
 * Inspired by sanid-app design system
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  success,
  leftIcon,
  rightIcon,
  containerStyle,
  secureTextEntry,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getBorderColor = () => {
    if (error) return Colors.error.main;
    if (success) return Colors.success.main;
    if (isFocused) return Colors.gold[500];
    return Colors.border.default;
  };

  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            isFocused && styles.labelFocused,
            error && styles.labelError,
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            borderWidth: isFocused || error ? 2 : 1,
          },
          error && styles.inputError,
          success && styles.inputSuccess,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          {...props}
          style={[
            styles.input,
            leftIcon && { paddingLeft: 0 },
            (rightIcon || isPassword) && { paddingRight: 0 },
          ]}
          placeholderTextColor={Colors.text.muted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          secureTextEntry={isPassword && !showPassword}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            {showPassword ? (
              <EyeOff size={20} color={Colors.text.muted} />
            ) : (
              <Eye size={20} color={Colors.text.muted} />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}

        {error && (
          <View style={styles.rightIcon}>
            <AlertCircle size={20} color={Colors.error.main} />
          </View>
        )}

        {success && !error && (
          <View style={styles.rightIcon}>
            <CheckCircle size={20} color={Colors.success.main} />
          </View>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.label,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  labelFocused: {
    color: Colors.gold[500],
  },
  labelError: {
    color: Colors.error.main,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    height: 56,
    paddingHorizontal: Spacing.lg,
  },
  inputError: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  inputSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  input: {
    flex: 1,
    fontFamily: Typography.fonts.regular,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    height: '100%',
  },
  leftIcon: {
    marginRight: Spacing.md,
  },
  rightIcon: {
    marginLeft: Spacing.md,
  },
  error: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.caption,
    color: Colors.error.main,
    marginTop: Spacing.xs,
  },
  hint: {
    fontFamily: Typography.fonts.regular,
    fontSize: Typography.sizes.caption,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
  },
});
