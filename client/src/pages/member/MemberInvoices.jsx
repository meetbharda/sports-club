import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Receipt, CheckCircle, Clock, Printer } from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function MemberInvoices() {
  const { user, token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    async function loadInvoices() {
      if (!user?.member?.id) return;
      try {
        const res = await fetch(`/api/members/${user.member.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, [user, token]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Membership Invoices & Receipts</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review payment history, membership installments, and download or print digital receipts.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        {invoices.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No invoices on file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-white">{inv.invoice_number}</td>
                    <td className="p-3 capitalize">{inv.invoice_type}</td>
                    <td className="p-3">{inv.issue_date}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">${inv.total_amount.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt({
                          order_number: inv.invoice_number,
                          date: inv.issue_date,
                          customer_name: inv.customer_name,
                          payment_method: 'Card / Bank',
                          total_amount: inv.total_amount,
                          items: [{ name: `${inv.invoice_type} dues`, unit_price: inv.total_amount, quantity: 1 }]
                        })}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
