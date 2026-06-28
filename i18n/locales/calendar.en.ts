/**
 * Calendar feature translations (English).
 * Merge the `calendar` key into the main `en` translation object.
 */

export default {
  calendar: {
    // Screen titles
    title: 'Calendar',
    subtitle: 'Shared family events',
    newEvent: 'New Event',
    addEvent: 'Add Event',

    // Sections / grouping
    upcoming: 'Upcoming',
    today: 'Today',
    tomorrow: 'Tomorrow',
    past: 'Past',
    allDay: 'All day',

    // Loading / empty / error states
    loading: 'Loading events...',
    noEventsTitle: 'No events yet',
    noEventsBody: 'Family events will show up here. Tap + to add your first one.',
    couldntLoad: "Couldn't load events",
    retry: 'Try again',
    noFamilyTitle: 'No family selected',
    noFamilyBody: 'Join or create a family to share a calendar.',

    // Form labels
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Family dinner',
    dateLabel: 'Date',
    datePlaceholder: 'YYYY-MM-DD',
    today_btn: 'Today',
    timeLabel: 'Time (optional)',
    timePlaceholder: 'HH:MM',
    descriptionLabel: 'Description (optional)',
    descriptionPlaceholder: 'Add a note...',
    locationLabel: 'Location (optional)',
    locationPlaceholder: 'Where is it?',
    categoryLabel: 'Category',
    createEvent: 'Create Event',

    // Event types (used as default categories)
    typeGeneral: 'General',
    typeBirthday: 'Birthday',
    typeAnniversary: 'Anniversary',
    typeIslamic: 'Islamic',
    typeSchool: 'School',
    typeMedical: 'Medical',
    typeTravel: 'Travel',
    typeWork: 'Work',
    typePrayer: 'Prayer',

    // Validation / alerts
    titleRequiredTitle: 'Title required',
    titleRequiredBody: 'Please give your event a title.',
    dateRequiredTitle: 'Date required',
    dateRequiredBody: 'Please enter a date (YYYY-MM-DD).',
    invalidDateTitle: 'Invalid date',
    invalidDateBody: 'Use the format YYYY-MM-DD.',
    invalidTimeTitle: 'Invalid time',
    invalidTimeBody: 'Use the 24-hour format HH:MM.',
    noFamilyAlertTitle: 'No family selected',
    noFamilyAlertBody: 'Select a family before creating an event.',
    couldNotCreateTitle: "Couldn't create event",
    couldNotCreateBody: 'Something went wrong. Please try again.',
  },
};
