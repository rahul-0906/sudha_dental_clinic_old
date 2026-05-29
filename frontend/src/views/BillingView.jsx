import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { IndianRupee, FileText, Plus, Check, RefreshCw } from 'lucide-react';

export default function BillingView({ userRole }) {
  const [invoices, setInvoices] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState({ totalInflow: 0, totalOutflow: 0, netCashFlow: 0 });
  const [loading, setLoading] = useState(false);
  
  // Pay Invoice State
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  // Add Expense State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expense, setExpense] = useState({ amount: '', description: '' });

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const invs = await api.billing.invoices();
      setInvoices(invs);
      
      const led = await api.billing.ledger();
      setLedger(led);

      const sum = await api.billing.summary();
      setSummary(sum);
    } catch (error) {
      console.error("Failed to load billing:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const handlePayInvoice = async (e) => {
    e.preventDefault();
    if (!payingInvoice || !payAmount) return;

    try {
      await api.billing.payInvoice(payingInvoice.id, parseFloat(payAmount));
      setPayingInvoice(null);
      setPayAmount('');
      loadBillingData();
    } catch (error) {
      alert("Payment failed: " + error.message);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.billing.addLedger({
        type: 'OUTFLOW',
        amount: parseFloat(expense.amount),
        description: expense.description
      });
      setIsExpenseModalOpen(false);
      setExpense({ amount: '', description: '' });
      loadBillingData();
    } catch (error) {
      alert("Failed to add expense: " + error.message);
    }
  };

  // RBAC checks
  const isAdmin = userRole === 'ADMIN';

  // Calculate percentages for custom CSS chart
  const maxVal = Math.max(summary.totalInflow, summary.totalOutflow, 100);
  const inflowPercent = (summary.totalInflow / maxVal) * 100;
  const outflowPercent = (summary.totalOutflow / maxVal) * 100;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cash Flow & Billing</h1>
          <p className="text-sm text-slate-500">Track and manage patient billing invoices, general clinic expenses, and statements.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadBillingData}
            className="p-2 bg-white text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200 transition"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition shadow-md font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Cash Flow Summary Cards & Custom Visual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Clinic Revenue</span>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-2xl font-bold text-emerald-600">₹{summary.totalInflow}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Aggregated payment inflows</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Expenses</span>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-2xl font-bold text-red-500 font-sans">₹{summary.totalOutflow}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Aggregated ledger outflows</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase">Net Balance</span>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-primary-700' : 'text-red-600'}`}>
                  ₹{summary.netCashFlow}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Net clinic cash position</p>
            </div>
          </div>

          {/* Ledger logs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">General Transaction Ledger</h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {ledger.map((entry) => {
                    const isDebit = entry.debit > 0;
                    const typeLabel = isDebit ? 'DEBIT (INFLOW)' : 'CREDIT (OUTFLOW)';
                    const amount = isDebit ? entry.debit : entry.credit;
                    const entryDate = entry.createdDate || entry.date || new Date().toISOString();
                    return (
                      <tr key={entry.id}>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(entryDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDebit ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{entry.description}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${
                          isDebit ? 'text-emerald-700' : 'text-red-600'
                        }`}>
                          {isDebit ? '+' : '-'}₹{amount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Premium CSS Chart Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Revenue vs Expenses</h3>
            <p className="text-xs text-slate-400 mt-0.5">Visual clinic cash breakdown.</p>
          </div>
          
          <div className="flex h-56 items-end justify-center space-x-12 py-4">
            {/* Inflow Bar */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <div 
                className="bg-emerald-500 w-12 rounded-t-lg transition-all duration-1000 shadow-lg relative group"
                style={{ height: `${Math.max(inflowPercent, 6)}%` }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                  ₹{summary.totalInflow}
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-2">Inflow</span>
              <span className="text-xs font-bold text-slate-700">₹{summary.totalInflow}</span>
            </div>

            {/* Outflow Bar */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <div 
                className="bg-red-400 w-12 rounded-t-lg transition-all duration-1000 shadow-lg relative group"
                style={{ height: `${Math.max(outflowPercent, 6)}%` }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                  ₹{summary.totalOutflow}
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-2">Outflow</span>
              <span className="text-xs font-bold text-slate-700">₹{summary.totalOutflow}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 text-center">
            <span className="text-xs text-slate-400">Net Profit Margin: </span>
            <span className={`text-xs font-bold ${summary.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {summary.totalInflow > 0 ? `${((summary.netCashFlow / summary.totalInflow) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Invoices List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Clinic Invoices & Billings</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No invoices registered.</p>
            <p className="text-sm mt-1">Invoices are automatically generated upon EMR treatment logs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase bg-slate-50/50">
                  <th className="px-6 py-3.5">Invoice ID</th>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-6 py-3.5">Billing Date</th>
                  <th className="px-6 py-3.5">Total Bill</th>
                  <th className="px-6 py-3.5">Amount Paid</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-500">#INV-{inv.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{inv.patient.name}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(inv.billingDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">₹{inv.totalAmount}</td>
                    <td className="px-6 py-4 text-slate-600">₹{inv.paidAmount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        inv.status === 'PARTIALLY_PAID' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => setPayingInvoice(inv)}
                          className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold transition"
                        >
                          Process Payment
                        </button>
                      )}
                      {inv.status === 'PAID' && (
                        <span className="inline-flex items-center text-slate-400 text-xs font-medium">
                          <Check className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          <span>Cleared</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Invoice Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100">
            <div className="bg-emerald-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Process Invoice Payment</h3>
              <button onClick={() => setPayingInvoice(null)} className="text-white/80 hover:text-white text-2xl font-semibold">&times;</button>
            </div>
            <form onSubmit={handlePayInvoice} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Collect due payment for patient:</p>
                <p className="font-bold text-slate-800 mt-1">{payingInvoice.patient.name}</p>
                <div className="grid grid-cols-2 gap-4 mt-2 text-xs border bg-slate-50 p-2.5 rounded-lg border-slate-100">
                  <div>
                    <span className="text-slate-400">Total Invoice:</span>
                    <p className="font-bold text-slate-700">₹{payingInvoice.totalAmount}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Unpaid Balance:</span>
                    <p className="font-bold text-red-500">₹{payingInvoice.totalAmount - payingInvoice.paidAmount}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payingInvoice.totalAmount - payingInvoice.paidAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition text-sm font-semibold shadow-md"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100">
            <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Record Clinic Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(null)} className="text-white/80 hover:text-white text-2xl font-semibold">&times;</button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Expense Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Enter expense cost"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  placeholder="What was this expense for? e.g. monthly lab diagnostic fee, utility bills..."
                  value={expense.description}
                  onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition text-sm font-semibold shadow-md"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
