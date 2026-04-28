/**
 * Family Documents Screen - Enhanced UI
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { FileText, Plus, Folder, Image, File, Download, Share2, MoreVertical, Search, Filter, ChevronRight, ChevronLeft, Cloud, Lock, Clock } from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';
import { ScreenHeader } from '../../../components/ui';
import {
  useStorageInfo,
  useDocumentFolders,
  useRecentDocuments,
  useDocumentDownload,
} from '../../../hooks/queries/useDocuments';

const fileIcons: Record<string, { icon: any; color: string }> = {
  pdf: { icon: FileText, color: Colors.error },
  image: { icon: Image, color: Colors.primary[500] },
  doc: { icon: File, color: Colors.sisters[500] },
  other: { icon: File, color: Colors.slate[500] },
};

const defaultFolderColors = [
  Colors.error,
  Colors.primary[500],
  Colors.gold[600],
  Colors.sisters[500],
];

// Important document categories for families
import { CreditCard, Briefcase, Zap, Home, Heart, GraduationCap, Car, Shield, Receipt, Users } from 'lucide-react-native';

const documentCategories = [
  { id: 'passports', nameAr: 'جوازات السفر والهوية', nameEn: 'Passports & IDs', icon: Users, color: Colors.primary[600], bgColor: Colors.primary[100] },
  { id: 'legal', nameAr: 'المستندات القانونية', nameEn: 'Legal Documents', icon: Shield, color: Colors.error, bgColor: '#fef2f2' },
  { id: 'utilities', nameAr: 'فواتير الخدمات (ستاغ/ماء)', nameEn: 'Utilities (STEG/Water)', icon: Zap, color: Colors.gold[600], bgColor: Colors.gold[100] },
  { id: 'banking', nameAr: 'الحسابات البنكية', nameEn: 'Bank Accounts', icon: CreditCard, color: '#059669', bgColor: '#ecfdf5' },
  { id: 'property', nameAr: 'عقود الملكية والإيجار', nameEn: 'Property & Rental', icon: Home, color: Colors.sisters[600], bgColor: Colors.sisters[100] },
  { id: 'health', nameAr: 'السجلات الصحية', nameEn: 'Health Records', icon: Heart, color: '#ef4444', bgColor: '#fef2f2' },
  { id: 'education', nameAr: 'الشهادات التعليمية', nameEn: 'Education Certificates', icon: GraduationCap, color: '#7c3aed', bgColor: '#f5f3ff' },
  { id: 'vehicle', nameAr: 'وثائق السيارة', nameEn: 'Vehicle Documents', icon: Car, color: '#0891b2', bgColor: '#ecfeff' },
  { id: 'receipts', nameAr: 'الفواتير والإيصالات', nameEn: 'Receipts & Invoices', icon: Receipt, color: Colors.slate[600], bgColor: Colors.slate[100] },
  { id: 'work', nameAr: 'وثائق العمل', nameEn: 'Work Documents', icon: Briefcase, color: '#ea580c', bgColor: '#fff7ed' },
];

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  const [refreshing, setRefreshing] = useState(false);

  // Fetch data from API
  const { data: storageInfo, refetch: refetchStorage } = useStorageInfo();
  const { data: folders = [], isLoading: foldersLoading, refetch: refetchFolders } = useDocumentFolders();
  const { data: recentFiles = [], isLoading: filesLoading, refetch: refetchFiles } = useRecentDocuments(5);
  const downloadMutation = useDocumentDownload();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStorage(), refetchFolders(), refetchFiles()]);
    setRefreshing(false);
  }, [refetchStorage, refetchFolders, refetchFiles]);

  const handleDownload = async (fileId: string) => {
    try {
      const result = await downloadMutation.mutateAsync(fileId);
      if (result.url) {
        Linking.openURL(result.url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const isLoading = foldersLoading || filesLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={rtl ? 'المستندات' : 'Documents'}
        showBack
        rightAction={{
          icon: Plus,
          onPress: () => {},
        }}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
          />
        }
      >
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }, rtl && styles.rowReverse]}>
          <Search size={20} color={theme.placeholder} />
          <Text style={[styles.searchPlaceholder, { color: theme.placeholder, fontFamily: getFont('regular') }]}>
            {rtl ? 'البحث في المستندات...' : 'Search documents...'}
          </Text>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.card }]}>
            <Filter size={18} color={theme.icon} />
          </TouchableOpacity>
        </View>

        {/* Storage Info - Enhanced */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <LinearGradient
            colors={isDark ? [Colors.primary[600], Colors.primary[800]] : [Colors.primary[500], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storageCard}
          >
            <View style={[styles.storageContent, rtl && styles.rowReverse]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.storageIcon}
              >
                <Cloud size={26} color={Colors.gold[400]} />
              </LinearGradient>
              <View style={[styles.storageInfo, rtl && styles.storageInfoRTL]}>
                <Text style={[styles.storageTitle, { fontFamily: getFont('bold') }]}>
                  {rtl ? 'التخزين السحابي' : 'Cloud Storage'}
                </Text>
                <Text style={[styles.storageValue, { fontFamily: getFont('regular') }]}>
                  {storageInfo?.used_formatted || '0 MB'} / {storageInfo?.total_formatted || '1 GB'}
                </Text>
              </View>
              <View style={styles.storageBadge}>
                <Lock size={12} color={Colors.white} />
                <Text style={[styles.storageBadgeText, { fontFamily: getFont('medium') }]}>
                  {rtl ? 'آمن' : 'Secure'}
                </Text>
              </View>
            </View>
            <View style={styles.storageBarContainer}>
              <View style={styles.storageBar}>
                <Animated.View style={[styles.storageFill, { width: `${storageInfo ? (storageInfo.used_bytes / storageInfo.total_bytes) * 100 : 0}%` }]} />
              </View>
              <Text style={[styles.storagePercent, { fontFamily: getFont('bold') }]}>
                {storageInfo ? Math.round((storageInfo.used_bytes / storageInfo.total_bytes) * 100) : 0}%
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Document Categories - Quick Access */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
            {rtl ? 'الفئات المهمة' : 'Important Categories'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
            style={rtl ? { transform: [{ scaleX: -1 }] } : undefined}
          >
            {documentCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Animated.View
                  key={category.id}
                  entering={FadeInDown.delay(200 + index * 30).duration(300)}
                  style={rtl ? { transform: [{ scaleX: -1 }] } : undefined}
                >
                  <TouchableOpacity style={[styles.categoryChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <LinearGradient
                      colors={[category.bgColor, `${category.color}15`]}
                      style={styles.categoryChipIcon}
                    >
                      <Icon size={18} color={category.color} />
                    </LinearGradient>
                    <Text style={[styles.categoryChipText, { color: theme.text, fontFamily: getFont('medium') }]} numberOfLines={1}>
                      {rtl ? category.nameAr : category.nameEn}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        )}

        {/* Folders - Enhanced */}
        {!isLoading && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'المجلدات' : 'Folders'}
            </Text>

            {folders.length === 0 ? (
              <View style={[styles.emptyFolders, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={[styles.emptyIcon, { backgroundColor: Colors.primary[100] }]}>
                  <Folder size={28} color={Colors.primary[500]} />
                </View>
                <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {rtl ? 'لا توجد مجلدات' : 'No folders yet'}
                </Text>
              </View>
            ) : (
              <View style={[styles.foldersGrid, rtl && styles.rowReverse]}>
                {folders.map((folder, index) => {
                  const folderColor = folder.color || defaultFolderColors[index % defaultFolderColors.length];
                  return (
                    <Animated.View key={folder.id} entering={FadeInDown.delay(250 + index * 50).duration(300)}>
                      <TouchableOpacity
                        style={[styles.folderCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                      >
                        <LinearGradient
                          colors={[`${folderColor}20`, `${folderColor}10`]}
                          style={styles.folderIcon}
                        >
                          <Folder size={26} color={folderColor} />
                        </LinearGradient>
                        <Text style={[styles.folderName, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]} numberOfLines={1}>
                          {folder.name_ar && rtl ? folder.name_ar : folder.name}
                        </Text>
                        <View style={[styles.folderMeta, { backgroundColor: `${folderColor}15` }]}>
                          <Text style={[styles.folderCount, { color: folderColor, fontFamily: getFont('medium') }]}>
                            {folder.file_count} {rtl ? 'ملفات' : 'files'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {/* Recent Files - Enhanced */}
        {!isLoading && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
            <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
              <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                {rtl ? 'الملفات الأخيرة' : 'Recent Files'}
              </Text>
              <TouchableOpacity style={[styles.seeAllButton, { backgroundColor: Colors.primary[100] }]}>
                <Text style={[styles.seeAllText, { color: Colors.primary[600], fontFamily: getFont('bold') }]}>
                  {rtl ? 'عرض الكل' : 'See All'}
                </Text>
              </TouchableOpacity>
            </View>

            {recentFiles.length === 0 ? (
              <View style={[styles.emptyFiles, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={[styles.emptyIcon, { backgroundColor: Colors.gold[100] }]}>
                  <FileText size={28} color={Colors.gold[600]} />
                </View>
                <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {rtl ? 'لا توجد ملفات' : 'No files yet'}
                </Text>
              </View>
            ) : (
              recentFiles.map((file, index) => {
                const fileIcon = fileIcons[file.type] || fileIcons.other;
                const Icon = fileIcon.icon;
                return (
                  <Animated.View key={file.id} entering={FadeInUp.delay(350 + index * 50).duration(300)}>
                    <TouchableOpacity
                      style={[styles.fileItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }, rtl && styles.rowReverse]}
                    >
                      <LinearGradient
                        colors={[`${fileIcon.color}20`, `${fileIcon.color}10`]}
                        style={styles.fileIcon}
                      >
                        <Icon size={22} color={fileIcon.color} />
                      </LinearGradient>
                      <View style={[styles.fileInfo, rtl && styles.fileInfoRTL]}>
                        <Text style={[styles.fileName, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <View style={[styles.fileMetaRow, rtl && styles.rowReverse]}>
                          <View style={styles.fileMetaBadge}>
                            <Text style={[styles.fileMeta, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                              {file.size}
                            </Text>
                          </View>
                          <View style={[styles.fileMetaDot, { backgroundColor: theme.textTertiary }]} />
                          <View style={[styles.fileDateBadge, rtl && styles.rowReverse]}>
                            <Clock size={10} color={theme.textTertiary} />
                            <Text style={[styles.fileMeta, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                              {new Date(file.created_at).toLocaleDateString(rtl ? 'ar-SA' : 'en-US')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.fileActions, rtl && styles.rowReverse]}>
                        <TouchableOpacity style={[styles.fileAction, { backgroundColor: Colors.primary[100] }]} onPress={() => handleDownload(file.id)}>
                          <Download size={16} color={Colors.primary[600]} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.fileAction, { backgroundColor: theme.inputBackground }]}>
                          <MoreVertical size={16} color={theme.icon} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>
        )}

        {/* Upload Button - Enhanced */}
        <Animated.View entering={FadeInUp.delay(450).duration(400)}>
          <TouchableOpacity style={rtl && styles.rowReverse}>
            <LinearGradient
              colors={[Colors.gold[500], Colors.gold[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.uploadButton, rtl && styles.rowReverse]}
            >
              <View style={styles.uploadIconBox}>
                <Plus size={20} color={Colors.gold[600]} />
              </View>
              <Text style={[styles.uploadButtonText, { fontFamily: getFont('bold') }]}>
                {rtl ? 'رفع مستند جديد' : 'Upload New Document'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
  },
  storageCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  storageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storageIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storageInfo: {
    flex: 1,
    marginLeft: 14,
  },
  storageInfoRTL: {
    marginLeft: 0,
    marginRight: 14,
    alignItems: 'flex-end',
  },
  storageTitle: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: 4,
  },
  storageValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  storageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  storageBadgeText: {
    fontSize: 11,
    color: Colors.white,
  },
  storageBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storageBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageFill: {
    height: '100%',
    backgroundColor: Colors.gold[400],
    borderRadius: 4,
  },
  storagePercent: {
    fontSize: 14,
    color: Colors.white,
    minWidth: 36,
    textAlign: 'left',
  },
  section: {
    marginBottom: 24,
  },
  categoriesScroll: {
    paddingRight: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    minWidth: 140,
  },
  categoryChipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipText: {
    fontSize: 13,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 14,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  seeAllText: {
    fontSize: 13,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  folderCard: {
    width: '47%',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  folderIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  folderName: {
    fontSize: 14,
    marginBottom: 8,
  },
  folderMeta: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  folderCount: {
    fontSize: 11,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileInfoRTL: {
    alignItems: 'flex-end',
  },
  fileName: {
    fontSize: 14,
    marginBottom: 6,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileMetaBadge: {},
  fileMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  fileDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fileMeta: {
    fontSize: 11,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 6,
  },
  fileAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 18,
    gap: 12,
  },
  uploadIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    color: Colors.white,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFolders: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyFiles: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
  },
});
