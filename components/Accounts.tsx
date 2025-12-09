
import React, { useState } from 'react';
import { Account, AppState } from '../types';
import { Plus, Edit2, Trash2, Wallet, Building } from 'lucide-react';
import { Modal } from './Modal';

interface AccountsProps {
  accounts: Account[];
  state: AppState;
  onAdd: (a: Omit<Account, 'id'>) => void;
  onUpdate: (a: Account) => void;
  onDelete: (id: number) => void;
}

export const Accounts: React.FC<AccountsProps> = ({ accounts, state, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Account | null>(null);
  
  const initialForm = { name: '', type: 'cash', initialBalance: '0' };
  const [formData, setFormData] = useState(initialForm);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: Account) => {
    setEditingItem(a);
    setFormData({ 
      name: a.name, 
      type: a.type, 
      initialBalance: a.initialBalance.toString() 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      type: formData.type as 'cash' | 'bank' | 'other',
      initialBalance: parseFloat(formData.initialBalance) || 0
    };
    
    if (editingItem) {
      onUpdate({ ...editingItem, ...payload });
    } else {
      onAdd(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this account?')) {
      onDelete(id);
    }
  };

  const getBalance = (accountId: number) => {
      const account = accounts.find(a => a.id === accountId);
      if(!account) return 0;
      
      const receipts = state.receivables
        .filter(r => r.accountId === accountId)
        .reduce((sum, r) => sum + r.amount, 0);
        
      return account.initialBalance + receipts;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Financial Accounts</h2>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
           const balance = getBalance(acc.id);
           const isBank = acc.type === 'bank';
           
           return (
             <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative group">
               <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEdit(acc)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(acc.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
               </div>
               
               <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded-full ${isBank ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                      {isBank ? <Building size={24} /> : <Wallet size={24} />}
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-gray-800">{acc.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{acc.type}</p>
                  </div>
               </div>
               
               <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Initial Balance:</span>
                   <span className="font-medium">${acc.initialBalance.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-2">
                   <span className="text-gray-600 font-medium">Current Balance</span>
                   <span className="text-2xl font-bold text-gray-900">${balance.toLocaleString()}</span>
                 </div>
               </div>
             </div>
           );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Account" : "Add Account"}>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Name</label>
            <input 
              required
              placeholder="e.g. Meezan Bank, Cash Box"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Type</label>
            <select 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Initial Balance</label>
            <input 
              required
              type="number"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.initialBalance}
              onChange={e => setFormData({...formData, initialBalance: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors mt-2 shadow-sm">
            {editingItem ? 'Update Account' : 'Save Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
