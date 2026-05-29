import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { IndianRupee, FileText, Plus, Check, RefreshCw, BarChart2, ListCollapse } from 'lucide-react';

export default function BillingView({ userRole }) {
  const [invoices, setInvoices] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState({ totalInflow: 0, totalOutflow: 0, netCashFlow: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'invoices', 'ledger'
  const [timeGroupMode, setTimeGroupMode] = useState('MONTHLY'); // 'DAILY', 'MONTHLY', 'YEARLY'
  
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
      console.error("Failed to load billing data:", error);
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
      alert("Failed to log expense: " + error.message);
    }
  };

  const isAdmin = userRole === 'ADMIN';

  // Grouped Calculations: Daily, Monthly, Yearly
  const getGroupedStats = () => {
    const groups = {};

    ledger.forEach(entry => {
      const dateStr = entry.createdDate || entry.date || new Date().toISOString();
      const dateObj = new Date(dateStr);
      let key = '';

      if (timeGroupMode === 'DAILY') {
        // YYYY-MM-DD
        key = dateObj.toISOString().split('T')[0];
      } else if (timeGroupMode === 'MONTHLY') {
        // YYYY-MM (e.g. May 2026)
        const monthName = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        key = monthName;
      } else {
        // YYYY
        key = dateObj.getFullYear().toString();
      }

      if (!groups[key]) {
        groups[key] = { key, earnings: 0, expenses: 0 };
      }

      groups[key].earnings += entry.debit || 0;
      groups[key].expenses += entry.credit || 0;
    });

    // Convert to list and sort chronologically
    return Object.values(groups).sort((a, b) => {
      if (timeGroupMode === 'DAILY') {
        return new Date(b.key) - new Date(a.key);
      }
      return b.key.localeCompare(a.key);
    });
  };

  const groupedStats = getGroupedStats();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cash Flow & Billing</h1>
          <p className="text-sm text-slate-500">Simplify clinic billing, record operational costs, and access grouped financial reports.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadBillingData}
            className="p-2 bg-white text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200 transition"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition shadow-sm font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'reports' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-slate-500" />
          <span>Financial Reports</span>
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'invoices' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Billing Invoices</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'ledger' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ListCollapse className="w-4 h-4 text-slate-500" />
          <span>Journal Ledger</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Earnings</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">₹{summary.totalInflow}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</span>
          <p className="text-xl font-extrabold text-red-500 mt-1">₹{summary.totalOutflow}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Cash Position</span>
          <p className={`text-xl font-extrabold mt-1 ${summary.netCashFlow >= 0 ? 'text-primary-700' : 'text-red-600'}`}>
            ₹{summary.netCashFlow}
          </p>
        </div>
      </div>

      {/* Reports Content View */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table List (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Grouped Cash Statements</h3>
              {/* Mode Toggles */}
              <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setTimeGroupMode('DAILY')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    timeGroupMode === 'DAILY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Datewise
                </button>
                <button
                  onClick={() => setTimeGroupMode('MONTHLY')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    timeGroupMode === 'MONTHLY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Monthwise
                </button>
                <button
                  onClick={() => setTimeGroupMode('YEARLY')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    timeGroupMode === 'YEARLY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Yearwise
                </button>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                  <th className="px-5 py-3">Timeframe</th>
                  <th className="px-5 py-3 text-right">Earnings (+)</th>
                  <th className="px-5 py-3 text-right">Expenses (-)</th>
                  <th className="px-5 py-3 text-right">Net Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {groupedStats.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400">No transactions recorded</td>
                  </tr>
                ) : (
                  groupedStats.map((item, idx) => {
                    const diff = item.earnings - item.expenses;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-3.5 font-bold text-slate-700">{item.key}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">₹{item.earnings}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-red-500">₹{item.expenses}</td>
                        <td className={`px-5 py-3.5 text-right font-bold ${diff >= 0 ? 'text-primary-700' : 'text-red-600'}`}>
                          ₹{diff}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Aggregation Visualizer (1/3 width) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-fit">
            <div>
              <h3 className="font-bold text-xs text-slate-400 uppercase">Cash Breakdown Ratio</h3>
              <p className="text-xs text-slate-500 mt-1">Earnings and expenses split comparison.</p>
            </div>

            <div className="py-8 space-y-4">
              {/* Earnings Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Total Earnings</span>
                  <span className="text-emerald-600 font-bold">₹{summary.totalInflow}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${summary.totalInflow > 0 ? (summary.totalInflow / Math.max(summary.totalInflow + summary.totalOutflow, 1)) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Expense Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Total Expenses</span>
                  <span className="text-red-500 font-bold">₹{summary.totalOutflow}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${summary.totalOutflow > 0 ? (summary.totalOutflow / Math.max(summary.totalInflow + summary.totalOutflow, 1)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 text-center text-xs">
              <span className="text-slate-400">Net Profit Margin: </span>
              <span className={`font-bold ${summary.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {summary.totalInflow > 0 ? `${((summary.netCashFlow / summary.totalInflow) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Invoices List Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {invoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No billing records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase bg-slate-50/50">
                    <th className="px-6 py-3.5">Invoice ID</th>
                    <th className="px-6 py-3.5">Patient Name</th>
                    <th className="px-6 py-3.5">Billing Date</th>
                    <th className="px-6 py-3.5">Total Cost</th>
                    <th className="px-6 py-3.5">Amount Paid</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-500">#INV-{inv.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{inv.patient.name}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(inv.billingDate || new Date()).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">₹{inv.totalAmount}</td>
                      <td className="px-6 py-4 text-slate-600">₹{inv.paidAmount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${
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
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold transition"
                          >
                            Collect Payment
                          </button>
                        )}
                        {inv.status === 'PAID' && (
                          <span className="inline-flex items-center text-slate-400 font-medium">
                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
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
      )}

      {/* Raw Ledger Journal Tab */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                  <th className="px-6 py-3.5">Transaction Date</th>
                  <th className="px-6 py-3.5">Double-Entry Type</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5 text-right">Debit (Inflow)</th>
                  <th className="px-6 py-3.5 text-right">Credit (Outflow)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {ledger.map((entry) => {
                  const entryDate = entry.createdDate || entry.date || new Date().toISOString();
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(entryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                          entry.debit > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {entry.debit > 0 ? 'DEBIT' : 'CREDIT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{entry.description}</td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                        {entry.debit > 0 ? `₹${entry.debit}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-red-500">
                        {entry.credit > 0 ? `₹${entry.credit}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Invoice Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100">
            <div className="bg-emerald-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-base font-bold">Collect Invoice Balance</h3>
              <button onClick={() => setPayingInvoice(null)} className="text-white/80 hover:text-white text-2xl font-semibold">&times;</button>
            </div>
            <form onSubmit={handlePayInvoice} className="p-6 space-y-4 text-xs">
              <div>
                <p className="text-slate-500">Patient Invoice Account:</p>
                <p className="font-bold text-slate-800 mt-1 text-sm">{payingInvoice.patient.name}</p>
                <div className="grid grid-cols-2 gap-4 mt-2 border bg-slate-50 p-2.5 rounded-lg border-slate-100">
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
                <label className="block text-slate-500 font-semibold uppercase mb-1">Payment Amount (₹)</label>
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
                  Record Payment
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
              <h3 className="text-base font-bold">Record Operational Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(null)} className="text-white/80 hover:text-white text-2xl font-semibold">&times;</button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold uppercase mb-1">Expense Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 1500"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  placeholder="What was this expense for? e.g. lab services, office utilities..."
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
                  Log Outflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
