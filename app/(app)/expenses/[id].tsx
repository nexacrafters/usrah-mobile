/**
 * Expense Detail Screen - View and Edit Transaction
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ChevronRight,
  Calendar,
  Tag,
  FileText,
  Trash2,
  Edit3,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  Receipt,
  MoreVertical,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import { useTransaction, useDeleteTransaction } from '../../../hooks/queries/useExpenses';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const { family } = useAuthStore();

  // Fetch transaction details
  const { data: transaction, isLoading } = useTransaction(id || '');
  const deleteMutation = useDeleteTransaction();

  const handleDelete = () => {
    Alert.alert(
      rtl ? 'حذف المعاملة' : 'Delete Transaction',
      rtl ? 'هل أنت متأكد من حذف هذه المعاملة؟' : 'Are you sure you want to delete this transaction?',
      [
        { text: rtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: rtl ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(id || '', {
              onSuccess: () => router.back(),
            });
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(rtl ? 'ar-TN' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(rtl ? 'ar-TN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
            {rtl ? 'تفاصيل المعاملة' : 'Transaction Details'}
          </Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <ChevronRight size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Receipt size={48} color={theme.textTertiary} />
          <Text style={[styles.errorText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
            {rtl ? 'المعاملة غير موجودة' : 'Transaction not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? Colors.error : Colors.success;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.card }]}>
          <MoreVertical size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
          {rtl ? 'تفاصيل المعاملة' : 'Transaction Details'}
        </Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <ChevronRight size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <LinearGradient
            colors={isExpense
              ? (isDark ? ['#7f1d1d', '#450a0a'] : ['#ef4444', '#dc2626'])
              : (isDark ? ['#14532d', '#052e16'] : ['#22c55e', '#16a34a'])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.amountCard}
          >
            <View style={styles.amountHeader}>
              <View style={styles.typeBadge}>
                {isExpense ? (
                  <TrendingDown size={16} color={Colors.white} />
                ) : (
                  <TrendingUp size={16} color={Colors.white} />
                )}
                <Text style={[styles.typeBadgeText, { fontFamily: getFont('medium') }]}>
                  {isExpense ? (rtl ? 'مصروف' : 'Expense') : (rtl ? 'دخل' : 'Income')}
                </Text>
              </View>
            </View>
            <Text style={[styles.amountText, { fontFamily: getFont('bold') }]}>
              {isExpense ? '-' : '+'}{Math.abs(transaction.amount).toLocaleString()} {rtl ? 'د.ت' : 'TND'}
            </Text>
            <Text style={[styles.categoryText, { fontFamily: getFont('medium') }]}>
              {transaction.category?.name || (rtl ? 'غير مصنف' : 'Uncategorized')}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Details Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'التفاصيل' : 'Details'}
            </Text>

            {/* Description */}
            {transaction.description && (
              <View style={[styles.detailRow, rtl && styles.rowReverse]}>
                <Text style={[styles.detailValue, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign(), flex: 1 }]}>
                  {transaction.description}
                </Text>
                <View style={[styles.detailIcon, { backgroundColor: Colors.primary[100] }]}>
                  <FileText size={18} color={Colors.primary[600]} />
                </View>
              </View>
            )}

            {/* Date */}
            <View style={[styles.detailRow, rtl && styles.rowReverse]}>
              <Text style={[styles.detailValue, { color: theme.text, fontFamily: getFont('regular') }]}>
                {formatDate(transaction.date)}
              </Text>
              <View style={[styles.detailIcon, { backgroundColor: Colors.gold[100] }]}>
                <Calendar size={18} color={Colors.gold[600]} />
              </View>
            </View>

            {/* Time */}
            <View style={[styles.detailRow, rtl && styles.rowReverse]}>
              <Text style={[styles.detailValue, { color: theme.text, fontFamily: getFont('regular') }]}>
                {formatTime(transaction.date)}
              </Text>
              <View style={[styles.detailIcon, { backgroundColor: Colors.sisters[100] }]}>
                <Clock size={18} color={Colors.sisters[600]} />
              </View>
            </View>

            {/* Category */}
            <View style={[styles.detailRow, rtl && styles.rowReverse]}>
              <View style={[styles.categoryBadge, { backgroundColor: `${amountColor}15` }]}>
                <Text style={[styles.categoryBadgeText, { color: amountColor, fontFamily: getFont('medium') }]}>
                  {transaction.category?.name || (rtl ? 'غير مصنف' : 'Uncategorized')}
                </Text>
              </View>
              <View style={[styles.detailIcon, { backgroundColor: `${amountColor}20` }]}>
                <Tag size={18} color={amountColor} />
              </View>
            </View>

            {/* Created By */}
            {transaction.created_by && (
              <View style={[styles.detailRow, rtl && styles.rowReverse]}>
                <Text style={[styles.detailValue, { color: theme.text, fontFamily: getFont('regular') }]}>
                  {transaction.created_by.full_name}
                </Text>
                <View style={[styles.detailIcon, { backgroundColor: Colors.slate[100] }]}>
                  <User size={18} color={Colors.slate[600]} />
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary[100] }]}
            onPress={() => router.push(`/expenses/add?edit=${id}`)}
          >
            <Edit3 size={20} color={Colors.primary[600]} />
            <Text style={[styles.actionButtonText, { color: Colors.primary[600], fontFamily: getFont('bold') }]}>
              {rtl ? 'تعديل' : 'Edit'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#fef2f2' }]}
            onPress={handleDelete}
          >
            <Trash2 size={20} color={Colors.error} />
            <Text style={[styles.actionButtonText, { color: Colors.error, fontFamily: getFont('bold') }]}>
              {rtl ? 'حذف' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  menuButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18 },
  placeholder: { width: 44 },
  content: { flex: 1, padding: 20 },
  rowReverse: { flexDirection: 'row-reverse' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorText: { fontSize: 16 },

  // Amount Card
  amountCard: { borderRadius: 24, padding: 28, marginBottom: 20, alignItems: 'center' },
  amountHeader: { width: '100%', alignItems: 'flex-end', marginBottom: 16 },
  typeBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  typeBadgeText: { fontSize: 13, color: Colors.white },
  amountText: { fontSize: 42, color: Colors.white, marginBottom: 8 },
  categoryText: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },

  // Details Card
  detailsCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 16, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.slate[100] },
  detailIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  detailValue: { fontSize: 15 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  categoryBadgeText: { fontSize: 13 },

  // Actions
  actionsSection: { flexDirection: 'row-reverse', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16 },
  actionButtonText: { fontSize: 15 },
});
