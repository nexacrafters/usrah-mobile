/**
 * Quran Screen — Surah Index
 *
 * A complete, accurate reference index of all 114 surahs of the Holy Quran
 * (number, Arabic name, English name, ayah count, place of revelation). This is
 * static reference data (acceptable per spec). Rows are searchable and tappable;
 * tapping opens an inline detail card. Full verse-by-verse reading is flagged as
 * a TODO in the UI.
 */

import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import ScreenHeader from '../../components/ui/ScreenHeader';

interface Surah {
  number: number;
  arabic: string;
  english: string;
  ayahs: number;
  meccan: boolean; // true = Meccan, false = Medinan
}

// Complete, accurate index of the 114 surahs.
const SURAHS: Surah[] = [
  {number: 1, arabic: 'الفاتحة', english: 'Al-Fatihah', ayahs: 7, meccan: true},
  {number: 2, arabic: 'البقرة', english: 'Al-Baqarah', ayahs: 286, meccan: false},
  {number: 3, arabic: 'آل عمران', english: "Ali 'Imran", ayahs: 200, meccan: false},
  {number: 4, arabic: 'النساء', english: 'An-Nisa', ayahs: 176, meccan: false},
  {number: 5, arabic: 'المائدة', english: "Al-Ma'idah", ayahs: 120, meccan: false},
  {number: 6, arabic: 'الأنعام', english: "Al-An'am", ayahs: 165, meccan: true},
  {number: 7, arabic: 'الأعراف', english: "Al-A'raf", ayahs: 206, meccan: true},
  {number: 8, arabic: 'الأنفال', english: 'Al-Anfal', ayahs: 75, meccan: false},
  {number: 9, arabic: 'التوبة', english: 'At-Tawbah', ayahs: 129, meccan: false},
  {number: 10, arabic: 'يونس', english: 'Yunus', ayahs: 109, meccan: true},
  {number: 11, arabic: 'هود', english: 'Hud', ayahs: 123, meccan: true},
  {number: 12, arabic: 'يوسف', english: 'Yusuf', ayahs: 111, meccan: true},
  {number: 13, arabic: 'الرعد', english: "Ar-Ra'd", ayahs: 43, meccan: false},
  {number: 14, arabic: 'إبراهيم', english: 'Ibrahim', ayahs: 52, meccan: true},
  {number: 15, arabic: 'الحجر', english: 'Al-Hijr', ayahs: 99, meccan: true},
  {number: 16, arabic: 'النحل', english: 'An-Nahl', ayahs: 128, meccan: true},
  {number: 17, arabic: 'الإسراء', english: 'Al-Isra', ayahs: 111, meccan: true},
  {number: 18, arabic: 'الكهف', english: 'Al-Kahf', ayahs: 110, meccan: true},
  {number: 19, arabic: 'مريم', english: 'Maryam', ayahs: 98, meccan: true},
  {number: 20, arabic: 'طه', english: 'Taha', ayahs: 135, meccan: true},
  {number: 21, arabic: 'الأنبياء', english: 'Al-Anbiya', ayahs: 112, meccan: true},
  {number: 22, arabic: 'الحج', english: 'Al-Hajj', ayahs: 78, meccan: false},
  {number: 23, arabic: 'المؤمنون', english: "Al-Mu'minun", ayahs: 118, meccan: true},
  {number: 24, arabic: 'النور', english: 'An-Nur', ayahs: 64, meccan: false},
  {number: 25, arabic: 'الفرقان', english: 'Al-Furqan', ayahs: 77, meccan: true},
  {number: 26, arabic: 'الشعراء', english: "Ash-Shu'ara", ayahs: 227, meccan: true},
  {number: 27, arabic: 'النمل', english: 'An-Naml', ayahs: 93, meccan: true},
  {number: 28, arabic: 'القصص', english: 'Al-Qasas', ayahs: 88, meccan: true},
  {number: 29, arabic: 'العنكبوت', english: "Al-'Ankabut", ayahs: 69, meccan: true},
  {number: 30, arabic: 'الروم', english: 'Ar-Rum', ayahs: 60, meccan: true},
  {number: 31, arabic: 'لقمان', english: 'Luqman', ayahs: 34, meccan: true},
  {number: 32, arabic: 'السجدة', english: 'As-Sajdah', ayahs: 30, meccan: true},
  {number: 33, arabic: 'الأحزاب', english: 'Al-Ahzab', ayahs: 73, meccan: false},
  {number: 34, arabic: 'سبأ', english: 'Saba', ayahs: 54, meccan: true},
  {number: 35, arabic: 'فاطر', english: 'Fatir', ayahs: 45, meccan: true},
  {number: 36, arabic: 'يس', english: 'Ya-Sin', ayahs: 83, meccan: true},
  {number: 37, arabic: 'الصافات', english: 'As-Saffat', ayahs: 182, meccan: true},
  {number: 38, arabic: 'ص', english: 'Sad', ayahs: 88, meccan: true},
  {number: 39, arabic: 'الزمر', english: 'Az-Zumar', ayahs: 75, meccan: true},
  {number: 40, arabic: 'غافر', english: 'Ghafir', ayahs: 85, meccan: true},
  {number: 41, arabic: 'فصلت', english: 'Fussilat', ayahs: 54, meccan: true},
  {number: 42, arabic: 'الشورى', english: 'Ash-Shuraa', ayahs: 53, meccan: true},
  {number: 43, arabic: 'الزخرف', english: 'Az-Zukhruf', ayahs: 89, meccan: true},
  {number: 44, arabic: 'الدخان', english: 'Ad-Dukhan', ayahs: 59, meccan: true},
  {number: 45, arabic: 'الجاثية', english: 'Al-Jathiyah', ayahs: 37, meccan: true},
  {number: 46, arabic: 'الأحقاف', english: 'Al-Ahqaf', ayahs: 35, meccan: true},
  {number: 47, arabic: 'محمد', english: 'Muhammad', ayahs: 38, meccan: false},
  {number: 48, arabic: 'الفتح', english: 'Al-Fath', ayahs: 29, meccan: false},
  {number: 49, arabic: 'الحجرات', english: 'Al-Hujurat', ayahs: 18, meccan: false},
  {number: 50, arabic: 'ق', english: 'Qaf', ayahs: 45, meccan: true},
  {number: 51, arabic: 'الذاريات', english: 'Adh-Dhariyat', ayahs: 60, meccan: true},
  {number: 52, arabic: 'الطور', english: 'At-Tur', ayahs: 49, meccan: true},
  {number: 53, arabic: 'النجم', english: 'An-Najm', ayahs: 62, meccan: true},
  {number: 54, arabic: 'القمر', english: 'Al-Qamar', ayahs: 55, meccan: true},
  {number: 55, arabic: 'الرحمن', english: 'Ar-Rahman', ayahs: 78, meccan: false},
  {number: 56, arabic: 'الواقعة', english: "Al-Waqi'ah", ayahs: 96, meccan: true},
  {number: 57, arabic: 'الحديد', english: 'Al-Hadid', ayahs: 29, meccan: false},
  {number: 58, arabic: 'المجادلة', english: 'Al-Mujadila', ayahs: 22, meccan: false},
  {number: 59, arabic: 'الحشر', english: 'Al-Hashr', ayahs: 24, meccan: false},
  {number: 60, arabic: 'الممتحنة', english: 'Al-Mumtahanah', ayahs: 13, meccan: false},
  {number: 61, arabic: 'الصف', english: 'As-Saff', ayahs: 14, meccan: false},
  {number: 62, arabic: 'الجمعة', english: "Al-Jumu'ah", ayahs: 11, meccan: false},
  {number: 63, arabic: 'المنافقون', english: 'Al-Munafiqun', ayahs: 11, meccan: false},
  {number: 64, arabic: 'التغابن', english: 'At-Taghabun', ayahs: 18, meccan: false},
  {number: 65, arabic: 'الطلاق', english: 'At-Talaq', ayahs: 12, meccan: false},
  {number: 66, arabic: 'التحريم', english: 'At-Tahrim', ayahs: 12, meccan: false},
  {number: 67, arabic: 'الملك', english: 'Al-Mulk', ayahs: 30, meccan: true},
  {number: 68, arabic: 'القلم', english: 'Al-Qalam', ayahs: 52, meccan: true},
  {number: 69, arabic: 'الحاقة', english: 'Al-Haqqah', ayahs: 52, meccan: true},
  {number: 70, arabic: 'المعارج', english: "Al-Ma'arij", ayahs: 44, meccan: true},
  {number: 71, arabic: 'نوح', english: 'Nuh', ayahs: 28, meccan: true},
  {number: 72, arabic: 'الجن', english: 'Al-Jinn', ayahs: 28, meccan: true},
  {number: 73, arabic: 'المزمل', english: 'Al-Muzzammil', ayahs: 20, meccan: true},
  {number: 74, arabic: 'المدثر', english: 'Al-Muddaththir', ayahs: 56, meccan: true},
  {number: 75, arabic: 'القيامة', english: 'Al-Qiyamah', ayahs: 40, meccan: true},
  {number: 76, arabic: 'الإنسان', english: 'Al-Insan', ayahs: 31, meccan: false},
  {number: 77, arabic: 'المرسلات', english: 'Al-Mursalat', ayahs: 50, meccan: true},
  {number: 78, arabic: 'النبأ', english: 'An-Naba', ayahs: 40, meccan: true},
  {number: 79, arabic: 'النازعات', english: "An-Nazi'at", ayahs: 46, meccan: true},
  {number: 80, arabic: 'عبس', english: 'Abasa', ayahs: 42, meccan: true},
  {number: 81, arabic: 'التكوير', english: 'At-Takwir', ayahs: 29, meccan: true},
  {number: 82, arabic: 'الانفطار', english: 'Al-Infitar', ayahs: 19, meccan: true},
  {number: 83, arabic: 'المطففين', english: 'Al-Mutaffifin', ayahs: 36, meccan: true},
  {number: 84, arabic: 'الانشقاق', english: 'Al-Inshiqaq', ayahs: 25, meccan: true},
  {number: 85, arabic: 'البروج', english: 'Al-Buruj', ayahs: 22, meccan: true},
  {number: 86, arabic: 'الطارق', english: 'At-Tariq', ayahs: 17, meccan: true},
  {number: 87, arabic: 'الأعلى', english: "Al-A'la", ayahs: 19, meccan: true},
  {number: 88, arabic: 'الغاشية', english: 'Al-Ghashiyah', ayahs: 26, meccan: true},
  {number: 89, arabic: 'الفجر', english: 'Al-Fajr', ayahs: 30, meccan: true},
  {number: 90, arabic: 'البلد', english: 'Al-Balad', ayahs: 20, meccan: true},
  {number: 91, arabic: 'الشمس', english: 'Ash-Shams', ayahs: 15, meccan: true},
  {number: 92, arabic: 'الليل', english: 'Al-Layl', ayahs: 21, meccan: true},
  {number: 93, arabic: 'الضحى', english: 'Ad-Duhaa', ayahs: 11, meccan: true},
  {number: 94, arabic: 'الشرح', english: 'Ash-Sharh', ayahs: 8, meccan: true},
  {number: 95, arabic: 'التين', english: 'At-Tin', ayahs: 8, meccan: true},
  {number: 96, arabic: 'العلق', english: "Al-'Alaq", ayahs: 19, meccan: true},
  {number: 97, arabic: 'القدر', english: 'Al-Qadr', ayahs: 5, meccan: true},
  {number: 98, arabic: 'البينة', english: 'Al-Bayyinah', ayahs: 8, meccan: false},
  {number: 99, arabic: 'الزلزلة', english: 'Az-Zalzalah', ayahs: 8, meccan: false},
  {number: 100, arabic: 'العاديات', english: "Al-'Adiyat", ayahs: 11, meccan: true},
  {number: 101, arabic: 'القارعة', english: "Al-Qari'ah", ayahs: 11, meccan: true},
  {number: 102, arabic: 'التكاثر', english: 'At-Takathur', ayahs: 8, meccan: true},
  {number: 103, arabic: 'العصر', english: "Al-'Asr", ayahs: 3, meccan: true},
  {number: 104, arabic: 'الهمزة', english: 'Al-Humazah', ayahs: 9, meccan: true},
  {number: 105, arabic: 'الفيل', english: 'Al-Fil', ayahs: 5, meccan: true},
  {number: 106, arabic: 'قريش', english: 'Quraysh', ayahs: 4, meccan: true},
  {number: 107, arabic: 'الماعون', english: "Al-Ma'un", ayahs: 7, meccan: true},
  {number: 108, arabic: 'الكوثر', english: 'Al-Kawthar', ayahs: 3, meccan: true},
  {number: 109, arabic: 'الكافرون', english: 'Al-Kafirun', ayahs: 6, meccan: true},
  {number: 110, arabic: 'النصر', english: 'An-Nasr', ayahs: 3, meccan: false},
  {number: 111, arabic: 'المسد', english: 'Al-Masad', ayahs: 5, meccan: true},
  {number: 112, arabic: 'الإخلاص', english: 'Al-Ikhlas', ayahs: 4, meccan: true},
  {number: 113, arabic: 'الفلق', english: 'Al-Falaq', ayahs: 5, meccan: true},
  {number: 114, arabic: 'الناس', english: 'An-Nas', ayahs: 6, meccan: true},
];

