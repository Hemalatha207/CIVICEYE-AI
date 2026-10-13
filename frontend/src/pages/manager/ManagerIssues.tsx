import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, AlertTriangle, Eye, MapPin, CheckCircle2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { issuesApi } from '../../services/api';
import { Issue } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const ManagerIssues: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPriority = searchParams.get('priority') || 'ALL';

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [priority, setPriority] = useState(initialPriority);
  const [status, setStatus] = useState('ALL');
  const [ward, setWard] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    loadIssues();
  }, [category, priority, status, ward]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await issuesApi.list({
        category: category !== 'ALL' ? category : undefined,
        priority: priority !== 'ALL' ? priority : undefined,
        status: status !== 'ALL' ? status : undefined,
        ward: ward !== 'ALL' ? ward : undefined,
        limit: 300,
      });
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
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      i.address.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Civic Issues Directory</h1>
          <p className="text-xs text-slate-500">
            Triage, verify AI detections, assign municipal departments, and monitor repair status.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          Showing <strong>{filtered.length}</strong> matching tickets
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by ticket ID, address, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#14B8A6]"
            />
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-[#14B8A6]"
            >
              <option value="ALL">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Garbage">Garbage</option>
              <option value="Streetlight Damage">Streetlight Damage</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Drainage Issue">Drainage Issue</option>
              <option value="Fallen Tree">Fallen Tree</option>
            </select>
          </div>

          <div>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-[#14B8A6]"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-[#14B8A6]"
            >
              <option value="ALL">All Statuses</option>
              <option value="REPORTED">Reported</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="VERIFICATION">Verification</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading issues table...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No issues found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Issue Details</th>
                  <th className="py-3 px-4">Location / Ward</th>
                  <th className="py-3 px-4">AI Detection</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F766E]">
                      {issue.ticket_code}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={issue.image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800'}
                          alt={issue.category}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{issue.category}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{issue.description}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800 line-clamp-1">{issue.address}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{issue.ward}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
                        <span className="font-bold text-slate-800">{issue.ai_classification || issue.category}</span>
                        <span className="text-[10px] font-semibold text-[#0F766E] bg-teal-50 px-1.5 py-0.5 rounded">
                          {Math.round((issue.ai_confidence || 0.94) * 100)}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={issue.priority} />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={issue.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/manager/issues/${issue.id}`}>
                        <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({filtered.length} total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
