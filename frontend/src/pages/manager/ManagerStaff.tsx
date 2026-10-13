import React, { useState, useEffect } from 'react';
import {
  Users,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  FileText,
  UserCheck,
  Search,
} from 'lucide-react';
import { staffApi, resignationsApi } from '../../services/api';
import { Staff, ResignationItem } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const ManagerStaff: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [resignations, setResignations] = useState<ResignationItem[]>([]);
  const [tab, setTab] = useState<'directory' | 'resignations'>('directory');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Admin action modal state
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [actionType, setActionType] = useState('WARNING');
  const [actionReason, setActionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [staffRes, resigRes] = await Promise.all([
        staffApi.list(),
        resignationsApi.list(),
      ]);
      setStaffList(staffRes.data);
      setResignations(resigRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setIsSubmittingAction(true);
    try {
      await staffApi.adminAction(selectedStaff.id, {
        action_type: actionType,
        reason: actionReason,
      });
      alert(`Administrative action [${actionType}] recorded on staff profile with full audit trail.`);
      setShowAdminModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record administrative action');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReviewResignation = async (id: number, status: string) => {
    try {
      await resignationsApi.review(id, {
        status,
        review_comments: `Reviewed by Operations Manager: ${status}`,
      });
      alert(`Resignation ${status.toLowerCase()} successfully.`);
      loadData();
    } catch (err: any) {
      alert('Failed to review resignation');
    }
  };

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.employment_status === 'ACTIVE').length;
  const onLeaveStaff = staffList.filter((s) => s.employment_status === 'ON_LEAVE').length;
  const pendingResignations = resignations.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      s.designation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Municipal Staff Management</h1>
          <p className="text-xs text-slate-500">
            Workforce roster, performance tracking, resignations workflow, and administrative governance.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === 'directory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff Directory ({totalStaff})
          </button>
          <button
            onClick={() => setTab('resignations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tab === 'resignations' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resignations
            {pendingResignations > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF6B6B] text-white text-[10px] font-bold flex items-center justify-center">
                {pendingResignations}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase block">Total Roster</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalStaff}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase block">Active on Duty</span>
          <span className="text-2xl font-black text-[#14B8A6] mt-1 block">{activeStaff}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase block">On Leave</span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">{onLeaveStaff}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase block">Resignation Queue</span>
          <span className="text-2xl font-black text-[#FF6B6B] mt-1 block">{pendingResignations}</span>
        </div>
      </div>

      {/* Directory Tab */}
      {tab === 'directory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none"
              />
            </div>
            <span className="text-xs text-slate-400">Never permanently delete historical staff records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Work Tasks</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={staff.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.name}`}
                          alt={staff.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{staff.name}</p>
                          <span className="font-mono text-[10px] text-slate-400">{staff.employee_id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{staff.department_name}</p>
                      <p className="text-[11px] text-slate-500">{staff.designation}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{staff.tasks_completed}</span> / {staff.tasks_assigned} done
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {staff.tasks_pending} pending tasks
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-amber-400" /> {staff.citizen_rating}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {staff.attendance_rate}%
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={staff.employment_status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setShowAdminModal(true);
                        }}
                        icon={<ShieldAlert className="w-3.5 h-3.5 text-slate-500" />}
                      >
                        Action Log
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resignations Tab */}
      {tab === 'resignations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Formal Resignation Review</h3>
            <p className="text-xs text-slate-500">
              Audit-compliant resignation review with required last working day and knowledge transfer comments.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {resignations.length === 0 ? (
              <p className="text-xs text-slate-400 p-4">No resignation requests filed.</p>
            ) : (
              resignations.map((r) => (
                <div key={r.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{r.staff_name}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1"><strong>Reason:</strong> {r.reason}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Requested Last Date: <strong>{r.requested_last_date}</strong> • Filed on: {r.request_date}
                    </p>
                  </div>

                  {r.status === 'UNDER_REVIEW' || r.status === 'SUBMITTED' ? (
                    <div className="flex items-center gap-2">
                      <Button variant="teal" size="sm" onClick={() => handleReviewResignation(r.id, 'APPROVED')}>
                        Approve
                      </Button>
                      <Button variant="coral" size="sm" onClick={() => handleReviewResignation(r.id, 'REJECTED')}>
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">Processed</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Administrative Action Modal (Section 21) */}
      <Modal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        title={`Administrative Action: ${selectedStaff?.name || 'Staff'}`}
      >
        <form onSubmit={handleAdminAction} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
            <strong>Governance Notice:</strong> Staff records cannot be simply deleted. Every disciplinary warning, suspension, promotion, or dismissal is recorded into the immutable audit ledger.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Action Type</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="COMMENDATION">COMMENDATION (Performance Award)</option>
              <option value="WARNING">WARNING (Official Notice)</option>
              <option value="SUSPENSION">SUSPENSION (Temporary Duty Hold)</option>
              <option value="SALARY_REVIEW">SALARY_REVIEW (Compensation Adjustment)</option>
              <option value="INQUIRY">INQUIRY (Work Quality Investigation)</option>
              <option value="DISMISSAL">DISMISSAL (Termination with Cause)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Detailed Reason & Evidence</label>
            <textarea
              rows={3}
              required
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="State formal findings, incident dates, or achievements..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowAdminModal(false)}>
              Cancel
            </Button>
            <Button variant="teal" type="submit" isLoading={isSubmittingAction}>
              Record Administrative Action
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
