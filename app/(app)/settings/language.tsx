/**
 * Language Settings Screen with Premium UI
 * Select Arabic or English with RTL support
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { ArrowLeft, ArrowRight, Check, Globe, Languages, Sparkles, Info } from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useLanguageStore } from '../../../store/languageStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../../../i18n';

interface LanguageOptionProps {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  isSelected: boolean;
  onSelect: () => void;
  isDark: boolean;
  isRTL: boolean;
  theme: typeof LightTheme;
  index: number;
}

const LanguageOption: React.FC<LanguageOptionProps> = ({
  code,
  name,
  nativeName,
  flag,
  isSelected,
  onSelect,
  isDark,
  isRTL,
  theme,
  index,
}) => (
  <Animated.View entering={FadeInUp.delay(200 + index * 100).duration(400)}>
    <TouchableOpacity
      style={[styles.languageOption, { backgroundColor: theme.card, borderColor: isSelected ? Colors.primary[500] : theme.cardBorder }]}
      onPress={onSelect}
    >
      {isSelected && (
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[600]]}
          style={styles.selectedOverlay}
        />
      )}
      <View style={[styles.languageContent, isRTL && styles.rowReverse]}>
        <View style={[styles.flagContainer, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : Colors.primary[100] }]}>
          <Text style={styles.flagEmoji}>{flag}</Text>
        </View>
        <View style={[styles.languageInfo, isRTL && styles.languageInfoRTL]}>
          <Text style={[
            styles.languageName,
            { color: isSelected ? Colors.white : theme.text, fontFamily: getFont('bold') }
          ]}>
            {nativeName}
          </Text>
          <Text style={[
            styles.languageSubtitle,
            { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textSecondary, fontFamily: getFont('regular') }
          ]}>
            {name}
          </Text>
        </View>
        {isSelected && (
          <Animated.View entering={ZoomIn.duration(300)}>
            <LinearGradient
              colors={[Colors.gold[400], Colors.gold[500]]}
              style={styles.checkContainer}
            >
              <Check size={18} color={Colors.slate[900]} strokeWidth={3} />
            </LinearGradient>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  </Animated.View>
);

export default function LanguageSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const isRTL = checkRTL();

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleLanguageSelect = async (code: LanguageCode) => {
    if (code === language) return;

    const needsRestart = await setLanguage(code);

    if (needsRestart) {
      Alert.alert(
        t('settings.restartRequired') || 'Restart Required',
        t('settings.restartMessage') || 'The app needs to restart to apply the language change. Please close and reopen the app.',
        [
          {
            text: t('common.ok'),
          },
        ]
      );
    }
  };

  const languages = [
    { code: 'ar' as LanguageCode, name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'en' as LanguageCode, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative circles */}
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />

          <View style={[styles.headerContent, isRTL && styles.rowReverse]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <BackIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={[styles.headerCenter, isRTL && styles.alignEnd]}>
              <View style={[styles.headerTitleRow, isRTL && styles.rowReverse]}>
                <Languages size={24} color={Colors.gold[400]} />
                <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                  {t('settings.language')}
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {isRTL ? 'اختر لغة التطبيق المفضلة' : 'Choose your preferred language'}
              </Text>
            </View>
            <View style={styles.headerIconBox}>
              <Globe size={24} color={Colors.gold[400]} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Language Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <LinearGradient
            colors={isDark ? [Colors.gold[600], Colors.gold[700]] : [Colors.gold[400], Colors.gold[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.currentCard}
          >
            <View style={[styles.currentCardContent, isRTL && styles.rowReverse]}>
              <View style={styles.currentIconBox}>
                <Sparkles size={24} color={Colors.gold[600]} />
              </View>
              <View style={[styles.currentInfo, isRTL && styles.alignEnd]}>
                <Text style={[styles.currentLabel, { fontFamily: getFont('regular') }]}>
                  {isRTL ? 'اللغة الحالية' : 'Current Language'}
                </Text>
                <Text style={[styles.currentValue, { fontFamily: getFont('bold') }]}>
                  {language === 'ar' ? 'العربية' : 'English'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Language Options */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
            {isRTL ? 'اختر اللغة' : 'Select Language'}
          </Text>

          <View style={styles.optionsContainer}>
            {languages.map((lang, index) => (
              <LanguageOption
                key={lang.code}
                code={lang.code}
                name={lang.name}
                nativeName={lang.nativeName}
                flag={lang.flag}
                isSelected={language === lang.code}
                onSelect={() => handleLanguageSelect(lang.code)}
                isDark={isDark}
                isRTL={isRTL}
                theme={theme}
                index={index}
              />
            ))}
          </View>
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.infoHeader, isRTL && styles.rowReverse]}>
              <View style={[styles.infoIconBox, { backgroundColor: Colors.primary[100] }]}>
                <Info size={20} color={Colors.primary[600]} />
              </View>
              <Text style={[styles.infoTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                {isRTL ? 'ملاحظة' : 'Note'}
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
              {t('settings.languageNote') || (isRTL
                ? 'سيتم تعديل اتجاه النص (RTL/LTR) تلقائياً بناءً على اختيار اللغة.'
                : 'The app will automatically adjust text direction (RTL/LTR) based on your language selection.')}
            </Text>
          </View>
        </Animated.View>

        {/* Features List */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
            {isRTL ? 'ما يتغير' : 'What Changes'}
          </Text>

          {[
            { icon: '🌐', titleAr: 'اتجاه النص', titleEn: 'Text Direction', descAr: 'RTL للعربية، LTR للإنجليزية', descEn: 'RTL for Arabic, LTR for English' },
            { icon: '📝', titleAr: 'المحتوى', titleEn: 'Content', descAr: 'جميع النصوص والتسميات', descEn: 'All texts and labels' },
            { icon: '🔤', titleAr: 'الخط', titleEn: 'Font', descAr: 'Tajawal للعربية، Inter للإنجليزية', descEn: 'Tajawal for Arabic, Inter for English' },
          ].map((feature, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.delay(550 + index * 80).duration(300)}
            >
              <View style={[styles.featureItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }, isRTL && styles.rowReverse]}>
                <View style={[styles.featureIconBox, { backgroundColor: Colors.primary[100] }]}>
                  <Text style={styles.featureEmoji}>{feature.icon}</Text>
                </View>
                <View style={[styles.featureInfo, isRTL && styles.alignEnd]}>
                  <Text style={[styles.featureTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                    {isRTL ? feature.titleAr : feature.titleEn}
                  </Text>
                  <Text style={[styles.featureDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                    {isRTL ? feature.descAr : feature.descEn}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    padding: 20,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle1: {
    width: 140,
    height: 140,
    top: -40,
    right: -20,
  },
  decorCircle2: {
    width: 90,
    height: 90,
    bottom: -20,
    left: -20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Current Card
  currentCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  currentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  currentIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentInfo: {
    flex: 1,
  },
  currentLabel: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 2,
  },
  currentValue: {
    fontSize: 20,
    color: Colors.slate[900],
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 14,
  },

  // Language Option
  languageOption: {
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  flagContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 28,
  },
  languageInfo: {
    flex: 1,
  },
  languageInfoRTL: {
    alignItems: 'flex-end',
  },
  languageName: {
    fontSize: 20,
    marginBottom: 4,
  },
  languageSubtitle: {
    fontSize: 14,
  },
  checkContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Info Card
  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Features Section
  featuresSection: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
  },
});
