import React, { useState, useMemo } from 'react';
import { AppState, Customer, Farm, Sale, Receivable } from '../types';
import { Calendar, Filter, Printer, FileText, User, Warehouse, TrendingUp, Clock, AlertCircle, Wallet } from 'lucide-react';

interface ReportsProps {
  state: AppState;
}

type ReportType = 'sales' | 'ledger' | 'farm' | 'aging' | 'accounts';

export const Reports: React.FC<ReportsProps> = ({ state }) => {
  const [reportType, setReportType] = useState<ReportType>('sales');
  
  // Date Filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Selection Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  // --- REPORT GENERATION LOGIC ---

  const salesReportData = useMemo(() => {
    return state.sales
      .filter(s => s.date >= startDate && s.date <= endDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.sales, startDate, endDate]);

  const customerLedgerData = useMemo(() => {
    if (!selectedCustomerId) return null;
    const cid = parseInt(selectedCustomerId);
    
    // Calculate Opening Balance
    const salesBefore = state.sales
      .filter(s => s.customerId === cid && s.date < startDate)
      .reduce((sum, s) => sum + s.total, 0);
    const receiptsBefore = state.receivables
      .filter(r => r.customerId === cid && r.date < startDate)
      .reduce((sum, r) => sum + r.amount, 0);
    const openingBalance = salesBefore - receiptsBefore;

    const salesInRange = state.sales
      .filter(s => s.customerId === cid && s.date >= startDate && s.date <= endDate)
      .map(s => ({
        id: s.id,
        date: s.date,
        type: 'SALE' as const,
        description: `Inv #${s.id} - ${state.farms?.find(f => f.id === s.farmId)?.name || 'Farm'}${s.vehicleNumber ? ` (${s.vehicleNumber})` : ''}`,
        debit: s.total,
        credit: 0
      }));

    const receiptsInRange = state.receivables
      .filter(r => r.customerId === cid && r.date >= startDate && r.date <= endDate)
      .map(r => ({
        id: r.id,
        date: r.date,
        type: 'RECEIPT' as const,
        description: `Receipt #${r.id}`,
        debit: 0,
        credit: r.amount
      }));

    const transactions = [...salesInRange, ...receiptsInRange].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = openingBalance;
    const transactionsWithBalance = transactions.map(t => {
      runningBalance += t.debit - t.credit;
      return { ...t, balance: runningBalance };
    });

    return {
      customer: state.customers?.find(c => c.id === cid),
      openingBalance,
      transactions: transactionsWithBalance,
      closingBalance: runningBalance
    };
  }, [state.sales, state.receivables, selectedCustomerId, startDate, endDate]);

  const farmReportData = useMemo(() => {
    const farms = selectedFarmId 
      ? state.farms?.filter(f => f.id === parseInt(selectedFarmId))
      : state.farms;

    return farms?.map(f => {
      const sales = state.sales.filter(s => s.farmId === f.id && s.date >= startDate && s.date <= endDate);
      const totalSoldQty = sales.reduce((sum, s) => sum + s.chickens, 0);
      const totalSoldWeight = sales.reduce((sum, s) => sum + s.weight, 0);
      const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
      
      const allTimeSales = state.sales.filter(s => s.farmId === f.id).reduce((sum, s) => sum + s.chickens, 0);
      const remainingStock = f.initialStock - allTimeSales;

      return {
        ...f,
        periodSales: sales.length,
        periodQty: totalSoldQty,
        periodWeight: totalSoldWeight,
        periodRevenue: totalRevenue,
        remainingStock
      };
    }) || [];
  }, [state.farms, state.sales, selectedFarmId, startDate, endDate]);

  const agingReportData = useMemo(() => {
    const today = new Date();
    return state.customers?.map(customer => {
        const sales = state.sales
            .filter(s => s.customerId === customer.id)
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const payments = state.receivables.filter(r => r.customerId === customer.id);
        const totalPaid = payments.reduce((sum, r) => sum + r.amount, 0);
        const lastPayment = payments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        let paymentPool = totalPaid;
        const openInvoices = [];

        for (const sale of sales) {
            if (paymentPool >= sale.total) {
                paymentPool -= sale.total;
            } else {
                const remainingDue = sale.total - paymentPool;
                openInvoices.push({ saleDate: new Date(sale.date), amount: remainingDue });
                paymentPool = 0;
            }
        }

        const buckets = { days0_15: 0, days16_30: 0, days31_60: 0, days60plus: 0 };
        openInvoices.forEach(inv => {
            const diffDays = Math.ceil(Math.abs(today.getTime() - inv.saleDate.getTime()) / (1000 * 60 * 60 * 24)); 
            if (diffDays <= 15) buckets.days0_15 += inv.amount;
            else if (diffDays <= 30) buckets.days16_30 += inv.amount;
            else if (diffDays <= 60) buckets.days31_60 += inv.amount;
            else buckets.days60plus += inv.amount;
        });

        const totalDue = Object.values(buckets).reduce((a,b) => a+b, 0);
        return { customer, totalDue, buckets, lastPayment };
    })
    .filter(item => item.totalDue > 0.01)
    .sort((a,b) => b.totalDue - a.totalDue) || [];
  }, [state.sales, state.receivables, state.customers]);

  const accountsReportData = useMemo(() => {
    return state.accounts?.map(acc => {
      // Calculate balances before start date
      const receiptsBefore = state.receivables
        .filter(r => r.accountId === acc.id && r.date < startDate)
        .reduce((sum, r) => sum + r.amount, 0);
      const openingBalance = acc.initialBalance + receiptsBefore;

      // Receipts in period
      const receiptsInRange = state.receivables.filter(r => r.accountId === acc.id && r.date >= startDate && r.date <= endDate);
      const totalInflow = receiptsInRange.reduce((sum, r) => sum + r.amount, 0);
      
      const closingBalance = openingBalance + totalInflow;

      return {
        ...acc,
        openingBalance,
        totalInflow,
        closingBalance,
        transactions: receiptsInRange
      };
    }) || [];
  }, [state.accounts, state.receivables, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    switch(reportType) {
      case 'sales': return 'Sales Summary';
      case 'ledger': return 'Customer Ledger';
      case 'farm': return 'Farm Performance';
      case 'aging': return 'Receivables Aging (Dues)';
      case 'accounts': return 'Financial Accounts Statement';
      default: return 'Report';
    }
  };

  // --- RENDERERS ---

  const renderSalesSummary = () => {
    const totalQty = salesReportData.reduce((sum, s) => sum + s.chickens, 0);
    const totalWeight = salesReportData.reduce((sum, s) => sum + s.weight, 0);
    const totalAmount = salesReportData.reduce((sum, s) => sum + s.total, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 print:bg-gray-100 print:border-gray-300">
            <span className="text-sm text-blue-600 font-semibold print:text-black">Total Revenue</span>
            <p className="text-2xl font-bold text-blue-900 print:text-black">${totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 print:bg-gray-100 print:border-gray-300">
            <span className="text-sm text-orange-600 font-semibold print:text-black">Chickens Sold</span>
            <p className="text-2xl font-bold text-orange-900 print:text-black">{totalQty.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 print:bg-gray-100 print:border-gray-300">
            <span className="text-sm text-green-600 font-semibold print:text-black">Total Weight</span>
            <p className="text-2xl font-bold text-green-900 print:text-black">{totalWeight.toLocaleString()} kg</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Inv #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Farm</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3 text-right">Crates</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Weight</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {salesReportData.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{sale.date}</td>
                  <td className="p-3 font-medium">#{sale.id}</td>
                  <td className="p-3">{state.customers?.find(c => c.id === sale.customerId)?.name}</td>
                  <td className="p-3 text-gray-600">{state.farms?.find(f => f.id === sale.farmId)?.name}</td>
                  <td className="p-3 text-gray-600">{sale.vehicleNumber || '-'}</td>
                  <td className="p-3 text-right">{sale.crates || '-'}</td>
                  <td className="p-3 text-right">{sale.chickens}</td>
                  <td className="p-3 text-right">{sale.weight}</td>
                  <td className="p-3 text-right">${sale.rate}</td>
                  <td className="p-3 text-right font-medium">${sale.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
              <tr>
                <td colSpan={6} className="p-3 text-right">Totals:</td>
                <td className="p-3 text-right">{totalQty}</td>
                <td className="p-3 text-right">{totalWeight.toFixed(2)}</td>
                <td className="p-3"></td>
                <td className="p-3 text-right">${totalAmount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderCustomerLedger = () => {
    if (!selectedCustomerId) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 print:hidden">
          <User className="text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">Please select a customer to view their ledger.</p>
        </div>
      );
    }
    if (!customerLedgerData) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{customerLedgerData.customer?.name}</h3>
              <p className="text-gray-500">{customerLedgerData.customer?.address}</p>
              <p className="text-gray-500">{customerLedgerData.customer?.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Closing Balance</p>
              <p className={`text-2xl font-bold ${customerLedgerData.closingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${customerLedgerData.closingBalance.toLocaleString()}
              </p>
            </div>
          </div>

          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-center">Type</th>
                <th className="p-3 text-right">Debit (Sale)</th>
                <th className="p-3 text-right">Credit (Paid)</th>
                <th className="p-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="bg-gray-50 italic">
                <td className="p-3">{startDate}</td>
                <td className="p-3" colSpan={2}>Opening Balance</td>
                <td className="p-3 text-right text-gray-400">-</td>
                <td className="p-3 text-right text-gray-400">-</td>
                <td className="p-3 text-right font-medium">
                  ${customerLedgerData.openingBalance.toLocaleString()}
                </td>
              </tr>
              
              {customerLedgerData.transactions.map((t) => (
                <tr key={`${t.type}-${t.id}`} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{t.date}</td>
                  <td className="p-3">{t.description}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      t.type === 'SALE' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    } print:border print:border-gray-300`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="p-3 text-right text-orange-600">
                    {t.debit > 0 ? `$${t.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="p-3 text-right text-green-600">
                    {t.credit > 0 ? `$${t.credit.toLocaleString()}` : '-'}
                  </td>
                  <td className="p-3 text-right font-medium">
                    ${t.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFarmReport = () => (
    <div className="space-y-6">
      <div className="grid gap-6">
        {farmReportData.map(farm => (
          <div key={farm.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm break-inside-avoid">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Warehouse size={20} className="text-gray-400" />
                  {farm.name}
                </h3>
                <p className="text-sm text-gray-500">Initial Stock: {farm.initialStock.toLocaleString()}</p>
              </div>
              <div className="mt-2 md:mt-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 print:border print:border-gray-300">
                  Current Stock: {farm.remainingStock.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg print:border print:border-gray-200">
                <p className="text-xs text-gray-500 uppercase">Sales Count</p>
                <p className="text-lg font-bold text-gray-800">{farm.periodSales}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg print:border print:border-gray-200">
                <p className="text-xs text-gray-500 uppercase">Birds Sold</p>
                <p className="text-lg font-bold text-orange-600">{farm.periodQty.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg print:border print:border-gray-200">
                <p className="text-xs text-gray-500 uppercase">Weight Sold</p>
                <p className="text-lg font-bold text-blue-600">{farm.periodWeight.toFixed(2)} kg</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg print:border print:border-gray-200">
                <p className="text-xs text-gray-500 uppercase">Revenue Generated</p>
                <p className="text-lg font-bold text-green-600">${farm.periodRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAgingReport = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 print:border-gray-300 print:bg-gray-50">
        <AlertCircle className="text-blue-500 mt-1 flex-shrink-0" size={20} />
        <div>
           <h4 className="font-bold text-blue-900 print:text-black">Collections Overview</h4>
           <p className="text-sm text-blue-800 print:text-gray-800">
             This report uses the <b>FIFO (First-In, First-Out)</b> method. Payments are applied to the oldest invoices first.
           </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4 text-right">Total Due</th>
              <th className="p-4 text-right bg-green-50 border-l border-green-100 print:bg-gray-100">0-15 Days</th>
              <th className="p-4 text-right bg-yellow-50 border-l border-yellow-100 print:bg-gray-100">16-30 Days</th>
              <th className="p-4 text-right bg-orange-50 border-l border-orange-100 print:bg-gray-100">31-60 Days</th>
              <th className="p-4 text-right bg-red-50 border-l border-red-100 print:bg-gray-100">60+ Days</th>
              <th className="p-4 text-right border-l border-gray-100">Last Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agingReportData.map((data) => {
               const hasCriticalDebt = data.buckets.days60plus > 0;
               return (
                <tr key={data.customer.id} className={`hover:bg-gray-50 ${hasCriticalDebt ? 'bg-red-50/30 print:bg-gray-100' : ''}`}>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{data.customer.name}</div>
                    <div className="text-xs text-gray-500">{data.customer.phone}</div>
                  </td>
                  <td className="p-4 text-right font-bold text-gray-900">${data.totalDue.toLocaleString()}</td>
                  <td className="p-4 text-right bg-green-50/30 border-l border-green-100 print:bg-transparent print:border-gray-200">{data.buckets.days0_15 > 0 ? `$${data.buckets.days0_15.toLocaleString()}` : '-'}</td>
                  <td className="p-4 text-right bg-yellow-50/30 border-l border-yellow-100 print:bg-transparent print:border-gray-200">{data.buckets.days16_30 > 0 ? `$${data.buckets.days16_30.toLocaleString()}` : '-'}</td>
                  <td className="p-4 text-right bg-orange-50/30 border-l border-orange-100 print:bg-transparent print:border-gray-200">{data.buckets.days31_60 > 0 ? `$${data.buckets.days31_60.toLocaleString()}` : '-'}</td>
                  <td className="p-4 text-right bg-red-50/30 border-l border-red-100 font-bold print:bg-transparent print:border-gray-200">{data.buckets.days60plus > 0 ? `$${data.buckets.days60plus.toLocaleString()}` : '-'}</td>
                  <td className="p-4 text-right border-l border-gray-100">
                    {data.lastPayment ? (
                      <div>
                        <div className="font-medium text-green-700">${data.lastPayment.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{data.lastPayment.date}</div>
                      </div>
                    ) : <span className="text-gray-400 text-xs italic">None</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAccountsReport = () => (
    <div className="space-y-6">
      <div className="grid gap-6">
        {accountsReportData.map(acc => (
          <div key={acc.id} className="bg-white rounded-lg border border-gray-200 shadow-sm break-inside-avoid">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Wallet className="text-gray-500" size={20} />
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{acc.name}</h3>
                        <p className="text-xs text-gray-500 uppercase">{acc.type}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase">Current Balance</p>
                    <p className="text-xl font-bold text-blue-700">${acc.closingBalance.toLocaleString()}</p>
                </div>
            </div>
            
            <div className="p-4 grid grid-cols-3 gap-4 text-sm border-b border-gray-100">
                <div>
                    <span className="text-gray-500 block">Opening Balance</span>
                    <span className="font-medium">${acc.openingBalance.toLocaleString()}</span>
                </div>
                <div>
                    <span className="text-gray-500 block">Total Inflow</span>
                    <span className="font-medium text-green-600">+{acc.totalInflow.toLocaleString()}</span>
                </div>
                <div>
                    <span className="text-gray-500 block">Total Outflow</span>
                    <span className="font-medium text-red-600">-0.00</span> 
                </div>
            </div>

            <div className="p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Recent Transactions</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="p-2 text-left">Date</th>
                                <th className="p-2 text-left">Ref #</th>
                                <th className="p-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {acc.transactions.map(t => (
                                <tr key={t.id}>
                                    <td className="p-2 text-gray-600">{t.date}</td>
                                    <td className="p-2 text-gray-600">Receipt #{t.id}</td>
                                    <td className="p-2 text-right font-medium text-green-600">+${t.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                            {acc.transactions.length === 0 && (
                                <tr><td colSpan={3} className="p-4 text-center text-gray-400 text-xs">No transactions in period</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Controls - Hidden in Print */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600" />
            Reports Center
          </h2>
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Printer size={18} />
            <span>Print Report</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg w-full lg:w-auto self-start overflow-x-auto">
            <button onClick={() => setReportType('sales')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${reportType === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <TrendingUp size={16} /> Sales
            </button>
            <button onClick={() => setReportType('ledger')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${reportType === 'ledger' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <User size={16} /> Ledger
            </button>
            <button onClick={() => setReportType('farm')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${reportType === 'farm' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Warehouse size={16} /> Farm
            </button>
            <button onClick={() => setReportType('aging')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${reportType === 'aging' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Clock size={16} /> Aging
            </button>
            <button onClick={() => setReportType('accounts')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${reportType === 'accounts' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Wallet size={16} /> Accounts
            </button>
          </div>

          {reportType !== 'aging' && (
            <div className="flex gap-2 items-center flex-1">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
              <span className="text-gray-400">-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          )}

          <div className="w-full lg:w-64">
            {reportType === 'ledger' && (
              <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">Select Customer...</option>
                {state.customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {reportType === 'farm' && (
              <select value={selectedFarmId} onChange={(e) => setSelectedFarmId(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">All Farms</option>
                {state.farms?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="animate-fade-in print:p-0 print:absolute print:top-0 print:left-0 print:w-full">
        <div className="hidden print:block mb-8 border-b border-gray-300 pb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 uppercase">AL REHMAN POULTRY FARMS</h1>
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-semibold text-gray-700">{getReportTitle()}</h2>
                    {reportType !== 'aging' && <p className="text-sm text-gray-500 mt-1">Period: {startDate} to {endDate}</p>}
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400">Generated on</p>
                    <p className="text-sm font-medium text-gray-800">{new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>

        {reportType === 'sales' && renderSalesSummary()}
        {reportType === 'ledger' && renderCustomerLedger()}
        {reportType === 'farm' && renderFarmReport()}
        {reportType === 'aging' && renderAgingReport()}
        {reportType === 'accounts' && renderAccountsReport()}
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .animate-fade-in, .animate-fade-in * { visibility: visible; }
          .animate-fade-in { position: absolute; left: 0; top: 0; width: 100%; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};