/**
 * Daily Duas Screen
 *
 * Loads duas and their categories from the live API:
 *   GET /islamic/duas/
 *   GET /islamic/duas/categories/
 * Categories act as filter chips; selecting one filters the list locally. The
 * dua/category field names are read defensively (the backend schema may vary),
 * and any missing field is simply omitted. On error or empty data we show a
 * friendly empty state — never mock content.
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import Card from '../../components/ui/Card';
import apiClient, {handleApiError, unwrapList} from '../../services/api/client';
import {colors, spacing, typography, borderRadius} from '../../theme';

interface DuaCategory {
  id: string;
  name: string;
}

interface Dua {
  id: string;
  title?: string;
  arabic?: string;
  translation?: string;
  transliteration?: string;
  reference?: string;
  categoryId?: string | null;
}

const str = (...vals: unknown[]): string | undefined => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
};

const id = (v: Record<string, unknown>): string =>
  String(v.public_id ?? v.id ?? v.slug ?? Math.random());

function normalizeCategory(raw: Record<string, unknown>): DuaCategory {
  return {
    id: id(raw),
    name: str(raw.name, raw.title, raw.name_en, raw.label) ?? '',
  };
}

function normalizeDua(raw: Record<string, unknown>): Dua {
  const cat = raw.category as Record<string, unknown> | string | null | undefined;
  const categoryId =
    typeof cat === 'string'
      ? cat
      : cat && typeof cat === 'object'
      ? id(cat)
      : (str(raw.category_id) ?? null);
  return {
    id: id(raw),
    title: str(raw.title, raw.name, raw.title_en),
    arabic: str(raw.arabic, raw.arabic_text, raw.text_ar, raw.dua_arabic),
    translation: str(
      raw.translation,
      raw.translation_en,
      raw.meaning,
      raw.text_en,
      raw.english,
    ),
    transliteration: str(raw.transliteration, raw.latin),
    reference: str(raw.reference, raw.source, raw.narrator),
    categoryId,
  };
}

export default function DuasScreen() {
  const {t} = useTranslation();
  const [categories, setCategories] = useState<DuaCategory[]>([]);
  const [duas, setDuas] = useState<Dua[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [catResp, duaResp] = await Promise.allSettled([
        apiClient.get('/islamic/duas/categories/'),
        apiClient.get('/islamic/duas/'),
      ]);

      if (catResp.status === 'fulfilled') {
        const list = unwrapList<Record<string, unknown>>(catResp.value.data);
        setCategories(list.map(normalizeCategory).filter((c) => c.name));
      } else {
        setCategories([]);
      }

      if (duaResp.status === 'fulfilled') {
        const list = unwrapList<Record<string, unknown>>(duaResp.value.data);
        setDuas(list.map(normalizeDua).filter((d) => d.arabic || d.translation));
      } else {
        setDuas([]);
        setError(handleApiError(duaResp.reason));
      }
    } catch (e) {
      setDuas([]);
      setError(handleApiError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const visibleDuas = useMemo(
    () => (activeCat ? duas.filter((d) => d.categoryId === activeCat) : duas),
    [duas, activeCat],
  );

  const isEmpty = !loading && duas.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('islamic.duasTitle')}</Text>
        <Text style={styles.headerSubtitle}>{t('islamic.duasSubtitle')}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : isEmpty ? (
        <ScrollView
          contentContainerStyle={styles.emptyWrap}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={styles.emptyIcon}>
            <Icon name="hand-heart" size={44} color={colors.primary[400]} />
          </View>
          <Text style={styles.emptyTitle}>
            {error ? t('islamic.duasErrorTitle') : t('islamic.duasEmptyTitle')}
          </Text>
          <Text style={styles.emptyBody}>
            {error || t('islamic.duasEmptyBody')}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh} activeOpacity={0.85}>
            <Icon name="refresh" size={18} color={colors.white} />
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {/* Category filter chips */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}>
              <Chip
                label={t('islamic.duasAllCategories')}
                selected={activeCat === null}
                onPress={() => setActiveCat(null)}
              />
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  selected={activeCat === c.id}
                  onPress={() => setActiveCat(c.id)}
                />
              ))}
            </ScrollView>
          )}

          {visibleDuas.map((d) => (
            <Card key={d.id} variant="outlined" style={styles.duaCard}>
              {d.title && <Text style={styles.duaTitle}>{d.title}</Text>}
              {d.arabic && <Text style={styles.duaArabic}>{d.arabic}</Text>}
              {d.transliteration && (
                <Text style={styles.duaTranslit}>{d.transliteration}</Text>
              )}
              {d.translation && (
                <Text style={styles.duaTranslation}>{d.translation}</Text>
              )}
              {d.reference && (
                <View style={styles.refRow}>
                  <Icon name="book-open-variant" size={13} color={colors.gold[600]} />
                  <Text style={styles.duaRef}>{d.reference}</Text>
                </View>
              )}
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.85}>
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background.default},
  header: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {...typography.h3, color: colors.text.primary, fontWeight: 'bold'},
  headerSubtitle: {...typography.caption, color: colors.text.secondary},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  scrollContent: {padding: spacing[4], paddingBottom: spacing[10]},
  chips: {gap: spacing[2], paddingBottom: spacing[4]},
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipActive: {backgroundColor: colors.primary[500], borderColor: colors.primary[500]},
  chipText: {...typography.label, color: colors.text.secondary},
  chipTextActive: {color: colors.white, fontWeight: '700'},
  duaCard: {marginBottom: spacing[3], padding: spacing[5]},
  duaTitle: {...typography.h6, color: colors.text.primary, fontWeight: '600', marginBottom: spacing[3]},
  duaArabic: {
    fontSize: 22,
    lineHeight: 38,
    color: colors.primary[700],
    textAlign: 'right',
    marginBottom: spacing[3],
  },
  duaTranslit: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginBottom: spacing[2],
  },
  duaTranslation: {...typography.body, color: colors.text.secondary, lineHeight: 24},
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  duaRef: {...typography.caption, color: colors.text.tertiary},
  emptyWrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[3],
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  emptyTitle: {...typography.h5, color: colors.text.primary, fontWeight: '600', textAlign: 'center'},
  emptyBody: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    marginTop: spacing[3],
  },
  retryText: {...typography.button, color: colors.white},
});
