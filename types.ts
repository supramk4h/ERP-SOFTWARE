
export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export interface Farm {
  id: number;
  name: string;
  initialStock: number;
}

export interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'other';
  initialBalance: number;
}

export interface Sale {
  id: number;
  date: string;
  customerId: number;
  farmId: number;
  vehicleNumber?: string;
  crates?: number;
  chickens: number;
  weight: number;
  rate: number;
  total: number;
}

export interface Receivable {
  id: number;
  date: string;
  customerId: number;
  accountId?: number; // Link to Account
  amount: number;
}

export interface Voucher {
  id: number;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  relatedId?: number;
  relatedType?: 'sale' | 'receivable';
}

export interface AppState {
  customers: Customer[];
  farms: Farm[];
  accounts: Account[];
  sales: Sale[];
  receivables: Receivable[];
  vouchers: Voucher[];
}

export type ViewName = 'dashboard' | 'customers' | 'farms' | 'accounts' | 'sales' | 'receivables' | 'vouchers' | 'reports';
