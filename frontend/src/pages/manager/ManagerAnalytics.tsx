import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import { analyticsApi } from '../../services/api';
import { AnalyticsData } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { BarChart3, TrendingUp, Star, Users, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ManagerAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard().then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-400">Loading municipal analytics intelligence...</div>;
  }

  const satisfactionData = [
    { name: '5 Stars', count: data.satisfaction.five_star, color: '#14B8A6' },
    { name: '4 Stars', count: data.satisfaction.four_star, color: '#0F766E' },
    { name: '3 Stars', count: data.satisfaction.three_star, color: '#F59E0B' },
    { name: '2 Stars', count: data.satisfaction.two_star, color: '#FB923C' },
    { name: '1 Star', count: data.satisfaction.one_star, color: '#FF6B6B' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Smart City Analytics Center</h1>
        <p className="text-xs text-slate-500">
          Executive performance indicators, category distributions, crew turnaround times, and citizen satisfaction ratings.
        </p>
      </div>

      {/* Top Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Issues"
          value={data.kpis.total_issues}
          icon={<BarChart3 className="w-5 h-5" />}
          variant="slate"
        />
        <StatCard
          title="Resolution Rate"
          value={`${data.kpis.resolution_rate_percent}%`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="teal"
          change="+8.4% MoM"
        />
        <StatCard
          title="Citizen Rating"
          value={`${data.satisfaction.average_rating} / 5`}
          icon={<Star className="w-5 h-5" />}
          variant="amber"
          subtitle={`${data.satisfaction.total_reviews} verified reviews`}
        />
        <StatCard
          title="High Priority"
          value={data.kpis.high_priority}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="coral"
        />
      </div>

      {/* Row 2: Issues by Category & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Issues by Civic Category</h3>
            <p className="text-xs text-slate-500">Total reported vs successfully resolved</p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categories} margin={{ bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" angle={-25} textAnchor="end" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#FF6B6B" name="Total Reported" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#14B8A6" name="Resolved" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Resolution Trend Area Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Daily Intake & Resolution Rate</h3>
            <p className="text-xs text-slate-500">Intake volume compared with closed work orders</p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="areaReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="areaResolved" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="reported" stroke="#FF6B6B" strokeWidth={2} fill="url(#areaReported)" name="Reported" />
                <Area type="monotone" dataKey="resolved" stroke="#14B8A6" strokeWidth={2} fill="url(#areaResolved)" name="Resolved" />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Department Workloads & Citizen Satisfaction Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Department Operational Workload</h3>
            <p className="text-xs text-slate-500">Assigned vs completed tickets across 5 divisions</p>
          </div>

          <div className="space-y-4 pt-2">
            {data.departments.map((dept) => {
              const total = dept.assigned || 1;
              const rate = Math.round((dept.completed / total) * 100);
              return (
                <div key={dept.department} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{dept.department}</span>
                    <span className="text-slate-500">
                      <strong>{dept.completed}</strong> / {dept.assigned} ({rate}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-[#14B8A6] to-[#0F766E] transition-all"
                      style={{ width: `${rate}%` }}
                    />
                    <div
                      className="h-full bg-amber-400/80 transition-all"
                      style={{ width: `${100 - rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Citizen Satisfaction Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Citizen Satisfaction Breakdown</h3>
              <p className="text-xs text-slate-500">Star ratings distribution from closed issues</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-[#0F766E]">{data.satisfaction.average_rating}</span>
              <span className="text-xs text-slate-400"> / 5.0</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {satisfactionData.map((s) => {
              const pct = data.satisfaction.total_reviews > 0 ? Math.round((s.count / data.satisfaction.total_reviews) * 100) : 0;
              return (
                <div key={s.name} className="flex items-center gap-3 text-xs">
                  <span className="w-16 font-semibold text-slate-700">{s.name}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <span className="w-10 text-right text-slate-500 font-bold">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
