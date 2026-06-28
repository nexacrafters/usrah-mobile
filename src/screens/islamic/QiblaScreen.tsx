/**
 * Qibla Screen
 *
 * Computes the Qibla bearing (degrees clockwise from true North toward the
 * Kaaba) and the great-circle distance to Makkah from the device location.
 * Location is read once via @react-native-community/geolocation; if it fails
 * or is denied we fall back to Tunis. No magnetometer is used — we display the
 * fixed bearing-from-North together with a Kaaba arrow rotated to that bearing.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import {useTranslation} from 'react-i18next';
import Card from '../../components/ui/Card';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';

// Kaaba (Makkah, Saudi Arabia)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Fallback when location is unavailable/denied (Tunis, Tunisia)
const FALLBACK_LAT = 36.8065;
const FALLBACK_LNG = 10.1815;

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Initial bearing (forward azimuth) from point 1 to point 2, normalized 0–360. */
function computeBearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Haversine great-circle distance in kilometres. */
function computeDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface QiblaResult {
  latitude: number;
  longitude: number;
  bearing: number;
  distanceKm: number;
  usedFallback: boolean;
}

export default function QiblaScreen() {
  const {t, i18n} = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<QiblaResult | null>(null);

  const buildResult = useCallback(
    (lat: number, lng: number, usedFallback: boolean): QiblaResult => ({
      latitude: lat,
      longitude: lng,
      bearing: computeBearing(lat, lng, KAABA_LAT, KAABA_LNG),
      distanceKm: computeDistanceKm(lat, lng, KAABA_LAT, KAABA_LNG),
      usedFallback,
    }),
    [],
  );

  const locate = useCallback(() => {
    // Render the Tunis fallback IMMEDIATELY so the screen is never blank/hung,
    // then refine with the device location in the background if it resolves.
    setResult(buildResult(FALLBACK_LAT, FALLBACK_LNG, true));
    setLoading(false);

    try {
      Geolocation.getCurrentPosition(
        (pos) => setResult(buildResult(pos.coords.latitude, pos.coords.longitude, false)),
        () => {
          /* keep the Tunis fallback already shown */
        },
        {enableHighAccuracy: false, timeout: 8000, maximumAge: 600000},
      );
    } catch {
      /* keep the Tunis fallback already shown */
    }
  }, [buildResult]);

  useEffect(() => {
    locate();
  }, [locate]);

  const fmtDeg = (n: number) =>
    t('islamic.qiblaDegrees', {value: Math.round(n)});
  const fmtKm = (n: number) =>
    t('islamic.qiblaKilometers', {
      value: Math.round(n).toLocaleString(isArabic ? 'ar-u-nu-latn' : 'en-US'),
    });
  const fmtCoord = (n: number) => n.toFixed(4);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('islamic.qiblaTitle')}</Text>
        <Text style={styles.headerSubtitle}>{t('islamic.qiblaSubtitle')}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centeredText}>{t('islamic.qiblaLocating')}</Text>
        </View>
      ) : result ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Compass / arrow */}
          <Card style={styles.compassCard}>
            <LinearGradient
              colors={[colors.primary[500], colors.primary[700]]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.compassGradient}>
              <Text style={styles.compassNorth}>N</Text>
              <View style={styles.compassRing}>
                <View
                  style={[
                    styles.arrowWrap,
                    {transform: [{rotate: `${result.bearing}deg`}]},
                  ]}>
                  <Icon name="navigation" size={88} color={colors.white} />
                </View>
                <View style={styles.kaabaBadge}>
                  <Icon name="kaaba" size={26} color={colors.gold[600]} />
                </View>
              </View>
              <Text style={styles.bearingValue}>{fmtDeg(result.bearing)}</Text>
              <Text style={styles.bearingLabel}>
                {t('islamic.qiblaBearing')}
              </Text>
            </LinearGradient>
          </Card>

          {/* Stats */}
          <View style={styles.statsRow}>
            <Card variant="outlined" style={styles.statCard}>
              <Icon
                name="compass-outline"
                size={24}
                color={colors.primary[500]}
              />
              <Text style={styles.statValue}>{fmtDeg(result.bearing)}</Text>
              <Text style={styles.statLabel}>{t('islamic.qiblaBearing')}</Text>
            </Card>
            <Card variant="outlined" style={styles.statCard}>
              <Icon name="map-marker-distance" size={24} color={colors.gold[600]} />
              <Text style={styles.statValue}>{fmtKm(result.distanceKm)}</Text>
              <Text style={styles.statLabel}>
                {t('islamic.qiblaDistance')}
              </Text>
            </Card>
          </View>

          {/* Location */}
          <Card variant="outlined" style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Icon name="crosshairs-gps" size={20} color={colors.primary[500]} />
              <Text style={styles.locationTitle}>
                {t('islamic.qiblaYourLocation')}
              </Text>
            </View>
            <Text style={styles.coordsLabel}>
              {t('islamic.qiblaCoordinates')}
            </Text>
            <Text style={styles.coordsValue}>
              {fmtCoord(result.latitude)}, {fmtCoord(result.longitude)}
            </Text>
            {result.usedFallback && (
              <View style={styles.fallbackPill}>
                <Icon name="information-outline" size={14} color={colors.warning} />
                <Text style={styles.fallbackText}>
                  {t('islamic.qiblaUsingFallback')}
                </Text>
              </View>
            )}
          </Card>

          <Text style={styles.note}>{t('islamic.qiblaNote')}</Text>

          <TouchableOpacity
            style={styles.recalcBtn}
            activeOpacity={0.85}
            onPress={locate}>
            <Icon name="refresh" size={18} color={colors.white} />
            <Text style={styles.recalcText}>
              {t('islamic.qiblaRecalculate')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </SafeAreaView>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  centeredText: {...typography.bodySmall, color: colors.text.secondary},
  scrollContent: {padding: spacing[4], paddingBottom: spacing[10]},
  compassCard: {padding: 0, overflow: 'hidden', marginBottom: spacing[4]},
  compassGradient: {padding: spacing[6], alignItems: 'center'},
  compassNorth: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    marginBottom: spacing[2],
  },
  compassRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  arrowWrap: {alignItems: 'center', justifyContent: 'center'},
  kaabaBadge: {
    position: 'absolute',
    bottom: -14,
    backgroundColor: colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  bearingValue: {fontSize: 44, fontWeight: 'bold', color: colors.white},
  bearingLabel: {...typography.caption, color: 'rgba(255,255,255,0.85)'},
  statsRow: {flexDirection: 'row', gap: spacing[3], marginBottom: spacing[4]},
  statCard: {flex: 1, alignItems: 'center', gap: spacing[2], paddingVertical: spacing[5]},
  statValue: {...typography.h4, color: colors.text.primary, fontWeight: '700'},
  statLabel: {...typography.caption, color: colors.text.secondary, textAlign: 'center'},
  locationCard: {marginBottom: spacing[4]},
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  locationTitle: {...typography.h6, color: colors.text.primary, fontWeight: '600'},
  coordsLabel: {...typography.caption, color: colors.text.tertiary},
  coordsValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
  fallbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.warning + '14',
    borderRadius: borderRadius.md,
  },
  fallbackText: {...typography.caption, color: colors.text.secondary, flex: 1},
  note: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing[5],
    paddingHorizontal: spacing[2],
  },
  recalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  recalcText: {...typography.button, color: colors.white},
});
