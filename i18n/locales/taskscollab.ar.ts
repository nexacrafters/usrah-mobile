/**
 * Tasks collaboration translations (Arabic).
 * NEW keys only — merged into the existing `tasks` namespace at runtime by the
 * task screens (via i18n.addResourceBundle). Does NOT touch ar.ts / index.ts.
 */

export default {
  tasks: {
    // Long-press action sheet
    cardHint: 'اضغط مطولاً للنقل أو إعادة التعيين',
    actionsTitle: 'إجراءات المهمة',
    moveTo: 'نقل إلى',
    moveToToDo: 'نقل إلى قائمة المهام',
    moveToInProgress: 'نقل إلى قيد التنفيذ',
    moveToDone: 'نقل إلى المنجزة',
    reassign: 'إعادة التعيين',
    cancel: 'إلغاء',

    // Assignment
    assignToMember: 'تعيين إلى',
    assignedToYou: 'موكلة إليك',
    unassign: 'إلغاء التعيين',

    // Errors
    updateError: 'تعذّر تحديث المهمة. يرجى المحاولة مرة أخرى.',
    assignError: 'تعذّر إعادة تعيين المهمة. يرجى المحاولة مرة أخرى.',
  },
};
