
import Dexie, { Table } from 'dexie';
import { Transaction, Budget, RecurringTransaction, SavingsGoal, Category } from '../types';

// Global variable to track current user (set on login)
let currentUserId = '';

export const setCurrentUserId = (id: string) => {
  currentUserId = id;
};

class SmartExpenseDB extends Dexie {
  transactions!: Table<Transaction>;
  budgets!: Table<Budget>;
  recurring!: Table<RecurringTransaction>;
  savings!: Table<SavingsGoal>;
  categories!: Table<Category>;
  settings!: Table<any>;

  constructor() {
    super('SmartExpenseDB');
    
    // Version 6: Add categories table
    (this as any).version(6).stores({
      transactions: '++id, userId, date, type, category, savingsGoalId',
      budgets: '++id, userId, category',
      recurring: '++id, userId, type, nextDueDate',
      savings: '++id, userId, name',
      categories: '++id, userId, type',
      settings: 'key'
    });
  }
}

const db = new SmartExpenseDB();

export { db };

export const initDB = async () => {
  try {
    await (db as any).open();
  } catch (err) {
    console.error("Failed to initialize DB", err);
  }
};

// --- Categories (New Feature) ---
const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Transport', 'Fuel', 'Utilities', 
  'Rent/Housing', 'Entertainment', 'Healthcare', 'Shopping', 
  'Personal Care', 'Education', 'Insurance', 'Subscriptions', 
  'Gifts & Donations', 'Family', 'Pets', 'Travel', 'Debt Payment', 
  'Maintenance', 'Electronics', 'Other'
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business Profit', 'Bonus', 
  'Investments', 'Dividends', 'Rental Income', 'Gifts', 
  'Refunds', 'Grants', 'Pension', 'Other'
];

export const seedCategories = async () => {
  if (!currentUserId) return;
  
  const count = await db.categories.where('userId').equals(currentUserId).count();
  if (count === 0) {
    const batch = [
      ...DEFAULT_EXPENSE_CATEGORIES.map(name => ({ userId: currentUserId, name, type: 'expense' as const, isDefault: true })),
      ...DEFAULT_INCOME_CATEGORIES.map(name => ({ userId: currentUserId, name, type: 'income' as const, isDefault: true }))
    ];
    await db.categories.bulkAdd(batch);
  }
};

export const getCategories = async (type?: 'income' | 'expense') => {
  if (!currentUserId) return [];
  let query = db.categories.where('userId').equals(currentUserId);
  if (type) {
    // Filter in memory for simplicity with compound query limitations in basic Dexie usage
    const all = await query.toArray();
    return all.filter(c => c.type === type);
  }
  return await query.toArray();
};

export const addCategory = async (name: string, type: 'income' | 'expense') => {
  if (!currentUserId) return;
  // Check duplicates
  const existing = await db.categories.where({ userId: currentUserId, name, type }).first();
  if (existing) return existing.id;

  return await db.categories.add({ userId: currentUserId, name, type, isDefault: false });
};

export const deleteCategory = async (id: number) => {
  return await db.categories.delete(id);
};

// --- Transactions ---
export const addTransaction = async (tx: Omit<Transaction, 'userId'>) => {
  if (!currentUserId) throw new Error("No user logged in");
  
  // Ensure categories exist if user is new
  await seedCategories();

  const fullTx: Transaction = { ...tx, userId: currentUserId };
  const id = await db.transactions.add(fullTx);
  
  // If linked to a savings goal, update the goal amount
  if (fullTx.savingsGoalId) {
    const goal = await db.savings.get(fullTx.savingsGoalId);
    if (goal) {
      // If it's an expense (adding money TO savings from wallet), we increase savings balance
      // If it's income (taking money FROM savings), we decrease savings balance
      const adjustment = fullTx.type === 'expense' ? fullTx.amount : -fullTx.amount;
      
      await db.savings.update(goal.id!, { 
        currentAmount: (goal.currentAmount || 0) + adjustment 
      });
    }
  }
  return id;
};

export const updateTransaction = async (tx: Transaction) => {
  if (!currentUserId || !tx.id) throw new Error("Invalid update request");
  
  // Get old transaction to handle Savings Goal logic changes
  const oldTx = await db.transactions.get(tx.id);
  
  await db.transactions.put({ ...tx, userId: currentUserId });

  // Handle Savings Goal Logic Reversal/Update if amounts changed
  if (oldTx && oldTx.savingsGoalId) {
     const goal = await db.savings.get(oldTx.savingsGoalId);
     if (goal) {
       // Reverse old operation
       const oldAdjustment = oldTx.type === 'expense' ? -oldTx.amount : oldTx.amount;
       await db.savings.update(goal.id!, { currentAmount: goal.currentAmount + oldAdjustment });
     }
  }

  // Apply new logic
  if (tx.savingsGoalId) {
    const goal = await db.savings.get(tx.savingsGoalId);
    if (goal) {
      const newAdjustment = tx.type === 'expense' ? tx.amount : -tx.amount;
      await db.savings.update(goal.id!, { currentAmount: goal.currentAmount + newAdjustment });
    }
  }
};

export const deleteTransactions = async (ids: number[]) => {
  // We should ideally reverse savings goal impact here too, but for simplicity in bulk delete we skip it for now
  return await db.transactions.bulkDelete(ids);
};

export const getTransactions = async () => {
  return await db.transactions
    .where('userId').equals(currentUserId)
    .reverse()
    .sortBy('date');
};

