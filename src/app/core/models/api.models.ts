export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PagedResponse<T> {
  content: T[];
  page: PageMetadata;
}

export interface MessageResponse {
  mensaje: string;
  data?: any;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  tokenType: string;
  expiresAt: string;
  username: string;
}

export interface CreateUser {
  username: string;
  name: string;
  email: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

export interface UpdateUser {
  username?: string;
  name?: string;
  email?: string;
  password?: string;
}

export interface UserResponse {
  id: number;
  username: string;
  name: string;
  email: string;
  creationDate: string;
  enable: boolean;
  isPremium?: boolean; // New field
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icons: string;
}

export interface CreateIncome {
  description: string;
  amount: number;
  date: string; // yyyy-MM-dd
  currency: string;
  fixedSalary?: boolean;
}

export interface UpdateIncome extends CreateIncome {}

export interface IncomeResponse {
  id: number;
  description: string;
  amount: number;
  date: string;
  currency: string;
  fixedSalary: boolean;
}

export interface CreateExpense {
  description: string;
  amount: number;
  date: string; // yyyy-MM-dd
  categoryId: number;
  currency: string;
}

export interface UpdateExpense extends CreateExpense {}

export interface ExpenseResponse {
  id: number;
  description: string;
  amount: number;
  date: string;
  currency: string;
  category: Category;
}

export interface BankOption {
  code: string;
  displayName: string;
  email: string;
}

export interface UpdateUserDto {
  username?: string;
  name?: string;
  email?: string;
  password?: string;
}

// Stats models
export interface PremiumStatusDto {
  isPremium: boolean;
  message: string;
}

// Saving Goals
export interface SavingGoalsResponse {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // date
  enable: boolean;
  achieved: boolean;
  createdAt: string; // date-time
  updatedAt: string; // date-time
}

export interface CreateSavingGoalsDto {
  name: string;
  targetAmount: number;
  targetDate: string; // date
}

export interface AddContributionDto {
  amount: number;
  description?: string;
}

export interface UpdateSavingGoals {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  enable?: boolean;
}

export interface PagedModelSavingGoalsResponse {
  content: SavingGoalsResponse[];
  page: PageMetadata;
}

export interface MonthlyStats {
  [categoryName: string]: number;
}

export interface ContributionResponse {
  id: number;
  amount: number;
  description?: string;
  createdAt: string; // date-time
}

// Budgets
export type BudgetPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Budget {
  id: number;
  limit: number;
  spent: number;
  percentage: number;
  period: BudgetPeriod;
  categoryId: number;
  category?: Category;
  startDate: string;
  endDate: string;
  month?: number /** 1-12 */;
  year?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export interface CreateBudgetDto {
  limit: number;
  period: BudgetPeriod;
  categoryId: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  isRecurring?: boolean;
  numberOfPeriods?: number;
}

export interface UpdateBudgetDto {
  limit?: number;
  period?: BudgetPeriod;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export interface PagedModelBudgetResponse {
  content: Budget[];
  page: PageMetadata;
}
