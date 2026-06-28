/**
 * Knowledge hub feature translations (English).
 * Merge the `forum` and `halaqat` keys into the main `en` translation object.
 */

export default {
  forum: {
    // Screen
    title: 'Forum',
    subtitle: 'Ask, share and discuss',
    ask: 'Ask / Post',
    all: 'All',

    // Post meta
    likes_one: '{{count}} like',
    likes_other: '{{count}} likes',
    comments_one: '{{count}} comment',
    comments_other: '{{count}} comments',
    views_one: '{{count}} view',
    views_other: '{{count}} views',
    anonymous: 'Anonymous',
    pinned: 'Pinned',
    locked: 'Locked',

    // Detail
    commentsTitle: 'Comments',
    addCommentPlaceholder: 'Write a comment...',
    send: 'Send',
    like: 'Like',
    liked: 'Liked',

    // Loading / empty / error
    loading: 'Loading posts...',
    noPostsTitle: 'No posts yet',
    noPostsBody: 'Be the first to start a discussion. Tap + to post.',
    noCommentsTitle: 'No comments yet',
    noCommentsBody: 'Be the first to reply.',
    couldntLoad: "Couldn't load the forum",
    couldntLoadPost: "Couldn't load this post",
    retry: 'Try again',
    postNotFound: 'Post not found',

    // Errors / alerts
    commentFailed: "Couldn't add your comment",
    likeFailed: "Couldn't update your like",
  },
  halaqat: {
    // Screen
    title: 'Halaqat',
    subtitle: 'Study circles',
    all: 'All',

    // Card meta
    members_one: '{{count}} member',
    members_other: '{{count}} members',
    online: 'Online',
    inPerson: 'In person',
    full: 'Full',
    join: 'Join',
    joined: 'Joined',
    joining: 'Joining...',
    by: 'with {{name}}',
    schedule: 'Schedule',

    // Loading / empty / error
    loading: 'Loading study circles...',
    noHalaqatTitle: 'No study circles yet',
    noHalaqatBody: 'New halaqat will appear here. Check back soon.',
    couldntLoad: "Couldn't load study circles",
    retry: 'Try again',

    // Alerts
    joinFailed: "Couldn't join this halaqa",
    joinedTitle: 'Enrolled',
    joinedBody: 'You have joined this study circle.',
  },
};
