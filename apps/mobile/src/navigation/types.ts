import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type PlannerStackParamList = {
  Classes: undefined;
  AddClass: undefined;
  Tasks: undefined;
  AddTask: { taskId?: string; duplicateFromId?: string } | undefined;
  Reminders: undefined;
};

export type MoreStackParamList = {
  Groceries: undefined;
  ShoppingList: undefined;
  AddGroceryItem:
    | { groceryItemId?: string; duplicateFromId?: string }
    | undefined;
  PriceHistory: { groceryItemId: string; name?: string };
  Cleaning: undefined;
  AIAssistant: undefined;
  CouponsList: undefined;
  EventsList: undefined;
  Settings: undefined;
  Profile: undefined;
  WorkEntryDetail: { workShiftId: string };
  WorkHistory: undefined;
  CompanyDetail: { companyId?: string; companyName?: string };
  AddEditCompany:
    | {
        companyId?: string;
        companyName?: string;
        title?: string;
        message?: string;
      }
    | undefined;
  WeekWorkDetail:
    | { weekLabel?: string; title?: string; message?: string }
    | undefined;
  ExpenseDetail: { expenseId: string };
  ExpenseReport: undefined;
  BudgetSettings: undefined;
  CategorySettings: undefined;
  SplitGroupDetail: { groupId: string };
  SplitGroupSettings: { groupId?: string } | undefined;
  AddEditSplitGroup: { groupId?: string } | undefined;
  AddSplitExpense: { groupId?: string; expenseId?: string } | undefined;
  SplitExpenseDetail: { expenseId: string };
  Settlement: { groupId?: string } | undefined;
  FriendDetail: { friendId?: string } | undefined;
  MemberBalanceDetail: { memberId?: string; groupId?: string } | undefined;
  TaskDetail: { taskId: string };
  ReminderDetail: { reminderId?: string; title?: string } | undefined;
  AddEditReminder:
    | { reminderId?: string; title?: string; message?: string }
    | undefined;
  CleaningRoutineDetail: { routineId?: string; title?: string } | undefined;
  AddEditCleaningRoutine:
    | { routineId?: string; title?: string; message?: string }
    | undefined;
  AddWithAI: undefined;
  AIPreview: { prompt?: string } | undefined;
  StoreComparison:
    | { groceryItemId?: string; title?: string; message?: string }
    | undefined;
  EmptyStateScreen: { title?: string; message?: string } | undefined;
  ComingSoon: { title: string; message?: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Work: undefined;
  Calendar: undefined;
  Settings: undefined;
  Money: undefined;
  Expenses: undefined;
  Tasks: undefined;
  Splits: undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
  AI: undefined;
  Profile: undefined;
  Planner: NavigatorScreenParams<PlannerStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  ModuleSelection: undefined;
  AuthChoice: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  AddWorkShift: { workShiftId?: string; duplicateFromId?: string } | undefined;
  WorkSummary: undefined;
  AddExpense: { expenseId?: string; duplicateFromId?: string } | undefined;
  Budget: undefined;
  AddTask: { taskId?: string; duplicateFromId?: string } | undefined;
  AddGroceryItem:
    | { groceryItemId?: string; duplicateFromId?: string }
    | undefined;
  Groceries: undefined;
  GroceryDetails: { groceryItemId?: string; name?: string } | undefined;
  Cleaning: undefined;
  AIAssistant: undefined;
  CouponsList: undefined;
  CouponDetails: { couponId?: string } | undefined;
  EventsList: undefined;
  EventDetails: { eventId?: string } | undefined;
  GlobalSearch: undefined;
  Settings: undefined;
  Profile: undefined;
  WorkEntryDetail: { workShiftId: string };
  WorkHistory: undefined;
  CompanyDetail: { companyId?: string; companyName?: string };
  AddEditCompany:
    | {
        companyId?: string;
        companyName?: string;
        title?: string;
        message?: string;
      }
    | undefined;
  WeekWorkDetail:
    | { weekLabel?: string; title?: string; message?: string }
    | undefined;
  ExpenseDetail: { expenseId: string };
  ExpenseReport: undefined;
  BudgetSettings: undefined;
  CategorySettings: undefined;
  WorkLimitSettings: undefined;
  SplitGroupDetail: { groupId: string };
  SplitGroupSettings: { groupId?: string } | undefined;
  AddEditSplitGroup: { groupId?: string } | undefined;
  AddSplitExpense: { groupId?: string; expenseId?: string } | undefined;
  SplitExpenseDetail: { expenseId: string };
  Settlement: { groupId?: string } | undefined;
  FriendDetail: { friendId?: string } | undefined;
  MemberBalanceDetail: { memberId?: string; groupId?: string } | undefined;
  TaskDetail: { taskId: string };
  ReminderDetail: { reminderId?: string; title?: string } | undefined;
  AddEditReminder:
    | { reminderId?: string; title?: string; message?: string }
    | undefined;
  CleaningRoutineDetail: { routineId?: string; title?: string } | undefined;
  AddEditCleaningRoutine:
    | { routineId?: string; title?: string; message?: string }
    | undefined;
  AddWithAI: undefined;
  AIPreview: { prompt?: string } | undefined;
  StoreComparison:
    | { groceryItemId?: string; title?: string; message?: string }
    | undefined;
  EmptyStateScreen: { title?: string; message?: string } | undefined;
  ComingSoon: { title: string; message?: string };
};
