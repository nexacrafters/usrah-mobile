/**
 * Family Hub Screen
 *
 * Two modes, driven by the active family in useAuthStore:
 *   1. HAS active family  -> family name, prominent Invite Code card (Share +
 *      copy-style affordance) and the live members list.
 *   2. NO active family   -> a Create Family form and a Join a Family form.
 *
 * All data comes from the real /families API via family.service — no mocks.
 * Loading / error / empty states + pull-to-refresh are handled throughout.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import i18n from '../../../i18n';

import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import {showAlert} from '../../store/dialogStore';
import {useAuthStore} from '../../store/authStore';
import {syncNow} from '../../sync/syncEngine';
import familyService from '../../services/api/family.service';
import type {FamilyDetail, FamilyMember} from '../../store/familyStore';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';

export default function FamilyScreen() {
  // Active family context lives in the auth store.
  const currentFamilyId = useAuthStore((s) => s.currentFamilyId);
  const currentFamilyName = useAuthStore((s) => s.currentFamilyName);
  const setCurrentFamily = useAuthStore((s) => s.setCurrentFamily);

  if (currentFamilyId) {
    return (
      <ActiveFamilyView
        familyId={currentFamilyId}
        fallbackName={currentFamilyName}
      />
    );
  }

  return <NoFamilyView onActivated={setCurrentFamily} />;
}

/* ------------------------------------------------------------------ */
/* HAS an active family: detail + invite code + members               */
/* ------------------------------------------------------------------ */

