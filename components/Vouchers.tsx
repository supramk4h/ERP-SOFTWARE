import React, { useState } from 'react';
import { Voucher, AppState, Sale, Receivable } from '../types';
import { Modal } from './Modal';
import { Printer, FileText, User, MapPin, Phone, Truck, Warehouse, ArrowRightLeft } from 'lucide-react';

interface VouchersProps {
  state: AppState;
}

export const Vouchers: React.FC<VouchersProps> = ({ state }) => {
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const getVoucherDetails = (voucher: Voucher) => {
    if (voucher.relatedType === 'sale' && voucher.relatedId) {
        const sale = state.sales.find(s => s.id === voucher.relatedId);
        const farm = sale ? state.farms.find(f => f.id === sale.farmId) : null;
        const customer = sale ? state.customers.find(c => c.id === sale.customerId) : null;
        return { type: 'sale', data: sale, farm, customer };
    } else if (voucher.relatedType === 'receivable' && voucher.relatedId) {
        const receipt = state.receivables.find(r => r.id === voucher.relatedId);
        const customer = receipt ? state.customers.find(c => c.id === receipt.customerId) : null;
        return { type: 'receivable', data: receipt, customer };
    }
    return { type: 'manual', data: null };
  };

  const details = selectedVoucher ? getVoucherDetails(selectedVoucher) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Accounting Vouchers</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
              {state.vouchers.slice().sort((a,b) => b.id - a.id).map(v => (
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
              {state.vouchers.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">No vouchers generated yet.</td></tr>
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
        maxWidth="max-w-5xl" 
      >
        {selectedVoucher && (
          <div className="flex justify-center bg-gray-100 p-4 rounded-lg print:p-0 print:bg-white print:block">
            {/* INVOICE CONTAINER - Fixed Width A4-ish */}
            <div className="bg-white w-[210mm] min-h-[297mm] shadow-xl p-8 md:p-12 print:shadow-none print:w-full print:min-h-0 print:p-0 text-gray-800 flex flex-col mx-auto">
              
              {/* --- HEADER --- */}
              <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-wider uppercase">
                    {details?.type === 'sale' ? 'Sales Voucher' : details?.type === 'receivable' ? 'Receipt Voucher' : 'Journal Voucher'}
                  </h1>
                  <p className="text-gray-500 mt-1 font-medium text-sm">Original Copy</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-800">Poultry ERP</h2>
                  <p className="text-sm text-gray-500">Farm Management System</p>
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
              <div className="mb-8 bg-blue-50 p-4 rounded border border-blue-100 print:bg-transparent print:border-gray-300">
                <div className="flex items-center gap-2 mb-2">
                    <ArrowRightLeft size={16} className="text-blue-500 print:text-black" />
                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest print:text-black">Journal Entry</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center border-r border-blue-200 pr-4 print:border-gray-300">
                        <div>
                            <span className="text-xs text-blue-500 uppercase block print:text-gray-600">Debit (Dr)</span>
                            <span className="font-bold text-gray-800">{selectedVoucher.debitAccount}</span>
                        </div>
                        <span className="font-mono font-bold text-gray-900">${selectedVoucher.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                         <div>
                            <span className="text-xs text-blue-500 uppercase block print:text-gray-600">Credit (Cr)</span>
                            <span className="font-bold text-gray-800">{selectedVoucher.creditAccount}</span>
                        </div>
                        <span className="font-mono font-bold text-gray-900">${selectedVoucher.amount.toLocaleString()}</span>
                    </div>
                </div>
              </div>

              {/* --- CUSTOMER / SALE SPECIFICS --- */}
              {details?.type === 'sale' && details.data ? (
                <div className="grid grid-cols-2 gap-8 mb-8 flex-grow-0">
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
              <div className="mb-8 flex-grow">
                {details?.type === 'sale' && details.data ? (
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-800 text-white print:bg-gray-200 print:text-black border-y-2 border-gray-800">
                                <th className="py-3 px-4 text-left font-semibold">Description</th>
                                <th className="py-3 px-4 text-center font-semibold">Crates</th>
                                <th className="py-3 px-4 text-center font-semibold">Birds</th>
                                <th className="py-3 px-4 text-center font-semibold">Weight</th>
                                <th className="py-3 px-4 text-right font-semibold">Rate</th>
                                <th className="py-3 px-4 text-right font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            <tr className="border-b border-gray-200">
                                <td className="py-4 px-4 font-medium">Broiler Chicken</td>
                                <td className="py-4 px-4 text-center font-mono">
                                    {(details.data as Sale).crates ? (details.data as Sale).crates : '-'}
                                </td>
                                <td className="py-4 px-4 text-center font-mono">
                                    {(details.data as Sale).chickens.toLocaleString()}
                                </td>
                                <td className="py-4 px-4 text-center font-mono">
                                    {(details.data as Sale).weight.toFixed(2)} kg
                                </td>
                                <td className="py-4 px-4 text-right font-mono">
                                    ${(details.data as Sale).rate.toFixed(2)}
                                </td>
                                <td className="py-4 px-4 text-right font-bold text-gray-900">
                                    ${selectedVoucher.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                             <tr className="bg-gray-50 print:bg-gray-100 border-t-2 border-gray-800">
                                <td colSpan={4}></td>
                                <td className="py-3 px-4 text-right font-bold text-gray-700 uppercase text-xs">Net Total</td>
                                <td className="py-3 px-4 text-right font-extrabold text-xl text-gray-900">
                                    ${selectedVoucher.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded p-6 bg-gray-50 print:bg-white print:border-gray-300">
                        <p className="text-gray-600 mb-2 text-sm uppercase font-bold">Narration / Description</p>
                        <p className="text-lg text-gray-800">{selectedVoucher.description}</p>
                    </div>
                )}
              </div>

              {/* --- FOOTER --- */}
              <div className="mt-auto pt-12">
                  <div className="grid grid-cols-2 gap-24">
                    <div className="text-center">
                      <div className="border-b border-gray-400 mb-2"></div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Authorized Signature</p>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-gray-400 mb-2"></div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Receiver's Signature</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-center text-[10px] text-gray-400 uppercase tracking-widest print:text-gray-500">
                      System Generated Document | Poultry ERP
                  </div>
              </div>

            </div>
          </div>
        )}

        {/* Print Action Floating Button */}
        {selectedVoucher && (
             <div className="mt-4 flex justify-end print:hidden">
                <button 
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
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
              }
              
              /* Ensure Colors Print */
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
        `}</style>
      </Modal>
    </div>
  );
};