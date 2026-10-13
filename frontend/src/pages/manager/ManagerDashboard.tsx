import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Users,
  Shield,
  MapPin,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { analyticsApi, issuesApi, workOrdersApi } from '../../services/api';
import { AnalyticsData, Issue, WorkOrder } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { CivicMap } from '../../components/maps/CivicMap';
import { Button } from '../../components/ui/Button';

export const ManagerDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [analyticsRes, issuesRes, workOrdersRes] = await Promise.all([
        analyticsApi.getDashboard(),
        issuesApi.list({ limit: 100 }),
        workOrdersApi.list({ limit: 5 }),
      ]);
      setAnalytics(analyticsRes.data);
      setIssues(issuesRes.data);
      setWorkOrders(workOrdersRes.data);
    } catch (e) {
      console.error('Failed to load manager dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  const highPriorityIssues = issues.filter(
    (i) => (i.priority === 'HIGH' || i.priority === 'CRITICAL') && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
  );

  const PRIORITY_COLORS: { [key: string]: string } = {
    CRITICAL: '#FF6B6B',
    HIGH: '#E85D5D',
    MEDIUM: '#F59E0B',
    LOW: '#14B8A6',
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Metropolis Municipal Command Center
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Good morning, Manager
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Here's what's happening across your civic area today. AI triage engine active.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/manager/map">
            <Button variant="outline" size="sm" icon={<MapPin className="w-4 h-4" />}>
              Live GIS Map
            </Button>
          </Link>
          <Link to="/manager/issues">
            <Button variant="teal" size="sm" icon={<AlertCircle className="w-4 h-4" />}>
              Triage Civic Issues
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Issues"
          value={analytics?.kpis.total_issues ?? 0}
          subtitle="All recorded reports"
          icon={<AlertCircle className="w-5 h-5" />}
          variant="slate"
        />
        <StatCard
          title="Pending Triage"
          value={analytics?.kpis.pending ?? 0}
          subtitle="Awaiting verification"
          icon={<Clock className="w-5 h-5" />}
          variant="amber"
        />
        <StatCard
          title="In Progress"
          value={analytics?.kpis.in_progress ?? 0}
          subtitle="Assigned to crew"
          icon={<ClipboardList className="w-5 h-5" />}
          variant="blue"
        />
        <StatCard
          title="Resolved"
          value={analytics?.kpis.resolved ?? 0}
          subtitle={`${analytics?.kpis.resolution_rate_percent ?? 0}% resolution rate`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="teal"
          change="+0% wk"
        />
        <StatCard
          title="High Priority"
          value={analytics?.kpis.high_priority ?? 0}
          subtitle="Urgent public safety"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="coral"
        />
      </div>

      {/* Row 2: Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">7-Day Civic Issue Trend</h3>
              <p className="text-xs text-slate-500">Reported issues vs resolved tickets</p>
            </div>
            <span className="text-xs font-semibold text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Live Feed
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.trends || []}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="reported" stroke="#FF6B6B" strokeWidth={2} fillOpacity={1} fill="url(#colorReported)" name="Reported" />
                <Area type="monotone" dataKey="resolved" stroke="#14B8A6" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Priority Distribution</h3>
              <span className="text-[11px] font-bold text-slate-500 uppercase">Current Triage</span>
            </div>

            <div className="h-48 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.priorities || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="priority"
                  >
                    {(analytics?.priorities || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {(analytics?.priorities || []).map((p) => (
              <div key={p.priority} className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded">
                <span className="flex items-center gap-1.5 font-bold" style={{ color: PRIORITY_COLORS[p.priority] }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p.priority] }} />
                  {p.priority}
                </span>
                <span className="font-extrabold text-slate-800">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Civic Map & High Priority Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Civic Map (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#14B8A6]" /> Metropolitan Smart City GIS Map
              </h3>
              <p className="text-xs text-slate-500">Live geo-tagged issues across 7 municipal wards</p>
            </div>
            <Link to="/manager/map" className="text-xs font-bold text-[#0F766E] hover:underline">
              Full Screen &rarr;
            </Link>
          </div>

          <CivicMap issues={issues.slice(0, 50)} height="380px" />
        </div>

        {/* High Priority Issues List (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FF6B6B]" /> Urgent Action Queue
              </h3>
              <span className="bg-[#FFF0F0] text-[#E85D5D] border border-[#FF6B6B]/30 px-2 py-0.5 rounded text-xs font-extrabold">
                {highPriorityIssues.length} Urgent
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 max-h-80 overflow-y-auto">
              {highPriorityIssues.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-[#14B8A6] mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-700 text-xs">No urgent issues</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All critical public safety tickets are resolved.</p>
                </div>
              ) : (
                highPriorityIssues.slice(0, 5).map((issue) => (
                  <div key={issue.id} className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#0F766E]">{issue.ticket_code}</span>
                      <PriorityBadge priority={issue.priority} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{issue.category}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{issue.address}</p>
                    <div className="flex items-center justify-between pt-1">
                      <StatusBadge status={issue.status} />
                      <Link to={`/manager/issues/${issue.id}`}>
                        <span className="text-[11px] font-bold text-[#0F766E] hover:underline flex items-center">
                          Verify / Assign &rarr;
                        </span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link to="/manager/issues?priority=HIGH">
              <Button variant="outline" size="sm" className="w-full">
                View All High Priority Tickets
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Work Orders & Staff Workload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Work Orders */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#0F766E]" /> Active Work Orders
              </h3>
              <p className="text-xs text-slate-500">Field dispatch status & crew assignments</p>
            </div>
            <Link to="/manager/work-orders" className="text-xs font-bold text-[#0F766E] hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {workOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-xs">No active work orders</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Verified civic issues will appear here when dispatched to staff.</p>
              </div>
            ) : (
              workOrders.map((wo) => (
                <div key={wo.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#0F766E]">{wo.order_code}</span>
                      <StatusBadge status={wo.status} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1">{wo.instructions}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Worker: <strong>{wo.worker_name}</strong> • Dept: {wo.department_name}
                    </p>
                  </div>
                  <Link to="/manager/work-orders">
                    <Button variant="outline" size="sm">Manage</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department Workloads */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#14B8A6]" /> Department Workload Breakdown
              </h3>
              <p className="text-xs text-slate-500">Real-time throughput per municipal division</p>
            </div>
            <Link to="/manager/staff" className="text-xs font-bold text-[#0F766E] hover:underline">
              Staff Portal &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {(analytics?.departments || []).map((dept) => {
              const totalDept = dept.assigned || 1;
              const pct = Math.round((dept.completed / totalDept) * 100);
              return (
                <div key={dept.department} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{dept.department}</span>
                    <span className="text-slate-500">
                      <strong>{dept.completed}</strong> / {dept.assigned} completed ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#14B8A6] to-[#0F766E] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
