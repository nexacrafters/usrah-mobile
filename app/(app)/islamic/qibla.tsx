/**
 * Qibla Direction Screen - Arabic Only - Enhanced UI
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence } from 'react-native-reanimated';
import { Compass, MapPin, ChevronRight, Navigation, Info, Globe } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useQiblaDirection } from '../../../hooks/queries/useIslamic';
import { useThemeStore } from '../../../store/themeStore';

const { width } = Dimensions.get('window');

export default function QiblaScreen() {
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const fontFamily = 'Tajawal_500Medium';
  const fontBold = 'Tajawal_700Bold';

  // Location state
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState('جاري تحديد الموقع...');
  const [locationLoading, setLocationLoading] = useState(true);

  // Get location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('لم يتم منح إذن الموقع');
          setLocationLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        // Reverse geocode to get location name
        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (address) {
          setLocationName(`${address.city || address.region || ''}, ${address.country || ''}`);
        }
      } catch (error) {
        console.error('Location error:', error);
        setLocationName('تعذر تحديد الموقع');
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  // Get Qibla direction from hook
  const { data: qiblaData, isLoading: qiblaLoading } = useQiblaDirection(
    location?.latitude || 0,
    location?.longitude || 0
  );

  const qiblaDirection = qiblaData?.direction || 0;
  const distanceKm = qiblaData?.distanceKm || 0;

  // Get direction label in Arabic
  const getDirectionLabel = (degrees: number) => {
    if (degrees >= 337.5 || degrees < 22.5) return 'شمال';
    if (degrees >= 22.5 && degrees < 67.5) return 'شمال شرق';
    if (degrees >= 67.5 && degrees < 112.5) return 'شرق';
    if (degrees >= 112.5 && degrees < 157.5) return 'جنوب شرق';
    if (degrees >= 157.5 && degrees < 202.5) return 'جنوب';
    if (degrees >= 202.5 && degrees < 247.5) return 'جنوب غرب';
    if (degrees >= 247.5 && degrees < 292.5) return 'غرب';
    return 'شمال غرب';
  };

  // Format distance in Arabic
  const formatDistance = (km: number) => {
    return km.toLocaleString('ar-TN') + ' كم';
  };

  const isLoading = locationLoading || qiblaLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={[styles.title, { color: theme.text, fontFamily: fontBold }]}>اتجاه القبلة</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronRight size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary, fontFamily }]}>
            جاري تحديد اتجاه القبلة...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={[styles.title, { color: theme.text, fontFamily: fontBold }]}>اتجاه القبلة</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <ChevronRight size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Main Compass Card with Gradient */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <LinearGradient
            colors={isDark ? [Colors.slate[800], Colors.slate[900]] : [Colors.white, Colors.cream[100]]}
            style={[styles.compassContainer, { borderColor: theme.cardBorder }]}
          >
            {/* Compass Ring */}
            <View style={styles.compassRing}>
              <LinearGradient
                colors={[Colors.primary[400], Colors.primary[600]]}
                style={styles.compassOuter}
              >
                <View style={styles.compassMiddle}>
                  <LinearGradient
                    colors={[Colors.gold[400], Colors.gold[600]]}
                    style={styles.compassInner}
                  >
                    <Compass size={32} color={Colors.white} />
                  </LinearGradient>
                </View>
                {/* Qibla Arrow */}
                <View style={[styles.directionIndicator, { transform: [{ rotate: `${qiblaDirection}deg` }] }]}>
                  <LinearGradient
                    colors={[Colors.gold[400], Colors.gold[600]]}
                    style={styles.arrow}
                  />
                  <View style={styles.arrowHead} />
                </View>
              </LinearGradient>
              {/* Direction Markers */}
              <View style={styles.directionMarkers}>
                <Text style={[styles.markerText, styles.markerN, { fontFamily: fontBold }]}>ش</Text>
                <Text style={[styles.markerText, styles.markerE, { fontFamily: fontBold }]}>ق</Text>
                <Text style={[styles.markerText, styles.markerS, { fontFamily: fontBold }]}>ج</Text>
                <Text style={[styles.markerText, styles.markerW, { fontFamily: fontBold }]}>غ</Text>
              </View>
            </View>

            {/* Degrees Display */}
            <View style={styles.degreesContainer}>
              <Text style={[styles.directionText, { color: theme.text, fontFamily: fontBold }]}>{Math.round(qiblaDirection)}°</Text>
              <View style={[styles.directionBadge, { backgroundColor: Colors.primary[100] }]}>
                <Navigation size={14} color={Colors.primary[600]} />
                <Text style={[styles.directionLabel, { color: Colors.primary[600], fontFamily }]}>{getDirectionLabel(qiblaDirection)}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary[100] }]}>
              <MapPin size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily }]}>الموقع</Text>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: fontBold }]} numberOfLines={1}>{locationName}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.gold[100] }]}>
              <Globe size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily }]}>المسافة</Text>
            <Text style={[styles.statValue, { color: Colors.gold[600], fontFamily: fontBold }]}>{formatDistance(distanceKm)}</Text>
          </View>
        </Animated.View>

        {/* Instructions Card */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <LinearGradient
            colors={[Colors.primary[50], Colors.primary[100]]}
            style={styles.instructionsCard}
          >
            <View style={styles.instructionsHeader}>
              <Text style={[styles.instructionsTitle, { color: Colors.primary[700], fontFamily: fontBold }]}>كيفية الاستخدام</Text>
              <View style={[styles.infoIcon, { backgroundColor: Colors.primary[200] }]}>
                <Info size={16} color={Colors.primary[700]} />
              </View>
            </View>
            <Text style={[styles.instructionsText, { color: Colors.primary[600], fontFamily }]}>
              أمسك هاتفك بشكل مسطح وأدره حتى يشير السهم الذهبي إلى اتجاه القبلة. تأكد من إبعاد الهاتف عن المعادن لدقة أفضل.
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20 },
  placeholder: { width: 44 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, textAlign: 'center' },
  content: { flex: 1, padding: 20 },

  // Compass Container
  compassContainer: { alignItems: 'center', padding: 28, borderRadius: 28, borderWidth: 1, marginBottom: 20, width: '100%' },
  compassRing: { position: 'relative', width: width * 0.6, height: width * 0.6, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  compassOuter: { width: width * 0.5, height: width * 0.5, borderRadius: width * 0.25, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  compassMiddle: { width: width * 0.35, height: width * 0.35, borderRadius: width * 0.175, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  compassInner: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  directionIndicator: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center' },
  arrow: { width: 6, height: '38%', borderRadius: 3 },
  arrowHead: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: Colors.gold[500], marginTop: -4 },
  directionMarkers: { position: 'absolute', width: '100%', height: '100%' },
  markerText: { position: 'absolute', fontSize: 14, color: Colors.slate[500] },
  markerN: { top: 0, left: '50%', marginLeft: -6 },
  markerS: { bottom: 0, left: '50%', marginLeft: -6 },
  markerE: { right: 0, top: '50%', marginTop: -10 },
  markerW: { left: 0, top: '50%', marginTop: -10 },

  // Degrees Display
  degreesContainer: { alignItems: 'center', gap: 8 },
  directionText: { fontSize: 42 },
  directionBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  directionLabel: { fontSize: 14 },

  // Stats Row
  statsRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 14, textAlign: 'center' },

  // Instructions Card
  instructionsCard: { width: '100%', padding: 20, borderRadius: 20 },
  instructionsHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  instructionsTitle: { fontSize: 16 },
  infoIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  instructionsText: { fontSize: 14, lineHeight: 24, textAlign: 'right' },
});
