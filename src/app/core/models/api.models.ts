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
export interface MonthlyStats {
  [categoryName: string]: number;
}
