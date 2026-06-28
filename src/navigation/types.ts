/**
 * Navigation Type Definitions
 */

import {NavigatorScreenParams} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
  Onboarding: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// App-level stack: hosts the bottom tabs plus pushed detail/add screens
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList>;
  AddExpense: undefined;
  AddTask: undefined;
  Recipes: undefined;
  RecipeDetail: {id: string};
  Prayer: undefined;
  AddIncomeSource: undefined;
  SavingsFunds: undefined;
  AddSavingsFund: undefined;
  SavingsFundDetail: {id: string};
  Family: undefined;
  Qibla: undefined;
  Dhikr: undefined;
  Hijri: undefined;
  Zakat: undefined;
  Duas: undefined;
  Quran: undefined;
  NotificationSettings: undefined;
  Help: undefined;
  About: undefined;
  Feedback: undefined;
  Shopping: undefined;
  Goals: undefined;
  AddGoal: undefined;
  Calendar: undefined;
  AddEvent: undefined;
  Circle: undefined;
  Post: {id: string};
  Notes: undefined;
  Documents: undefined;
  Forum: undefined;
  ForumPost: {id: string};
  Halaqat: undefined;
  Debts: undefined;
  Recurring: undefined;
  MealPlan: undefined;
  Pantry: undefined;
  Habits: undefined;
  Memorization: undefined;
};

export type AppStackScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;

// Auth Navigator
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  /**
   * Phone verification. `purpose` lets the screen tailor copy/behaviour:
   * - 'verify'   : verify a freshly registered phone (default)
   */
  OTP: {phone: string; purpose?: 'verify'};
  ForgotPassword: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// App Bottom Tabs
export type AppTabParamList = {
  Home: undefined;
  Chat: undefined;
  Expenses: undefined;
  Tasks: undefined;
  More: undefined;
};

export type AppTabScreenProps<T extends keyof AppTabParamList> =
  BottomTabScreenProps<AppTabParamList, T>;

// Declare global navigation type
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
