import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Customers } from './components/Customers';
import { Farms } from './components/Farms';
import { Accounts } from './components/Accounts';
import { Sales } from './components/Sales';
import { Receivables } from './components/Receivables';
import { Vouchers } from './components/Vouchers';
import { Reports } from './components/Reports';
import { AppState, ViewName, Customer, Farm, Sale, Receivable, Voucher, Account } from './types';
import { loadState, saveState } from './services/storage';
import { Menu } from 'lucide-react';

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [activeView, setActiveView] = useState<ViewName>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // --- Actions ---

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const loaded = JSON.parse(ev.target?.result as string);
            // Sanitize and migrate structure
            if (Array.isArray(loaded.customers) && Array.isArray(loaded.farms)) {
                const newState: AppState = {
                    customers: loaded.customers || [],
                    farms: loaded.farms || [],
                    accounts: Array.isArray(loaded.accounts) && loaded.accounts.length > 0 
                        ? loaded.accounts 
                        : [
                            { id: 1, name: 'Cash in Hand', type: 'cash', initialBalance: 0 },
                            { id: 2, name: 'Bank Account', type: 'bank', initialBalance: 0 }
                          ],
                    sales: loaded.sales || [],
                    receivables: loaded.receivables || [],
                    vouchers: loaded.vouchers || [],
                };
                setState(newState);
                alert('Import successful');
            } else {
              alert('Invalid file format: Missing customers or farms data.');
            }
          } catch(err) {
            console.error(err);
            alert('Error parsing file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poultry-erp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to delete ALL data?')) {
      setState({ 
          customers: [], 
          farms: [], 
          accounts: [
            { id: 1, name: 'Cash in Hand', type: 'cash', initialBalance: 0 },
            { id: 2, name: 'Bank Account', type: 'bank', initialBalance: 0 }
          ], 
          sales: [], 
          receivables: [], 
          vouchers: [] 
        });
    }
  };

  // --- CRUD Handlers ---

  const addCustomer = (c: Omit<Customer, 'id'>) => {
    const id = (state.customers.length > 0 ? Math.max(...state.customers.map(x => x.id)) : 0) + 1;
    setState(prev => ({ ...prev, customers: [...prev.customers, { ...c, id }] }));
  };
  const updateCustomer = (c: Customer) => {
    setState(prev => ({ ...prev, customers: prev.customers.map(x => x.id === c.id ? c : x) }));
  };
  const deleteCustomer = (id: number) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id),
      sales: prev.sales.filter(s => s.customerId !== id),
      receivables: prev.receivables.filter(r => r.customerId !== id),
      vouchers: prev.vouchers.filter(v => !v.description.includes(`CUST-${id}`))
    }));
  };

  const addFarm = (f: Omit<Farm, 'id'>) => {
    const id = (state.farms.length > 0 ? Math.max(...state.farms.map(x => x.id)) : 0) + 1;
    setState(prev => ({ ...prev, farms: [...prev.farms, { ...f, id }] }));
  };
  const updateFarm = (f: Farm) => {
    setState(prev => ({ ...prev, farms: prev.farms.map(x => x.id === f.id ? f : x) }));
  };
  const deleteFarm = (id: number) => {
    setState(prev => ({
      ...prev,
      farms: prev.farms.filter(f => f.id !== id),
      sales: prev.sales.filter(s => s.farmId !== id),
    }));
  };

  const addAccount = (a: Omit<Account, 'id'>) => {
    const id = (state.accounts.length > 0 ? Math.max(...state.accounts.map(x => x.id)) : 0) + 1;
    setState(prev => ({ ...prev, accounts: [...prev.accounts, { ...a, id }] }));
  };
  const updateAccount = (a: Account) => {
    setState(prev => ({ ...prev, accounts: prev.accounts.map(x => x.id === a.id ? a : x) }));
  };
  const deleteAccount = (id: number) => {
    setState(prev => ({ ...prev, accounts: prev.accounts.filter(a => a.id !== id) }));
  };

  const addSale = (s: Omit<Sale, 'id'>) => {
    const id = (state.sales.length > 0 ? Math.max(...state.sales.map(x => x.id)) : 0) + 1;
    const sale = { ...s, id };
    
    // Create Voucher
    const customer = state.customers.find(c => c.id === sale.customerId);
    const farm = state.farms.find(f => f.id === sale.farmId);
    const voucherId = (state.vouchers.length > 0 ? Math.max(...state.vouchers.map(x => x.id)) : 0) + 1;
    
    const vehicleInfo = sale.vehicleNumber ? ` (${sale.vehicleNumber})` : '';
    const description = `Sale #${sale.id} - ${customer?.name}${vehicleInfo}`;

    const voucher: Voucher = {
      id: voucherId,
      date: sale.date,
      description: description,
      debitAccount: `Customer - ${customer?.name}`,
      creditAccount: `Sales - ${farm?.name}`,
      amount: sale.total,
      relatedId: sale.id,
      relatedType: 'sale'
    };

    setState(prev => ({
      ...prev,
      sales: [...prev.sales, sale],
      vouchers: [...prev.vouchers, voucher]
    }));
  };

  const updateSale = (s: Sale) => {
    const customer = state.customers.find(c => c.id === s.customerId);
    const farm = state.farms.find(f => f.id === s.farmId);
    const vehicleInfo = s.vehicleNumber ? ` (${s.vehicleNumber})` : '';
    const description = `Sale #${s.id} - ${customer?.name}${vehicleInfo}`;

    setState(prev => ({
      ...prev,
      sales: prev.sales.map(x => x.id === s.id ? s : x),
      vouchers: prev.vouchers.map(v => {
        if (v.relatedId === s.id && v.relatedType === 'sale') {
          return {
            ...v,
            date: s.date,
            description: description,
            debitAccount: `Customer - ${customer?.name}`,
            creditAccount: `Sales - ${farm?.name}`,
            amount: s.total
          };
        }
        return v;
      })
    }));
  };

  const deleteSale = (id: number) => {
    setState(prev => ({
      ...prev,
      sales: prev.sales.filter(s => s.id !== id),
      vouchers: prev.vouchers.filter(v => !(v.relatedId === id && v.relatedType === 'sale'))
    }));
  };

  const addReceivable = (r: Omit<Receivable, 'id'>) => {
    const id = (state.receivables.length > 0 ? Math.max(...state.receivables.map(x => x.id)) : 0) + 1;
    const item = { ...r, id };

    // Create Voucher
    const customer = state.customers.find(c => c.id === item.customerId);
    // Determine the debit account name (the receiving account)
    // Default to Cash in Hand if accounts is corrupted or empty
    const targetAccount = state.accounts?.find(a => a.id === item.accountId);
    const debitAccountName = targetAccount ? targetAccount.name : 'Cash in Hand';

    const voucherId = (state.vouchers.length > 0 ? Math.max(...state.vouchers.map(x => x.id)) : 0) + 1;

    const voucher: Voucher = {
      id: voucherId,
      date: item.date,
      description: `Receipt #${item.id} - ${customer?.name}`,
      debitAccount: debitAccountName,
      creditAccount: `Customer - ${customer?.name}`,
      amount: item.amount,
      relatedId: item.id,
      relatedType: 'receivable'
    };

    setState(prev => ({
      ...prev,
      receivables: [...prev.receivables, item],
      vouchers: [...prev.vouchers, voucher]
    }));
  };

  const updateReceivable = (r: Receivable) => {
     const customer = state.customers.find(c => c.id === r.customerId);
     const targetAccount = state.accounts?.find(a => a.id === r.accountId);
     const debitAccountName = targetAccount ? targetAccount.name : 'Cash in Hand';

     setState(prev => ({
      ...prev,
      receivables: prev.receivables.map(x => x.id === r.id ? r : x),
      vouchers: prev.vouchers.map(v => {
        if (v.relatedId === r.id && v.relatedType === 'receivable') {
          return {
             ...v,
             date: r.date,
             description: `Receipt #${r.id} - ${customer?.name}`,
             debitAccount: debitAccountName,
             creditAccount: `Customer - ${customer?.name}`,
             amount: r.amount
          };
        }
        return v;
      })
    }));
  };

  const deleteReceivable = (id: number) => {
    setState(prev => ({
      ...prev,
      receivables: prev.receivables.filter(r => r.id !== id),
      vouchers: prev.vouchers.filter(v => !(v.relatedId === id && v.relatedType === 'receivable'))
    }));
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onNavigate={setActiveView}
        onImport={handleImport}
        onExport={handleExport}
        onClear={handleClear}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
           <h1 className="font-bold text-gray-800 uppercase">AL REHMAN POULTRY FARMS</h1>
           <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 text-gray-600">
             <Menu />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && <Dashboard state={state} />}
            {activeView === 'customers' && <Customers customers={state.customers} state={state} onAdd={addCustomer} onUpdate={updateCustomer} onDelete={deleteCustomer} />}
            {activeView === 'farms' && <Farms farms={state.farms} state={state} onAdd={addFarm} onUpdate={updateFarm} onDelete={deleteFarm} />}
            {activeView === 'accounts' && <Accounts accounts={state.accounts || []} state={state} onAdd={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />}
            {activeView === 'sales' && <Sales sales={state.sales} state={state} onAdd={addSale} onUpdate={updateSale} onDelete={deleteSale} />}
            {activeView === 'receivables' && <Receivables receivables={state.receivables} state={state} onAdd={addReceivable} onUpdate={updateReceivable} onDelete={deleteReceivable} />}
            {activeView === 'vouchers' && <Vouchers state={state} />}
            {activeView === 'reports' && <Reports state={state} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;