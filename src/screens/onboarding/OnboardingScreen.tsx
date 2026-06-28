/**
 * Onboarding Screen
 * Beautiful feature showcase with Islamic design
 */

import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import Button from '../../components/ui/Button';
import {useAuthStore} from '../../store/authStore';
import {colors, spacing, typography, borderRadius} from '../../theme';
import {
  changeLanguage,
  SUPPORTED_LANGUAGES,
  LanguageCode,
} from '../../../i18n';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// Slides reference translation keys so they render only the active language.
const SLIDES = [
  {id: '1', key: 'slide1', emoji: '🏠', gradient: [colors.primary[500], colors.primary[300]]},
  {id: '2', key: 'slide2', emoji: '🕌', gradient: [colors.gold[500], colors.gold[300]]},
  {id: '3', key: 'slide3', emoji: '💬', gradient: [colors.skyBlue[500], colors.skyBlue[600]]},
  {id: '4', key: 'slide4', emoji: '👨‍👩‍👧‍👦', gradient: [colors.islamic.mashallah, '#16a34a']},
];

export default function OnboardingScreen() {
  const {t, i18n} = useTranslation();
  const setHasSeenOnboarding = useAuthStore(
    state => state.setHasSeenOnboarding,
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // The language to switch *to* (the one that is not currently active).
  const otherLang: LanguageCode = i18n.language === 'ar' ? 'en' : 'ar';
  const handleToggleLanguage = () => {
    changeLanguage(otherLang);
  };

  // Flipping the flag causes RootNavigator to swap to the Auth stack.
  const finishOnboarding = () => setHasSeenOnboarding(true);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const renderSlide = ({item}: {item: typeof SLIDES[0]}) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.slideGradient}>
        <View style={styles.slideContent}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.slideTitle}>
              {t(`onboarding.${item.key}.title`)}
            </Text>
            <Text style={styles.slideSubtitle}>
              {t(`onboarding.${item.key}.subtitle`)}
            </Text>
            <Text style={styles.slideDescription}>
              {t(`onboarding.${item.key}.description`)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Language Toggle — shows the OTHER language; tap to switch */}
      <TouchableOpacity
        style={styles.langToggle}
        onPress={handleToggleLanguage}
        activeOpacity={0.8}>
        <Text style={styles.langToggleIcon}>🌐</Text>
        <Text style={styles.langToggleText}>
          {SUPPORTED_LANGUAGES[otherLang].nativeName}
        </Text>
      </TouchableOpacity>

      {/* Skip Button */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
          );
          setCurrentIndex(index);
        }}
        keyExtractor={item => item.id}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {currentIndex === SLIDES.length - 1 ? (
            <>
              <Button
                title={t('onboarding.getStarted')}
                onPress={handleNext}
                variant="gold"
                fullWidth
                size="large"
              />
              <TouchableOpacity
                style={styles.loginButton}
                onPress={finishOnboarding}>
                <Text style={styles.loginText}>
                  {t('onboarding.signInPrompt')}{' '}
                  <Text style={styles.loginLink}>{t('onboarding.signIn')}</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Button
              title={t('onboarding.next')}
              onPress={handleNext}
              variant="primary"
              fullWidth
              size="large"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  langToggle: {
    position: 'absolute',
    top: 60,
    left: spacing[6],
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: borderRadius.full,
  },
  langToggleIcon: {
    fontSize: 14,
  },
  langToggleText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '700',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing[6],
    zIndex: 10,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  skipText: {
    ...typography.bodyMedium,
    color: colors.white,
    fontWeight: '600',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  slideGradient: {
    flex: 1,
    paddingTop: spacing[20],
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  emojiContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  emoji: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing[2],
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  slideSubtitle: {
    ...typography.h5,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  slideDescription: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing[4],
  },
  bottomContainer: {
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.slate[300],
    marginHorizontal: spacing[1],
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary[500],
  },
  buttonsContainer: {
    marginBottom: spacing[6],
  },
  loginButton: {
    alignItems: 'center',
    marginTop: spacing[4],
  },
  loginText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  loginLink: {
    color: colors.primary[500],
    fontWeight: '600',
  },
});
