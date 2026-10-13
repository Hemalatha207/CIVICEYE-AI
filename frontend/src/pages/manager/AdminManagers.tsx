import React, { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  Phone,
  Mail,
  Search,
  Shield,
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { staffApi, authApi, departmentsApi } from '../../services/api';
import { Department } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

interface ManagerItem {
  id: number;
  name: string;
  avatar: string;
  title: string;
  city: string;
  location: string;
  phone: string;
  email: string;
  department: string;
  status: string;
  issuesResolved: number;
  activeWorkOrders: number;
  responseTimeAvg: string;
  joinedDate: string;
  badge: string;
  badgeColor: string;
  assignedWards?: string[];
  coordinates?: string;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ON_LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
  INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
};

const DEPT_COLORS: Record<string, string> = {
  'Road & Infrastructure Maintenance': 'bg-orange-50 text-orange-700',
  'Water Supply & Underground Drainage': 'bg-blue-50 text-blue-700',
  'Electrical & Street Lighting Network': 'bg-yellow-50 text-yellow-700',
  'Sanitation & Solid Waste Management': 'bg-green-50 text-green-700',
  'Public Works & Environmental Infrastructure': 'bg-teal-50 text-teal-700',
  'Executive Operations': 'bg-purple-50 text-purple-700',
};

export const AdminManagers: React.FC = () => {
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedManager, setSelectedManager] = useState<ManagerItem | null>(null);

  // Add Manager Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDeptId, setNewDeptId] = useState<number | ''>('');
  const [newDesignation, setNewDesignation] = useState('Regional Operations Manager');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mgrRes, deptsRes] = await Promise.all([
        staffApi.getManagersDirectory(),
        departmentsApi.list()
      ]);
      setManagers(mgrRes.data);
      setDepartments(deptsRes.data);
      if (deptsRes.data.length > 0 && !newDeptId) {
        setNewDeptId(deptsRes.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load managers directory:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      await authApi.createUser({
        full_name: newName,
        email: newEmail,
        password: newPassword,
        phone_number: newPhone,
        role: 'MANAGER',
        department_id: newDeptId ? Number(newDeptId) : undefined,
        designation: newDesignation
      });
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      await loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to create manager account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = managers.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.city && m.city.toLowerCase().includes(search.toLowerCase())) ||
      (m.department && m.department.toLowerCase().includes(search.toLowerCase())) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalResolved = managers.reduce((s, m) => s + (m.issuesResolved || 0), 0);
  const activeCount = managers.filter((m) => m.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#14B8A6]" />
            City Managers Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin governance — regional civic operations managers, ward assignments, and operational rosters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="teal"
            size="sm"
            onClick={() => setShowAddModal(true)}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            Provision Manager
          </Button>
          <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full">
            Admin Access Only
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Managers', value: managers.length, icon: Users, color: 'text-[#14B8A6] bg-teal-50' },
          { label: 'Active on Duty', value: activeCount, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Issues Handled', value: totalResolved, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
          { label: 'Departments', value: departments.length, icon: Building2, color: 'text-blue-600 bg-blue-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-xs">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, city, or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#14B8A6] outline-none bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {['ALL', 'ACTIVE', 'ON_LEAVE', 'INACTIVE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#14B8A6] text-white border-[#14B8A6]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#14B8A6]'
              }`}
            >
              {s === 'ALL' ? 'All' : s === 'ON_LEAVE' ? 'On Leave' : s === 'INACTIVE' ? 'Inactive' : 'Active'}
            </button>
          ))}
        </div>
      </div>

      {/* Managers Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading managers directory...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#14B8A6] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No managers found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {managers.length === 0
                ? "No regional operations managers have been provisioned yet. Use the 'Provision Manager' button to add your operational management team."
                : "No managers match your search criteria."}
            </p>
          </div>
          {managers.length === 0 && (
            <Button
              variant="teal"
              size="sm"
              onClick={() => setShowAddModal(true)}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Provision First Manager
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((manager) => (
            <div
              key={manager.id}
              onClick={() => setSelectedManager(selectedManager?.id === manager.id ? null : manager)}
              className={`bg-white rounded-2xl border shadow-xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                selectedManager?.id === manager.id
                  ? 'border-[#14B8A6] ring-2 ring-[#14B8A6]/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 flex items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={manager.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${manager.name}`}
                    alt={manager.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      manager.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{manager.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{manager.title}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[manager.status] || STATUS_STYLES.ACTIVE}`}>
                        {manager.status === 'ON_LEAVE' ? 'On Leave' : manager.status}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${manager.badgeColor || 'text-teal-600 bg-teal-50 border-teal-200'}`}>
                        ★ {manager.badge}
                      </span>
                    </div>
                  </div>

                  {/* Department pill */}
                  <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md ${DEPT_COLORS[manager.department] || 'bg-slate-100 text-slate-600'}`}>
                    {manager.department}
                  </span>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="px-5 pb-4 space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-[#14B8A6] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">{manager.city}</p>
                    <p className="text-slate-500">{manager.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                  <a href={`tel:${manager.phone}`} className="font-semibold text-slate-800 hover:text-[#14B8A6] transition">
                    {manager.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                  <a href={`mailto:${manager.email}`} className="text-slate-600 hover:text-[#14B8A6] transition truncate">
                    {manager.email}
                  </a>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="px-5 pb-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Resolved', value: manager.issuesResolved || 0, color: 'text-emerald-600' },
                  { label: 'Active WOs', value: manager.activeWorkOrders || 0, color: 'text-[#14B8A6]' },
                  { label: 'Avg Turnaround', value: manager.responseTimeAvg || '2.0 hrs', color: 'text-purple-600' },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                    <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Expand hint */}
              <div className="px-5 pb-3 flex items-center justify-end">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  {selectedManager?.id === manager.id ? 'Hide details' : 'View full details'}
                  <ChevronRight className={`w-3 h-3 transition-transform ${selectedManager?.id === manager.id ? 'rotate-90' : ''}`} />
                </span>
              </div>

              {/* Expanded Detail Panel */}
              {selectedManager?.id === manager.id && (
                <div className="border-t border-slate-100 px-5 py-4 bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-b-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white rounded-xl border border-slate-200 p-3">
                      <p className="text-[10px] text-slate-400 font-medium">Headquarters</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{manager.location}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-3">
                      <p className="text-[10px] text-slate-400 font-medium">Joined System</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {manager.joinedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${manager.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#14B8A6] text-white text-xs font-bold rounded-xl hover:bg-[#0F766E] transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Manager
                    </a>
                    <a
                      href={`mailto:${manager.email}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-3.5 h-3.5" /> Send Email
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Provision Manager Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Provision Operations Manager"
        maxWidth="md"
      >
        <form onSubmit={handleCreateManager} className="space-y-4">
          <p className="text-xs text-slate-500">
            Create an operational manager account with administrative authority to triage civic tickets, dispatch work orders, and supervise field workers.
          </p>

          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#14B8A6]"
              placeholder="e.g. David Sterling"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#14B8A6]"
                placeholder="manager@citygov.org"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#14B8A6]"
                placeholder="Secure password"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#14B8A6]"
                placeholder="+1 (555) 014-8892"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
              <select
                value={newDeptId}
                onChange={(e) => setNewDeptId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#14B8A6] bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Designation</label>
            <input
              type="text"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#14B8A6]"
              placeholder="e.g. Senior Civic Operations Manager"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="teal" type="submit" isLoading={isSubmitting}>
              Create & Provision Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
