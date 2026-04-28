/**
 * Village Community Screen - جيران (Neighbors) - Enhanced UI
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Users,
  Plus,
  MapPin,
  Bell,
  ChefHat,
  Heart,
  MessageCircle,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Home,
  Star,
  Gift,
  Megaphone,
  Sparkles,
  Shield,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';
import { ScreenHeader } from '../../../components/ui';
import { useNeighbors, useAnnouncements, useSharedItems } from '../../../hooks/queries/useVillage';

export default function VillageScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  const [activeTab, setActiveTab] = useState<'neighbors' | 'announcements' | 'sharing'>('neighbors');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data from API
  const { data: neighbors = [], isLoading: neighborsLoading, refetch: refetchNeighbors } = useNeighbors();
  const {
    data: announcementsData,
    isLoading: announcementsLoading,
    refetch: refetchAnnouncements,
    fetchNextPage: fetchMoreAnnouncements,
    hasNextPage: hasMoreAnnouncements,
  } = useAnnouncements();
  const {
    data: sharedItemsData,
    isLoading: sharedItemsLoading,
    refetch: refetchSharedItems,
    fetchNextPage: fetchMoreSharedItems,
    hasNextPage: hasMoreSharedItems,
  } = useSharedItems();

  // Flatten paginated data
  const announcements = announcementsData?.pages.flatMap(page => page.results) || [];
  const sharedItems = sharedItemsData?.pages.flatMap(page => page.results) || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchNeighbors(),
      refetchAnnouncements(),
      refetchSharedItems(),
    ]);
    setRefreshing(false);
  }, [refetchNeighbors, refetchAnnouncements, refetchSharedItems]);

  const isLoading = neighborsLoading || announcementsLoading || sharedItemsLoading;

  // Calculate village stats from data
  const totalFamilies = neighbors.length;
  const totalMembers = neighbors.reduce((sum, n) => sum + (n.member_count || 0), 0);
  const avgRating = neighbors.length > 0
    ? (neighbors.reduce((sum, n) => sum + (n.trust_score || 4.5), 0) / neighbors.length).toFixed(1)
    : '4.5';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={rtl ? 'القرية - الجيران' : 'Village - Neighbors'}
        showBack
        rightAction={{ icon: Plus, onPress: () => router.push('/village/add') }}
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
        {/* Village Stats - Enhanced with Gradient */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <LinearGradient
            colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}
          >
            <View style={styles.statsHeader}>
              <View style={styles.statsBadge}>
                <Shield size={12} color={Colors.gold[500]} />
                <Text style={[styles.statsBadgeText, { fontFamily: getFont('medium') }]}>
                  {rtl ? 'مجتمع موثوق' : 'Trusted Community'}
                </Text>
              </View>
              <Sparkles size={20} color="rgba(255,255,255,0.5)" />
            </View>
            <View style={[styles.statsRow, rtl && styles.rowReverse]}>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.statIconBox}
                >
                  <Home size={22} color={Colors.gold[400]} />
                </LinearGradient>
                <Text style={[styles.statValue, { fontFamily: getFont('bold') }]}>{totalFamilies}</Text>
                <Text style={[styles.statLabel, { fontFamily: getFont('regular') }]}>
                  {rtl ? 'عائلات' : 'Families'}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.statIconBox}
                >
                  <Users size={22} color={Colors.gold[400]} />
                </LinearGradient>
                <Text style={[styles.statValue, { fontFamily: getFont('bold') }]}>{totalMembers}</Text>
                <Text style={[styles.statLabel, { fontFamily: getFont('regular') }]}>
                  {rtl ? 'أعضاء' : 'Members'}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.statIconBox}
                >
                  <Star size={22} color={Colors.gold[400]} />
                </LinearGradient>
                <Text style={[styles.statValue, { fontFamily: getFont('bold') }]}>{avgRating}</Text>
                <Text style={[styles.statLabel, { fontFamily: getFont('regular') }]}>
                  {rtl ? 'التقييم' : 'Rating'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tabs */}
        <View style={[styles.tabs, rtl && styles.rowReverse]}>
          {[
            { id: 'neighbors', label: 'Neighbors', labelAr: 'الجيران', icon: Users },
            { id: 'announcements', label: 'News', labelAr: 'الأخبار', icon: Bell },
            { id: 'sharing', label: 'Sharing', labelAr: 'المشاركة', icon: Gift },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                { backgroundColor: activeTab === tab.id ? Colors.primary[500] : theme.card, borderColor: activeTab === tab.id ? Colors.primary[500] : theme.cardBorder },
              ]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <tab.icon size={18} color={activeTab === tab.id ? Colors.white : theme.textSecondary} />
              <Text style={[styles.tabText, { color: activeTab === tab.id ? Colors.white : theme.textSecondary, fontFamily: getFont('medium') }]}>
                {rtl ? tab.labelAr : tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        )}

        {/* Neighbors Tab */}
        {activeTab === 'neighbors' && !isLoading && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'جيرانك' : 'Your Neighbors'}
            </Text>

            {neighbors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={48} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {rtl ? 'لا يوجد جيران بعد' : 'No neighbors yet'}
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textTertiary, fontFamily: getFont('regular') }]}>
                  {rtl ? 'ادعُ جيرانك للانضمام' : 'Invite your neighbors to join'}
                </Text>
              </View>
            ) : (
              neighbors.map((neighbor) => (
                <TouchableOpacity
                  key={neighbor.id}
                  style={[styles.neighborCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, rtl && styles.rowReverse]}
                  onPress={() => router.push(`/village/neighbor/${neighbor.id}`)}
                >
                  <View style={[styles.neighborAvatar, { backgroundColor: Colors.primary[100] }]}>
                    <Text style={[styles.neighborInitial, { color: Colors.primary[600], fontFamily: getFont('bold') }]}>
                      {neighbor.family_name.charAt(0)}
                    </Text>
                    {neighbor.is_online && <View style={styles.onlineIndicator} />}
                  </View>
                  <View style={[styles.neighborInfo, rtl && styles.neighborInfoRTL]}>
                    <Text style={[styles.neighborName, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                      {neighbor.family_name}
                    </Text>
                    <View style={[styles.neighborMeta, rtl && styles.rowReverse]}>
                      <Users size={12} color={theme.textSecondary} />
                      <Text style={[styles.neighborMetaText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                        {neighbor.member_count} {rtl ? 'أفراد' : 'members'}
                      </Text>
                      {neighbor.distance && (
                        <>
                          <MapPin size={12} color={theme.textSecondary} />
                          <Text style={[styles.neighborMetaText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                            {neighbor.distance}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.chatButton, { backgroundColor: Colors.primary[100] }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/chat/${neighbor.family_id}`);
                    }}
                  >
                    <MessageCircle size={18} color={Colors.primary[500]} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && !isLoading && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'إعلانات القرية' : 'Village Announcements'}
            </Text>

            {announcements.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Megaphone size={48} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {rtl ? 'لا توجد إعلانات' : 'No announcements'}
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textTertiary, fontFamily: getFont('regular') }]}>
                  {rtl ? 'ابق على اطلاع بأخبار القرية' : 'Stay tuned for village news'}
                </Text>
              </View>
            ) : (
              announcements.map((announcement) => {
                const isEvent = announcement.type === 'event';
                const isHelp = announcement.type === 'help';
                const isRecipe = announcement.type === 'recipe';
                const iconBg = isEvent ? Colors.primary[100] : isHelp ? Colors.error + '20' : Colors.gold[100];

                return (
                  <TouchableOpacity
                    key={announcement.id}
                    style={[styles.announcementCard, { backgroundColor: theme.card, borderColor: announcement.is_urgent ? Colors.error : theme.cardBorder }]}
                    onPress={() => router.push(`/village/announcement/${announcement.id}`)}
                  >
                    <View style={[styles.announcementHeader, rtl && styles.rowReverse]}>
                      <View style={[styles.announcementIcon, { backgroundColor: iconBg }]}>
                        {isEvent && <Calendar size={20} color={Colors.primary[500]} />}
                        {isHelp && <Heart size={20} color={Colors.error} />}
                        {isRecipe && <ChefHat size={20} color={Colors.gold[600]} />}
                        {!isEvent && !isHelp && !isRecipe && <Bell size={20} color={Colors.primary[500]} />}
                      </View>
                      <View style={[styles.announcementContent, rtl && styles.announcementContentRTL]}>
                        <Text style={[styles.announcementTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                          {announcement.title}
                        </Text>
                        <Text style={[styles.announcementDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]} numberOfLines={2}>
                          {announcement.content}
                        </Text>
                        {announcement.event_date && (
                          <Text style={[styles.announcementDate, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
                            {new Date(announcement.event_date).toLocaleDateString(rtl ? 'ar-SA' : 'en-US', {
                              weekday: 'long',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {hasMoreAnnouncements && (
              <TouchableOpacity
                style={[styles.loadMoreButton, { borderColor: theme.cardBorder }]}
                onPress={() => fetchMoreAnnouncements()}
              >
                <Text style={[styles.loadMoreText, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
                  {rtl ? 'تحميل المزيد' : 'Load More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Sharing Tab */}
        {activeTab === 'sharing' && !isLoading && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'أدوات للمشاركة' : 'Items for Sharing'}
            </Text>

            {sharedItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Gift size={48} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {rtl ? 'لا توجد أدوات للمشاركة' : 'No items for sharing'}
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textTertiary, fontFamily: getFont('regular') }]}>
                  {rtl ? 'شارك أدواتك مع جيرانك' : 'Share your items with neighbors'}
                </Text>
              </View>
            ) : (
              sharedItems.map((item) => {
                const isAvailable = item.status === 'available';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.sharingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, rtl && styles.rowReverse]}
                    onPress={() => router.push(`/village/item/${item.id}`)}
                  >
                    <View style={[styles.sharingIcon, { backgroundColor: isAvailable ? Colors.success + '20' : Colors.slate[200] }]}>
                      <Gift size={22} color={isAvailable ? Colors.success : Colors.slate[500]} />
                    </View>
                    <View style={[styles.sharingInfo, rtl && styles.sharingInfoRTL]}>
                      <Text style={[styles.sharingItem, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.sharingOwner, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                        {rtl ? `من ${item.owner_name}` : `From ${item.owner_name}`}
                      </Text>
                    </View>
                    <View style={[styles.availabilityBadge, { backgroundColor: isAvailable ? Colors.success + '20' : Colors.slate[200] }]}>
                      <Text style={[styles.availabilityText, { color: isAvailable ? Colors.success : Colors.slate[600], fontFamily: getFont('medium') }]}>
                        {isAvailable ? (rtl ? 'متاح' : 'Available') : (rtl ? 'مستعار' : 'Borrowed')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {hasMoreSharedItems && (
              <TouchableOpacity
                style={[styles.loadMoreButton, { borderColor: theme.cardBorder }]}
                onPress={() => fetchMoreSharedItems()}
              >
                <Text style={[styles.loadMoreText, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
                  {rtl ? 'تحميل المزيد' : 'Load More'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.addItemButton, { backgroundColor: Colors.gold[500] }, rtl && styles.rowReverse]}
              onPress={() => router.push('/village/add-item')}
            >
              <Plus size={20} color={Colors.slate[900]} />
              <Text style={[styles.addItemText, { fontFamily: getFont('bold') }]}>
                {rtl ? 'أضف أداة للمشاركة' : 'Add Item to Share'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },
  rowReverse: { flexDirection: 'row-reverse' },
  statsCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
  statsHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statsBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  statsBadgeText: { fontSize: 12, color: Colors.white },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 8 },
  statIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 26, color: Colors.white },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  statDivider: { width: 1, height: 80, marginHorizontal: 10 },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  tabText: { fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 14 },
  neighborCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, gap: 12 },
  neighborAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  neighborInitial: { fontSize: 20 },
  onlineIndicator: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.white },
  neighborInfo: { flex: 1 },
  neighborInfoRTL: { alignItems: 'flex-end' },
  neighborName: { fontSize: 15, marginBottom: 4 },
  neighborMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  neighborMetaText: { fontSize: 12 },
  chatButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  announcementCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  announcementHeader: { flexDirection: 'row', gap: 12 },
  announcementIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  announcementContent: { flex: 1 },
  announcementContentRTL: { alignItems: 'flex-end' },
  announcementTitle: { fontSize: 15, marginBottom: 4 },
  announcementDesc: { fontSize: 13, marginBottom: 6 },
  announcementDate: { fontSize: 12 },
  sharingCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, gap: 12 },
  sharingIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sharingInfo: { flex: 1 },
  sharingInfoRTL: { alignItems: 'flex-end' },
  sharingItem: { fontSize: 15, marginBottom: 2 },
  sharingOwner: { fontSize: 13 },
  availabilityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  availabilityText: { fontSize: 12 },
  addItemButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, gap: 8, marginTop: 10 },
  addItemText: { fontSize: 15, color: Colors.slate[900] },
  loadingContainer: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 18, marginTop: 12 },
  emptySubtext: { fontSize: 14 },
  loadMoreButton: { alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  loadMoreText: { fontSize: 14 },
});
