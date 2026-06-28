/**
 * Calendar feature translations (Arabic).
 * Merge the `calendar` key into the main `ar` translation object.
 */

export default {
  calendar: {
    // Screen titles
    title: 'التقويم',
    subtitle: 'مناسبات العائلة المشتركة',
    newEvent: 'مناسبة جديدة',
    addEvent: 'إضافة مناسبة',

    // Sections / grouping
    upcoming: 'القادمة',
    today: 'اليوم',
    tomorrow: 'غدًا',
    past: 'السابقة',
    allDay: 'طوال اليوم',

    // Loading / empty / error states
    loading: 'جارٍ تحميل المناسبات...',
    noEventsTitle: 'لا توجد مناسبات بعد',
    noEventsBody: 'ستظهر مناسبات العائلة هنا. اضغط + لإضافة أول مناسبة.',
    couldntLoad: 'تعذّر تحميل المناسبات',
    retry: 'إعادة المحاولة',
    noFamilyTitle: 'لم يتم اختيار عائلة',
    noFamilyBody: 'انضم إلى عائلة أو أنشئ واحدة لمشاركة التقويم.',

    // Form labels
    titleLabel: 'العنوان',
    titlePlaceholder: 'مثال: عشاء العائلة',
    dateLabel: 'التاريخ',
    datePlaceholder: 'سنة-شهر-يوم',
    today_btn: 'اليوم',
    timeLabel: 'الوقت (اختياري)',
    timePlaceholder: 'ساعة:دقيقة',
    descriptionLabel: 'الوصف (اختياري)',
    descriptionPlaceholder: 'أضف ملاحظة...',
    locationLabel: 'المكان (اختياري)',
    locationPlaceholder: 'أين ستقام؟',
    categoryLabel: 'التصنيف',
    createEvent: 'إنشاء المناسبة',

    // Event types (used as default categories)
    typeGeneral: 'عام',
    typeBirthday: 'عيد ميلاد',
    typeAnniversary: 'ذكرى سنوية',
    typeIslamic: 'إسلامي',
    typeSchool: 'مدرسة',
    typeMedical: 'طبي',
    typeTravel: 'سفر',
    typeWork: 'عمل',
    typePrayer: 'صلاة',

    // Validation / alerts
    titleRequiredTitle: 'العنوان مطلوب',
    titleRequiredBody: 'الرجاء إدخال عنوان للمناسبة.',
    dateRequiredTitle: 'التاريخ مطلوب',
    dateRequiredBody: 'الرجاء إدخال تاريخ (سنة-شهر-يوم).',
    invalidDateTitle: 'تاريخ غير صالح',
    invalidDateBody: 'استخدم الصيغة سنة-شهر-يوم (YYYY-MM-DD).',
    invalidTimeTitle: 'وقت غير صالح',
    invalidTimeBody: 'استخدم صيغة 24 ساعة (ساعة:دقيقة).',
    noFamilyAlertTitle: 'لم يتم اختيار عائلة',
    noFamilyAlertBody: 'اختر عائلة قبل إنشاء المناسبة.',
    couldNotCreateTitle: 'تعذّر إنشاء المناسبة',
    couldNotCreateBody: 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.',
  },
};