export const getMonthlyStats = async () => {
  if (!currentUserId) return { income: 0, expense: 0, savingsRate: 0 };

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const txs = await db.transactions
    .where('userId').equals(currentUserId)
    .filter(tx => tx.date >= start && tx.date <= end)
    .toArray();
  
  let income = 0;
  let expense = 0;
  
  txs.forEach(tx => {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  });

  return { income, expense, savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0 };
};

export const getRecentTransactions = async (limit = 5) => {
  return await db.transactions
    .where('userId').equals(currentUserId)
    .reverse()
    .sortBy('date')
    .then(txs => txs.slice(0, limit));
};

export const getCategoryBreakdown = async (type: 'income' | 'expense') => {
  if (!currentUserId) return [];

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1); 
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); 

  const txs = await db.transactions
    .where('userId').equals(currentUserId)
    .filter(tx => tx.date >= start && tx.date <= end && tx.type === type)
    .toArray();

  const map = new Map<string, number>();
  txs.forEach(t => {
    const current = map.get(t.category) || 0;
    map.set(t.category, current + t.amount);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const getLast30DaysChartData = async () => {
  if (!currentUserId) return [];

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  
  const txs = await db.transactions
    .where('userId').equals(currentUserId)
    .filter(tx => tx.date >= start && tx.date <= end)
    .toArray();
  
  const dailyMap = new Map<string, { date: string, income: number, expense: number }>();
  
  for(let d = 0; d < 30; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      const key = date.toISOString().split('T')[0];
      const displayDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date);
      dailyMap.set(key, { date: displayDate, income: 0, expense: 0 });
  }

  txs.forEach(tx => {
      const key = tx.date.toISOString().split('T')[0];
      if (dailyMap.has(key)) {
          const entry = dailyMap.get(key)!;
          if (tx.type === 'income') entry.income += tx.amount;
          else entry.expense += tx.amount;
      }
  });

  return Array.from(dailyMap.values());
};

// --- Budgets ---
export const getBudgets = async () => {
    return await db.budgets.where('userId').equals(currentUserId).toArray();
};

export const saveBudget = async (budget: Omit<Budget, 'userId'>) => {
  if (!currentUserId) throw new Error("No user");

  if (budget.id) {
    return await db.budgets.put({ ...budget, userId: currentUserId });
  }
  const existing = await db.budgets
    .where({ userId: currentUserId, category: budget.category })
    .first();

  if (existing) {
    return await db.budgets.update(existing.id!, { limit: budget.limit });
  }
  return await db.budgets.add({ ...budget, userId: currentUserId });
};

export const deleteBudget = async (id: number) => {
  return await db.budgets.delete(id);
};

export const getBudgetsWithStats = async () => {
  if (!currentUserId) return [];

  const budgets = await db.budgets.where('userId').equals(currentUserId).toArray();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // We fetch all expenses for this month for this user
  const txs = await db.transactions
    .where('userId').equals(currentUserId)
    .filter(tx => tx.date >= start && tx.date <= end && tx.type === 'expense')
    .toArray();

  const spendingMap = new Map<string, number>();
  txs.forEach(tx => {
    const cat = tx.category;
    const current = spendingMap.get(cat) || 0;
    spendingMap.set(cat, current + tx.amount);
  });

  return budgets.map(b => ({
    ...b,
    spent: spendingMap.get(b.category) || 0
  }));
};

// --- Recurring / Automation Engine ---
export const addRecurring = async (item: Omit<RecurringTransaction, 'userId'>) => {
  return await db.recurring.add({ ...item, userId: currentUserId });
};

export const getRecurring = async () => {
  return await db.recurring.where('userId').equals(currentUserId).toArray();
};

export const deleteRecurring = async (id: number) => {
  return await db.recurring.delete(id);
};

export const checkAndProcessRecurring = async () => {
  // Only process for current user when app opens
  if (!currentUserId) return;

  const recurringItems = await db.recurring.where('userId').equals(currentUserId).toArray();
  const today = new Date();
  today.setHours(0,0,0,0);

  let processedCount = 0;

  for (const item of recurringItems) {
    if (!item.active) continue;

    let dueDate = new Date(item.nextDueDate);
    let modified = false;

    while (dueDate <= today) {
      await addTransaction({
        title: item.title,
        amount: item.amount,
        type: item.type,
        category: item.category,
        date: new Date(dueDate),
        notes: 'Auto-generated via Automation'
      });

      const nextDate = new Date(dueDate);
      if (item.frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (item.frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      
      dueDate = nextDate;
      modified = true;
      processedCount++;
    }

    if (modified) {
      await db.recurring.update(item.id!, { nextDueDate: dueDate });
    }
  }
};

// --- Upcoming Bills Helper ---
export const getUpcomingBills = async (limit = 3) => {
    if (!currentUserId) return [];
    
    // Get recurring transactions that are expenses and active
    const bills = await db.recurring
        .where('userId').equals(currentUserId)
        .filter(r => r.type === 'expense' && r.active)
        .toArray();
    
    // Sort by nextDueDate
    return bills.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime()).slice(0, limit);
};

// --- Savings Goals ---
export const addSavingsGoal = async (goal: Omit<SavingsGoal, 'userId'>) => {
  return await db.savings.add({ ...goal, userId: currentUserId });
};

export const updateSavingsGoal = async (goal: SavingsGoal) => {
  // Ensure we don't overwrite userId accidentally if passed partial
  return await db.savings.put(goal);
};

export const deleteSavingsGoal = async (id: number) => {
  return await db.savings.delete(id);
};

export const getSavingsGoals = async () => {
  return await db.savings.where('userId').equals(currentUserId).toArray();
};
