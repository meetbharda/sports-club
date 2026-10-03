import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, TrendingUp, Users, Calendar, AlertTriangle, ShieldCheck, Settings, FileText, CheckCircle, Search, Sliders } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('kpis'); // 'kpis', 'users', 'settings', 'audit'
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const loadAdminData = async () => {
    try {
      const [dashRes, userRes, logRes, setRes] = await Promise.all([
        fetch('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/audit-logs', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/settings', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (userRes.ok) setUsers(await userRes.json());
      if (logRes.ok) setAuditLogs(await logRes.json());
      if (setRes.ok) setSettings(await setRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  // Update user role or status
  const handleUpdateUser = async (userId, updatePayload) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });
      if (res.ok) loadAdminData();
    } catch (err) {
      alert(`Update Error: ${err.message}`);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err) {
      alert(`Settings Save Error: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const kpis = dashboardData?.kpis;

  return (
    <div className="min-h-screen bg-[#0b0f19] p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase">
              Super Admin Executive Portal
            </span>
            <span className="text-xs text-slate-400">Owner Business Intelligence Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Good evening, Victoria Sterling</h1>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'kpis' ? 'bg-purple-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            KPI Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users' ? 'bg-purple-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            User RBAC ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'settings' ? 'bg-purple-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Club Settings
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'audit' ? 'bg-purple-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* KPI ANALYTICS TAB */}
      {activeTab === 'kpis' && kpis && (
        <div className="space-y-6">
          {/* Main 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue Year-to-Date</div>
              <div className="text-3xl font-black font-mono text-emerald-400">
                ${kpis.totalRevenue.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">All registered club streams</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Members</div>
              <div className="text-3xl font-black font-mono text-white">
                {kpis.activeMembers} <span className="text-xs text-slate-400 font-normal">athletes</span>
              </div>
              <div className="text-[10px] text-amber-400 font-semibold">{kpis.expiringSoon} expiring in next 14 days</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Court Utilization</div>
              <div className="text-3xl font-black font-mono text-sky-400">
                {kpis.courtUtilizationPct}%
              </div>
              <div className="text-[10px] text-slate-400">Capacity booked across 7 courts</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operational Health</div>
              <div className="text-xl font-bold font-mono text-white">
                {kpis.openTabsCount} Open Tabs
              </div>
              <div className="text-[10px] text-amber-400 font-semibold">
                {kpis.lowStockCount} low-stock alerts • {kpis.openEnquiries} CRM leads
              </div>
            </div>
          </div>

          {/* Revenue Breakdown by Source */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white">Revenue Sources Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Court Bookings</div>
                <div className="text-2xl font-mono font-bold text-emerald-400">${kpis.breakdown.court.toFixed(2)}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Pro Shop Gear</div>
                <div className="text-2xl font-mono font-bold text-amber-400">${kpis.breakdown.shop.toFixed(2)}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Bar & Cafeteria</div>
                <div className="text-2xl font-mono font-bold text-rose-400">${kpis.breakdown.bar.toFixed(2)}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Membership Dues</div>
                <div className="text-2xl font-mono font-bold text-purple-400">${kpis.breakdown.membership.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER & ROLE MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white">Role-Based Access Control (RBAC)</h3>
            <span className="text-xs text-slate-400">{users.length} registered accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Primary Role</th>
                  <th className="p-3">Assigned Roles</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-white">{u.full_name}</td>
                    <td className="p-3 font-mono text-slate-300">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-emerald-400 border border-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400">{u.assigned_roles}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleUpdateUser(u.id, { status: u.status === 'active' ? 'inactive' : 'active' })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'active' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                        }`}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="member">Member</option>
                        <option value="frontdesk">Front Desk</option>
                        <option value="coach">Coach</option>
                        <option value="shop">Shop Staff</option>
                        <option value="bar">Bar Staff</option>
                        <option value="finance">Finance</option>
                        <option value="hr">HR</option>
                        <option value="admin">Owner / Super Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLUB SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 max-w-3xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-400" />
              <span>System & Club Operational Settings</span>
            </h3>
            {settingsSuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Saved successfully
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Club Business Name</label>
              <input
                type="text"
                value={settings.club_name || ''}
                onChange={(e) => setSettings({ ...settings, club_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Public Tagline</label>
              <input
                type="text"
                value={settings.club_tagline || ''}
                onChange={(e) => setSettings({ ...settings, club_tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cancellation Cutoff (Hours in advance)</label>
                <input
                  type="number"
                  value={settings.cancellation_cutoff_hours || '4'}
                  onChange={(e) => setSettings({ ...settings, cancellation_cutoff_hours: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sales Tax (%)</label>
                <input
                  type="number"
                  value={settings.tax_rate_pct || '5'}
                  onChange={(e) => setSettings({ ...settings, tax_rate_pct: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Daily Facility Operating Hours</label>
              <input
                type="text"
                value={settings.operating_hours || ''}
                onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="py-2.5 px-6 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow"
            >
              {savingSettings ? 'Saving...' : 'Update Settings'}
            </button>
          </form>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white">Immutable Security Audit Trail</h3>
            <span className="text-xs text-slate-400">All authenticated operations</span>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/40 text-[11px]">
                    <td className="p-3 text-slate-400">{log.created_at}</td>
                    <td className="p-3 text-white font-sans">{log.user_email || 'System'}</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded uppercase text-[10px] bg-slate-800 text-purple-400 font-sans">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">{log.action}</td>
                    <td className="p-3 text-slate-400">{log.entity} #{log.entity_id}</td>
                    <td className="p-3 text-slate-400 truncate max-w-xs">{log.metadata || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
