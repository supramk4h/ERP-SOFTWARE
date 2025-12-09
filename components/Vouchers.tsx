import React, { useState } from 'react';
import { Voucher, AppState, Sale } from '../types';
import { Modal } from './Modal';
import { Printer, FileText, User, MapPin, Phone, Truck, Warehouse, ArrowRightLeft, Search } from 'lucide-react';

interface VouchersProps {
  state: AppState;
}

export const Vouchers: React.FC<VouchersProps> = ({ state }) => {
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const getVoucherDetails = (voucher: Voucher) => {
    if (!voucher) return { type: 'manual', data: null };
    
    // Safe navigation for arrays in case of corrupted state
    const sales = state.sales || [];
    const farms = state.farms || [];
    const customers = state.customers || [];
    const receivables = state.receivables || [];

    if (voucher.relatedType === 'sale' && voucher.relatedId) {
        const sale = sales.find(s => s.id === voucher.relatedId);
        const farm = sale ? farms.find(f => f.id === sale.farmId) : null;
        const customer = sale ? customers.find(c => c.id === sale.customerId) : null;
        return { type: 'sale', data: sale, farm, customer };
    } else if (voucher.relatedType === 'receivable' && voucher.relatedId) {
        const receipt = receivables.find(r => r.id === voucher.relatedId);
        const customer = receipt ? customers.find(c => c.id === receipt.customerId) : null;
        return { type: 'receivable', data: receipt, customer };
    }
    return { type: 'manual', data: null };
  };

  const details = selectedVoucher ? getVoucherDetails(selectedVoucher) : null;

  // Filter vouchers based on search term
  const filteredVouchers = (state.vouchers || []).filter(v => {
    const term = searchTerm.toLowerCase();
    return (
      v.id.toString().includes(term) ||
      v.description.toLowerCase().includes(term) ||
      v.debitAccount.toLowerCase().includes(term) ||
      v.creditAccount.toLowerCase().includes(term)
    );
  }).sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Accounting Vouchers</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID, Description or Account..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Debit Account</th>
                <th className="p-4">Credit Account</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVouchers.map(v => (
                <tr 
                  key={v.id} 
                  className="hover:bg-blue-50 cursor-pointer transition-colors group"
                  onClick={() => setSelectedVoucher(v)}
                >
                  <td className="p-4 text-gray-500 font-mono">#{v.id}</td>
                  <td className="p-4 text-sm">{v.date}</td>
                  <td className="p-4 font-medium text-gray-800">{v.description}</td>
                  <td className="p-4 text-sm text-gray-600">{v.debitAccount}</td>
                  <td className="p-4 text-sm text-gray-600">{v.creditAccount}</td>
                  <td className="p-4 text-right font-bold text-gray-800">${v.amount.toLocaleString()}</td>
                  <td className="p-4 text-center text-gray-400 group-hover:text-blue-500">
                    <FileText size={18} className="mx-auto" />
                  </td>
                </tr>
              ))}
              {filteredVouchers.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">No vouchers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voucher Detail Modal */}
      <Modal 
        isOpen={!!selectedVoucher} 
        onClose={() => setSelectedVoucher(null)} 
        title="Voucher Details"
        maxWidth="max-w-4xl" 
      >
        {selectedVoucher && (
          <div className="flex flex-col items-center bg-gray-200 p-2 sm:p-6 print:p-0 print:bg-white print:block">
            {/* SCROLL WRAPPER for Small Screens */}
            <div className="w-full overflow-x-auto print:overflow-visible flex justify-center">
                {/* INVOICE CONTAINER - Adaptive Height & Responsive Padding */}
                <div className="bg-white w-full max-w-[210mm] shadow-xl p-4 sm:p-8 print:shadow-none print:w-full print:max-w-none print:p-0 text-gray-800 flex flex-col mx-auto rounded-sm">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-800 pb-6 mb-6 gap-4">
                    <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-wider uppercase">
                        {details?.type === 'sale' ? 'Sales Voucher' : details?.type === 'receivable' ? 'Receipt Voucher' : 'Journal Voucher'}
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium text-sm">Original Copy</p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                    <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight">AL REHMAN POULTRY FARMS</h2>
                    <div className="mt-4 text-sm bg-gray-50 p-2 rounded border border-gray-100 print:bg-transparent print:border-none">
                        <div className="flex justify-between gap-6">
                            <span className="text-gray-500">Voucher No:</span>
                            <span className="font-mono font-bold text-gray-900">#{selectedVoucher.id}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span className="text-gray-500">Date:</span>
                            <span className="font-semibold text-gray-900">{selectedVoucher.date}</span>
                        </div>
                    </div>
                    </div>
                </div>

                {/* --- ACCOUNTING ENTRY (Visual Double Entry) --- */}
                <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100 print:bg-transparent print:border-gray-300">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowRightLeft size={16} className="text-blue-500 print:text-black" />
                        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest print:text-black">Journal Entry</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex justify-between items-center sm:border-r border-blue-200 sm:pr-4 print:border-gray-300 border-b sm:border-b-0 pb-2 sm:pb-0">
                            <div>
                                <span className="text-xs text-blue-500 uppercase block print:text-gray-600">Debit (Dr)</span>
                                <span className="font-bold text-gray-800 text-sm sm:text-base">{selectedVoucher.debitAccount}</span>
                            </div>
                            <span className="font-mono font-bold text-gray-900 text-sm sm:text-base">${selectedVoucher.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center sm:pl-2">
                            <div>
                                <span className="text-xs text-blue-500 uppercase block print:text-gray-600">Credit (Cr)</span>
                                <span className="font-bold text-gray-800 text-sm sm:text-base">{selectedVoucher.creditAccount}</span>
                            </div>
                            <span className="font-mono font-bold text-gray-900 text-sm sm:text-base">${selectedVoucher.amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* --- CUSTOMER / SALE SPECIFICS --- */}
                {details?.type === 'sale' && details.data ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div className="border border-gray-200 rounded p-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                <User size={14} /> Customer Details
                            </h3>
                            <div className="font-bold text-lg text-gray-900">{details.customer?.name}</div>
                            <div className="text-sm text-gray-600 mt-1 flex items-start gap-2">
                                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                {details.customer?.address || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                <Phone size={14} />
                                {details.customer?.phone || 'N/A'}
                            </div>
                        </div>
                        <div className="border border-gray-200 rounded p-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                <Truck size={14} /> Logistics Information
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b border-gray-100 pb-1">
                                    <span className="text-gray-500">Vehicle Number</span>
                                    <span className="font-mono font-bold">{(details.data as Sale).vehicleNumber || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-1">
                                    <span className="text-gray-500">Source Farm</span>
                                    <span className="font-medium flex items-center gap-1"><Warehouse size={12}/> {details.farm?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Transaction ID</span>
                                    <span className="font-mono">SALE-{(details.data as Sale).id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* --- DETAILED TABLE --- */}
                <div className="mb-6">
                    {details?.type === 'sale' && details.data ? (
                        <div className="overflow-hidden rounded border border-gray-200">
                        <table className="w-full text-xs sm:text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-800 text-white print:bg-gray-200 print:text-black border-b border-gray-800">
                                    <th className="py-2 px-2 sm:px-4 text-left font-semibold">Description</th>
                                    <th className="py-2 px-2 sm:px-4 text-center font-semibold">Crates</th>
                                    <th className="py-2 px-2 sm:px-4 text-center font-semibold">Birds</th>
                                    <th className="py-2 px-2 sm:px-4 text-center font-semibold">Weight</th>
                                    <th className="py-2 px-2 sm:px-4 text-right font-semibold">Rate</th>
                                    <th className="py-2 px-2 sm:px-4 text-right font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                <tr>
                                    <td className="py-3 px-2 sm:px-4 font-medium">Broiler Chicken</td>
                                    <td className="py-3 px-2 sm:px-4 text-center font-mono">
                                        {(details.data as Sale).crates ? (details.data as Sale).crates : '-'}
                                    </td>
                                    <td className="py-3 px-2 sm:px-4 text-center font-mono">
                                        {(details.data as Sale).chickens.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-2 sm:px-4 text-center font-mono">
                                        {(details.data as Sale).weight.toFixed(2)} kg
                                    </td>
                                    <td className="py-3 px-2 sm:px-4 text-right font-mono">
                                        ${(details.data as Sale).rate.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-2 sm:px-4 text-right font-bold text-gray-900">
                                        ${selectedVoucher.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 print:bg-gray-100 border-t border-gray-200">
                                    <td colSpan={4} className="hidden sm:table-cell"></td>
                                    <td className="py-3 px-4 text-right font-bold text-gray-700 uppercase text-xs whitespace-nowrap sm:border-t-0 border-t border-gray-200" colSpan={4}>
                                        <div className="flex justify-between sm:block">
                                            <span className="sm:hidden">Net Total:</span>
                                            <span>Net Total</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right font-extrabold text-xl text-gray-900 sm:border-t-0 border-t border-gray-200">
                                        ${selectedVoucher.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded p-6 bg-gray-50 print:bg-white print:border-gray-300">
                            <p className="text-gray-600 mb-2 text-sm uppercase font-bold">Narration / Description</p>
                            <p className="text-lg text-gray-800">{selectedVoucher.description}</p>
                        </div>
                    )}
                </div>

                {/* --- FOOTER --- */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-8 sm:gap-24">
                        <div className="text-center">
                        <div className="h-16 border-b border-gray-400 mb-2"></div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Authorized Signature</p>
                        </div>
                        <div className="text-center">
                        <div className="h-16 border-b border-gray-400 mb-2"></div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Receiver's Signature</p>
                        </div>
                    </div>
                    
                    <div className="mt-6 text-center text-[10px] text-gray-400 uppercase tracking-widest print:text-gray-500">
                        System Generated Document | AL REHMAN POULTRY FARMS
                    </div>
                </div>

                </div>
            </div>

            {/* Print Action Floating Button */}
            {selectedVoucher && (
                <div className="mt-4 flex justify-end print:hidden w-full max-w-[210mm] mx-auto px-2 sm:px-0">
                    <button 
                    onClick={handlePrint}
                    className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                    >
                    <Printer size={20} />
                    <span>Print Voucher</span>
                    </button>
                </div>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                @page { size: auto; margin: 0mm; }
                body > *:not(#root) { display: none !important; }
                #root > *:not([class*="fixed"]) { display: none !important; }
                nav, aside, header, .print\\:hidden { display: none !important; }
                
                .fixed.inset-0 { 
                    position: relative !important; 
                    background: white !important;
                    padding: 0 !important;
                    display: block !important;
                    overflow: visible !important;
                }

                /* Reset Modal Container */
                .fixed > div {
                    box-shadow: none !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    max-height: none !important; /* Allow print to flow */
                    height: auto !important;
                }
                
                /* Ensure Colors Print */
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
          </div>
        )}
      </Modal>
    </div>
  );
};