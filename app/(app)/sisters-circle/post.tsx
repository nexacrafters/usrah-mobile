/**
 * Create Post Screen for Sisters Circle - Premium Design
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Image as ImageIcon,
  EyeOff,
  Eye,
  Sparkles,
  Baby,
  Shirt,
  Utensils,
  BookHeart,
  X,
  Send,
  ChevronRight,
  Heart,
  Shield,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../../utils/fonts';
import { useAuthStore } from '../../../store';
import { useCreateSistersCirclePost } from '../../../hooks/queries/useSocial';

const categories = [
  { id: 'advice', label: 'Advice', labelAr: 'نصيحة', icon: BookHeart, color: '#3b82f6', gradient: ['#3b82f6', '#2563eb'] },
  { id: 'pregnancy', label: 'Pregnancy', labelAr: 'حمل', icon: Baby, color: '#ec4899', gradient: ['#ec4899', '#db2777'] },
  { id: 'fashion', label: 'Fashion', labelAr: 'أزياء', icon: Shirt, color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'] },
  { id: 'recipes', label: 'Recipes', labelAr: 'وصفات', icon: Utensils, color: Colors.gold[500], gradient: [Colors.gold[500], Colors.gold[600]] },
  { id: 'general', label: 'General', labelAr: 'عام', icon: Sparkles, color: Colors.sisters[500], gradient: [Colors.sisters[500], Colors.sisters[600]] },
];

export default function CreateSistersPostScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const { family } = useAuthStore();

  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [mediaUris, setMediaUris] = useState<string[]>([]);

  // Create post mutation
  const createPost = useCreateSistersCirclePost();

  const selectedCat = categories.find(c => c.id === category) || categories[4];

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          rtl ? 'خطأ' : 'Error',
          rtl ? 'نحتاج إذن للوصول إلى الصور' : 'We need permission to access photos'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUris([result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'يرجى كتابة شيء لمشاركته' : 'Please write something to share'
      );
      return;
    }

    if (!family?.id) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'لا توجد عائلة محددة' : 'No family selected'
      );
      return;
    }

    try {
      await createPost.mutateAsync({
        familyId: family.id,
        content: content.trim(),
        mediaUris: mediaUris.length > 0 ? mediaUris : undefined,
      });

      Alert.alert(
        rtl ? 'تم النشر' : 'Posted',
        rtl ? 'تمت مشاركة منشورك بنجاح' : 'Your post has been shared successfully',
        [{ text: rtl ? 'حسناً' : 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        error.message || (rtl ? 'فشل في نشر المنشور' : 'Failed to create post')
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={[Colors.sisters[500], Colors.sisters[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative Elements */}
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />

          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={handlePost}
              disabled={createPost.isPending}
              style={styles.headerActionButton}
            >
              {createPost.isPending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Send size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
              {rtl ? 'منشور جديد' : 'New Post'}
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <ChevronRight size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerContent}>
            <Animated.View entering={ZoomIn.duration(400).delay(200)} style={styles.headerIconBox}>
              <Heart size={28} color={Colors.sisters[500]} />
            </Animated.View>
            <Text style={[styles.headerSubtitle, { fontFamily: getFont('medium') }]}>
              {rtl ? 'شاركي مع الأخوات' : 'Share with Sisters'}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Anonymous Toggle */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <TouchableOpacity
            style={[styles.anonymousCard, { backgroundColor: isAnonymous ? Colors.sisters[50] : theme.card, borderColor: isAnonymous ? Colors.sisters[300] : theme.cardBorder }]}
            onPress={() => setIsAnonymous(!isAnonymous)}
            activeOpacity={0.8}
          >
            <View style={[styles.anonymousRow, rtl && styles.rowReverse]}>
              <LinearGradient
                colors={isAnonymous ? [Colors.sisters[500], Colors.sisters[600]] : [Colors.slate[200], Colors.slate[300]]}
                style={styles.anonymousIcon}
              >
                {isAnonymous ? (
                  <EyeOff size={22} color={Colors.white} />
                ) : (
                  <Eye size={22} color={Colors.slate[500]} />
                )}
              </LinearGradient>
              <View style={[styles.anonymousInfo, rtl && styles.anonymousInfoRTL]}>
                <Text style={[styles.anonymousTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                  {rtl ? 'النشر بشكل مجهول' : 'Post Anonymously'}
                </Text>
                <Text style={[styles.anonymousDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                  {rtl ? 'لن يظهر اسمك للأخوات' : 'Your name will be hidden'}
                </Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: Colors.slate[200], true: Colors.sisters[300] }}
                thumbColor={isAnonymous ? Colors.sisters[500] : Colors.white}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Category Selection */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.sisters[100] }]}>
              <Sparkles size={18} color={Colors.sisters[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'الفئة' : 'Category'}
            </Text>
          </View>
          <View style={[styles.categoryGrid, rtl && styles.rowReverse]}>
            {categories.map((cat, index) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <Animated.View key={cat.id} entering={ZoomIn.duration(200).delay(150 + index * 40)}>
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: isSelected ? cat.color + '15' : theme.card,
                        borderColor: isSelected ? cat.color : theme.cardBorder,
                      },
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    {isSelected ? (
                      <LinearGradient colors={cat.gradient} style={styles.categoryIconBox}>
                        <Icon size={18} color={Colors.white} />
                      </LinearGradient>
                    ) : (
                      <View style={[styles.categoryIconBox, { backgroundColor: theme.inputBackground }]}>
                        <Icon size={18} color={theme.textSecondary} />
                      </View>
                    )}
                    <Text style={[styles.categoryText, { color: isSelected ? cat.color : theme.text, fontFamily: getFont('medium') }]}>
                      {rtl ? cat.labelAr : cat.label}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Content Input */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
            <View style={[styles.sectionIconBox, { backgroundColor: selectedCat.color + '20' }]}>
              <selectedCat.icon size={18} color={selectedCat.color} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'ماذا تريدين مشاركته؟' : 'What to share?'}
            </Text>
          </View>
          <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.textArea, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
              value={content}
              onChangeText={setContent}
              placeholder={rtl ? 'شاركي أفكارك، نصائحك، أو أسئلتك مع الأخوات...' : 'Share your thoughts, advice, or questions...'}
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              writingDirection={getWritingDirection()}
            />
            <View style={styles.inputFooter}>
              <Text style={[styles.charCount, { color: content.length > 450 ? Colors.error : theme.textTertiary, fontFamily: getFont('regular') }]}>
                {content.length}/500
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Photo Section */}
        <Animated.View entering={FadeInUp.duration(500).delay(250)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.gold[100] }]}>
              <Camera size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'إضافة صورة' : 'Add Photo'}
            </Text>
            <Text style={[styles.optionalBadge, { color: theme.textTertiary, fontFamily: getFont('regular') }]}>
              {rtl ? 'اختياري' : 'Optional'}
            </Text>
          </View>
          {mediaUris.length > 0 ? (
            <View style={[styles.photoPreview, { backgroundColor: Colors.sisters[100] }]}>
              <View style={styles.photoPlaceholder}>
                <LinearGradient colors={[Colors.sisters[500], Colors.sisters[600]]} style={styles.photoIconBox}>
                  <ImageIcon size={28} color={Colors.white} />
                </LinearGradient>
                <Text style={[styles.photoPlaceholderText, { color: Colors.sisters[700], fontFamily: getFont('medium') }]}>
                  {rtl ? 'صورة مضافة' : 'Photo added'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removePhoto}
                onPress={() => setMediaUris([])}
              >
                <LinearGradient colors={[Colors.error, '#b91c1c']} style={styles.removePhotoGradient}>
                  <X size={18} color={Colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addPhotoButton, { backgroundColor: theme.card, borderColor: Colors.sisters[300] }]}
              onPress={handlePickImage}
            >
              <Camera size={28} color={Colors.sisters[500]} />
              <Text style={[styles.addPhotoText, { color: Colors.sisters[600], fontFamily: getFont('medium') }]}>
                {rtl ? 'اضغطي لإضافة صورة' : 'Tap to add photo'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Privacy Reminder */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <LinearGradient
            colors={isDark ? [Colors.sisters[900], Colors.sisters[800]] : [Colors.sisters[50], Colors.sisters[100]]}
            style={[styles.privacyReminder, { borderColor: Colors.sisters[200] }]}
          >
            <Shield size={20} color={Colors.sisters[600]} />
            <Text style={[styles.privacyText, { color: Colors.sisters[700], fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
              {rtl
                ? 'هذه المساحة خاصة بالأخوات فقط. منشورك آمن ومحمي.'
                : 'This space is for sisters only. Your post is safe and protected.'}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Post Button */}
        <Animated.View entering={FadeInUp.duration(500).delay(350)}>
          <TouchableOpacity
            onPress={handlePost}
            disabled={createPost.isPending}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.sisters[500], Colors.sisters[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.postButton, createPost.isPending && { opacity: 0.7 }]}
            >
              {createPost.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Send size={22} color={Colors.white} />
                  <Text style={[styles.postButtonText, { fontFamily: getFont('bold') }]}>
                    {rtl ? 'نشر المنشور' : 'Share Post'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rowReverse: { flexDirection: 'row-reverse' },

  // Header
  headerGradient: { paddingTop: 16, paddingBottom: 28, paddingHorizontal: 20, overflow: 'hidden', position: 'relative' },
  decorCircle: { position: 'absolute', borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  decorCircle1: { width: 150, height: 150, top: -60, right: -30 },
  decorCircle2: { width: 100, height: 100, bottom: -40, left: -20 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerBackButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerActionButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, color: Colors.white },
  headerContent: { alignItems: 'center' },
  headerIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },

  content: { flex: 1, padding: 20 },

  // Anonymous Card
  anonymousCard: { borderRadius: 18, padding: 18, marginBottom: 20, borderWidth: 1.5 },
  anonymousRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  anonymousIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  anonymousInfo: { flex: 1 },
  anonymousInfoRTL: { alignItems: 'flex-end' },
  anonymousTitle: { fontSize: 16, marginBottom: 3 },
  anonymousDesc: { fontSize: 13 },

  // Section
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { flex: 1, fontSize: 16 },
  optionalBadge: { fontSize: 12 },

  // Category
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, gap: 10 },
  categoryIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  categoryText: { fontSize: 14 },

  // Input
  inputCard: { borderRadius: 18, borderWidth: 1, padding: 18, overflow: 'hidden' },
  textArea: { fontSize: 16, lineHeight: 26, minHeight: 160 },
  inputFooter: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 10 },
  charCount: { fontSize: 13 },

  // Photo
  addPhotoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 32, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', gap: 12 },
  addPhotoText: { fontSize: 16 },
  photoPreview: { height: 200, borderRadius: 18, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  photoPlaceholder: { alignItems: 'center', gap: 12 },
  photoIconBox: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { fontSize: 15 },
  removePhoto: { position: 'absolute', top: 14, right: 14 },
  removePhotoGradient: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },

  // Privacy
  privacyReminder: { flexDirection: 'row-reverse', alignItems: 'center', padding: 18, borderRadius: 16, gap: 14, marginBottom: 24, borderWidth: 1 },
  privacyText: { flex: 1, fontSize: 14, lineHeight: 22 },

  // Post Button
  postButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 18, gap: 12, shadowColor: Colors.sisters[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  postButtonText: { fontSize: 18, color: Colors.white },
});
