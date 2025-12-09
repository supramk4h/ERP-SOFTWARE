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

export interface Sale {
  id: number;
  date: string;
  customerId: number;
  farmId: number;
  vehicleNumber?: string; // New field
  crates?: number;        // New field
  chickens: number;
  weight: number;
  rate: number;
  total: number;
}

export interface Receivable {
  id: number;
  date: string;
  customerId: number;
  amount: number;
}

export interface Voucher {
  id: number;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  relatedId?: number; // Store ID of Sale or Receivable
  relatedType?: 'sale' | 'receivable';
}

export interface AppState {
  customers: Customer[];
  farms: Farm[];
  sales: Sale[];
  receivables: Receivable[];
  vouchers: Voucher[];
}

export type ViewName = 'dashboard' | 'customers' | 'farms' | 'sales' | 'receivables' | 'vouchers' | 'reports';