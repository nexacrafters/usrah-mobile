/**
 * Knowledge Center Screen - Premium Design
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  I18nManager,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Heart,
  Leaf,
  AlertTriangle,
  Baby,
  Thermometer,
  Bone,
  Bug,
  Droplets,
  Flame,
  Wind,
  BookOpen,
  Star,
  Clock,
  Eye,
  ShieldCheck,
  Sparkles,
  BookMarked,
  Phone,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, getWritingDirection } from '../../../utils/fonts';

const { width } = Dimensions.get('window');

// Knowledge categories
const categories = [
  {
    id: 'first-aid',
    name: 'First Aid',
    nameAr: 'الإسعافات الأولية',
    icon: Heart,
    color: Colors.error,
    bgColor: Colors.error + '15',
    gradient: [Colors.error, '#dc2626'] as const,
  },
  {
    id: 'islamic-medicine',
    name: 'Islamic Medicine',
    nameAr: 'الطب النبوي',
    icon: Leaf,
    color: Colors.primary[600],
    bgColor: Colors.primary[100],
    gradient: [Colors.primary[500], Colors.primary[700]] as const,
  },
  {
    id: 'emergencies',
    name: 'Emergencies',
    nameAr: 'الطوارئ',
    icon: AlertTriangle,
    color: Colors.gold[600],
    bgColor: Colors.gold[100],
    gradient: [Colors.gold[500], Colors.gold[700]] as const,
  },
  {
    id: 'child-health',
    name: 'Child Health',
    nameAr: 'صحة الطفل',
    icon: Baby,
    color: Colors.sisters[500],
    bgColor: Colors.sisters[100],
    gradient: [Colors.sisters[500], Colors.sisters[600]] as const,
  },
];

// Knowledge articles
const articles = [
  // First Aid
  {
    id: '1',
    category: 'first-aid',
    title: 'How to Treat Burns',
    titleAr: 'كيفية علاج الحروق',
    summary: 'Learn the proper steps to treat minor and severe burns at home.',
    summaryAr: 'تعلم الخطوات الصحيحة لعلاج الحروق البسيطة والشديدة في المنزل.',
    icon: Flame,
    readTime: '5 min',
    readTimeAr: '5 دقائق',
    isBookmarked: true,
    isPropheticMedicine: false,
  },
  {
    id: '2',
    category: 'first-aid',
    title: 'Snake Bite First Aid',
    titleAr: 'إسعافات لدغة الأفعى',
    summary: 'Essential steps to take immediately after a snake bite before reaching hospital.',
    summaryAr: 'الخطوات الأساسية التي يجب اتخاذها فورًا بعد لدغة الأفعى قبل الوصول للمستشفى.',
    icon: Bug,
    readTime: '4 min',
    readTimeAr: '4 دقائق',
    isBookmarked: false,
    isPropheticMedicine: false,
  },
  {
    id: '3',
    category: 'first-aid',
    title: 'Treating Wounds and Cuts',
    titleAr: 'علاج الجروح والقطوع',
    summary: 'Proper wound cleaning, bandaging, and when to seek medical help.',
    summaryAr: 'تنظيف الجروح بشكل صحيح، التضميد، ومتى يجب طلب المساعدة الطبية.',
    icon: Droplets,
    readTime: '6 min',
    readTimeAr: '6 دقائق',
    isBookmarked: true,
    isPropheticMedicine: false,
  },
  {
    id: '4',
    category: 'first-aid',
    title: 'Broken Bones & Fractures',
    titleAr: 'الكسور والشروخ',
    summary: 'How to immobilize fractures and provide first aid for broken bones.',
    summaryAr: 'كيفية تثبيت الكسور وتقديم الإسعافات الأولية للعظام المكسورة.',
    icon: Bone,
    readTime: '7 min',
    readTimeAr: '7 دقائق',
    isBookmarked: false,
    isPropheticMedicine: false,
  },
  // Islamic Medicine
  {
    id: '5',
    category: 'islamic-medicine',
    title: 'Benefits of Black Seed (Habbatus Sauda)',
    titleAr: 'فوائد الحبة السوداء',
    summary: 'The Prophet (PBUH) said: "In the black seed is healing for every disease except death."',
    summaryAr: 'قال النبي ﷺ: "في الحبة السوداء شفاء من كل داء إلا السام".',
    icon: Leaf,
    readTime: '8 min',
    readTimeAr: '8 دقائق',
    isBookmarked: true,
    isPropheticMedicine: true,
  },
  {
    id: '6',
    category: 'islamic-medicine',
    title: 'Honey: The Natural Healer',
    titleAr: 'العسل: الشفاء الطبيعي',
    summary: 'Quranic and Prophetic guidance on the healing properties of honey.',
    summaryAr: 'الإرشادات القرآنية والنبوية حول خصائص العسل الشفائية.',
    icon: Droplets,
    readTime: '6 min',
    readTimeAr: '6 دقائق',
    isBookmarked: false,
    isPropheticMedicine: true,
  },
  {
    id: '7',
    category: 'islamic-medicine',
    title: 'Cupping (Hijama) Therapy',
    titleAr: 'العلاج بالحجامة',
    summary: 'Understanding the Sunnah practice of cupping and its health benefits.',
    summaryAr: 'فهم سنة الحجامة وفوائدها الصحية.',
    icon: Heart,
    readTime: '10 min',
    readTimeAr: '10 دقائق',
    isBookmarked: true,
    isPropheticMedicine: true,
  },
  {
    id: '8',
    category: 'islamic-medicine',
    title: 'Zamzam Water Benefits',
    titleAr: 'فوائد ماء زمزم',
    summary: 'The blessed water and its spiritual and physical healing properties.',
    summaryAr: 'الماء المبارك وخصائصه الشفائية الروحية والجسدية.',
    icon: Droplets,
    readTime: '5 min',
    readTimeAr: '5 دقائق',
    isBookmarked: false,
    isPropheticMedicine: true,
  },
  // Emergencies
  {
    id: '9',
    category: 'emergencies',
    title: 'Choking: Heimlich Maneuver',
    titleAr: 'الاختناق: مناورة هايمليك',
    summary: 'Step-by-step guide to help someone who is choking on food or objects.',
    summaryAr: 'دليل خطوة بخطوة لمساعدة شخص يختنق بالطعام أو الأشياء.',
    icon: Wind,
    readTime: '4 min',
    readTimeAr: '4 دقائق',
    isBookmarked: true,
    isPropheticMedicine: false,
  },
  {
    id: '10',
    category: 'emergencies',
    title: 'CPR Guide',
    titleAr: 'دليل الإنعاش القلبي',
    summary: 'Learn how to perform CPR correctly - it could save a life.',
    summaryAr: 'تعلم كيفية إجراء الإنعاش القلبي بشكل صحيح - قد ينقذ حياة.',
    icon: Heart,
    readTime: '8 min',
    readTimeAr: '8 دقائق',
    isBookmarked: false,
    isPropheticMedicine: false,
  },
  {
    id: '11',
    category: 'emergencies',
    title: 'Heat Stroke Treatment',
    titleAr: 'علاج ضربة الشمس',
    summary: 'Recognize symptoms and provide immediate treatment for heat stroke.',
    summaryAr: 'التعرف على الأعراض وتقديم العلاج الفوري لضربة الشمس.',
    icon: Thermometer,
    readTime: '5 min',
    readTimeAr: '5 دقائق',
    isBookmarked: false,
    isPropheticMedicine: false,
  },
  // Child Health
  {
    id: '12',
    category: 'child-health',
    title: 'Common Childhood Fevers',
    titleAr: 'حمى الأطفال الشائعة',
    summary: 'When to worry about your child\'s fever and how to manage it safely.',
    summaryAr: 'متى تقلق بشأن حمى طفلك وكيفية التعامل معها بأمان.',
    icon: Thermometer,
    readTime: '7 min',
    readTimeAr: '7 دقائق',
    isBookmarked: true,
    isPropheticMedicine: false,
  },
  {
    id: '13',
    category: 'child-health',
    title: 'Child Eye Safety',
    titleAr: 'سلامة عيون الأطفال',
    summary: 'Protecting your children\'s eyes and recognizing vision problems.',
    summaryAr: 'حماية عيون أطفالك والتعرف على مشاكل الرؤية.',
    icon: Eye,
    readTime: '6 min',
    readTimeAr: '6 دقائق',
    isBookmarked: false,
    isPropheticMedicine: false,
  },
  {
    id: '14',
    category: 'child-health',
    title: 'Vaccination Guide',
    titleAr: 'دليل التطعيمات',
    summary: 'Essential vaccinations schedule for children from birth to adolescence.',
    summaryAr: 'جدول التطعيمات الأساسية للأطفال من الولادة حتى المراهقة.',
    icon: ShieldCheck,
    readTime: '10 min',
    readTimeAr: '10 دقائق',
    isBookmarked: true,
    isPropheticMedicine: false,
  },
];

export default function KnowledgeCenterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const isRTL = I18nManager.isRTL;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [articlesList, setArticlesList] = useState(articles);

  const ChevronBack = isRTL ? ChevronRight : ChevronLeft;

  // Filter articles
  const filteredArticles = articlesList.filter(article => {
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.titleAr.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Toggle bookmark
  const toggleBookmark = (articleId: string) => {
    setArticlesList(articlesList.map(article => {
      if (article.id === articleId) {
        return { ...article, isBookmarked: !article.isBookmarked };
      }
      return article;
    }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header with Gradient */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative Elements */}
          <View style={styles.headerDecoration}>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>

          <View style={[styles.header, isRTL && styles.rowReverse]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronBack size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                {isRTL ? 'مركز المعرفة' : 'Knowledge Center'}
              </Text>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {filteredArticles.length} {isRTL ? 'مقال' : 'articles'}
              </Text>
            </View>
            <View style={styles.headerIconBox}>
              <BookMarked size={22} color={Colors.white} />
            </View>
          </View>

          {/* Hero Icon */}
          <View style={styles.heroIconContainer}>
            <View style={styles.heroIconRing}>
              <BookOpen size={28} color={Colors.white} />
            </View>
            <Sparkles size={16} color={Colors.gold[400]} style={styles.heroSparkle} />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }, isRTL && styles.rowReverse]}>
          <View style={[styles.searchIconBox, { backgroundColor: Colors.primary[100] }]}>
            <Search size={18} color={Colors.primary[600]} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            placeholder={isRTL ? 'ابحث عن معلومات طبية...' : 'Search medical info...'}
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories Grid */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
            {isRTL ? 'الفئات' : 'Categories'}
          </Text>
          <View style={[styles.categoriesGrid, isRTL && styles.rowReverse]}>
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <Animated.View key={category.id} entering={FadeInUp.duration(400).delay(150 + index * 50)}>
                  <TouchableOpacity
                    style={[styles.categoryCard, { borderColor: isSelected ? category.color : theme.cardBorder }]}
                    onPress={() => setSelectedCategory(isSelected ? null : category.id)}
                  >
                    {isSelected ? (
                      <LinearGradient colors={category.gradient} style={styles.categoryGradient}>
                        <View style={styles.categoryIconSelected}>
                          <Icon size={26} color={Colors.white} />
                        </View>
                        <Text style={[styles.categoryNameSelected, { fontFamily: getFont('semibold') }]}>
                          {isRTL ? category.nameAr : category.name}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.categoryInner, { backgroundColor: theme.card }]}>
                        <View style={[styles.categoryIcon, { backgroundColor: category.bgColor }]}>
                          <Icon size={26} color={category.color} />
                        </View>
                        <Text style={[styles.categoryName, { color: theme.text, fontFamily: getFont('medium') }]}>
                          {isRTL ? category.nameAr : category.name}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Featured/Islamic Medicine Banner */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)}>
          <TouchableOpacity onPress={() => setSelectedCategory('islamic-medicine')}>
            <LinearGradient
              colors={[Colors.primary[600], Colors.primary[800]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.featuredBanner, isRTL && styles.rowReverse]}
            >
              <View style={[styles.featuredContent, isRTL && styles.rowReverse]}>
                <View style={styles.featuredIconContainer}>
                  <Leaf size={32} color={Colors.white} />
                </View>
                <View style={[styles.featuredText, isRTL && styles.alignEnd]}>
                  <Text style={[styles.featuredTitle, { fontFamily: getFont('bold') }]}>
                    {isRTL ? 'الطب النبوي' : 'Prophetic Medicine'}
                  </Text>
                  <Text style={[styles.featuredSubtitle, { fontFamily: getFont('regular') }]}>
                    {isRTL ? 'علاجات من السنة النبوية الشريفة' : 'Remedies from the Noble Sunnah'}
                  </Text>
                </View>
              </View>
              <View style={styles.featuredArrow}>
                <ChevronRight size={20} color={Colors.white} style={isRTL && { transform: [{ scaleX: -1 }] }} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Articles List */}
        <View style={styles.articlesSection}>
          <View style={[styles.articlesSectionHeader, isRTL && styles.rowReverse]}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.[isRTL ? 'nameAr' : 'name']
                : (isRTL ? 'جميع المقالات' : 'All Articles')}
            </Text>
            <View style={[styles.articleCountBadge, { backgroundColor: Colors.primary[100] }]}>
              <Text style={[styles.articleCount, { color: Colors.primary[600], fontFamily: getFont('semibold') }]}>
                {filteredArticles.length}
              </Text>
            </View>
          </View>

          {filteredArticles.map((article, index) => {
            const Icon = article.icon;
            const categoryInfo = categories.find(c => c.id === article.category);
            return (
              <Animated.View key={article.id} entering={FadeInUp.duration(400).delay(350 + index * 30)}>
                <TouchableOpacity style={[styles.articleCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={[styles.articleContent, isRTL && styles.rowReverse]}>
                    <LinearGradient
                      colors={categoryInfo?.gradient || [Colors.slate[400], Colors.slate[500]]}
                      style={styles.articleIcon}
                    >
                      <Icon size={22} color={Colors.white} />
                    </LinearGradient>
                    <View style={[styles.articleInfo, isRTL && styles.articleInfoRTL]}>
                      <View style={[styles.articleTitleRow, isRTL && styles.rowReverse]}>
                        <Text style={[styles.articleTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]} numberOfLines={2}>
                          {isRTL ? article.titleAr : article.title}
                        </Text>
                        {article.isPropheticMedicine && (
                          <View style={[styles.propheticBadge, { backgroundColor: Colors.gold[100] }]}>
                            <Star size={10} color={Colors.gold[600]} fill={Colors.gold[600]} />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.articleSummary, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]} numberOfLines={2}>
                        {isRTL ? article.summaryAr : article.summary}
                      </Text>
                      <View style={[styles.articleMeta, isRTL && styles.rowReverse]}>
                        <View style={[styles.readTime, { backgroundColor: theme.inputBackground }, isRTL && styles.rowReverse]}>
                          <Clock size={12} color={theme.textSecondary} />
                          <Text style={[styles.readTimeText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                            {isRTL ? article.readTimeAr : article.readTime}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => toggleBookmark(article.id)} style={[styles.bookmarkButton, { backgroundColor: article.isBookmarked ? Colors.gold[100] : theme.inputBackground }]}>
                          <Star size={14} color={article.isBookmarked ? Colors.gold[500] : theme.textTertiary} fill={article.isBookmarked ? Colors.gold[500] : 'transparent'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Emergency Numbers */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)}>
          <LinearGradient
            colors={[Colors.error + '20', Colors.error + '10']}
            style={[styles.emergencySection, { borderColor: Colors.error + '40' }]}
          >
            <View style={[styles.emergencyHeader, isRTL && styles.rowReverse]}>
              <View style={[styles.emergencyIconBox, { backgroundColor: Colors.error }]}>
                <Phone size={18} color={Colors.white} />
              </View>
              <Text style={[styles.emergencyTitle, { color: Colors.error, fontFamily: getFont('bold') }]}>
                {isRTL ? 'أرقام الطوارئ - تونس' : 'Emergency Numbers - Tunisia'}
              </Text>
            </View>
            <View style={[styles.emergencyNumbers, isRTL && styles.rowReverse]}>
              <TouchableOpacity style={styles.emergencyNumber}>
                <Text style={[styles.emergencyValue, { color: Colors.error, fontFamily: getFont('bold') }]}>190</Text>
                <Text style={[styles.emergencyLabel, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {isRTL ? 'الإسعاف' : 'Ambulance'}
                </Text>
              </TouchableOpacity>
              <View style={[styles.emergencyDivider, { backgroundColor: Colors.error + '30' }]} />
              <TouchableOpacity style={styles.emergencyNumber}>
                <Text style={[styles.emergencyValue, { color: Colors.error, fontFamily: getFont('bold') }]}>197</Text>
                <Text style={[styles.emergencyLabel, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {isRTL ? 'الشرطة' : 'Police'}
                </Text>
              </TouchableOpacity>
              <View style={[styles.emergencyDivider, { backgroundColor: Colors.error + '30' }]} />
              <TouchableOpacity style={styles.emergencyNumber}>
                <Text style={[styles.emergencyValue, { color: Colors.error, fontFamily: getFont('bold') }]}>198</Text>
                <Text style={[styles.emergencyLabel, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {isRTL ? 'الإطفاء' : 'Fire'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse' as const,
  },
  alignEnd: {
    alignItems: 'flex-end' as const,
  },

  // Header
  headerGradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  decorCircle2: {
    width: 60,
    height: 60,
    bottom: -10,
    left: 30,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  heroIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSparkle: {
    position: 'absolute',
    top: 0,
    right: width / 2 - 44,
  },

  // Search
  searchSection: {
    paddingHorizontal: 20,
    marginTop: -12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },

  // Categories
  categoriesSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (width - 52) / 2,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  categoryGradient: {
    padding: 18,
    alignItems: 'center',
  },
  categoryInner: {
    padding: 18,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIconSelected: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 14,
    textAlign: 'center',
  },
  categoryNameSelected: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
  },

  // Featured Banner
  featuredBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featuredIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featuredText: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 17,
    color: Colors.white,
  },
  featuredSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  featuredArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Articles
  articlesSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  articlesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  articleCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  articleCount: {
    fontSize: 13,
  },
  articleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  articleContent: {
    flexDirection: 'row',
  },
  articleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleInfo: {
    flex: 1,
    marginLeft: 14,
  },
  articleInfoRTL: {
    marginLeft: 0,
    marginRight: 14,
    alignItems: 'flex-end',
  },
  articleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  articleTitle: {
    fontSize: 15,
    flex: 1,
  },
  propheticBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  readTimeText: {
    fontSize: 11,
  },
  bookmarkButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Emergency
  emergencySection: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  emergencyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 15,
  },
  emergencyNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  emergencyNumber: {
    alignItems: 'center',
    flex: 1,
  },
  emergencyValue: {
    fontSize: 28,
    marginBottom: 4,
  },
  emergencyLabel: {
    fontSize: 12,
  },
  emergencyDivider: {
    width: 1,
    height: 40,
  },
});
