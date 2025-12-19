
export interface Transaction {
  id?: number;
  userId: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  notes?: string;
  savingsGoalId?: number;
  attachment?: string;
}

export interface Budget {
  id?: number;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly';
}

export interface RecurringTransaction {
  id?: number;
  userId: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'monthly' | 'weekly';
  nextDueDate: Date;
  active: boolean;
}

export interface SavingsGoal {
  id?: number;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  color: string;
  icon?: string;
}

export interface Category {
  id?: number;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  isDefault?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  currency: string;
  avatarUrl: string;
}

export type TabItem = {
  id: string;
  label: string;
  icon: any;
  path: string;
};

export interface ChartDataPoint {
  name: string;
  income: number;
  expense: number;
}
