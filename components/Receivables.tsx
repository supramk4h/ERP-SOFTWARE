import React, { useState } from 'react';
import { Receivable, AppState } from '../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

interface ReceivablesProps {
  receivables: Receivable[];
  state: AppState;
  onAdd: (r: Omit<Receivable, 'id'>) => void;
  onUpdate: (r: Receivable) => void;
  onDelete: (id: number) => void;
}

export const Receivables: React.FC<ReceivablesProps> = ({ receivables, state, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Receivable | null>(null);
  
  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    amount: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: Receivable) => {
    setEditingItem(r);
    setFormData({
      date: r.date,
      customerId: r.customerId.toString(),
      amount: r.amount.toString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date: formData.date,
      customerId: parseInt(formData.customerId),
      amount: parseFloat(formData.amount)
    };

    if (editingItem) {
      onUpdate({ ...editingItem, ...payload });
    } else {
      onAdd(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Payment Receipts</h2>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Receipt</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {receivables.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(rec => {
                const customerName = state.customers.find(c => c.id === rec.customerId)?.name || 'Unknown';
                
                return (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm">{rec.date}</td>
                    <td className="p-4 font-medium">{customerName}</td>
                    <td className="p-4 text-right font-bold text-green-600">${rec.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="p-4 flex justify-center space-x-2">
                       <button onClick={() => handleOpenEdit(rec)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit2 size={16} /></button>
                       <button onClick={() => onDelete(rec.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {receivables.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No receipts recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Receipt" : "Record Receipt"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="date" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <select required className="w-full p-2 border border-gray-300 rounded-lg" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
            <option value="">Select Customer</option>
            {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input required type="number" step="0.01" placeholder="Amount Received" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700">{editingItem ? 'Update' : 'Save'}</button>
        </form>
      </Modal>
    </div>
  );
};
