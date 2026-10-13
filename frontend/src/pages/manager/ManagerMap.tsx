import React, { useState, useEffect } from 'react';
import { issuesApi } from '../../services/api';
import { Issue } from '../../types';
import { CivicMap } from '../../components/maps/CivicMap';
import { MapPin, Filter, Layers } from 'lucide-react';

export const ManagerMap: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapIssues();
  }, [filterPriority, filterStatus]);

  const loadMapIssues = async () => {
    try {
      const res = await issuesApi.list({
        priority: filterPriority !== 'ALL' ? filterPriority : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        limit: 300,
      });
      setIssues(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#14B8A6]" /> Metropolitan Smart City GIS Command Map
          </h1>
          <p className="text-xs text-slate-500">
            Interactive geographical map of civic alerts, repair teams, and infrastructure status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-slate-300 rounded-lg text-xs py-1.5 px-3 bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="MEDIUM">Medium</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-300 rounded-lg text-xs py-1.5 px-3 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="REPORTED">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs">
        {loading ? (
          <div className="h-[650px] flex items-center justify-center text-slate-400">Loading GIS data...</div>
        ) : (
          <CivicMap issues={issues} height="650px" />
        )}
      </div>
    </div>
  );
};
