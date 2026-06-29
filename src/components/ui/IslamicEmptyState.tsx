/**
 * IslamicEmptyState — a calm, uncrowded empty state that shows an āyah or duʿāʾ
 * instead of a bland "no data" message. Used across the app so every empty page
 * still nourishes the heart.
 */

import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import i18n from '../../../i18n';
import {colors, spacing, typography} from '../../theme';

interface Verse {
  ar: string;
  en: string;
  ref: string;
}

// A small curated set — hope, reliance, remembrance, gratitude.
const VERSES: Verse[] = [
  {ar: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', en: 'And whoever relies upon Allah — He is sufficient for him.', ref: 'Aṭ-Ṭalāq 65:3'},
  {ar: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', en: 'Indeed, with hardship comes ease.', ref: 'Ash-Sharḥ 94:6'},
  {ar: 'فَاذْكُرُونِي أَذْكُرْكُمْ', en: 'So remember Me; I will remember you.', ref: 'Al-Baqarah 2:152'},
  {ar: 'وَلَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', en: 'If you are grateful, I will surely increase you.', ref: 'Ibrāhīm 14:7'},
  {ar: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', en: 'My Lord, expand for me my chest and ease for me my task.', ref: 'Ṭā-Hā 20:25–26'},
  {ar: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', en: 'Allah is sufficient for us, and He is the best Disposer of affairs.', ref: 'Āl ʿImrān 3:173'},
  {ar: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', en: 'And say: My Lord, increase me in knowledge.', ref: 'Ṭā-Hā 20:114'},
  {ar: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', en: 'Indeed, Allah is with the patient.', ref: 'Al-Baqarah 2:153'},
];

interface Props {
  icon?: string;
  message?: string;
}

export default function IslamicEmptyState({icon = '🤲', message}: Props) {
  const {t} = useTranslation();
  const isAr = i18n.language?.startsWith('ar');
  // Stable per mount, varies over time.
  const verse = useMemo(
    () => VERSES[Math.floor(Math.random() * VERSES.length)],
    [],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.verseAr}>{verse.ar}</Text>
      {!isAr && <Text style={styles.verseEn}>{verse.en}</Text>}
      <Text style={styles.ref}>{verse.ref}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
  },
  icon: {fontSize: 40, marginBottom: spacing[4], opacity: 0.9},
  verseAr: {
    fontSize: 20,
    lineHeight: 34,
    color: colors.primary[700],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  verseEn: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing[1],
  },
  ref: {
    ...typography.caption,
    color: colors.primary[500],
    marginBottom: spacing[4],
  },
  message: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
