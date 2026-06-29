/**
 * App Stack Navigator
 * Hosts the bottom tabs ("Tabs") and the pushed detail/add screens so they
 * are reachable from anywhere inside the authenticated app.
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AppStackParamList} from './types';
import AppNavigator from './AppNavigator';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import AddTaskScreen from '../screens/tasks/AddTaskScreen';
import RecipesScreen from '../screens/recipes/RecipesScreen';
import RecipeDetailScreen from '../screens/recipes/RecipeDetailScreen';
import PrayerTimesScreen from '../screens/prayer/PrayerTimesScreen';
import AddIncomeSourceScreen from '../screens/finance/AddIncomeSourceScreen';
import SavingsFundScreen from '../screens/finance/SavingsFundScreen';
import AddSavingsFundScreen from '../screens/finance/AddSavingsFundScreen';
import SavingsFundDetailScreen from '../screens/finance/SavingsFundDetailScreen';
import FamilyScreen from '../screens/family/FamilyScreen';
import QiblaScreen from '../screens/islamic/QiblaScreen';
import DhikrCounterScreen from '../screens/islamic/DhikrCounterScreen';
import HijriCalendarScreen from '../screens/islamic/HijriCalendarScreen';
import ZakatScreen from '../screens/islamic/ZakatScreen';
import DuasScreen from '../screens/islamic/DuasScreen';
import QuranScreen from '../screens/islamic/QuranScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import HelpScreen from '../screens/settings/HelpScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import FeedbackScreen from '../screens/settings/FeedbackScreen';
import ShoppingListScreen from '../screens/shopping/ShoppingListScreen';
import GoalsScreen from '../screens/goals/GoalsScreen';
import AddGoalScreen from '../screens/goals/AddGoalScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import AddEventScreen from '../screens/calendar/AddEventScreen';
import CircleScreen from '../screens/social/CircleScreen';
import PostScreen from '../screens/social/PostScreen';
import NotesScreen from '../screens/notes/NotesScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import ForumScreen from '../screens/forum/ForumScreen';
import ForumPostScreen from '../screens/forum/ForumPostScreen';
import HalaqatScreen from '../screens/halaqat/HalaqatScreen';
import DebtsScreen from '../screens/finance/DebtsScreen';
import RecurringScreen from '../screens/finance/RecurringScreen';
import MealPlanScreen from '../screens/food/MealPlanScreen';
import PantryScreen from '../screens/food/PantryScreen';
import HabitsScreen from '../screens/habits/HabitsScreen';
import MemorizationScreen from '../screens/habits/MemorizationScreen';
import MasroufScreen from '../screens/finance/MasroufScreen';
import PreferencesScreen from '../screens/settings/PreferencesScreen';
import CashFlowScreen from '../screens/finance/CashFlowScreen';
import ReportsScreen from '../screens/finance/ReportsScreen';
import SunnahScreen from '../screens/islamic/SunnahScreen';
import FastingScreen from '../screens/islamic/FastingScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Tabs" component={AppNavigator} />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{presentation: 'modal'}}
      />
      <Stack.Screen
        name="AddTask"
        component={AddTaskScreen}
        options={{presentation: 'modal'}}
      />
      <Stack.Screen name="Recipes" component={RecipesScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="Prayer" component={PrayerTimesScreen} />
      <Stack.Screen
        name="AddIncomeSource"
        component={AddIncomeSourceScreen}
        options={{presentation: 'modal'}}
      />
      <Stack.Screen name="SavingsFunds" component={SavingsFundScreen} />
      <Stack.Screen
        name="AddSavingsFund"
        component={AddSavingsFundScreen}
        options={{presentation: 'modal'}}
      />
      <Stack.Screen
        name="SavingsFundDetail"
        component={SavingsFundDetailScreen}
      />
      <Stack.Screen name="Family" component={FamilyScreen} />
      <Stack.Screen name="Qibla" component={QiblaScreen} />
      <Stack.Screen name="Dhikr" component={DhikrCounterScreen} />
      <Stack.Screen name="Hijri" component={HijriCalendarScreen} />
      <Stack.Screen name="Zakat" component={ZakatScreen} />
      <Stack.Screen name="Duas" component={DuasScreen} />
      <Stack.Screen name="Quran" component={QuranScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Shopping" component={ShoppingListScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="AddGoal" component={AddGoalScreen} options={{presentation: 'modal'}} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} options={{presentation: 'modal'}} />
      <Stack.Screen name="Circle" component={CircleScreen} />
      <Stack.Screen name="Post" component={PostScreen} />
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="Forum" component={ForumScreen} />
      <Stack.Screen name="ForumPost" component={ForumPostScreen} />
      <Stack.Screen name="Halaqat" component={HalaqatScreen} />
      <Stack.Screen name="Debts" component={DebtsScreen} />
      <Stack.Screen name="Recurring" component={RecurringScreen} />
      <Stack.Screen name="MealPlan" component={MealPlanScreen} />
      <Stack.Screen name="Pantry" component={PantryScreen} />
      <Stack.Screen name="Habits" component={HabitsScreen} />
      <Stack.Screen name="Memorization" component={MemorizationScreen} />
      <Stack.Screen name="Masrouf" component={MasroufScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="CashFlow" component={CashFlowScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Sunnah" component={SunnahScreen} />
      <Stack.Screen name="Fasting" component={FastingScreen} />
    </Stack.Navigator>
  );
}
