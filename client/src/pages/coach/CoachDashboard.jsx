import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, CheckCircle, Clock, Trophy, FileText, Send } from 'lucide-react';

export default function CoachDashboard() {
  const { user, token } = useAuth();
  const [schedule, setSchedule] = useState({ sessions: [], socials: [] });
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');
  const [leaveStatusMsg, setLeaveStatusMsg] = useState(null);

  const loadCoachSchedule = async () => {
    try {
      const res = await fetch('/api/coach/schedule', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSchedule(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCoachSchedule();
  }, [token]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: leaveStart,
          end_date: leaveEnd,
          reason: leaveReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit leave');

      setLeaveStatusMsg(data.message);
      setLeaveReason('');
      setLeaveStart('');
      setLeaveEnd('');
    } catch (err) {
      alert(`Leave Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
              Head Coach Portal
            </span>
            <span className="text-xs text-slate-400">Head Athletic Trainer: Marcus Vance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Coaching Clinic & Session Roster</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scheduled Sessions Roster */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Assigned Court Bookings & Clinics</span>
            </h3>

            {schedule.sessions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">No upcoming clinic sessions scheduled.</div>
            ) : (
              <div className="space-y-3">
                {schedule.sessions.map(s => (
                  <div key={s.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm">{s.court_name}</div>
                      <div className="text-slate-400">
                        Player: <strong className="text-slate-200">{s.member_name || s.guest_name}</strong> ({s.member_phone || 'N/A'})
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        📅 {s.date} • ⏰ {s.start_time} - {s.end_time} ({s.booking_code})
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Mixers & Group Clinics */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Social Play Sessions & Group Mixers</span>
            </h3>

            {schedule.socials.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No group social sessions today.</div>
            ) : (
              <div className="space-y-3">
                {schedule.socials.map(soc => (
                  <div key={soc.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-white text-sm">{soc.title}</div>
                      <div className="text-slate-400 mt-0.5">Court: {soc.court_name} • Sport: {soc.sport}</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        Time: {soc.start_time} - {soc.end_time} • Roster: {soc.participant_count} / {soc.capacity} registered athletes
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                      Capacity: {soc.participant_count}/{soc.capacity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coach Leave Request Submission */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Submit Coach Leave Request</span>
          </h3>
          <p className="text-xs text-slate-400">
            Submit symposium, tournament travel, or personal leave to the HR & Staff Manager.
          </p>

          {leaveStatusMsg && (
            <div className="p-3 rounded-lg bg-emerald-950 text-emerald-300 text-xs border border-emerald-800">
              {leaveStatusMsg}
            </div>
          )}

          <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Casual">Casual / Personal</option>
                <option value="Sick">Medical / Sick</option>
                <option value="Paid">Tournament Delegation (Paid)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
              <input
                type="date"
                required
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">End Date</label>
              <input
                type="date"
                required
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Reason / Notes</label>
              <textarea
                rows={3}
                required
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="e.g. National Tennis Coaching Certification Workshop..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit to HR</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
