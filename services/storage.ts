import { AppState } from '../types';

const STORAGE_KEY = 'poultry_erp_state_v1';

const emptyState: AppState = {
  customers: [],
  farms: [],
  sales: [],
  receivables: [],
  vouchers: [],
};

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return emptyState;
    return JSON.parse(serialized);
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
