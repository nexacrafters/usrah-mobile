/**
 * AppDialogHost — renders the app's CUSTOM confirm/alert dialog (driven by the
 * dialogStore). Mount once at the app root. Replaces the native `Alert.alert`
 * everywhere so dialogs match the app's premium look (and RTL).
 */
import React from 'react';
import {View, Text, StyleSheet, Modal, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useDialogStore} from '../../store/dialogStore';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';

export default function AppDialogHost() {
  const {t} = useTranslation();
  const current = useDialogStore((s) => s.current);
  const close = useDialogStore((s) => s.close);

  const visible = !!current;
  const confirmLabel =
    current?.confirmText ??
    (current?.cancelable
      ? t('common.confirm', {defaultValue: 'Confirm'})
      : t('common.ok', {defaultValue: 'OK'}));
  const cancelLabel =
    current?.cancelText ?? t('common.cancel', {defaultValue: 'Cancel'});
  const accent = current?.destructive ? colors.error : colors.primary[500];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => close(false)}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => current?.cancelable && close(false)}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {!!current?.icon && (
            <View
              style={[styles.iconWrap, {backgroundColor: accent + '1A'}]}>
              <Icon name={current.icon} size={26} color={accent} />
            </View>
          )}

          {!!current?.title && (
            <Text style={styles.title}>{current.title}</Text>
          )}
          {!!current?.message && (
            <Text style={styles.message}>{current.message}</Text>
          )}

          <View style={styles.actions}>
            {current?.cancelable && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                activeOpacity={0.8}
                onPress={() => close(false)}>
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, {backgroundColor: accent}]}
              activeOpacity={0.85}
              onPress={() => close(true)}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    ...shadows.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[5],
  },
  actions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  button: {
    flex: 1,
    paddingVertical: spacing[3] + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cancelText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  confirmText: {
    ...typography.bodyMedium,
    color: colors.white,
    fontWeight: '700',
  },
});
