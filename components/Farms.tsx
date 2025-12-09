
import React, { useState } from 'react';
import { Farm, AppState } from '../types';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Modal } from './Modal';

interface FarmsProps {
  farms: Farm[];
  state: AppState;
  onAdd: (f: Omit<Farm, 'id'>) => void;
  onUpdate: (f: Farm) => void;
  onDelete: (id: number) => void;
}

export const Farms: React.FC<FarmsProps> = ({ farms, state, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [formData, setFormData] = useState({ name: '', initialStock: '' });

  const handleOpenAdd = () => {
    setEditingFarm(null);
    setFormData({ name: '', initialStock: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Farm) => {
    setEditingFarm(f);
    setFormData({ name: f.name, initialStock: f.initialStock.toString() });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      initialStock: parseInt(formData.initialStock) || 0
    };
    
    if (editingFarm) {
      onUpdate({ ...editingFarm, ...payload });
    } else {
      onAdd(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete farm? This will cascadingly delete related sales and vouchers.')) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Farm Management</h2>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Farm</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map(farm => {
           const sold = state.sales.filter(s => s.farmId === farm.id).reduce((sum, s) => sum + s.chickens, 0);
           const left = farm.initialStock - sold;
           const percentage = farm.initialStock > 0 ? (left / farm.initialStock) * 100 : 0;
           
           return (
             <div key={farm.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative group overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2 bg-white/90 backdrop-blur-sm rounded-bl-xl border-b border-l border-gray-100">
                  <button onClick={() => handleOpenEdit(farm)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(farm.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={16} /></button>
               </div>
               
               <h3 className="text-xl font-bold text-gray-800 mb-1">{farm.name}</h3>
               <p className="text-sm text-gray-500 mb-4">ID: #{farm.id}</p>
               
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Initial Stock:</span>
                   <span className="font-medium">{farm.initialStock.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Total Sold:</span>
                   <span className="font-medium text-blue-600">{sold.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-sm border-t pt-2">
                   <span className="text-gray-800 font-semibold">Remaining:</span>
                   <span className={`font-bold ${left < 100 ? 'text-red-500' : 'text-green-600'}`}>
                     {left.toLocaleString()}
                   </span>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
                    <div 
                      className={`h-2.5 rounded-full ${percentage < 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                      style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                    ></div>
                 </div>
               </div>
             </div>
           );
        })}
        {farms.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
            No farms added yet.
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFarm ? "Edit Farm" : "Add Farm"}>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Farm Name</label>
            <input 
              required
              placeholder="e.g. Shed #1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Initial Stock</label>
            <input 
              required
              type="number"
              min="0"
              placeholder="e.g. 5000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.initialStock}
              onChange={e => setFormData({...formData, initialStock: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors mt-2">
            {editingFarm ? 'Update Farm' : 'Save Farm'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