function ActiveFamilyView({
  familyId,
  fallbackName,
}: {
  familyId: string;
  fallbackName: string | null;
}) {
  const {t} = useTranslation();
  const setCurrentFamily = useAuthStore((s) => s.setCurrentFamily);

  const [detail, setDetail] = useState<FamilyDetail | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Join another family" form state.
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Family switcher: the user's full family list.
  const [families, setFamilies] = useState<
    Array<{public_id: string; name: string}>
  >([]);

  const loadFamilies = useCallback(async () => {
    try {
      const list = await familyService.listFamilies();
      setFamilies(list);
    } catch {
      // Non-fatal: the switcher just stays hidden / stale.
    }
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        // Members can fail independently of the detail; surface detail errors
        // as the blocking error and keep members best-effort.
        const [detailResult, membersResult] = await Promise.allSettled([
          familyService.getFamily(familyId),
          familyService.getMembers(familyId),
        ]);

        if (detailResult.status === 'fulfilled') {
          setDetail(detailResult.value);
        } else {
          throw detailResult.reason;
        }

        if (membersResult.status === 'fulfilled') {
          setMembers(membersResult.value);
        } else {
          setMembers([]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t('family.loadError'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [familyId, t],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  // Join ANOTHER family, then make it the active one.
  const handleJoinAnother = useCallback(async () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) {
      setJoinError(t('family.codeRequired', {defaultValue: 'Please enter an invite code.'}));
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      await familyService.joinFamily(trimmed);
      // The join response is a membership, not the family. Refetch the user's
      // families and resolve the one whose detail invite_code matches; fall back
      // to the newest family in the list.
      const list = await familyService.getFamilies();
      let joinedId: string | null = null;
      let joinedName: string | null = null;
      for (const fam of list) {
        try {
          const famDetail = await familyService.getFamily(fam.public_id);
          if (famDetail.invite_code?.toUpperCase() === trimmed) {
            joinedId = famDetail.public_id;
            joinedName = famDetail.name;
            break;
          }
        } catch {
          // ignore individual detail failures, keep scanning
        }
      }
      if (!joinedId && list.length > 0) {
        const fam = list[list.length - 1];
        joinedId = fam.public_id;
        joinedName = fam.name;
      }
      if (!joinedId) {
        setJoinError(t('family.joinError', {defaultValue: 'Could not join. Check the code and try again.'}));
        return;
      }
      setCurrentFamily(joinedId, joinedName);
      setFamilies(list.map((f) => ({public_id: f.public_id, name: f.name})));
      setJoinCode('');
      void syncNow();
      void showAlert({
        title: t('family.joinedTitle', {defaultValue: 'Joined'}),
        message: t('family.joinedBody', {defaultValue: "You're now in this family."}),
      });
    } catch (e) {
      setJoinError(
        e instanceof Error
          ? e.message
          : t('family.joinError', {defaultValue: 'Could not join. Check the code and try again.'}),
      );
    } finally {
      setJoining(false);
    }
  }, [joinCode, setCurrentFamily, t]);

  // Switch the active family to an existing one the user already belongs to.
  const handleSwitch = useCallback(
    (id: string, name: string) => {
      if (id === familyId) {
        return;
      }
      setCurrentFamily(id, name);
      void syncNow();
      void showAlert({
        title: t('family.switchedTitle', {defaultValue: 'Switched family'}),
        message: name,
      });
    },
    [familyId, setCurrentFamily, t],
  );

  const inviteCode = detail?.invite_code ?? '';
  const familyName = detail?.name ?? fallbackName ?? t('family.hubTitle');
  const membersCount = detail?.members_count ?? members.length;

  const onShare = useCallback(async () => {
    if (!inviteCode) {
      return;
    }
    try {
      await Share.share({
        message: t('family.shareMessage', {
          name: familyName,
          code: inviteCode,
        }),
      });
    } catch {
      // user cancelled or share unavailable — non-fatal
    }
  }, [inviteCode, familyName, t]);

  if (loading && !detail) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !detail) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>{t('family.loadError')}</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => load()}
            accessibilityRole="button">
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary[500]}
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          <Avatar name={familyName} size="large" />
          <View style={styles.headerText}>
            <Text style={styles.familyName} numberOfLines={2}>
              {familyName}
            </Text>
            <Text style={styles.familyMeta}>
              {t('family.membersCount', {count: membersCount})}
            </Text>
          </View>
        </View>

        {/* Invite Code card */}
        <View style={styles.inviteCard}>
          <Text style={styles.inviteLabel}>{t('family.inviteCode')}</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel={t('family.shareCode')}>
            <Text style={styles.inviteCode}>
              {inviteCode || '— — — —'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.inviteHint}>{t('family.inviteCodeHint')}</Text>
          <Text style={styles.tapHint}>{t('family.tapToCopy')}</Text>

          <View style={styles.inviteActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonGhost]}
              onPress={onShare}
              disabled={!inviteCode}
              accessibilityRole="button">
              <Text style={styles.actionButtonGhostText}>
                {t('family.copy')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={onShare}
              disabled={!inviteCode}
              accessibilityRole="button">
              <Text style={styles.actionButtonPrimaryText}>
                {t('family.share')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Join another family */}
        <View style={[styles.formCard, styles.joinAnotherCard]}>
          <Text style={styles.formTitle}>
            {t('family.joinAnother', {defaultValue: 'Join another family'})}
          </Text>
          <Input
            value={joinCode}
            onChangeText={(v) => {
              setJoinCode(v.toUpperCase().slice(0, 8));
              if (joinError) {
                setJoinError(null);
              }
            }}
            placeholder={t('family.enterInviteCode', {
              defaultValue: 'Enter invite code',
            })}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            editable={!joining}
            error={joinError ?? undefined}
            style={styles.switchCodeInput}
            returnKeyType="go"
            onSubmitEditing={handleJoinAnother}
            containerStyle={styles.switchInputContainer}
          />
          <Button
            title={t('family.joinButton', {defaultValue: 'Join'})}
            onPress={handleJoinAnother}
            variant="gold"
            loading={joining}
            disabled={joining}
            fullWidth
          />
        </View>

        {/* Family switcher */}
        {families.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('family.yourFamilies', {defaultValue: 'Your families'})}
            </Text>
            {families.map((fam) => {
              const active = fam.public_id === familyId;
              return (
                <TouchableOpacity
                  key={fam.public_id}
                  style={[
                    styles.familyRow,
                    active && styles.familyRowActive,
                  ]}
                  onPress={() => handleSwitch(fam.public_id, fam.name)}
                  disabled={active}
                  accessibilityRole="button">
                  <Avatar name={fam.name} size="medium" />
                  <Text style={styles.familyRowName} numberOfLines={1}>
                    {fam.name}
                  </Text>
                  {active && <Text style={styles.familyRowCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('family.members')}</Text>

          {members.length > 0 ? (
            members.map((m) => (
              <MemberRow key={m.public_id} member={m} adminLabel={t('family.admin')} />
            ))
          ) : (
            <View style={styles.emptyMembers}>
              <Text style={styles.emptyEmoji}>👋</Text>
              <Text style={styles.emptyTitle}>
                {t('family.noMembersTitle')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t('family.noMembersBody')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MemberRow({
  member,
  adminLabel,
}: {
  member: FamilyMember;
  adminLabel: string;
}) {
  const name = member.nickname || member.user?.full_name || '—';
  const roleText = member.is_admin
    ? adminLabel
    : i18n.t(`roles.${member.role}`, {defaultValue: member.role});
  return (
    <View style={styles.memberRow}>
      <Avatar name={member.user?.full_name} size="medium" />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>
          {name}
        </Text>
        {!!roleText && (
          <Text style={styles.memberRole} numberOfLines={1}>
            {roleText}
          </Text>
        )}
      </View>
      {member.is_admin && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>{adminLabel}</Text>
        </View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* NO active family: create + join forms                              */
/* ------------------------------------------------------------------ */

function NoFamilyView({
  onActivated,
}: {
  onActivated: (id: string | null, name?: string | null) => void;
}) {
  const {t} = useTranslation();

  // Create form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join form state
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setCreateError(t('family.nameRequired'));
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const result = await familyService.createFamily({
        name: trimmed,
        description: description.trim() || undefined,
      });
      onActivated(result.public_id, result.name);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : t('family.createError'));
    } finally {
      setCreating(false);
    }
  }, [name, description, onActivated, t]);

  const handleJoin = useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setJoinError(t('family.codeRequired'));
      return;
    }
    if (trimmed.length !== 8) {
      setJoinError(t('family.codeLength'));
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      await familyService.joinFamily(trimmed);
      // The join response is the membership, not the family — refetch families
      // and activate the one matching the entered invite code's family.
      const families = await familyService.getFamilies();
      // We can't map invite_code -> family from the list shape, so resolve by
      // checking each family's detail for the matching code (newest first is
      // typically the just-joined one). Fall back to the first family.
      let activated = false;
      for (const fam of families) {
        try {
          const detail = await familyService.getFamily(fam.public_id);
          if (detail.invite_code?.toUpperCase() === trimmed) {
            onActivated(detail.public_id, detail.name);
            activated = true;
            break;
          }
        } catch {
          // ignore individual detail failures, keep scanning
        }
      }
      if (!activated && families.length > 0) {
        const fam = families[families.length - 1];
        onActivated(fam.public_id, fam.name);
        activated = true;
      }
      if (activated) {
        void showAlert({title: t('family.joinedTitle'), message: t('family.joinedBody')});
      } else {
        setJoinError(t('family.joinError'));
      }
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : t('family.joinError'));
    } finally {
      setJoining(false);
    }
  }, [code, onActivated, t]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.introTitle}>{t('family.emptyHubTitle')}</Text>
          <Text style={styles.introBody}>{t('family.emptyHubBody')}</Text>
        </View>

        {/* Create family form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{t('family.createTitle')}</Text>
          <Text style={styles.formSubtitle}>{t('family.createSubtitle')}</Text>

          <Text style={styles.inputLabel}>{t('family.familyName')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (createError) {
                setCreateError(null);
              }
            }}
            placeholder={t('family.namePlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            editable={!creating}
            returnKeyType="next"
          />

          <Text style={styles.inputLabel}>
            {t('family.descriptionLabel')}{' '}
            <Text style={styles.optional}>({t('common.optional')})</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('family.descriptionPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            editable={!creating}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {!!createError && <Text style={styles.errorText}>{createError}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, creating && styles.submitButtonDisabled]}
            onPress={handleCreate}
            disabled={creating}
            accessibilityRole="button">
            {creating ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {t('family.createButton')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('family.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Join family form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{t('family.joinTitle')}</Text>
          <Text style={styles.formSubtitle}>{t('family.joinSubtitle')}</Text>

          <Text style={styles.inputLabel}>{t('family.familyCode')}</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(v) => {
              setCode(v.toUpperCase().slice(0, 8));
              if (joinError) {
                setJoinError(null);
              }
            }}
            placeholder={t('family.codePlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            editable={!joining}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            returnKeyType="go"
            onSubmitEditing={handleJoin}
          />

          {!!joinError && <Text style={styles.errorText}>{joinError}</Text>}

          <TouchableOpacity
            style={[
              styles.submitButton,
              styles.submitButtonGold,
              joining && styles.submitButtonDisabled,
            ]}
            onPress={handleJoin}
            disabled={joining}
            accessibilityRole="button">
            {joining ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {t('family.joinButton')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[16],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[2],
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing[2],
  },
  emptyTitle: {
    ...typography.h5,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },

  /* Active family header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  headerText: {
    flex: 1,
  },
  familyName: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  familyMeta: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },

  /* Invite code card */
  inviteCard: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[6],
    ...shadows.lg,
  },
  inviteLabel: {
    ...typography.label,
    color: colors.primary[100],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inviteCode: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 6,
    marginVertical: spacing[2],
    textAlign: 'center',
  },
  inviteHint: {
    ...typography.caption,
    color: colors.primary[100],
    textAlign: 'center',
  },
  tapHint: {
    ...typography.caption,
    color: colors.gold[200],
    textAlign: 'center',
    marginTop: spacing[1],
  },
  inviteActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[5],
    alignSelf: 'stretch',
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: colors.gold[500],
  },
  actionButtonPrimaryText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
  actionButtonGhost: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  actionButtonGhostText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },

  /* Members */
  section: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  memberRole: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: colors.gold[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  adminBadgeText: {
    ...typography.labelSmall,
    color: colors.gold[700],
    fontWeight: '700',
  },
  emptyMembers: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    gap: spacing[1],
  },

  /* Join another family + switcher (active-family view) */
  joinAnotherCard: {
    marginBottom: spacing[6],
  },
  switchInputContainer: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  switchCodeInput: {
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  familyRowActive: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  familyRowName: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  familyRowCheck: {
    ...typography.h5,
    color: colors.primary[500],
    fontWeight: '800',
  },

  /* No-family intro */
  intro: {
    alignItems: 'center',
    marginBottom: spacing[6],
    gap: spacing[1],
  },
  introEmoji: {
    fontSize: 56,
    marginBottom: spacing[2],
  },
  introTitle: {
    ...typography.h4,
    color: colors.text.primary,
    textAlign: 'center',
  },
  introBody: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },

  /* Forms */
  formCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.md,
  },
  formTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  formSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  inputLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  optional: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '400',
  },
  input: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    ...typography.body,
    color: colors.text.primary,
  },
  inputMultiline: {
    minHeight: 80,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing[3],
  },
  submitButton: {
    marginTop: spacing[5],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  submitButtonGold: {
    backgroundColor: colors.gold[600],
    ...shadows.glowGold,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[6],
    gap: spacing[3],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
});
