/**
 * Notes Screen
 * Shared family notes backed by the real /notes API.
 *
 * - Lists the active family's SHARED notes (title + preview + author/time).
 * - Tap a note to open it in the inline editor (edit + delete, author only).
 * - "+ New note" opens the same editor empty to create a note.
 * - Pull-to-refresh, reload on focus, loading / empty / error states.
 *
 * The editor is an inline Modal so no navigation changes are required.
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import notesService, {
  Note,
  NoteDetail,
} from '../../services/api/notes.service';
import {getCurrentFamilyId, useAuthStore} from '../../store/authStore';
import {showAlert, showConfirm} from '../../store/dialogStore';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import {formatDate} from '../../utils/datetime';
import ScreenHeader from '../../components/ui/ScreenHeader';

/** Format an ISO timestamp into a short relative-ish label. */
function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const now = Date.now();
  const diffMs = now - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) {
    return 'now';
  }
  if (min < 60) {
    return `${min}m`;
  }
  const hrs = Math.floor(min / 60);
  if (hrs < 24) {
    return `${hrs}h`;
  }
  const days = Math.floor(hrs / 24);
  if (days < 7) {
    return `${days}d`;
  }
  return formatDate(d);
}

interface EditorState {
  visible: boolean;
  note: NoteDetail | null; // null => creating
  title: string;
  body: string;
  loading: boolean;
  fetching: boolean;
}

const EMPTY_EDITOR: EditorState = {
  visible: false,
  note: null,
  title: '',
  body: '',
  loading: false,
  fetching: false,
};

