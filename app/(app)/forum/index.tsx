/**
 * Community Forum Screen with Premium UI
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, I18nManager, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Search, Plus, MessageCircle, Heart, Share2, Bookmark, MoreHorizontal, TrendingUp, Clock, Users, Hash, Filter, Sparkles, MessagesSquare } from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, getWritingDirection } from '../../../utils/fonts';
import { useForumPosts, useToggleForumLike, useToggleForumBookmark } from '../../../hooks/queries/useForum';

const categories = [
  { id: 'all', name: 'All', nameAr: 'الكل', icon: Hash, color: Colors.slate[500] },
  { id: 'family', name: 'Family Life', nameAr: 'الحياة الأسرية', icon: Users, color: Colors.primary[500] },
  { id: 'parenting', name: 'Parenting', nameAr: 'تربية الأطفال', icon: Heart, color: Colors.sisters[500] },
  { id: 'recipes', name: 'Recipes', nameAr: 'الوصفات', icon: Hash, color: Colors.gold[500] },
  { id: 'islamic', name: 'Islamic', nameAr: 'الإسلام', icon: Hash, color: Colors.primary[600] },
];

export default function ForumScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const isRTL = I18nManager.isRTL;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'trending' | 'recent'>('trending');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch posts from API
  const {
    data: postsData,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useForumPosts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    sort: sortBy,
    search: searchQuery || undefined,
  });

  const likeMutation = useToggleForumLike();
  const bookmarkMutation = useToggleForumBookmark();

  // Flatten paginated data
  const posts = useMemo(() =>
    postsData?.pages.flatMap(page => page.results) || [],
    [postsData]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const ChevronBack = isRTL ? ChevronRight : ChevronLeft;

  const toggleLike = (postId: string) => likeMutation.mutate(postId);
  const toggleBookmark = (postId: string) => bookmarkMutation.mutate(postId);

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    } else {
      return isRTL ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative circles */}
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />

          <View style={[styles.headerContent, isRTL && styles.rowReverse]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronBack size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={[styles.headerCenter, isRTL && styles.alignEnd]}>
              <View style={[styles.headerTitleRow, isRTL && styles.rowReverse]}>
                <MessagesSquare size={24} color={Colors.gold[400]} />
                <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                  {isRTL ? 'منتدى المجتمع' : 'Community Forum'}
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {isRTL ? 'شارك وتعلم مع العائلات' : 'Share and learn with families'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/forum/create')}
            >
              <LinearGradient
                colors={[Colors.gold[400], Colors.gold[500]]}
                style={styles.createButtonInner}
              >
                <Plus size={20} color={Colors.slate[900]} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.searchWrapper}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }, isRTL && styles.rowReverse]}>
          <View style={[styles.searchIconBox, { backgroundColor: Colors.primary[100] }]}>
            <Search size={18} color={Colors.primary[600]} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            placeholder={isRTL ? 'ابحث في المنتدى...' : 'Search discussions...'}
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.inputBackground }]}>
            <Filter size={18} color={theme.icon} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Categories */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
        >
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <Animated.View
                key={category.id}
                entering={ZoomIn.delay(200 + index * 50).duration(300)}
                style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
              >
                <TouchableOpacity onPress={() => setSelectedCategory(category.id)}>
                  {isSelected ? (
                    <LinearGradient
                      colors={[category.color, `${category.color}dd`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.categoryChipSelected}
                    >
                      <Icon size={16} color={Colors.white} />
                      <Text style={[styles.categoryText, { color: Colors.white, fontFamily: getFont('bold') }]}>
                        {isRTL ? category.nameAr : category.name}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.categoryChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      <Icon size={16} color={category.color} />
                      <Text style={[styles.categoryText, { color: theme.text, fontFamily: getFont('medium') }]}>
                        {isRTL ? category.nameAr : category.name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Sort Tabs */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <View style={[styles.sortTabs, { borderBottomColor: theme.divider }, isRTL && styles.rowReverse]}>
          <TouchableOpacity
            style={[styles.sortTab, sortBy === 'trending' && styles.sortTabActive]}
            onPress={() => setSortBy('trending')}
          >
            <View style={[styles.sortTabIcon, { backgroundColor: sortBy === 'trending' ? Colors.primary[100] : 'transparent' }]}>
              <TrendingUp size={16} color={sortBy === 'trending' ? Colors.primary[600] : theme.textSecondary} />
            </View>
            <Text style={[styles.sortTabText, { color: sortBy === 'trending' ? Colors.primary[600] : theme.textSecondary, fontFamily: getFont(sortBy === 'trending' ? 'bold' : 'medium') }]}>
              {isRTL ? 'الأكثر تفاعلاً' : 'Trending'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortTab, sortBy === 'recent' && styles.sortTabActive]}
            onPress={() => setSortBy('recent')}
          >
            <View style={[styles.sortTabIcon, { backgroundColor: sortBy === 'recent' ? Colors.primary[100] : 'transparent' }]}>
              <Clock size={16} color={sortBy === 'recent' ? Colors.primary[600] : theme.textSecondary} />
            </View>
            <Text style={[styles.sortTabText, { color: sortBy === 'recent' ? Colors.primary[600] : theme.textSecondary, fontFamily: getFont(sortBy === 'recent' ? 'bold' : 'medium') }]}>
              {isRTL ? 'الأحدث' : 'Recent'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
          />
        }
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.emptyContainer}>
            <LinearGradient
              colors={[Colors.primary[100], Colors.primary[50]]}
              style={styles.emptyIconBox}
            >
              <MessageCircle size={48} color={Colors.primary[500]} />
            </LinearGradient>
            <Text style={[styles.emptyText, { color: theme.text, fontFamily: getFont('bold') }]}>
              {isRTL ? 'لا توجد مناقشات' : 'No discussions yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
              {isRTL ? 'كن أول من يبدأ النقاش' : 'Be the first to start a discussion'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/forum/create')}>
              <LinearGradient
                colors={[Colors.primary[500], Colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButton}
              >
                <Plus size={18} color={Colors.white} />
                <Text style={[styles.emptyButtonText, { fontFamily: getFont('bold') }]}>
                  {isRTL ? 'ابدأ مناقشة' : 'Start Discussion'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Posts */}
        {posts.map((post, index) => {
          const categoryInfo = categories.find(c => c.id === post.category);
          return (
            <Animated.View
              key={post.id}
              entering={FadeInUp.delay(index * 80).duration(400)}
            >
              <TouchableOpacity
                style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => router.push(`/forum/${post.id}`)}
              >
                <View style={[styles.postHeader, isRTL && styles.rowReverse]}>
                  <View style={[styles.authorInfo, isRTL && styles.rowReverse]}>
                    <LinearGradient
                      colors={[Colors.primary[500], Colors.primary[600]]}
                      style={styles.avatar}
                    >
                      <Text style={styles.avatarText}>{post.author.name.charAt(0)}</Text>
                    </LinearGradient>
                    <View style={isRTL ? styles.alignEnd : undefined}>
                      <Text style={[styles.authorName, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                        {post.author.name}
                      </Text>
                      <Text style={[styles.postTime, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                        {formatTimeAgo(post.created_at)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.moreButton, { backgroundColor: theme.inputBackground }]}>
                    <MoreHorizontal size={18} color={theme.icon} />
                  </TouchableOpacity>
                </View>

                <View style={styles.postContent}>
                  <Text style={[styles.postTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign(), writingDirection: getWritingDirection() }]}>
                    {post.title}
                  </Text>
                  <Text style={[styles.postText, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign(), writingDirection: getWritingDirection() }]} numberOfLines={3}>
                    {post.content}
                  </Text>
                </View>

                <View style={[styles.postTags, isRTL && styles.rowReverse]}>
                  <LinearGradient
                    colors={[`${categoryInfo?.color || Colors.slate[500]}20`, `${categoryInfo?.color || Colors.slate[500]}10`]}
                    style={styles.categoryTag}
                  >
                    <Text style={[styles.categoryTagText, { color: categoryInfo?.color, fontFamily: getFont('bold') }]}>
                      {isRTL ? categoryInfo?.nameAr : categoryInfo?.name}
                    </Text>
                  </LinearGradient>
                </View>

                <View style={[styles.postActions, { borderTopColor: theme.cardBorder }, isRTL && styles.rowReverse]}>
                  <TouchableOpacity
                    style={[styles.actionButton, isRTL && styles.rowReverse]}
                    onPress={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                  >
                    <View style={[styles.actionIconBox, { backgroundColor: post.is_liked ? `${Colors.error}15` : theme.inputBackground }]}>
                      <Heart size={16} color={post.is_liked ? Colors.error : theme.icon} fill={post.is_liked ? Colors.error : 'transparent'} />
                    </View>
                    <Text style={[styles.actionText, { color: post.is_liked ? Colors.error : theme.textSecondary, fontFamily: getFont('medium') }]}>
                      {post.likes_count}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, isRTL && styles.rowReverse]}>
                    <View style={[styles.actionIconBox, { backgroundColor: theme.inputBackground }]}>
                      <MessageCircle size={16} color={theme.icon} />
                    </View>
                    <Text style={[styles.actionText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                      {post.comments_count}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, isRTL && styles.rowReverse]}
                    onPress={(e) => { e.stopPropagation(); toggleBookmark(post.id); }}
                  >
                    <View style={[styles.actionIconBox, { backgroundColor: post.is_bookmarked ? `${Colors.gold[500]}15` : theme.inputBackground }]}>
                      <Bookmark size={16} color={post.is_bookmarked ? Colors.gold[500] : theme.icon} fill={post.is_bookmarked ? Colors.gold[500] : 'transparent'} />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, isRTL && styles.rowReverse]}>
                    <View style={[styles.actionIconBox, { backgroundColor: theme.inputBackground }]}>
                      <Share2 size={16} color={theme.icon} />
                    </View>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Load More */}
        {hasNextPage && (
          <Animated.View entering={FadeInUp.duration(300)}>
            <TouchableOpacity onPress={() => fetchNextPage()}>
              <LinearGradient
                colors={[Colors.primary[500], Colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loadMoreButton}
              >
                <Text style={[styles.loadMoreText, { fontFamily: getFont('bold') }]}>
                  {isRTL ? 'تحميل المزيد' : 'Load More'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View entering={ZoomIn.delay(500).duration(400)} style={styles.fabContainer}>
        <TouchableOpacity onPress={() => router.push('/forum/create')}>
          <LinearGradient
            colors={[Colors.gold[400], Colors.gold[500]]}
            style={styles.fab}
          >
            <Sparkles size={24} color={Colors.slate[900]} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle1: {
    width: 150,
    height: 150,
    top: -50,
    right: -30,
  },
  decorCircle2: {
    width: 100,
    height: 100,
    bottom: -30,
    left: -20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  createButton: {},
  createButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: -12,
    marginBottom: 16,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
  },
  categoryChipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  categoryText: {
    fontSize: 13,
  },

  // Sort Tabs
  sortTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  sortTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    gap: 8,
  },
  sortTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary[500],
  },
  sortTabIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortTabText: {
    fontSize: 14,
  },

  // Post Card
  postCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 0,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  authorName: {
    fontSize: 15,
  },
  postTime: {
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContent: {
    padding: 16,
    paddingTop: 14,
  },
  postTitle: {
    fontSize: 17,
    marginBottom: 8,
    lineHeight: 24,
  },
  postText: {
    fontSize: 14,
    lineHeight: 22,
  },
  postTags: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
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
    marginHorizontal: 20,
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
    fontSize: 20,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  emptyButtonText: {
    fontSize: 15,
    color: Colors.white,
  },

  // Load More
  loadMoreButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 16,
  },
  loadMoreText: {
    fontSize: 15,
    color: Colors.white,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
