import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, MapPin, Eye } from 'lucide-react';
import { issuesApi } from '../../services/api';
import { Issue } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const CitizenReports: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const loadReports = async () => {
    try {
      const res = await issuesApi.list({ my_reports: true, status: filterStatus });
      setIssues(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = issues.filter(
    (i) =>
      i.ticket_code.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Civic Submissions</h1>
          <p className="text-xs text-slate-500">Track and manage every issue you have reported.</p>
        </div>
        <Link to="/citizen/report">
          <Button variant="coral" icon={<PlusCircle className="w-4 h-4" />}>
            Report New Issue
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ticket or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#14B8A6]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-300 rounded-lg text-xs py-2 px-3 bg-white outline-none w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="VERIFIED">Verified</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REOPENED">Reopened</option>
          </select>
        </div>
      </div>

      {/* Issues Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No reports found matching criteria.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((issue) => (
              <div
                key={issue.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={issue.image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800'}
                    alt={issue.category}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0F766E]">{issue.ticket_code}</span>
                      <PriorityBadge priority={issue.priority} />
                      <StatusBadge status={issue.status} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{issue.category}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{issue.description}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {issue.address} • Reported on{' '}
                      {new Date(issue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="self-end md:self-center">
                  <Link to={`/citizen/report/${issue.id}`}>
                    <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