export default function NotesScreen() {
  const {t} = useTranslation();
  const currentUser = useAuthStore((s) => s.user);

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);

  const hasFamily = !!getCurrentFamilyId();

  const loadNotes = useCallback(
    async (isRefresh = false) => {
      if (!getCurrentFamilyId()) {
        setNotes([]);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const data = await notesService.listNotes();
        setNotes(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('notes.loadError'));
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes]),
  );

  // --- Editor -------------------------------------------------------------

  const openCreate = () => {
    setEditor({...EMPTY_EDITOR, visible: true});
  };

  const openNote = async (note: Note) => {
    setEditor({
      ...EMPTY_EDITOR,
      visible: true,
      fetching: true,
      title: note.title,
      body: note.content_preview ?? '',
    });
    try {
      const detail = await notesService.getNote(note.id);
      setEditor((prev) => ({
        ...prev,
        note: detail,
        title: detail.title,
        body: detail.content ?? '',
        fetching: false,
      }));
    } catch (e) {
      setEditor((prev) => ({...prev, fetching: false}));
      void showAlert({
        title: t('notes.errorTitle'),
        message: e instanceof Error ? e.message : t('notes.loadError'),
      });
    }
  };

  const closeEditor = () => setEditor(EMPTY_EDITOR);

  const isAuthor =
    !!editor.note &&
    !!currentUser &&
    editor.note.author?.public_id === currentUser.public_id;
  // New notes are always editable; existing notes only by their author.
  const canEdit = !editor.note || isAuthor;

  const handleSave = async () => {
    const title = editor.title.trim();
    const body = editor.body.trim();
    if (!title) {
      void showAlert({title: t('notes.titleRequiredTitle'), message: t('notes.titleRequiredBody')});
      return;
    }
    if (!getCurrentFamilyId()) {
      void showAlert({title: t('notes.noFamilyTitle'), message: t('notes.noFamilyBody')});
      return;
    }
    setEditor((prev) => ({...prev, loading: true}));
    try {
      if (editor.note) {
        await notesService.updateNote(editor.note.id, {title, content: body});
      } else {
        await notesService.createNote({title, content: body});
      }
      closeEditor();
      await loadNotes();
    } catch (e) {
      setEditor((prev) => ({...prev, loading: false}));
      void showAlert({
        title: t('notes.saveErrorTitle'),
        message: e instanceof Error ? e.message : t('notes.saveErrorBody'),
      });
    }
  };

  const handleDelete = async () => {
    if (!editor.note) {
      return;
    }
    const id = editor.note.id;
    const ok = await showConfirm({
      title: t('notes.deleteTitle'),
      message: t('notes.deleteBody'),
      confirmText: t('notes.delete'),
      cancelText: t('notes.cancel'),
      destructive: true,
    });
    if (ok) {
      try {
        await notesService.deleteNote(id);
        closeEditor();
        await loadNotes();
      } catch (e) {
        void showAlert({
          title: t('notes.deleteErrorTitle'),
          message: e instanceof Error ? e.message : t('notes.saveErrorBody'),
        });
      }
    }
  };

  // --- Rendering ----------------------------------------------------------

  const renderItem = ({item}: {item: Note}) => (
    <TouchableOpacity
      style={styles.noteCard}
      activeOpacity={0.7}
      onPress={() => openNote(item)}>
      <View style={styles.noteHeader}>
        {item.is_pinned && (
          <Icon name="pin" size={16} color={colors.gold[600]} />
        )}
        <Text style={styles.noteTitle} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
      {!!item.content_preview && (
        <Text style={styles.notePreview} numberOfLines={2}>
          {item.content_preview}
        </Text>
      )}
      <View style={styles.noteFooter}>
        <Text style={styles.noteMeta} numberOfLines={1}>
          {item.author
            ? t('notes.by', {name: item.author.full_name})
            : ''}
        </Text>
        <Text style={styles.noteTime}>{formatWhen(item.updated)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderBody = () => {
    if (!hasFamily) {
      return (
        <View style={styles.centered}>
          <Icon name="account-group" size={56} color={colors.slate[300]} />
          <Text style={styles.emptyTitle}>{t('notes.noFamilyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('notes.noFamilyBody')}</Text>
        </View>
      );
    }
    if (isLoading && notes.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.emptyBody}>{t('notes.loading')}</Text>
        </View>
      );
    }
    if (error && notes.length === 0) {
      return (
        <View style={styles.centered}>
          <Icon name="alert-circle-outline" size={56} color={colors.error} />
          <Text style={styles.emptyTitle}>{t('notes.errorTitle')}</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadNotes()}>
            <Text style={styles.retryText}>{t('notes.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNotes(true)}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Icon
              name="note-text-outline"
              size={56}
              color={colors.slate[300]}
            />
            <Text style={styles.emptyTitle}>{t('notes.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('notes.emptyBody')}</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={t('notes.title')}
        subtitle={t('notes.subtitle', {count: notes.length})}
      />

      {renderBody()}

      {hasFamily && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={openCreate}>
          <Icon name="plus" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Inline editor */}
      <Modal
        visible={editor.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditor}>
        <SafeAreaView style={styles.editorContainer} edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}>
            <View style={styles.editorHeader}>
              <TouchableOpacity onPress={closeEditor} hitSlop={hitSlop}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.editorTitle}>
                {editor.note ? t('notes.editNote') : t('notes.newNote')}
              </Text>
              {canEdit ? (
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={editor.loading}
                  hitSlop={hitSlop}>
                  {editor.loading ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary[500]}
                    />
                  ) : (
                    <Text style={styles.saveText}>
                      {editor.note ? t('notes.save') : t('notes.create')}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.headerSpacer} />
              )}
            </View>

            {editor.fetching ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
              </View>
            ) : (
              <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.editorContent}
                keyboardShouldPersistTaps="handled">
                <TextInput
                  style={styles.titleInput}
                  placeholder={t('notes.titlePlaceholder')}
                  placeholderTextColor={colors.text.tertiary}
                  value={editor.title}
                  onChangeText={(v) =>
                    setEditor((prev) => ({...prev, title: v}))
                  }
                  editable={canEdit}
                />
                <TextInput
                  style={styles.bodyInput}
                  placeholder={t('notes.bodyPlaceholder')}
                  placeholderTextColor={colors.text.tertiary}
                  value={editor.body}
                  onChangeText={(v) =>
                    setEditor((prev) => ({...prev, body: v}))
                  }
                  editable={canEdit}
                  multiline
                  textAlignVertical="top"
                />

                {editor.note && isAuthor && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}>
                    <Icon
                      name="trash-can-outline"
                      size={20}
                      color={colors.error}
                    />
                    <Text style={styles.deleteText}>{t('notes.delete')}</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const hitSlop = {top: 8, bottom: 8, left: 8, right: 8};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  flex: {
    flex: 1,
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
    paddingBottom: spacing[24],
    gap: spacing[3],
    flexGrow: 1,
  },
  noteCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  noteTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  notePreview: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
    lineHeight: 18,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  noteMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
    flexShrink: 1,
  },
  noteTime: {
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
  fab: {
    position: 'absolute',
    bottom: spacing[8],
    right: spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xl,
  },
  // Editor
  editorContainer: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  editorTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
  },
  saveText: {
    ...typography.bodyMedium,
    color: colors.primary[600],
    fontWeight: '700',
  },
  headerSpacer: {
    width: 24,
  },
  editorContent: {
    padding: spacing[5],
    paddingBottom: spacing[10],
    gap: spacing[4],
    flexGrow: 1,
  },
  titleInput: {
    ...typography.h4,
    color: colors.text.primary,
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  bodyInput: {
    ...typography.body,
    color: colors.text.primary,
    minHeight: 200,
    paddingVertical: spacing[2],
    lineHeight: 22,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteText: {
    ...typography.bodyMedium,
    color: colors.error,
    fontWeight: '600',
  },
});
