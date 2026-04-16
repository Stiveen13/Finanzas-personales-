export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  uid: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: any; // Firestore Timestamp
  description: string;
  createdAt: any;
}

export interface SavingsGoal {
  id: string;
  uid: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: any;
  createdAt: any;
}

export interface MonthlyBudget {
  id: string;
  uid: string;
  year: number;
  month: number;
  limit: number;
  createdAt: any;
}

export interface UserSettings {
  uid: string;
  email: string;
  displayName: string;
  currency: string;
  createdAt: any;
}
