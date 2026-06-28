/**
 * Halaqat Screen
 * Study circles backed by the real /halaqat API, with an enroll (join) action.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Avatar from '../../components/ui/Avatar';
import halaqatService, {Halaqa} from '../../services/api/halaqat.service';
import {showAlert} from '../../store/dialogStore';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';

export default function HalaqatScreen() {
  const {t} = useTranslation();

  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await halaqatService.listHalaqat();
        setHalaqat(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('halaqat.couldntLoad'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onJoin = async (item: Halaqa) => {
    if (joiningId || joinedIds.has(item.id)) return;
    setJoiningId(item.id);
    try {
      await halaqatService.join(item.id);
      setJoinedIds((prev) => new Set(prev).add(item.id));
      void showAlert({title: t('halaqat.joinedTitle'), message: t('halaqat.joinedBody')});
    } catch (e) {
      void showAlert({
        title: t('halaqat.joinFailed'),
        message: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setJoiningId(null);
    }
  };

  const renderHalaqa = ({item}: {item: Halaqa}) => {
    const instructorName = item.instructor?.full_name ?? '';
    const isJoined = joinedIds.has(item.id);
    const isJoining = joiningId === item.id;
    const isFull = !!item.is_full;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {!!instructorName && (
              <View style={styles.instructorRow}>
                <Avatar
                  name={instructorName}
                  size="small"
                  source={
                    item.instructor?.avatar
                      ? {uri: item.instructor.avatar}
                      : undefined
                  }
                />
                <Text style={styles.instructorName} numberOfLines={1}>
                  {t('halaqat.by', {name: instructorName})}
                </Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.modeBadge,
              item.is_online ? styles.modeOnline : styles.modeInPerson,
            ]}>
            <Icon
              name={item.is_online ? 'video-outline' : 'map-marker-outline'}
              size={12}
              color={colors.white}
            />
            <Text style={styles.modeText}>
              {item.is_online ? t('halaqat.online') : t('halaqat.inPerson')}
            </Text>
          </View>
        </View>

        {!!item.description && (
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        <View style={styles.metaRow}>
          {!!item.schedule && (
            <View style={styles.metaItem}>
              <Icon
                name="calendar-clock"
                size={14}
                color={colors.text.tertiary}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.schedule}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Icon
              name="account-group-outline"
              size={14}
              color={colors.text.tertiary}
            />
            <Text style={styles.metaText}>
              {t('halaqat.members', {count: item.enrolled_count ?? 0})}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.joinBtn,
            (isJoined || isFull) && styles.joinBtnDisabled,
          ]}
          onPress={() => onJoin(item)}
          disabled={isJoined || isFull || isJoining}
          activeOpacity={0.8}>
          {isJoining ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text
              style={[
                styles.joinBtnText,
                (isJoined || isFull) && styles.joinBtnTextDisabled,
              ]}>
              {isJoined
                ? t('halaqat.joined')
                : isFull
                ? t('halaqat.full')
                : t('halaqat.join')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.emptySubtext}>{t('halaqat.loading')}</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle-outline" size={56} color={colors.error} />
          <Text style={styles.emptyText}>{t('halaqat.couldntLoad')}</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>{t('halaqat.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Icon
          name="book-open-page-variant-outline"
          size={56}
          color={colors.text.tertiary}
        />
        <Text style={styles.emptyText}>{t('halaqat.noHalaqatTitle')}</Text>
        <Text style={styles.emptySubtext}>{t('halaqat.noHalaqatBody')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('halaqat.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('halaqat.subtitle')}</Text>
      </View>

      <FlatList
        data={halaqat}
        renderItem={renderHalaqa}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  list: {
    padding: spacing[4],
    paddingBottom: spacing[20],
    flexGrow: 1,
    gap: spacing[3],
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.h5,
    color: colors.text.primary,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  instructorName: {
    ...typography.caption,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  modeOnline: {
    backgroundColor: colors.skyBlue[500],
  },
  modeInPerson: {
    backgroundColor: colors.gold[600],
  },
  modeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  description: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[3],
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    marginTop: spacing[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    flexShrink: 1,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  joinBtn: {
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnDisabled: {
    backgroundColor: colors.slate[100],
  },
  joinBtnText: {
    ...typography.button,
    color: colors.white,
  },
  joinBtnTextDisabled: {
    color: colors.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[20],
    gap: spacing[2],
  },
  emptyText: {
    ...typography.h5,
    color: colors.text.secondary,
    marginTop: spacing[2],
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },
  retryBtn: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  retryText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
});
