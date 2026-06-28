/**
 * Tasks collaboration translations (English).
 * NEW keys only — merged into the existing `tasks` namespace at runtime by the
 * task screens (via i18n.addResourceBundle). Does NOT touch en.ts / index.ts.
 */

export default {
  tasks: {
    // Long-press action sheet
    cardHint: 'Long-press to move or reassign',
    actionsTitle: 'Task actions',
    moveTo: 'Move to',
    moveToToDo: 'Move to To Do',
    moveToInProgress: 'Move to In Progress',
    moveToDone: 'Move to Done',
    reassign: 'Reassign',
    cancel: 'Cancel',

    // Assignment
    assignToMember: 'Assign to',
    assignedToYou: 'Assigned to you',
    unassign: 'Unassign',

    // Errors
    updateError: "Couldn't update the task. Please try again.",
    assignError: "Couldn't reassign the task. Please try again.",
  },
};
