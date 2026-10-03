import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, TrendingUp, TrendingDown, Receipt, CreditCard, Plus, ArrowRight, CheckCircle } from 'lucide-react';

export default function FinanceDashboard() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'invoices', 'expenses'
  const [overview, setOverview] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // New Expense form
  const [expenseForm, setExpenseForm] = useState({
    vendor_name: '',
    category: 'Maintenance',
    amount: '',
    payment_method: 'Bank Transfer',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // New Invoice form
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    invoice_type: 'event',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    item_description: 'Tournament Court Hire & Catering',
    item_price: '',
    notes: ''
  });

  const loadFinanceData = async () => {
    try {
      const [ovRes, invRes, expRes] = await Promise.all([
        fetch('/api/finance/overview', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/finance/invoices', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/finance/expenses', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (ovRes.ok) setOverview(await ovRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [token]);

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...expenseForm,
          amount: Number(expenseForm.amount)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record expense');

      setShowExpenseModal(false);
      setExpenseForm({ vendor_name: '', category: 'Maintenance', amount: '', payment_method: 'Bank Transfer', date: new Date().toISOString().split('T')[0], notes: '' });
      loadFinanceData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finance/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: invoiceForm.customer_name,
          customer_email: invoiceForm.customer_email,
          customer_phone: invoiceForm.customer_phone,
          invoice_type: invoiceForm.invoice_type,
          due_date: invoiceForm.due_date,
          items: [{ description: invoiceForm.item_description, unit_price: Number(invoiceForm.item_price), quantity: 1 }],
          notes: invoiceForm.notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      setShowInvoiceModal(false);
      loadFinanceData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    try {
      const res = await fetch(`/api/finance/invoices/${invoiceId}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      if (res.ok) loadFinanceData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800 uppercase">
              Finance & Controller Hub
            </span>
            <span className="text-xs text-slate-400">P&L & Receivables</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Club Financial Operations</h1>
        </div>

        {/* Tab switcher & quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overview' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview P&L
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'invoices' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'expenses' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Expenses ({expenses.length})
            </button>
          </div>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-red-400" />
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => setShowInvoiceModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW P&L TAB */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</div>
              <div className="text-3xl font-black font-mono text-emerald-400">
                ${overview.todayRevenue.total.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Courts: ${overview.todayRevenue.court.toFixed(2)}</span>
                <span>Bar: ${overview.todayRevenue.bar.toFixed(2)}</span>
                <span>Shop: ${overview.todayRevenue.shop.toFixed(2)}</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Month Revenue (All Streams)</div>
              <div className="text-3xl font-black font-mono text-white">
                ${overview.monthRevenue.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-400">Membership dues + bookings + POS</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Month Expenses</div>
              <div className="text-3xl font-black font-mono text-red-400">
                ${overview.monthExpenses.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">Utilities, supplies, equipment</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Operating Profit</div>
              <div className="text-3xl font-black font-mono text-teal-400">
                ${overview.netProfitMonth.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">Receivables: ${overview.outstandingReceivables.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white">Accounts Receivable & Issued Invoices</h3>
            <span className="text-xs text-slate-400">{invoices.length} invoices</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer / Organization</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-teal-400">{inv.invoice_number}</td>
                    <td className="p-3 font-semibold text-white">{inv.customer_name}</td>
                    <td className="p-3 capitalize">{inv.invoice_type}</td>
                    <td className="p-3">{inv.issue_date}</td>
                    <td className="p-3">{inv.due_date}</td>
                    <td className="p-3 font-mono font-bold text-white">${inv.total_amount.toFixed(2)}</td>
                    <td className="p-3 font-mono">${inv.paid_amount.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-950 text-emerald-300' :
                        inv.status === 'Overdue' ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => handlePayInvoice(inv.id)}
                          className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white">Club Operational Expenses</h3>
            <span className="text-xs text-slate-400">{expenses.length} expense records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Ref Code</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-red-400">{exp.expense_number}</td>
                    <td className="p-3 font-semibold text-white">{exp.vendor_name}</td>
                    <td className="p-3">{exp.category}</td>
                    <td className="p-3 font-mono font-bold text-red-300">${exp.amount.toFixed(2)}</td>
                    <td className="p-3">{exp.payment_method}</td>
                    <td className="p-3 text-slate-400">{exp.date}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{exp.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Record Operational Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleRecordExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vendor / Payee *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.vendor_name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor_name: e.target.value })}
                  placeholder="e.g. Red Clay Surface Supplies"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Rent">Rent & Ground Lease</option>
                  <option value="Utilities">Utilities & Floodlights</option>
                  <option value="Salaries">Staff & Coaching Salaries</option>
                  <option value="Equipment">Court & Gym Equipment</option>
                  <option value="Maintenance">Maintenance & Clay Dressing</option>
                  <option value="Inventory">Pro Shop Inventory Intake</option>
                  <option value="Marketing">Marketing & Sponsorship</option>
                  <option value="Food supplies">Food & Beverage Supplies</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                  <select
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Corporate Card">Corporate Card</option>
                    <option value="Direct Debit">Direct Debit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Invoice Ref</label>
                <input
                  type="text"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="e.g. 20 Bags Red Clay Top Dressing"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow"
              >
                Log Expense to General Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Generate Client Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Client / Business Name *</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.customer_name}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                  placeholder="e.g. Metro Sports Academy League"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={invoiceForm.customer_email}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_email: e.target.value })}
                    placeholder="events@metro.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Line Item Description</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.item_description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, item_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subtotal Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={invoiceForm.item_price}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, item_price: e.target.value })}
                  placeholder="1200.00"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow"
              >
                Issue Invoice & Record Receivable
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
