/**
 * Brothers Circle - Premium Design
 * Private space for male family members
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  Heart,
  MessageCircle,
  Users,
  Briefcase,
  Car,
  Dumbbell,
  Wrench,
  EyeOff,
  MoreHorizontal,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import { useBrothersCirclePosts, useToggleReaction } from '../../../hooks/queries/useSocial';
import { getFont, isRTL as checkRTL } from '../../../utils/fonts';
import type { Post, ReactionType } from '../../../types/models';

const { width } = Dimensions.get('window');

const categories = [
  { id: 'all', name: 'All', nameAr: 'الكل', icon: Users, color: Colors.primary[600] },
  { id: 'business', name: 'Business', nameAr: 'العمل', icon: Briefcase, color: '#2563eb' },
  { id: 'sports', name: 'Sports', nameAr: 'الرياضة', icon: Dumbbell, color: '#16a34a' },
  { id: 'cars', name: 'Cars', nameAr: 'السيارات', icon: Car, color: '#dc2626' },
  { id: 'diy', name: 'DIY', nameAr: 'صيانة', icon: Wrench, color: '#ca8a04' },
];

export default function BrothersCircleScreen() {
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { user, family } = useAuthStore();
  const rtl = checkRTL();
  const ChevronIcon = rtl ? ChevronRight : ChevronLeft;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is male
  const isMale = user?.gender === 'male';

  // Fetch brothers circle posts
  const {
    data: postsData,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useBrothersCirclePosts(family?.id || '');

  const posts = postsData?.pages?.flatMap(p => p.results) || [];

  // Toggle reaction mutation
  const toggleReaction = useToggleReaction();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Format post time
  const formatPostTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return rtl ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return rtl ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    }
    if (diffDays === 1) {
      return rtl ? 'أمس' : 'Yesterday';
    }
    return rtl ? `منذ ${diffDays} أيام` : `${diffDays}d ago`;
  };

  const handleReaction = (postId: string, type: ReactionType) => {
    toggleReaction.mutate({ postId, type });
  };

  const getReactionEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      love: '❤️',
      mashallah: '✨',
      alhamdulillah: '🙏',
      barakallah: '💫',
    };
    return emojis[type] || '❤️';
  };

  // Access denied screen for non-male users
  if (!isMale) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.deniedHeader}
          >
            <View style={[styles.deniedNav, rtl && styles.deniedNavRTL]}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ChevronIcon size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={[styles.deniedHeaderTitle, { fontFamily: getFont('bold') }]}>
                {rtl ? 'حلقة الإخوة' : 'Brothers Circle'}
              </Text>
              <View style={{ width: 44 }} />
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.accessDenied}>
          <Animated.View entering={ZoomIn.duration(600).delay(300)}>
            <LinearGradient
              colors={[Colors.primary[500], Colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.lockContainer}
            >
              <Lock size={64} color={Colors.white} />
            </LinearGradient>
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(400).delay(500)}>
            <Text style={[styles.accessDeniedTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'مساحة الإخوة فقط' : 'Brothers Only Space'}
            </Text>
            <Text style={[styles.accessDeniedText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
              {rtl
                ? 'هذه مساحة خاصة وآمنة حصريًا لأفراد العائلة من الذكور. توفر مساحة للإخوة للتواصل والمشاركة والدعم المتبادل.'
                : 'This is a private, secure space exclusively for the male members of the family. It provides a space for brothers to connect, share, and support each other.'}
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? theme.background : Colors.primary[50] }]} edges={['top']}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerDecoration}>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>

          <View style={[styles.headerContent, rtl && styles.headerContentRTL]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Users size={20} color={Colors.gold[400]} />
              <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                {rtl ? 'حلقة الإخوة' : 'Brothers Circle'}
              </Text>
              <Lock size={14} color={Colors.primary[200]} />
            </View>
            <TouchableOpacity style={styles.backButton}>
              <MoreHorizontal size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Privacy Notice */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <View style={[styles.privacyNotice, { backgroundColor: isDark ? Colors.primary[900] : Colors.primary[100] }]}>
          <View style={[styles.privacyContent, rtl && styles.privacyContentRTL]}>
            <View style={[styles.privacyIconBox, { backgroundColor: Colors.primary[200] }]}>
              <ShieldCheck size={14} color={Colors.primary[700]} />
            </View>
            <Text style={[styles.privacyText, { color: Colors.primary[700], fontFamily: getFont('medium') }]}>
              {rtl ? 'مساحة خاصة للإخوة فقط' : 'Private space for brothers only'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Category Filter */}
      <Animated.View entering={FadeInDown.duration(400).delay(150)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={[styles.categoryContainer, rtl && { flexDirection: 'row-reverse' }]}
        >
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.8}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[category.color, category.color + 'DD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryButtonActive}
                  >
                    <Icon size={18} color={Colors.white} />
                    <Text style={[styles.categoryTextActive, { fontFamily: getFont('semibold') }]}>
                      {rtl ? category.nameAr : category.name}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.categoryButton, { backgroundColor: Colors.white, borderColor: Colors.primary[200] }]}>
                    <Icon size={18} color={category.color} />
                    <Text style={[styles.categoryText, { color: Colors.primary[700], fontFamily: getFont('medium') }]}>
                      {rtl ? category.nameAr : category.name}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[600]}
          />
        }
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[600]} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <Animated.View entering={FadeInUp.duration(500)} style={styles.emptyContainer}>
            <LinearGradient
              colors={[Colors.primary[100], Colors.primary[200]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconBox}
            >
              <Users size={48} color={Colors.primary[600]} />
            </LinearGradient>
            <Text style={[styles.emptyText, { color: Colors.primary[600], fontFamily: getFont('semibold') }]}>
              {rtl ? 'لا توجد منشورات بعد في حلقة الإخوة' : 'No posts yet in Brothers Circle'}
            </Text>
            <Text style={[styles.emptySubtext, { color: Colors.primary[400], fontFamily: getFont('regular') }]}>
              {rtl ? 'كن أول من يشارك مع إخوانك!' : 'Be the first to share with your brothers!'}
            </Text>
          </Animated.View>
        )}

        {/* Posts */}
        {posts.map((post: Post, index) => {
          const isAnonymous = !post.author;

          // Convert reactions_count to array
          const reactionsArray = Object.entries(post.reactions_count || {})
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => ({ type, count }));

          return (
            <Animated.View
              key={post.id}
              entering={FadeInUp.duration(400).delay(200 + index * 100)}
            >
              <View style={[styles.postCard, { backgroundColor: Colors.white }]}>
                <View style={[styles.postHeader, rtl && styles.rowReverse]}>
                  <View style={[styles.postAuthor, rtl && styles.rowReverse]}>
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: isAnonymous
                            ? Colors.slate[200]
                            : Colors.primary[200],
                        },
                      ]}
                    >
                      {isAnonymous ? (
                        <EyeOff size={20} color={Colors.slate[500]} />
                      ) : (
                        <Text style={[styles.avatarText, { fontFamily: getFont('bold') }]}>
                          {post.author?.full_name?.charAt(0) || '?'}
                        </Text>
                      )}
                    </View>
                    <View style={rtl && { alignItems: 'flex-end' }}>
                      <View style={[styles.authorNameRow, rtl && styles.rowReverse]}>
                        <Text style={[styles.authorName, { color: Colors.primary[900], fontFamily: getFont('bold') }]}>
                          {isAnonymous ? (rtl ? 'أخ مجهول' : 'Anonymous Brother') : post.author?.full_name}
                        </Text>
                        {isAnonymous && (
                          <View style={styles.anonymousBadge}>
                            <EyeOff size={10} color={Colors.slate[500]} />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.postTime, { color: Colors.primary[400], fontFamily: getFont('regular') }]}>
                        {formatPostTime(post.created)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <MoreHorizontal size={20} color={Colors.primary[400]} />
                  </TouchableOpacity>
                </View>

                {post.content && (
                  <Text style={[styles.postContent, { color: Colors.primary[900], fontFamily: getFont('regular'), textAlign: rtl ? 'right' : 'left' }]}>
                    {post.content}
                  </Text>
                )}

                {post.media && post.media.length > 0 && (
                  <View style={[styles.postMedia, { backgroundColor: Colors.primary[100] }]}>
                    <Text style={{ color: Colors.primary[400], fontFamily: getFont('regular') }}>
                      {rtl ? 'صورة' : 'Photo'}
                    </Text>
                  </View>
                )}

                {reactionsArray.length > 0 && (
                  <View style={[styles.postReactions, rtl && styles.rowReverse]}>
                    {reactionsArray.map((reaction, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.reactionBadge, { backgroundColor: Colors.primary[100] }]}
                        onPress={() => handleReaction(post.id, reaction.type as ReactionType)}
                      >
                        <Text style={styles.reactionEmoji}>
                          {getReactionEmoji(reaction.type)}
                        </Text>
                        <Text style={[styles.reactionCount, { color: Colors.primary[600], fontFamily: getFont('semibold') }]}>
                          {reaction.count}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={[styles.postActions, { borderTopColor: Colors.primary[100] }]}>
                  <TouchableOpacity
                    style={styles.postAction}
                    onPress={() => handleReaction(post.id, 'love')}
                  >
                    <Heart
                      size={20}
                      color={post.user_reaction === 'love' ? Colors.primary[600] : Colors.primary[400]}
                      fill={post.user_reaction === 'love' ? Colors.primary[600] : 'transparent'}
                    />
                    <Text style={[styles.postActionText, { color: Colors.primary[600], fontFamily: getFont('medium') }]}>
                      {rtl ? 'تفاعل' : 'React'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postAction}>
                    <MessageCircle size={20} color={Colors.primary[400]} />
                    <Text style={[styles.postActionText, { color: Colors.primary[600], fontFamily: getFont('medium') }]}>
                      {post.comments_count || 0} {rtl ? 'تعليقات' : 'Comments'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB for new post */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/brothers-circle/post')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus size={28} color={Colors.white} />
        </LinearGradient>
      </TouchableOpacity>
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
    paddingBottom: 20,
    paddingHorizontal: 16,
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
    justifyContent: 'space-between',
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.white,
  },

  // Privacy Notice
  privacyNotice: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  privacyContentRTL: {
    flexDirection: 'row-reverse',
  },
  privacyIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 12,
  },

  // Categories
  categoryScroll: {
    maxHeight: 60,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    flexDirection: 'row',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    fontSize: 13,
  },
  categoryTextActive: {
    fontSize: 13,
    color: Colors.white,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Post Card
  postCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: Colors.primary[700],
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 15,
  },
  anonymousBadge: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: Colors.slate[100],
  },
  postTime: {
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postMedia: {
    height: 200,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postReactions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 13,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 14,
  },
  postAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postActionText: {
    fontSize: 13,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    borderRadius: 28,
    shadowColor: Colors.primary[600],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading & Empty
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Access Denied
  deniedHeader: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  deniedNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deniedNavRTL: {
    flexDirection: 'row-reverse',
  },
  deniedHeaderTitle: {
    fontSize: 20,
    color: Colors.white,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockContainer: {
    width: 140,
    height: 140,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: Colors.primary[600],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  accessDeniedTitle: {
    fontSize: 26,
    marginBottom: 16,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
});
