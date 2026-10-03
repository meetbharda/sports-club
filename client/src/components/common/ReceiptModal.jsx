import React from 'react';
import { X, Printer, CheckCircle, Trophy } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, receipt }) {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide text-white">THE CHAMPIONS CLUB</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-slate-200">
          <div className="text-center pb-3 border-b border-dashed border-slate-700">
            <div className="inline-flex p-2 bg-emerald-500/10 text-emerald-400 rounded-full mb-2">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Official Payment Receipt</h3>
            <p className="text-xs text-slate-400">450 Champions Way, Grand Sports Enclave</p>
            <p className="text-xs text-slate-400 mt-0.5">VAT / Tax ID: TC-8921-99</p>
          </div>

          <div className="text-xs space-y-1.5 py-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Receipt Ref:</span>
              <span className="font-mono font-bold text-white">{receipt.order_number || receipt.booking_code || 'RCP-2026-99'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date & Time:</span>
              <span>{receipt.date || new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Method:</span>
              <span className="uppercase font-semibold text-emerald-400">{receipt.payment_method || 'CARD'}</span>
            </div>
            {receipt.customer_name && (
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span>{receipt.customer_name}</span>
              </div>
            )}
          </div>

          {receipt.items && receipt.items.length > 0 && (
            <div className="border-t border-b border-dashed border-slate-800 py-3 space-y-2">
              <div className="text-[11px] font-semibold uppercase text-slate-400 flex justify-between">
                <span>Item</span>
                <span>Qty x Rate</span>
                <span>Total</span>
              </div>
              {receipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="truncate max-w-[160px] text-slate-300">{item.name || item.item_name}</span>
                  <span className="text-slate-400">{item.quantity} x ${(item.unit_price || 0).toFixed(2)}</span>
                  <span className="font-mono font-medium">${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5 pt-1 text-xs">
            {receipt.subtotal && (
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">${Number(receipt.subtotal).toFixed(2)}</span>
              </div>
            )}
            {receipt.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Member Discount</span>
                <span className="font-mono">-${Number(receipt.discount_amount).toFixed(2)}</span>
              </div>
            )}
            {receipt.tax_amount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Sales Tax (5%)</span>
                <span className="font-mono">${Number(receipt.tax_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-white border-t border-slate-800 pt-2">
              <span>Total Paid</span>
              <span className="font-mono text-emerald-400">${Number(receipt.total_amount || receipt.price || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-500">
            Thank you for playing at The Champions Club.
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
