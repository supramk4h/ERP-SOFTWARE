import { AppState } from '../types';

const STORAGE_KEY = 'poultry_erp_state_v2';

const emptyState: AppState = {
  customers: [],
  farms: [],
  accounts: [
    { id: 1, name: 'Cash in Hand', type: 'cash', initialBalance: 0 },
    { id: 2, name: 'Bank Account', type: 'bank', initialBalance: 0 }
  ],
  sales: [],
  receivables: [],
  vouchers: [],
};

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return emptyState;
    
    const loaded = JSON.parse(serialized);
    
    // Robust migration: Ensure all arrays exist to prevent "undefined.map" errors
    return {
        customers: Array.isArray(loaded.customers) ? loaded.customers : [],
        farms: Array.isArray(loaded.farms) ? loaded.farms : [],
        // If accounts is missing (legacy data), use default accounts
        accounts: (Array.isArray(loaded.accounts) && loaded.accounts.length > 0) ? loaded.accounts : emptyState.accounts,
        sales: Array.isArray(loaded.sales) ? loaded.sales : [],
        receivables: Array.isArray(loaded.receivables) ? loaded.receivables : [],
        vouchers: Array.isArray(loaded.vouchers) ? loaded.vouchers : [],
    };
  } catch (e) {
    console.error("Failed to load state", e);
    return emptyState;
  }
};

export const saveState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};