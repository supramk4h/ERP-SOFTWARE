
import React, { useState } from 'react';
import { Sale, AppState } from '../types';
import { Plus, Edit2, Trash2, Truck } from 'lucide-react';
import { Modal } from './Modal';

interface SalesProps {
  sales: Sale[];
  state: AppState;
  onAdd: (s: Omit<Sale, 'id'>) => void;
  onUpdate: (s: Sale) => void;
  onDelete: (id: number) => void;
}

export const Sales: React.FC<SalesProps> = ({ sales, state, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  
  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    farmId: '',
    vehicleNumber: '',
    crates: '',
    chickens: '',
    weight: '',
    rate: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const handleOpenAdd = () => {
    setEditingSale(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Sale) => {
    setEditingSale(s);
    setFormData({
      date: s.date,
      customerId: s.customerId.toString(),
      farmId: s.farmId.toString(),
      vehicleNumber: s.vehicleNumber || '',
      crates: s.crates ? s.crates.toString() : '',
      chickens: s.chickens.toString(),
      weight: s.weight.toString(),
      rate: s.rate.toString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(formData.weight);
    const rate = parseFloat(formData.rate);
    const payload = {
      date: formData.date,
      customerId: parseInt(formData.customerId),
      farmId: parseInt(formData.farmId),
      vehicleNumber: formData.vehicleNumber,
      crates: formData.crates ? parseInt(formData.crates) : 0,
      chickens: parseInt(formData.chickens),
      weight,
      rate,
      total: weight * rate
    };

    if (editingSale) {
      onUpdate({ ...editingSale, ...payload });
    } else {
      onAdd(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Sales Transactions</h2>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Sale</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Farm</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4 text-right">Qty / Crates</th>
                <th className="p-4 text-right">Weight</th>
                <th className="p-4 text-right">Rate</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => {
                const customerName = state.customers?.find(c => c.id === sale.customerId)?.name || 'Unknown';
                const farmName = state.farms?.find(f => f.id === sale.farmId)?.name || 'Unknown';
                
                return (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm whitespace-nowrap">{sale.date}</td>
                    <td className="p-4 font-medium">{customerName}</td>
                    <td className="p-4 text-sm text-gray-600">{farmName}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {sale.vehicleNumber ? (
                        <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                          <Truck size={12} /> {sale.vehicleNumber}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-right font-mono">
                      <div>{sale.chickens.toLocaleString()}</div>
                      {sale.crates ? <div className="text-xs text-gray-400">({sale.crates} crates)</div> : null}
                    </td>
                    <td className="p-4 text-right font-mono">{sale.weight} kg</td>
                    <td className="p-4 text-right font-mono">${sale.rate}</td>
                    <td className="p-4 text-right font-bold text-gray-800">${sale.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="p-4 flex justify-center space-x-2">
                       <button onClick={() => handleOpenEdit(sale)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit2 size={16} /></button>
                       <button onClick={() => onDelete(sale.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {sales.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-gray-400">No sales recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSale ? "Edit Sale" : "Record Sale"}>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input required type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle No. <span className="text-gray-400 font-normal">(Optional)</span></label>
              <input type="text" placeholder="e.g. ABC-123" className="w-full px-4 py-3 border border-gray-300 rounded-lg uppercase focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer</label>
            <select required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
              <option value="">Select Customer</option>
              {state.customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1.5">Source Farm</label>
             <select required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={formData.farmId} onChange={e => setFormData({...formData, farmId: e.target.value})}>
              <option value="">Select Farm</option>
              {state.farms?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1.5">Crates</label>
               <input type="number" placeholder="0" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.crates} onChange={e => setFormData({...formData, crates: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1.5">Chickens</label>
               <input required type="number" placeholder="Qty" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.chickens} onChange={e => setFormData({...formData, chickens: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Weight</label>
               <input required type="number" step="0.01" placeholder="Kg" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rate per Kg</label>
            <input required type="number" step="0.01" placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200 mt-2">
             <span className="text-sm text-gray-600 font-medium">Total Amount:</span>
             <span className="text-2xl font-bold text-gray-900">
               ${(parseFloat(formData.weight || '0') * parseFloat(formData.rate || '0')).toLocaleString(undefined, {minimumFractionDigits: 2})}
             </span>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm mt-2">
            {editingSale ? 'Update Sale' : 'Save Sale'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
