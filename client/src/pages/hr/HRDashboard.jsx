import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Calendar, Clock, CheckCircle, XCircle, Plus, FileText, UserCheck, Shield } from 'lucide-react';

export default function HRDashboard() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('employees'); // 'employees', 'shifts', 'leave'
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showShiftModal, setShowShiftModal] = useState(false);

  // Shift form
  const [shiftForm, setShiftForm] = useState({
    employee_id: 1,
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '16:00',
    notes: 'Standard weekday shift'
  });

  const loadHRData = async () => {
    try {
      const [empRes, shiftRes, leaveRes] = await Promise.all([
        fetch('/api/hr/employees', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/hr/shifts', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/hr/leave', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (empRes.ok) {
        const eData = await empRes.json();
        setEmployees(eData);
        if (eData.length > 0) setShiftForm(prev => ({ ...prev, employee_id: eData[0].id }));
      }
      if (shiftRes.ok) setShifts(await shiftRes.json());
      if (leaveRes.ok) setLeaveRequests(await leaveRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHRData();
  }, [token]);

  // Approve / Reject Leave
  const handleReviewLeave = async (leaveId, status) => {
    const notes = prompt(`Optional review note for ${status.toLowerCase()} status:`, 'Approved as requested');
    try {
      const res = await fetch(`/api/hr/leave/${leaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, review_notes: notes })
      });
      if (res.ok) {
        alert(`Leave request ${status.toLowerCase()}!`);
        loadHRData();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Schedule Shift
  const handleScheduleShift = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shiftForm)
      });
      if (res.ok) {
        alert('Shift rostered successfully!');
        setShowShiftModal(false);
        loadHRData();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
              HR & Staff Operations
            </span>
            <span className="text-xs text-slate-400">Roster, Employees & Leave Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Staff Management & Roster</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'employees' ? 'bg-indigo-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Staff Directory ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('shifts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'shifts' ? 'bg-indigo-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today's Shifts ({shifts.length})
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'leave' ? 'bg-indigo-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Leave Requests ({leaveRequests.length})
            </button>
          </div>

          <button
            onClick={() => setShowShiftModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-slate-950 transition-colors shadow flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Roster Shift</span>
          </button>
        </div>
      </div>

      {/* EMPLOYEES TAB */}
      {activeTab === 'employees' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-white">Registered Club Staff & Roles</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Joining Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-indigo-400">{emp.emp_code}</td>
                    <td className="p-3 font-semibold text-white">{emp.name}</td>
                    <td className="p-3">{emp.department}</td>
                    <td className="p-3 text-emerald-400">{emp.role}</td>
                    <td className="p-3">{emp.phone || emp.email}</td>
                    <td className="p-3 text-slate-400">{emp.joining_date}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {emp.employment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SHIFTS TAB */}
      {activeTab === 'shifts' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-white">Today's Staff Shifts & Attendance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Scheduled Time</th>
                  <th className="p-3">Clock-In</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {shifts.map(shift => (
                  <tr key={shift.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-white">{shift.employee_name}</td>
                    <td className="p-3">{shift.department}</td>
                    <td className="p-3 font-mono">{shift.start_time} - {shift.end_time}</td>
                    <td className="p-3 font-mono text-emerald-400">{shift.clock_in || 'Pending'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        shift.status === 'Active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {shift.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{shift.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAVE TAB */}
      {activeTab === 'leave' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-white">Staff Leave Requests & Approvals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {leaveRequests.map(l => (
                  <tr key={l.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-white">{l.employee_name}</td>
                    <td className="p-3">{l.department}</td>
                    <td className="p-3 capitalize">{l.leave_type}</td>
                    <td className="p-3">{l.start_date}</td>
                    <td className="p-3">{l.end_date}</td>
                    <td className="p-3 text-slate-300 max-w-xs">{l.reason}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.status === 'Approved' ? 'bg-emerald-950 text-emerald-300' :
                        l.status === 'Rejected' ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {l.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReviewLeave(l.id, 'Approved')}
                            className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewLeave(l.id, 'Rejected')}
                            className="px-2.5 py-1 text-xs font-bold rounded bg-red-950 text-red-300 hover:bg-red-900 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROSTER SHIFT MODAL */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Roster Staff Shift</h3>
              <button onClick={() => setShowShiftModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleScheduleShift} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Employee</label>
                <select
                  value={shiftForm.employee_id}
                  onChange={(e) => setShiftForm({ ...shiftForm, employee_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department} - {emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={shiftForm.date}
                  onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift Start Time</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.start_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift End Time</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.end_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Duty Notes / Assignment</label>
                <input
                  type="text"
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  placeholder="e.g. Afternoon court maintenance & floodlights check"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-400 text-slate-950 transition-colors shadow"
              >
                Save Shift to Roster
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
