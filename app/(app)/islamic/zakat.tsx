/**
 * Zakat Calculator Screen - Enhanced Arabic UI
 */
import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Calculator, Coins, Building2, Wallet, Info, ChevronRight, Save, History, TrendingUp, Star, Gift, CircleDollarSign } from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import { useNisab, useCalculateZakat, useZakatCalculations } from '../../../hooks/queries/useZakat';

const { width } = Dimensions.get('window');

const ZAKAT_RATE = 0.025;
const DEFAULT_GOLD_PRICE = 200; // Fallback price per gram

export default function ZakatScreen() {
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const fontFamily = 'Tajawal_500Medium';
  const fontBold = 'Tajawal_700Bold';
  const { family } = useAuthStore();

  const [cash, setCash] = useState('');
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [business, setBusiness] = useState('');
  const [stocks, setStocks] = useState('');
  const [debtsOwed, setDebtsOwed] = useState('');
  const [activeSection, setActiveSection] = useState<'assets' | 'deductions'>('assets');

  // Fetch current nisab from API
  const { data: nisabData, isLoading: nisabLoading } = useNisab();
  const calculateZakat = useCalculateZakat();
  const { data: calculations = [] } = useZakatCalculations(family?.id || '');

  const goldPrice = nisabData?.gold_price_per_gram || DEFAULT_GOLD_PRICE;
  const silverPrice = nisabData?.silver_price_per_gram || 2.5;
  const nisabGold = nisabData?.nisab_gold || 85;
  const nisabValue = nisabData?.nisab_value || (nisabGold * goldPrice);

  // Calculate values
  const assetValues = useMemo(() => {
    const goldValue = (parseFloat(gold) || 0) * goldPrice;
    const silverValue = (parseFloat(silver) || 0) * silverPrice;
    const cashValue = parseFloat(cash) || 0;
    const businessValue = parseFloat(business) || 0;
    const stocksValue = parseFloat(stocks) || 0;
    const debtsValue = parseFloat(debtsOwed) || 0;
    const totalAssets = cashValue + goldValue + silverValue + businessValue + stocksValue;
    const netWealth = Math.max(0, totalAssets - debtsValue);
    return { goldValue, silverValue, cashValue, businessValue, stocksValue, debtsValue, totalAssets, netWealth };
  }, [cash, gold, silver, business, stocks, debtsOwed, goldPrice, silverPrice]);

  const isZakatDue = assetValues.netWealth >= nisabValue;
  const zakatAmount = isZakatDue ? assetValues.netWealth * ZAKAT_RATE : 0;
  const nisabProgress = Math.min(100, (assetValues.netWealth / nisabValue) * 100);
  const formatCurrency = (amount: number) => `${amount.toLocaleString('ar-TN')} د.ت`;

  const handleSaveCalculation = async () => {
    if (!family?.id) {
      Alert.alert('خطأ', 'يرجى تسجيل الدخول أولاً');
      return;
    }

    try {
      await calculateZakat.mutateAsync({
        family_id: family.id,
        gold_price_per_gram: goldPrice,
        silver_price_per_gram: silverPrice,
      });
      Alert.alert('نجاح', 'تم حفظ حساب الزكاة');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ الحساب');
    }
  };

  const InputField = ({ label, value, onChange, icon: Icon, hint }: any) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputContent}>
        <Text style={[styles.inputLabel, { color: isDark ? Colors.slate[400] : Colors.slate[500], fontFamily }]}>{label}</Text>
        {hint && <Text style={[styles.inputHint, { color: isDark ? Colors.slate[500] : Colors.slate[400], fontFamily }]}>{hint}</Text>}
        <TextInput
          style={[styles.input, {
            color: isDark ? Colors.white : Colors.slate[800],
            fontFamily,
            borderColor: isDark ? Colors.slate[600] : Colors.slate[300],
            backgroundColor: isDark ? Colors.slate[800] : Colors.white
          }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="٠"
          placeholderTextColor={isDark ? Colors.slate[500] : Colors.slate[400]}
          textAlign="right"
        />
      </View>
      <View style={[styles.inputIcon, { backgroundColor: isDark ? Colors.primary[900] : Colors.primary[100] }]}>
        <Icon size={20} color={Colors.primary[500]} />
      </View>
    </View>
  );

  if (nisabLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={[styles.title, isDark && styles.textDark, { fontFamily: fontBold }]}>حاسبة الزكاة</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronRight size={24} color={isDark ? Colors.white : Colors.slate[800]} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={[styles.loadingText, isDark && styles.textDark, { fontFamily }]}>
            جاري تحميل بيانات النصاب...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        {calculations.length > 0 && (
          <TouchableOpacity style={[styles.historyButton, { backgroundColor: theme.card }]} onPress={() => router.push('/islamic/zakat/history')}>
            <History size={20} color={theme.text} />
          </TouchableOpacity>
        )}
        {calculations.length === 0 && <View style={styles.placeholder} />}
        <Text style={[styles.title, { color: theme.text, fontFamily: fontBold }]}>حاسبة الزكاة</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronRight size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nisab Card with Progress */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={[Colors.gold[500], Colors.gold[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nisabCard}
          >
            <View style={styles.nisabHeader}>
              <View style={styles.nisabIconBox}>
                <Star size={24} color={Colors.navy[900]} fill={Colors.navy[900]} />
              </View>
              <View style={styles.nisabHeaderText}>
                <Text style={[styles.nisabTitle, { fontFamily: fontBold }]}>النصاب الحالي</Text>
                <Text style={[styles.nisabDesc, { fontFamily }]}>
                  {nisabGold} جرام ذهب
                </Text>
              </View>
            </View>

            <Text style={[styles.nisabValue, { fontFamily: fontBold }]}>{formatCurrency(nisabValue)}</Text>

            {/* Progress to Nisab */}
            <View style={styles.nisabProgress}>
              <View style={styles.nisabProgressHeader}>
                <Text style={[styles.nisabProgressPercent, { fontFamily: fontBold }]}>
                  {Math.round(nisabProgress)}%
                </Text>
                <Text style={[styles.nisabProgressLabel, { fontFamily }]}>
                  نسبة الوصول للنصاب
                </Text>
              </View>
              <View style={styles.nisabProgressBar}>
                <View style={[styles.nisabProgressFill, { width: `${nisabProgress}%` }]} />
              </View>
            </View>

            <View style={styles.nisabStats}>
              <View style={styles.nisabStat}>
                <Text style={[styles.nisabStatValue, { fontFamily: fontBold }]}>{goldPrice}</Text>
                <Text style={[styles.nisabStatLabel, { fontFamily }]}>سعر الذهب/جرام</Text>
              </View>
              <View style={styles.nisabStatDivider} />
              <View style={styles.nisabStat}>
                <Text style={[styles.nisabStatValue, { fontFamily: fontBold }]}>{silverPrice}</Text>
                <Text style={[styles.nisabStatLabel, { fontFamily }]}>سعر الفضة/جرام</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Summary */}
        {assetValues.totalAssets > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(100)}>
            <View style={[styles.quickSummary, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.quickSummaryRow}>
                <View style={styles.quickSummaryItem}>
                  <TrendingUp size={18} color={Colors.success} />
                  <Text style={[styles.quickSummaryValue, { color: Colors.success, fontFamily: fontBold }]}>
                    {formatCurrency(assetValues.totalAssets)}
                  </Text>
                  <Text style={[styles.quickSummaryLabel, { color: theme.textSecondary, fontFamily }]}>
                    إجمالي الأصول
                  </Text>
                </View>
                <View style={[styles.quickSummaryDivider, { backgroundColor: theme.border }]} />
                <View style={styles.quickSummaryItem}>
                  <CircleDollarSign size={18} color={Colors.error} />
                  <Text style={[styles.quickSummaryValue, { color: Colors.error, fontFamily: fontBold }]}>
                    {formatCurrency(assetValues.debtsValue)}
                  </Text>
                  <Text style={[styles.quickSummaryLabel, { color: theme.textSecondary, fontFamily }]}>
                    الخصومات
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Section Tabs */}
        <Animated.View entering={FadeInUp.duration(500).delay(150)}>
          <View style={[styles.sectionTabs, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={[styles.sectionTab, activeSection === 'deductions' && { backgroundColor: Colors.primary[500] }]}
              onPress={() => setActiveSection('deductions')}
            >
              <Text style={[styles.sectionTabText, { color: activeSection === 'deductions' ? Colors.white : theme.textSecondary, fontFamily }]}>
                الخصومات
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sectionTab, activeSection === 'assets' && { backgroundColor: Colors.primary[500] }]}
              onPress={() => setActiveSection('assets')}
            >
              <Text style={[styles.sectionTabText, { color: activeSection === 'assets' ? Colors.white : theme.textSecondary, fontFamily }]}>
                الأصول
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Assets Section */}
        {activeSection === 'assets' && (
          <Animated.View entering={FadeInUp.duration(400)}>
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <InputField label="النقد والمدخرات" value={cash} onChange={setCash} icon={Wallet} />
              <InputField label="الذهب (بالجرام)" value={gold} onChange={setGold} icon={Coins} hint={`القيمة: ${formatCurrency(assetValues.goldValue)}`} />
              <InputField label="الفضة (بالجرام)" value={silver} onChange={setSilver} icon={Coins} hint={`القيمة: ${formatCurrency(assetValues.silverValue)}`} />
              <InputField label="أصول تجارية" value={business} onChange={setBusiness} icon={Building2} />
              <InputField label="الأسهم والاستثمارات" value={stocks} onChange={setStocks} icon={Calculator} />
            </View>
          </Animated.View>
        )}

        {/* Deductions Section */}
        {activeSection === 'deductions' && (
          <Animated.View entering={FadeInUp.duration(400)}>
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <InputField label="الديون المستحقة عليك" value={debtsOwed} onChange={setDebtsOwed} icon={Wallet} />
              <Text style={[styles.deductionNote, { color: theme.textSecondary, fontFamily }]}>
                الديون المستحقة عليك تُخصم من إجمالي الأصول قبل حساب الزكاة
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Results Card */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <LinearGradient
            colors={isZakatDue ? [Colors.primary[600], Colors.primary[700]] : [theme.card, theme.card]}
            style={[styles.resultsCard, !isZakatDue && { borderWidth: 1, borderColor: theme.cardBorder }]}
          >
            {isZakatDue && (
              <View style={styles.zakatDueBadge}>
                <Gift size={14} color={Colors.gold[400]} />
                <Text style={[styles.zakatDueText, { fontFamily }]}>الزكاة مستحقة</Text>
              </View>
            )}

            <View style={styles.resultRow}>
              <Text style={[styles.resultValue, { color: isZakatDue ? Colors.white : theme.text, fontFamily: fontBold }]}>
                {formatCurrency(assetValues.netWealth)}
              </Text>
              <Text style={[styles.resultLabel, { color: isZakatDue ? 'rgba(255,255,255,0.8)' : theme.textSecondary, fontFamily }]}>
                صافي الثروة
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: isZakatDue ? 'rgba(255,255,255,0.2)' : theme.border }]} />

            <View style={styles.resultRow}>
              <Text style={[styles.zakatValue, { color: isZakatDue ? Colors.gold[300] : Colors.gold[600], fontFamily: fontBold }]}>
                {formatCurrency(zakatAmount)}
              </Text>
              <Text style={[styles.resultLabel, { color: isZakatDue ? 'rgba(255,255,255,0.8)' : theme.textSecondary, fontFamily }]}>
                الزكاة المستحقة (٢.٥٪)
              </Text>
            </View>

            {!isZakatDue && (
              <View style={[styles.notDueBox, { backgroundColor: theme.inputBackground }]}>
                <Info size={16} color={theme.textSecondary} />
                <Text style={[styles.notDueText, { color: theme.textSecondary, fontFamily }]}>
                  ثروتك أقل من النصاب. الزكاة غير مستحقة حتى تبلغ النصاب.
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Save Button */}
        {isZakatDue && family?.id && (
          <Animated.View entering={FadeInUp.duration(500).delay(250)}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveCalculation}
              disabled={calculateZakat.isPending}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.gold[500], Colors.gold[600]]}
                style={styles.saveButtonGradient}
              >
                {calculateZakat.isPending ? (
                  <ActivityIndicator color={Colors.navy[900]} />
                ) : (
                  <>
                    <Save size={22} color={Colors.navy[900]} />
                    <Text style={[styles.saveButtonText, { fontFamily: fontBold }]}>حفظ الحساب</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  historyButton: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20 },
  placeholder: { width: 44 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: Colors.slate[600] },
  content: { flex: 1, padding: 20 },
  // Nisab Card
  nisabCard: { padding: 20, borderRadius: 24, marginBottom: 20 },
  nisabHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 16 },
  nisabIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  nisabHeaderText: { flex: 1, alignItems: 'flex-end' },
  nisabTitle: { fontSize: 16, color: Colors.navy[900] },
  nisabDesc: { fontSize: 13, color: Colors.navy[800], marginTop: 2 },
  nisabValue: { fontSize: 32, color: Colors.navy[900], textAlign: 'center', marginBottom: 16 },
  nisabProgress: { marginBottom: 16 },
  nisabProgressHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 },
  nisabProgressLabel: { fontSize: 12, color: Colors.navy[800] },
  nisabProgressPercent: { fontSize: 14, color: Colors.navy[900] },
  nisabProgressBar: { height: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden' },
  nisabProgressFill: { height: '100%', backgroundColor: Colors.navy[900], borderRadius: 4 },
  nisabStats: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 24 },
  nisabStat: { alignItems: 'center' },
  nisabStatValue: { fontSize: 18, color: Colors.navy[900] },
  nisabStatLabel: { fontSize: 11, color: Colors.navy[800], marginTop: 2 },
  nisabStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.1)' },
  // Quick Summary
  quickSummary: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  quickSummaryRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  quickSummaryItem: { flex: 1, alignItems: 'center', gap: 6 },
  quickSummaryValue: { fontSize: 16 },
  quickSummaryLabel: { fontSize: 11 },
  quickSummaryDivider: { width: 1, height: 40, marginHorizontal: 12 },
  // Section Tabs
  sectionTabs: { flexDirection: 'row-reverse', borderRadius: 14, padding: 4, marginBottom: 16 },
  sectionTab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  sectionTabText: { fontSize: 14 },
  // Section
  section: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 20, textAlign: 'right' },
  deductionNote: { fontSize: 12, textAlign: 'right', marginTop: 8, lineHeight: 18 },
  // Input
  inputContainer: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 16, gap: 12 },
  inputIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  inputContent: { flex: 1, alignItems: 'flex-end' },
  inputLabel: { fontSize: 14, marginBottom: 4, textAlign: 'right' },
  inputHint: { fontSize: 11, marginBottom: 4, textAlign: 'right', color: Colors.success },
  input: { height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, width: '100%' },
  // Results Card
  resultsCard: { borderRadius: 24, padding: 24, marginBottom: 16 },
  zakatDueBadge: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, marginBottom: 16, alignSelf: 'center' },
  zakatDueText: { fontSize: 13, color: Colors.gold[300] },
  resultRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  resultLabel: { fontSize: 14 },
  resultValue: { fontSize: 20 },
  divider: { height: 1, marginVertical: 12 },
  zakatValue: { fontSize: 28 },
  notDueBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginTop: 16 },
  notDueText: { flex: 1, fontSize: 13, textAlign: 'right', lineHeight: 18 },
  // Save Button
  saveButton: { marginTop: 8 },
  saveButtonGradient: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 10 },
  saveButtonText: { fontSize: 16, color: Colors.navy[900] },
});
