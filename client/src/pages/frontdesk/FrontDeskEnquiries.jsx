import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, CheckCircle, Clock, Phone, Mail, ArrowRight, UserPlus } from 'lucide-react';

export default function FrontDeskEnquiries() {
  const { token } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEnquiries = async () => {
    try {
      const res = await fetch('/api/enquiries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setEnquiries(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [token]);

  // Convert lead to member
  const handleConvert = async (enquiryId) => {
    const plan = prompt('Enter membership plan code to assign (GOLD, SILVER, or JUNIOR):', 'GOLD');
    if (!plan) return;

    try {
      const res = await fetch(`/api/enquiries/${enquiryId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan_code: plan.toUpperCase().trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');

      alert(data.message);
      loadEnquiries();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Update lead status
  const handleUpdateStatus = async (enquiryId, newStatus) => {
    try {
      const res = await fetch(`/api/enquiries/${enquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) loadEnquiries();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">CRM & Guest Enquiry Pipeline</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review public trial requests, track follow-ups, and convert prospective athletes directly into club members.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        {enquiries.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">No customer enquiries on file.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Lead Code</th>
                  <th className="p-3">Athlete Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Sport / Interest</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {enquiries.map(e => (
                  <tr key={e.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-blue-400">{e.enquiry_code}</td>
                    <td className="p-3 font-semibold text-white">{e.name}</td>
                    <td className="p-3">
                      <div>{e.phone}</div>
                      <div className="text-[10px] text-slate-400">{e.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-emerald-400">{e.interested_sport || 'Tennis'}</span>
                      {e.preferred_date && <div className="text-[10px] text-slate-400">Pref: {e.preferred_date}</div>}
                    </td>
                    <td className="p-3 text-slate-400">{e.source}</td>
                    <td className="p-3">
                      <select
                        value={e.status}
                        onChange={(evt) => handleUpdateStatus(e.id, evt.target.value)}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Trial Scheduled">Trial Scheduled</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      {e.status !== 'Converted' ? (
                        <button
                          onClick={() => handleConvert(e.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Convert to Member</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Converted
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
    </div>
  );
}
