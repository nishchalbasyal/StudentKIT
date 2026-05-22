export type SplitType = "EQUAL" | "CUSTOM" | "PERCENTAGE";

export interface SplitGroup {
  id: string;
  userId: string;
  ownerUserId?: string;
  name: string;
  description: string | null;
  currency: string;
  imageUrl?: string | null;
  archivedAt?: string | null;
  totalAmount: number;
  totalAmountCents: number;
  currentUserBalance: number;
  currentUserBalanceCents: number;
  createdAt: string;
  updatedAt: string;
  members: SplitMember[];
  expenses: SplitExpense[];
  settlements: SplitSettlement[];
  balances?: SplitBalance[];
  simplifiedDebts?: SplitDebt[];
  activities?: SplitActivity[];
}

export interface SplitMember {
  id: string;
  groupId: string;
  userId?: string | null;
  name: string;
  email: string | null;
  avatarUrl?: string | null;
  isCurrentUser: boolean;
  isRegisteredUser?: boolean;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SplitExpense {
  id: string;
  groupId: string;
  paidByMemberId: string;
  title: string;
  category?: string | null;
  amount: number;
  amountCents: number;
  currency?: string;
  date: string;
  splitType: SplitType;
  notes: string | null;
  createdByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  paidBy?: SplitMember;
  payers?: SplitExpensePayer[];
  shares: SplitExpenseShare[];
  group?: { id: string; name: string; currency: string };
  balanceEffect?: SplitDebt[];
}

export interface SplitExpensePayer {
  id?: string;
  expenseId?: string;
  memberId: string;
  amount: number;
  amountCents: number;
  member?: SplitMember;
}

export interface SplitExpenseShare {
  id?: string;
  splitExpenseId?: string;
  memberId: string;
  amount: number;
  amountCents: number;
  member?: SplitMember;
}

export interface SplitSettlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  amountCents: number;
  currency?: string;
  date: string;
  notes: string | null;
  createdByUserId?: string | null;
  fromMember?: SplitMember;
  toMember?: SplitMember;
}

export interface SplitBalance {
  memberId: string;
  member: SplitMember;
  totalPaid: number;
  totalPaidCents: number;
  totalShare: number;
  totalShareCents: number;
  settlement: number;
  settlementCents: number;
  net: number;
  netCents: number;
}

export interface SplitDebt {
  fromMemberId: string;
  toMemberId: string;
  fromMember: SplitMember;
  toMember: SplitMember;
  amount: number;
  amountCents: number;
}

export interface SplitSummary {
  balance: number;
  balanceCents: number;
  currency: string;
  groupsCount: number;
  expenseCount: number;
  status: string;
}

export interface SplitFriendBalance {
  id: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  isRegisteredUser?: boolean;
  memberIds: string[];
  balance: number;
  balanceCents: number;
  currency: string;
  groups: Array<{
    groupId: string;
    groupName: string;
    balance: number;
    balanceCents: number;
    expenses?: SplitExpense[];
    settlements?: SplitSettlement[];
  }>;
  expenses?: SplitExpense[];
  settlements?: SplitSettlement[];
}

export interface SplitActivity {
  id: string;
  groupId: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  group?: { id: string; name: string; currency: string };
}

export interface CreateSplitGroupInput {
  name: string;
  description?: string | null;
  currency?: string;
  imageUrl?: string | null;
  members: Array<{
    name: string;
    email?: string | null;
    userId?: string | null;
    avatarUrl?: string | null;
    isCurrentUser?: boolean;
    isRegisteredUser?: boolean;
    role?: string;
  }>;
}

export interface CreateSplitMemberInput {
  name: string;
  email?: string | null;
  userId?: string | null;
  avatarUrl?: string | null;
  isCurrentUser?: boolean;
  isRegisteredUser?: boolean;
  role?: string;
}

export interface CreateSplitExpenseInput {
  paidByMemberId: string;
  title: string;
  category?: string | null;
  amountCents: number;
  date: string;
  splitType: SplitType;
  notes?: string | null;
  shares: Array<{
    memberId: string;
    amountCents?: number;
    percentage?: number;
  }>;
}

export interface RecordSettlementInput {
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
  date?: string;
  notes?: string | null;
}
