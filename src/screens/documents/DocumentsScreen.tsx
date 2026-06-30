/**
 * Documents Screen
 * Family document list backed by the real /documents API.
 *
 * - Lists the active family's documents (name, type, size, uploaded_by, date)
 *   with a file-type icon.
 * - Tapping a document resolves its absolute URL and opens it via Linking.
 * - Pull-to-refresh, reload on focus, loading / empty / error states.
 *
 * Uploading requires a binary file (the API's upload endpoint is multipart),
 * so we deliberately do NOT add a file picker here — the empty state notes that
 * uploads happen on the web app.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {showAlert} from '../../store/dialogStore';
import documentsService, {
  DocumentItem,
} from '../../services/api/documents.service';
import {getCurrentFamilyId} from '../../store/authStore';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import {formatDate as formatDateLocale} from '../../utils/datetime';
import ScreenHeader from '../../components/ui/ScreenHeader';

/** Map a server file_type bucket to an icon + accent color. */
function fileTypeVisual(type: string): {icon: string; color: string} {
  switch (type) {
    case 'pdf':
      return {icon: 'file-pdf-box', color: colors.error};
    case 'image':
      return {icon: 'file-image', color: colors.islamic.subhanallah};
    case 'document':
      return {icon: 'file-document', color: colors.primary[500]};
    case 'spreadsheet':
      return {icon: 'file-excel', color: colors.islamic.mashallah};
    case 'presentation':
      return {icon: 'file-powerpoint', color: colors.warning};
    case 'video':
      return {icon: 'file-video', color: colors.islamic.barakallah};
    case 'audio':
      return {icon: 'file-music', color: colors.skyBlue[500]};
    case 'archive':
      return {icon: 'folder-zip', color: colors.gold[600]};
    default:
      return {icon: 'file', color: colors.slate[500]};
  }
}

function formatDate(iso: string): string {
  return formatDateLocale(iso);
}

export default function DocumentsScreen() {
  const {t} = useTranslation();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const hasFamily = !!getCurrentFamilyId();

  const loadDocuments = useCallback(
    async (isRefresh = false) => {
      if (!getCurrentFamilyId()) {
        setDocuments([]);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const data = await documentsService.listDocuments();
        setDocuments(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('documents.loadError'));
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments]),
  );

  const openDocument = useCallback(
    async (doc: DocumentItem) => {
      setOpeningId(doc.id);
      try {
        const url = await documentsService.getDownloadUrl(doc.id);
        if (!url) {
          void showAlert({title: t('documents.noFileTitle'), message: t('documents.noFileBody')});
          return;
        }
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          void showAlert({title: t('documents.noFileTitle'), message: t('documents.openError')});
          return;
        }
        await Linking.openURL(url);
      } catch (e) {
        void showAlert({
          title: t('documents.errorTitle'),
          message: e instanceof Error ? e.message : t('documents.openError'),
        });
      } finally {
        setOpeningId(null);
      }
    },
    [t],
  );

  const renderItem = ({item}: {item: DocumentItem}) => {
    const visual = fileTypeVisual(item.file_type);
    const typeLabel = t(`documents.fileTypes.${item.file_type}`, {
      defaultValue: item.file_type,
    });
    return (
      <TouchableOpacity
        style={styles.docCard}
        activeOpacity={0.7}
        onPress={() => openDocument(item)}>
        <View style={[styles.iconWrap, {backgroundColor: visual.color + '18'}]}>
          {openingId === item.id ? (
            <ActivityIndicator size="small" color={visual.color} />
          ) : (
            <Icon name={visual.icon} size={26} color={visual.color} />
          )}
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docName} numberOfLines={1}>
            {item.filename}
          </Text>
          <Text style={styles.docMeta} numberOfLines={1}>
            {typeLabel}
            {item.file_size_display ? ` · ${item.file_size_display}` : ''}
            {item.created ? ` · ${formatDate(item.created)}` : ''}
          </Text>
          <Text style={styles.docUploader} numberOfLines={1}>
            {t('documents.uploadedBy', {
              name:
                item.uploaded_by?.full_name ??
                t('documents.unknownUploader'),
            })}
          </Text>
        </View>
        <Icon
          name="chevron-right"
          size={22}
          color={colors.text.tertiary}
        />
      </TouchableOpacity>
    );
  };

  const renderBody = () => {
    if (!hasFamily) {
      return (
        <View style={styles.centered}>
          <Icon name="account-group" size={56} color={colors.slate[300]} />
          <Text style={styles.emptyTitle}>{t('documents.noFamilyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('documents.noFamilyBody')}</Text>
        </View>
      );
    }
    if (isLoading && documents.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.emptyBody}>{t('documents.loading')}</Text>
        </View>
      );
    }
    if (error && documents.length === 0) {
      return (
        <View style={styles.centered}>
          <Icon name="alert-circle-outline" size={56} color={colors.error} />
          <Text style={styles.emptyTitle}>{t('documents.errorTitle')}</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadDocuments()}>
            <Text style={styles.retryText}>{t('documents.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDocuments(true)}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Icon
              name="folder-open-outline"
              size={56}
              color={colors.slate[300]}
            />
            <Text style={styles.emptyTitle}>{t('documents.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('documents.emptyBody')}</Text>
            <Text style={styles.uploadHint}>{t('documents.uploadHint')}</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={t('documents.title')}
        subtitle={t('documents.subtitle', {count: documents.length})}
      />

      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[3],
    flexGrow: 1,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing[3],
    ...shadows.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
    gap: spacing[1],
  },
  docName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  docMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  docUploader: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[2],
  },
  emptyTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginTop: spacing[2],
  },
  emptyBody: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  uploadHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  retryButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
});
