import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, AlertTriangle, ArrowRight, MapPin, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { issuesApi } from '../../services/api';
import { Issue } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyReports();
  }, []);

  const loadMyReports = async () => {
    try {
      const res = await issuesApi.list({ my_reports: true });
      setIssues(res.data);
    } catch (e) {
      console.error('Failed to load citizen issues', e);
    } finally {
      setLoading(false);
    }
  };

  const total = issues.length;
  const pending = issues.filter((i) => ['REPORTED', 'PENDING_REVIEW', 'VERIFIED'].includes(i.status)).length;
  const inProgress = issues.filter((i) => ['ASSIGNED', 'IN_PROGRESS', 'VERIFICATION'].includes(i.status)).length;
  const resolved = issues.filter((i) => ['RESOLVED', 'CLOSED', 'COMPLETED'].includes(i.status)).length;

  return (
    <div className="space-y-8">
      {/* Hero Welcome & CTA Banner */}
      <div className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-teal-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-teal-200 text-xs font-bold uppercase tracking-wider">Citizen Portal</span>
          <h1 className="text-2xl md:text-3xl font-black mt-1">
            Good morning, {user?.full_name?.split(' ')[0] || 'Citizen'}!
          </h1>
          <p className="text-teal-50 text-sm mt-1 max-w-xl">
            Spot a problem in your street? Submit a photo and location. Our AI instantly classifies severity and routes it directly to municipal crews.
          </p>
        </div>

        <Link to="/citizen/report">
          <Button variant="coral" size="lg" className="shadow-lg hover:scale-105 transition-transform text-white font-extrabold gap-2">
            <PlusCircle className="w-5 h-5" /> REPORT AN ISSUE
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Reports"
          value={total}
          icon={<AlertTriangle className="w-6 h-6" />}
          variant="slate"
        />
        <StatCard
          title="Pending Review"
          value={pending}
          icon={<Clock className="w-6 h-6" />}
          variant="amber"
        />
        <StatCard
          title="In Progress"
          value={inProgress}
          icon={<Clock className="w-6 h-6" />}
          variant="blue"
        />
        <StatCard
          title="Resolved"
          value={resolved}
          icon={<CheckCircle2 className="w-6 h-6" />}
          variant="teal"
        />
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Recent Civic Reports</h2>
            <p className="text-xs text-slate-500">Track progress from AI analysis to completion</p>
          </div>
          <Link to="/citizen/my-reports" className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading your reports...</div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-slate-500">You haven't reported any civic issues yet.</p>
            <Link to="/citizen/report">
              <Button variant="teal" size="sm">+ Report Your First Issue</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.slice(0, 5).map((issue) => (
              <div
                key={issue.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-lg transition"
              >
                <div className="flex items-start gap-4">
                  {issue.image_url ? (
                    <img
                      src={issue.image_url}
                      alt={issue.category}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-[#0F766E]">{issue.ticket_code}</span>
                      <PriorityBadge priority={issue.priority} />
                      <StatusBadge status={issue.status} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{issue.category}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{issue.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {issue.address} • {new Date(issue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <Link to={`/citizen/report/${issue.id}`}>
                    <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                      View Status & Evidence
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
