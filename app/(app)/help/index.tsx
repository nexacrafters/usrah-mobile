/**
 * Help & Support Screen - Premium Design
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Book,
  Video,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Sparkles,
  Heart,
  Headphones,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';

const faqs = [
  {
    id: '1',
    question: 'How do I add a family member?',
    questionAr: 'كيف أضيف فرد عائلة؟',
    answer: 'Go to Settings > Family Settings > Add Member. You can invite them via phone number or share an invite code.',
    answerAr: 'اذهب إلى الإعدادات > إعدادات العائلة > إضافة فرد. يمكنك دعوتهم عبر رقم الهاتف أو مشاركة رمز الدعوة.',
  },
  {
    id: '2',
    question: 'How does the village network work?',
    questionAr: 'كيف تعمل شبكة القرية؟',
    answer: 'The village is a closed network of neighboring families. You can share recipes, request help, and stay connected with your neighbors.',
    answerAr: 'القرية هي شبكة مغلقة من العائلات المجاورة. يمكنك مشاركة الوصفات وطلب المساعدة والبقاء على تواصل مع جيرانك.',
  },
  {
    id: '3',
    question: 'Is my data private?',
    questionAr: 'هل بياناتي خاصة؟',
    answer: 'Yes, all your family data is private and only shared within your family group. Village data is only shared with approved neighbors.',
    answerAr: 'نعم، جميع بيانات عائلتك خاصة ويتم مشاركتها فقط داخل مجموعة عائلتك. بيانات القرية تُشارك فقط مع الجيران المعتمدين.',
  },
  {
    id: '4',
    question: 'How do I use the emergency feature?',
    questionAr: 'كيف أستخدم ميزة الطوارئ؟',
    answer: 'Tap the Emergency button to quickly call village emergency services or send alerts to your neighbors.',
    answerAr: 'اضغط على زر الطوارئ للاتصال بخدمات طوارئ القرية بسرعة أو إرسال تنبيهات لجيرانك.',
  },
];

const contactOptions = [
  { id: 'chat', label: 'Live Chat', labelAr: 'محادثة مباشرة', icon: MessageCircle, color: Colors.primary[500], bgColor: Colors.primary[100] },
  { id: 'email', label: 'Email', labelAr: 'بريد', icon: Mail, color: Colors.gold[600], bgColor: Colors.gold[100] },
  { id: 'phone', label: 'Call', labelAr: 'اتصال', icon: Phone, color: Colors.success, bgColor: Colors.success + '20' },
];

export default function HelpScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;
  const BackChevron = rtl ? ChevronRight : ChevronLeft;

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.accent[600], Colors.accent[800]] : [Colors.accent[400], Colors.accent[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerDecoration}>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>

          <View style={[styles.headerContent, rtl && styles.headerContentRTL]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <BackChevron size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                {rtl ? 'المساعدة والدعم' : 'Help & Support'}
              </Text>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {rtl ? 'نحن هنا لمساعدتك' : "We're here to help"}
              </Text>
            </View>
          </View>
          <Sparkles size={18} color={Colors.gold[400]} style={styles.headerSparkle} />
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Help Card */}
        <Animated.View entering={ZoomIn.duration(500).delay(200)}>
          <LinearGradient
            colors={isDark ? [Colors.primary[600], Colors.primary[800]] : [Colors.primary[500], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickHelpCard}
          >
            <View style={styles.quickHelpIconBox}>
              <Headphones size={36} color={Colors.gold[400]} />
            </View>
            <Text style={[styles.quickHelpTitle, { fontFamily: getFont('bold') }]}>
              {rtl ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'}
            </Text>
            <Text style={[styles.quickHelpDesc, { fontFamily: getFont('regular') }]}>
              {rtl ? 'تصفح الأسئلة الشائعة أو تواصل معنا' : 'Browse FAQs or contact our support team'}
            </Text>
            <View style={styles.quickHelpBadge}>
              <Heart size={14} color={Colors.white} />
              <Text style={[styles.quickHelpBadgeText, { fontFamily: getFont('medium') }]}>
                {rtl ? 'دعم ٢٤/٧' : '24/7 Support'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Contact Options */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.primary[100] }]}>
              <MessageCircle size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'تواصل معنا' : 'Contact Us'}
            </Text>
          </View>

          <View style={[styles.contactGrid, rtl && styles.rowReverse]}>
            {contactOptions.map((option, index) => (
              <Animated.View
                key={option.id}
                entering={FadeInUp.duration(300).delay(350 + index * 100)}
                style={styles.contactCardWrapper}
              >
                <TouchableOpacity
                  style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.contactIcon, { backgroundColor: option.bgColor }]}>
                    <option.icon size={26} color={option.color} />
                  </View>
                  <Text style={[styles.contactLabel, { color: theme.text, fontFamily: getFont('semibold') }]}>
                    {rtl ? option.labelAr : option.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* FAQs */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.gold[100] }]}>
              <HelpCircle size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </Text>
          </View>

          {faqs.map((faq, index) => (
            <Animated.View
              key={faq.id}
              entering={FadeInUp.duration(300).delay(550 + index * 50)}
            >
              <TouchableOpacity
                style={[styles.faqCard, { backgroundColor: theme.card, borderColor: expandedFaq === faq.id ? Colors.primary[500] : theme.cardBorder }]}
                onPress={() => toggleFaq(faq.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.faqHeader, rtl && styles.rowReverse]}>
                  <View style={[styles.faqIconBox, { backgroundColor: expandedFaq === faq.id ? Colors.primary[100] : theme.inputBackground }]}>
                    <HelpCircle size={18} color={expandedFaq === faq.id ? Colors.primary[600] : theme.icon} />
                  </View>
                  <Text style={[styles.faqQuestion, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign(), flex: 1 }]}>
                    {rtl ? faq.questionAr : faq.question}
                  </Text>
                  <View style={[styles.faqArrow, { backgroundColor: expandedFaq === faq.id ? Colors.primary[100] : theme.inputBackground }]}>
                    {expandedFaq === faq.id ? (
                      <ChevronUp size={18} color={Colors.primary[600]} />
                    ) : (
                      <ChevronDown size={18} color={theme.icon} />
                    )}
                  </View>
                </View>
                {expandedFaq === faq.id && (
                  <Animated.View entering={FadeInDown.duration(200)}>
                    <View style={[styles.faqDivider, { backgroundColor: theme.divider }]} />
                    <Text style={[styles.faqAnswer, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                      {rtl ? faq.answerAr : faq.answer}
                    </Text>
                  </Animated.View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Resources */}
        <Animated.View entering={FadeInUp.duration(400).delay(700)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.sisters[100] }]}>
              <Book size={18} color={Colors.sisters[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'موارد إضافية' : 'Additional Resources'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.resourceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            activeOpacity={0.8}
          >
            <View style={[styles.resourceContent, rtl && styles.rowReverse]}>
              <View style={[styles.resourceIcon, { backgroundColor: Colors.primary[100] }]}>
                <Book size={24} color={Colors.primary[600]} />
              </View>
              <View style={[styles.resourceInfo, rtl && styles.resourceInfoRTL]}>
                <Text style={[styles.resourceTitle, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                  {rtl ? 'دليل المستخدم' : 'User Guide'}
                </Text>
                <Text style={[styles.resourceDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                  {rtl ? 'تعلم كيفية استخدام جميع الميزات' : 'Learn how to use all features'}
                </Text>
              </View>
              <View style={[styles.resourceArrow, { backgroundColor: Colors.primary[100] }]}>
                <ExternalLink size={18} color={Colors.primary[600]} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resourceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            activeOpacity={0.8}
          >
            <View style={[styles.resourceContent, rtl && styles.rowReverse]}>
              <View style={[styles.resourceIcon, { backgroundColor: Colors.gold[100] }]}>
                <Video size={24} color={Colors.gold[600]} />
              </View>
              <View style={[styles.resourceInfo, rtl && styles.resourceInfoRTL]}>
                <Text style={[styles.resourceTitle, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                  {rtl ? 'فيديوهات تعليمية' : 'Video Tutorials'}
                </Text>
                <Text style={[styles.resourceDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                  {rtl ? 'شاهد كيفية استخدام التطبيق' : 'Watch how to use the app'}
                </Text>
              </View>
              <View style={[styles.resourceArrow, { backgroundColor: Colors.gold[100] }]}>
                <ExternalLink size={18} color={Colors.gold[600]} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInUp.duration(400).delay(800)}>
          <LinearGradient
            colors={isDark ? [Colors.slate[800], Colors.slate[900]] : [Colors.slate[100], Colors.slate[200]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.appInfoCard}
          >
            <View style={[styles.appInfoContent, rtl && styles.rowReverse]}>
              <View style={styles.appInfoIconBox}>
                <Info size={22} color={Colors.primary[500]} />
              </View>
              <View style={rtl && { alignItems: 'flex-end' }}>
                <Text style={[styles.appName, { color: theme.text, fontFamily: getFont('bold') }]}>
                  Usrah أُسرة
                </Text>
                <Text style={[styles.appVersion, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                  {rtl ? 'الإصدار 1.0.0' : 'Version 1.0.0'}
                </Text>
              </View>
            </View>
          </LinearGradient>
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

  // Header
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerContentRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerSparkle: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Quick Help
  quickHelpCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  quickHelpIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickHelpTitle: {
    fontSize: 22,
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  quickHelpDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 16,
  },
  quickHelpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickHelpBadgeText: {
    fontSize: 13,
    color: Colors.white,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
  },

  // Contact
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCardWrapper: {
    flex: 1,
  },
  contactCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    gap: 12,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 13,
    textAlign: 'center',
  },

  // FAQ
  faqCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
  },
  faqArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqDivider: {
    height: 1,
    marginVertical: 14,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 24,
  },

  // Resources
  resourceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  resourceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  resourceIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceInfo: {
    flex: 1,
  },
  resourceInfoRTL: {
    alignItems: 'flex-end',
  },
  resourceTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  resourceDesc: {
    fontSize: 13,
  },
  resourceArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // App Info
  appInfoCard: {
    borderRadius: 18,
    padding: 18,
  },
  appInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  appInfoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 17,
  },
  appVersion: {
    fontSize: 13,
    marginTop: 2,
  },
});