export default function QuranScreen() {
  const {t} = useTranslation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Surah | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SURAHS;
    return SURAHS.filter(
      (s) =>
        s.english.toLowerCase().includes(q) ||
        s.arabic.includes(query.trim()) ||
        String(s.number) === q,
    );
  }, [query]);

  const renderItem = ({item}: {item: Surah}) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.8}
      onPress={() => setSelected(item)}>
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{item.number}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowEnglish}>{item.english}</Text>
        <Text style={styles.rowMeta}>
          {t('islamic.quranAyahs', {count: item.ayahs})} ·{' '}
          {item.meccan ? t('islamic.quranMeccan') : t('islamic.quranMedinan')}
        </Text>
      </View>
      <Text style={styles.rowArabic}>{item.arabic}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('islamic.quranTitle')} subtitle={t('islamic.quranSubtitle')} />

      <View style={styles.searchWrap}>
        <Icon name="magnify" size={20} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t('islamic.quranSearch')}
          placeholderTextColor={colors.text.tertiary}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Icon name="close-circle" size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(s) => String(s.number)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.noResults}>{t('islamic.quranNoResults')}</Text>
        }
      />

      {/* Detail modal */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selected && (
              <>
                <LinearGradient
                  colors={[colors.primary[500], colors.primary[700]]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.modalHero}>
                  <Text style={styles.modalArabic}>{selected.arabic}</Text>
                  <Text style={styles.modalEnglish}>{selected.english}</Text>
                  <Text style={styles.modalNumber}>
                    {t('islamic.quranSurahNumber', {number: selected.number})}
                  </Text>
                </LinearGradient>
                <View style={styles.modalBody}>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>{selected.ayahs}</Text>
                    <Text style={styles.modalStatLabel}>
                      {t('islamic.quranAyahs', {count: selected.ayahs})}
                    </Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>
                      {selected.meccan
                        ? t('islamic.quranMeccan')
                        : t('islamic.quranMedinan')}
                    </Text>
                    <Text style={styles.modalStatLabel}>
                      {t('islamic.quranRevelation')}
                    </Text>
                  </View>
                </View>
                <View style={styles.todoRow}>
                  <Icon name="information-outline" size={15} color={colors.text.tertiary} />
                  <Text style={styles.todoText}>
                    {t('islamic.quranReadingTodo')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelected(null)}
                  activeOpacity={0.85}>
                  <Text style={styles.closeText}>{t('common.close')}</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    margin: spacing[4],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  searchInput: {flex: 1, paddingVertical: spacing[3], fontSize: 15, color: colors.text.primary},
  listContent: {paddingHorizontal: spacing[4], paddingBottom: spacing[10]},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing[2],
  },
  numberBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {...typography.label, color: colors.primary[600], fontWeight: '700'},
  rowInfo: {flex: 1},
  rowEnglish: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
  rowMeta: {...typography.caption, color: colors.text.secondary},
  rowArabic: {fontSize: 20, color: colors.primary[700], fontWeight: '600'},
  noResults: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[10],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.xl,
  },
  modalHero: {padding: spacing[6], alignItems: 'center'},
  modalArabic: {fontSize: 34, fontWeight: 'bold', color: colors.white},
  modalEnglish: {...typography.h5, color: 'rgba(255,255,255,0.95)', marginTop: spacing[1]},
  modalNumber: {...typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: spacing[2]},
  modalBody: {flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[5]},
  modalStat: {flex: 1, alignItems: 'center', gap: spacing[1]},
  modalStatDivider: {width: 1, height: 36, backgroundColor: colors.border.default},
  modalStatValue: {...typography.h5, color: colors.text.primary, fontWeight: '700'},
  modalStatLabel: {...typography.caption, color: colors.text.secondary},
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[3],
    backgroundColor: colors.cream[100],
    borderRadius: borderRadius.md,
  },
  todoText: {...typography.caption, color: colors.text.secondary, flex: 1},
  closeBtn: {
    margin: spacing[6],
    marginTop: 0,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  closeText: {...typography.button, color: colors.white},
});
