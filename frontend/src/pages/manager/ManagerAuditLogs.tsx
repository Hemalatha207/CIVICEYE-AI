import React, { useState, useEffect } from 'react';
import { History, Search, Shield, Filter } from 'lucide-react';
import { auditApi } from '../../services/api';
import { AuditLogItem } from '../../types';

export const ManagerAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, [filterAction]);

  const loadAuditLogs = async () => {
    try {
      const res = await auditApi.list({ action: filterAction !== 'ALL' ? filterAction : undefined });
      setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.user_email && l.user_email.toLowerCase().includes(search.toLowerCase())) ||
      (l.entity && l.entity.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-[#0F766E]" /> System Security & Operations Audit Trail
        </h1>
        <p className="text-xs text-slate-500">
          Immutable event log tracking logins, AI analyses, issue triages, work order dispatches, and evidence approvals.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by action, user, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs outline-none"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="border border-slate-300 rounded-lg text-xs py-2 px-3 bg-white outline-none w-full sm:w-auto"
        >
          <option value="ALL">All Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="ISSUE_CREATED">ISSUE_CREATED</option>
          <option value="ISSUE_VERIFIED">ISSUE_VERIFIED</option>
          <option value="WORK_ORDER_CREATED">WORK_ORDER_CREATED</option>
          <option value="WORK_COMPLETED">WORK_COMPLETED</option>
          <option value="WORK_VERIFIED">WORK_VERIFIED</option>
          <option value="FEEDBACK_CREATED">FEEDBACK_CREATED</option>
          <option value="ADMINISTRATIVE_ACTION">ADMINISTRATIVE_ACTION</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading audit trail...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No audit entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">
                      {log.user_email || 'SYSTEM'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-teal-50 text-[#0F766E] border border-teal-200 font-bold px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-700">{log.entity}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.entity_id || '-'}</td>
                    <td className="py-3 px-4 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
