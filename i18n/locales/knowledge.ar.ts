/**
 * Knowledge hub feature translations (Arabic).
 * Merge the `forum` and `halaqat` keys into the main `ar` translation object.
 */

export default {
  forum: {
    // Screen
    title: 'المنتدى',
    subtitle: 'اسأل وشارك وناقش',
    ask: 'اطرح سؤالاً',
    all: 'الكل',

    // Post meta
    likes_zero: '{{count}} إعجاب',
    likes_one: 'إعجاب واحد',
    likes_two: 'إعجابان',
    likes_few: '{{count}} إعجابات',
    likes_many: '{{count}} إعجاباً',
    likes_other: '{{count}} إعجاب',
    comments_zero: '{{count}} تعليق',
    comments_one: 'تعليق واحد',
    comments_two: 'تعليقان',
    comments_few: '{{count}} تعليقات',
    comments_many: '{{count}} تعليقاً',
    comments_other: '{{count}} تعليق',
    views_zero: '{{count}} مشاهدة',
    views_one: 'مشاهدة واحدة',
    views_two: 'مشاهدتان',
    views_few: '{{count}} مشاهدات',
    views_many: '{{count}} مشاهدة',
    views_other: '{{count}} مشاهدة',
    anonymous: 'مجهول',
    pinned: 'مثبّت',
    locked: 'مغلق',

    // Detail
    commentsTitle: 'التعليقات',
    addCommentPlaceholder: 'اكتب تعليقاً...',
    send: 'إرسال',
    like: 'إعجاب',
    liked: 'أعجبني',

    // Loading / empty / error
    loading: 'جارٍ تحميل المنشورات...',
    noPostsTitle: 'لا توجد منشورات بعد',
    noPostsBody: 'كن أول من يبدأ نقاشاً. اضغط + للنشر.',
    noCommentsTitle: 'لا توجد تعليقات بعد',
    noCommentsBody: 'كن أول من يردّ.',
    couldntLoad: 'تعذّر تحميل المنتدى',
    couldntLoadPost: 'تعذّر تحميل هذا المنشور',
    retry: 'حاول مرة أخرى',
    postNotFound: 'المنشور غير موجود',

    // Errors / alerts
    commentFailed: 'تعذّر إضافة تعليقك',
    likeFailed: 'تعذّر تحديث إعجابك',
  },
  halaqat: {
    // Screen
    title: 'الحلقات',
    subtitle: 'حلقات الدراسة',
    all: 'الكل',

    // Card meta
    members_zero: '{{count}} عضو',
    members_one: 'عضو واحد',
    members_two: 'عضوان',
    members_few: '{{count}} أعضاء',
    members_many: '{{count}} عضواً',
    members_other: '{{count}} عضو',
    online: 'عبر الإنترنت',
    inPerson: 'حضوري',
    full: 'مكتملة',
    join: 'انضمام',
    joined: 'منضمّ',
    joining: 'جارٍ الانضمام...',
    by: 'مع {{name}}',
    schedule: 'الموعد',

    // Loading / empty / error
    loading: 'جارٍ تحميل الحلقات...',
    noHalaqatTitle: 'لا توجد حلقات بعد',
    noHalaqatBody: 'ستظهر الحلقات الجديدة هنا. عُد قريباً.',
    couldntLoad: 'تعذّر تحميل الحلقات',
    retry: 'حاول مرة أخرى',

    // Alerts
    joinFailed: 'تعذّر الانضمام إلى هذه الحلقة',
    joinedTitle: 'تم التسجيل',
    joinedBody: 'لقد انضممت إلى هذه الحلقة.',
  },
};
