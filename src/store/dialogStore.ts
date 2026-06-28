/**
 * App dialog store — a tiny imperative layer so anywhere in the app can show a
 * CUSTOM confirm/alert (no jarring native `Alert.alert`). A single
 * <AppDialogHost/> mounted at the app root renders whatever is queued here.
 *
 *   const ok = await showConfirm({title, message, confirmText, destructive: true});
 *   if (ok) { ...do it... }
 *
 *   await showAlert({title, message});   // single-button, premium styled
 */
import {create} from 'zustand';

export interface DialogOptions {
  title: string;
  message?: string;
  /** Label for the affirmative button (default: common.ok / common.confirm). */
  confirmText?: string;
  /** Label for the dismiss button (default: common.cancel). */
  cancelText?: string;
  /** Red, dangerous affirmative button (delete, sign out...). */
  destructive?: boolean;
  /** Show a cancel button (true for confirms, false for plain alerts). */
  cancelable?: boolean;
  /** Emoji/MaterialCommunityIcons name shown at the top (optional). */
  icon?: string;
}

interface DialogState extends DialogOptions {
  id: number;
  resolve: (value: boolean) => void;
}

interface DialogStore {
  current: DialogState | null;
  _seq: number;
  open: (opts: DialogOptions, resolve: (value: boolean) => void) => void;
  /** Resolve the active dialog with the user's choice and dismiss it. */
  close: (value: boolean) => void;
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  current: null,
  _seq: 0,
  open: (opts, resolve) =>
    set((s) => ({current: {...opts, id: s._seq + 1, resolve}, _seq: s._seq + 1})),
  close: (value) => {
    const c = get().current;
    if (c) {
      c.resolve(value);
      set({current: null});
    }
  },
}));

/** Show a custom confirm dialog. Resolves true (confirmed) / false (cancelled). */
export const showConfirm = (opts: DialogOptions): Promise<boolean> =>
  new Promise((resolve) =>
    useDialogStore.getState().open({cancelable: true, ...opts}, resolve),
  );

/** Show a custom single-button alert. Resolves when dismissed. */
export const showAlert = (
  opts: Omit<DialogOptions, 'cancelable' | 'destructive'>,
): Promise<void> =>
  new Promise((resolve) =>
    useDialogStore.getState().open({...opts, cancelable: false}, () => resolve()),
  );
