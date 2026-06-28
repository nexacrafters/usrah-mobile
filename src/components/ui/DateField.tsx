/**
 * DateField
 * A premium, tappable date/time field that opens the native picker instead of
 * forcing the user to type a date into a plain text box. Returns ISO strings:
 *   mode="date" -> 'YYYY-MM-DD'
 *   mode="time" -> 'HH:MM'
 */

import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useTranslation} from 'react-i18next';
import {colors, spacing, typography, borderRadius} from '../../theme';

interface DateFieldProps {
  label?: string;
  mode?: 'date' | 'time';
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  clearable?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

const toDate = (value: string | null | undefined, mode: 'date' | 'time'): Date => {
  if (!value) {
    return new Date();
  }
  if (mode === 'time') {
    const [h, m] = value.split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function DateField({
  label,
  mode = 'date',
  value,
  onChange,
  placeholder,
  minimumDate,
  clearable,
}: DateFieldProps) {
  const {t} = useTranslation();
  const [show, setShow] = useState(false);

  const display = (() => {
    if (!value) {
      return placeholder ?? (mode === 'time' ? '--:--' : t('common.selectDate', {defaultValue: 'Select date'}));
    }
    if (mode === 'time') {
      return value;
    }
    const d = toDate(value, mode);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  })();

  const handleChange = (_event: unknown, selected?: Date) => {
    // On Android the dialog closes itself; hide our state regardless.
    setShow(Platform.OS === 'ios');
    if (selected) {
      if (mode === 'time') {
        onChange(`${pad(selected.getHours())}:${pad(selected.getMinutes())}`);
      } else {
        onChange(
          `${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(
            selected.getDate(),
          )}`,
        );
      }
    }
  };

  return (
    <View>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.field}
        activeOpacity={0.7}
        onPress={() => setShow(true)}>
        <Text style={styles.icon}>{mode === 'time' ? '🕐' : '📅'}</Text>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {display}
        </Text>
        {clearable && !!value ? (
          <TouchableOpacity
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            onPress={() => onChange('')}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.chevron}>›</Text>
        )}
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={toDate(value, mode)}
          mode={mode}
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  icon: {
    fontSize: 18,
  },
  value: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  placeholder: {
    color: colors.text.tertiary,
  },
  chevron: {
    fontSize: 22,
    color: colors.text.tertiary,
  },
  clear: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
});
