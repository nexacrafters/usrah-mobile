import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Users, UserPlus, QrCode, Home, Building2, Camera } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors, LightTheme, DarkTheme } from '../../constants/colors';
import { useAuthStore, useAppStore } from '../../store';
import { useCreateFamily, useJoinFamily } from '../../hooks/queries/useFamilies';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../utils/fonts';
import { useThemeStore } from '../../store/themeStore';

type AppModeType = 'family' | 'village';
type ActionMode = 'create' | 'join';

export default function FamilySetupScreen() {
  const { t } = useTranslation();
  const rtl = checkRTL();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { setSelectedFamily } = useAuthStore();
  const { setAppMode, appMode: savedAppMode } = useAppStore();

  const [step, setStep] = useState<'mode' | 'action' | 'form'>(savedAppMode ? 'action' : 'mode');
  const [appMode, setLocalAppMode] = useState<AppModeType | null>(savedAppMode);
  const [actionMode, setActionMode] = useState<ActionMode | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [sistersCircleEnabled, setSistersCircleEnabled] = useState(true);
  const [error, setError] = useState('');

  const createFamilyMutation = useCreateFamily();
  const joinFamilyMutation = useJoinFamily();

  const isLoading = createFamilyMutation.isPending || joinFamilyMutation.isPending;

  const handleSelectAppMode = (mode: AppModeType) => {
    setLocalAppMode(mode);
    setAppMode(mode);
    setStep('action');
  };

  const handleSelectAction = (action: ActionMode) => {
    setActionMode(action);
    setStep('form');
  };

  const handleCreate = async () => {
    if (!familyName.trim()) {
      setError(rtl ? 'يرجى إدخال اسم العائلة' : 'Please enter a family name');
      return;
    }

    setError('');

    createFamilyMutation.mutate(
      {
        name: familyName.trim(),
        description: description.trim() || undefined,
        sisters_circle_enabled: sistersCircleEnabled,
        allow_join_requests: true,
      },
      {
        onSuccess: (family) => {
          setSelectedFamily(family);
          router.replace('/(app)/(tabs)');
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.response?.data?.name?.[0] ||
            (rtl ? 'فشل إنشاء العائلة' : 'Failed to create family');
          setError(message);
        },
      }
    );
  };

  const handleJoin = async () => {
    if (inviteCode.length < 6) {
      setError(rtl ? 'يرجى إدخال رمز الدعوة الكامل' : 'Please enter the complete invite code');
      return;
    }

    setError('');

    joinFamilyMutation.mutate(inviteCode.toUpperCase(), {
      onSuccess: () => {
        router.replace('/(app)/(tabs)');
      },
      onError: (err: any) => {
        const message =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          (rtl ? 'رمز الدعوة غير صالح' : 'Invalid invite code');
        setError(message);
      },
    });
  };

  const handleScanQR = () => {
    Alert.alert(
      rtl ? 'قريباً' : 'Coming Soon',
      rtl ? 'ميزة مسح QR قادمة قريباً' : 'QR scanning feature coming soon'
    );
  };

  const handleBack = () => {
    setError('');
    if (step === 'form') {
      setStep('action');
      setActionMode(null);
    } else if (step === 'action') {
      setStep('mode');
      setLocalAppMode(null);
    }
  };

  // Step 1: App Mode Selection
  if (step === 'mode') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text
              style={[
                styles.title,
                { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() },
              ]}
            >
              {rtl ? 'اختر نوع الاستخدام' : 'Choose Your Mode'}
            </Text>
            <Text
              style={[
                styles.titleAr,
                { color: Colors.primary[500], fontFamily: 'Tajawal_700Bold', textAlign: getTextAlign() },
              ]}
            >
              {rtl ? 'Choose Your Mode' : 'اختر نوع الاستخدام'}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() },
              ]}
            >
              {rtl ? 'كيف ستستخدم التطبيق؟' : 'How will you use the app?'}
            </Text>

            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => handleSelectAppMode('family')}
            >
              <View style={[styles.optionIcon, { backgroundColor: Colors.primary[100] }]}>
                <Home size={32} color={Colors.primary[500]} />
              </View>
              <Text
                style={[
                  styles.optionTitle,
                  { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() },
                ]}
              >
                {rtl ? 'عائلة واحدة' : 'Single Family'}
              </Text>
              <Text
                style={[
                  styles.optionDesc,
                  { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() },
                ]}
              >
                {rtl ? 'لإدارة أسرة واحدة - مثالي للعائلات الصغيرة' : 'Manage one family - perfect for households'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => handleSelectAppMode('village')}
            >
              <View style={[styles.optionIcon, { backgroundColor: Colors.gold[100] }]}>
                <Building2 size={32} color={Colors.gold[600]} />
              </View>
              <Text
                style={[
                  styles.optionTitle,
                  { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() },
                ]}
              >
                {rtl ? 'قرية / مجتمع' : 'Village / Community'}
              </Text>
              <Text
                style={[
                  styles.optionDesc,
                  { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() },
                ]}
              >
                {rtl ? 'لعدة عائلات في قرية أو مجتمع واحد' : 'Multiple families in a village or community'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2: Create or Join Selection
  if (step === 'action') {
    const entityName = appMode === 'family' ? (rtl ? 'عائلة' : 'Family') : (rtl ? 'قرية' : 'Village');

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text
              style={[
                styles.title,
                { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() },
              ]}
            >
              {rtl ? `إعداد ${entityName}` : `${entityName} Setup`}
            </Text>
            <Text
              style={[
                styles.titleAr,
                { color: Colors.primary[500], fontFamily: 'Tajawal_700Bold', textAlign: getTextAlign() },
              ]}
            >
              {rtl ? `${entityName} Setup` : `إعداد ${appMode === 'family' ? 'الأسرة' : 'القرية'}`}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() },
              ]}
            >
              {rtl
                ? `أنشئ ${entityName} جديدة أو انضم إلى ${entityName} موجودة.`
                : `Create a new ${entityName.toLowerCase()} or join an existing one.`}
            </Text>

            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => handleSelectAction('create')}
            >
              <View style={[styles.optionIcon, { backgroundColor: Colors.primary[100] }]}>
                <Users size={32} color={Colors.primary[500]} />
              </View>
              <Text
                style={[
                  styles.optionTitle,
                  { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() },
                ]}
              >
                {rtl ? `إنشاء ${entityName}` : `Create ${entityName}`}
              </Text>
              <Text
                style={[
                  styles.optionDesc,
                  { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() },
                ]}
              >
                {rtl
                  ? `ابدأ ${entityName} جديدة وادعُ الأعضاء`
                  : `Start a new ${entityName.toLowerCase()} and invite members`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => handleSelectAction('join')}
            >
              <View style={[styles.optionIcon, { backgroundColor: Colors.gold[100] }]}>
                <UserPlus size={32} color={Colors.gold[600]} />
              </View>
              <Text
                style={[
                  styles.optionTitle,
                  { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() },
                ]}
              >
                {rtl ? `الانضمام ل${entityName}` : `Join ${entityName}`}
              </Text>
              <Text
                style={[
                  styles.optionDesc,
                  { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() },
                ]}
              >
                {rtl ? 'أدخل رمز الدعوة أو امسح QR' : 'Enter invite code or scan QR'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBack} style={styles.backLink}>
              <Text style={[styles.backText, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
                {rtl ? 'العودة لاختيار النوع' : 'Back to mode selection'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 3: Form for Create or Join
  const entityName = appMode === 'family' ? (rtl ? 'العائلة' : 'Family') : (rtl ? 'القرية' : 'Village');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() },
            ]}
          >
            {actionMode === 'create'
              ? rtl
                ? `إنشاء ${entityName}`
                : `Create ${entityName}`
              : rtl
              ? `الانضمام لل${appMode === 'family' ? 'عائلة' : 'قرية'}`
              : `Join ${entityName}`}
          </Text>

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: Colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: Colors.error, fontFamily: getFont('medium') }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {actionMode === 'create' ? (
            <>
              <Text
                style={[
                  styles.label,
                  { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() },
                ]}
              >
                {rtl ? `اسم ${entityName}` : `${entityName} Name`} *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  rtl && styles.inputWrapperRTL,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() },
                  ]}
                  placeholder={
                    appMode === 'family'
                      ? rtl
                        ? 'مثال: عائلة أحمد'
                        : 'e.g., The Ahmed Family'
                      : rtl
                      ? 'مثال: قرية السلام'
                      : 'e.g., Peace Village'
                  }
                  placeholderTextColor={theme.placeholder}
                  value={familyName}
                  onChangeText={setFamilyName}
                  writingDirection={getWritingDirection()}
                  editable={!isLoading}
                />
              </View>

              <Text
                style={[
                  styles.label,
                  { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() },
                ]}
              >
                {rtl ? 'الوصف' : 'Description'} ({rtl ? 'اختياري' : 'optional'})
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  rtl && styles.inputWrapperRTL,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() },
                  ]}
                  placeholder={rtl ? 'وصف قصير للعائلة' : 'Short description'}
                  placeholderTextColor={theme.placeholder}
                  value={description}
                  onChangeText={setDescription}
                  writingDirection={getWritingDirection()}
                  editable={!isLoading}
                  multiline
                />
              </View>

              {/* Sisters Circle Toggle */}
              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  rtl && styles.toggleRowRTL,
                  { borderColor: theme.inputBorder },
                ]}
                onPress={() => setSistersCircleEnabled(!sistersCircleEnabled)}
                disabled={isLoading}
              >
                <View
                  style={[
                    styles.checkbox,
                    sistersCircleEnabled && { backgroundColor: Colors.sisters[500] },
                    { borderColor: sistersCircleEnabled ? Colors.sisters[500] : theme.inputBorder },
                  ]}
                >
                  {sistersCircleEnabled && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.toggleTextContainer}>
                  <Text
                    style={[
                      styles.toggleTitle,
                      { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() },
                    ]}
                  >
                    {rtl ? 'تفعيل دائرة الأخوات' : 'Enable Sisters Circle'}
                  </Text>
                  <Text
                    style={[
                      styles.toggleDesc,
                      { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() },
                    ]}
                  >
                    {rtl ? 'مساحة خاصة للنساء فقط' : 'Private space for women only'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: Colors.primary[500] },
                  isLoading && { opacity: 0.7 },
                ]}
                onPress={handleCreate}
                disabled={isLoading || !familyName.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={[styles.buttonText, { fontFamily: getFont('semibold') }]}>
                    {rtl ? `إنشاء ${entityName}` : `Create ${entityName}`}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.label,
                  { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() },
                ]}
              >
                {rtl ? 'رمز الدعوة' : 'Invite Code'}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  rtl && styles.inputWrapperRTL,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, fontFamily: getFont('regular'), textAlign: 'center', letterSpacing: 4 },
                  ]}
                  placeholder={rtl ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter 6-character code'}
                  placeholderTextColor={theme.placeholder}
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={8}
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.qrButton, rtl && styles.qrButtonRTL, { borderColor: theme.border }]}
                onPress={handleScanQR}
                disabled={isLoading}
              >
                <Camera size={20} color={theme.text} />
                <Text style={[styles.qrText, { color: theme.text, fontFamily: getFont('medium') }]}>
                  {rtl ? 'مسح رمز QR' : 'Scan QR Code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: Colors.primary[500] },
                  isLoading && { opacity: 0.7 },
                ]}
                onPress={handleJoin}
                disabled={isLoading || inviteCode.length < 6}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={[styles.buttonText, { fontFamily: getFont('semibold') }]}>
                    {rtl ? `الانضمام لل${appMode === 'family' ? 'عائلة' : 'قرية'}` : `Join ${entityName}`}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={handleBack} style={styles.backLink}>
            <Text style={[styles.backText, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
              {rtl ? 'العودة للخيارات' : 'Back to options'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28 },
  titleAr: { fontSize: 24, marginTop: 4, marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 40 },
  optionCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  optionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: { fontSize: 20, marginBottom: 8 },
  optionDesc: { fontSize: 14, textAlign: 'center' },
  errorContainer: { padding: 16, borderRadius: 12, marginBottom: 20, marginTop: 16 },
  errorText: { fontSize: 14, textAlign: 'center' },
  label: { fontSize: 14, marginBottom: 8, marginTop: 24 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputWrapperRTL: { flexDirection: 'row-reverse' },
  input: { flex: 1, fontSize: 16 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
    gap: 12,
  },
  toggleRowRTL: { flexDirection: 'row-reverse' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  toggleTextContainer: { flex: 1 },
  toggleTitle: { fontSize: 16, marginBottom: 2 },
  toggleDesc: { fontSize: 13 },
  button: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { fontSize: 18, color: '#fff' },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  qrButtonRTL: { flexDirection: 'row-reverse' },
  qrText: { fontSize: 16 },
  backLink: { alignItems: 'center', marginTop: 24 },
  backText: { fontSize: 14 },
});
