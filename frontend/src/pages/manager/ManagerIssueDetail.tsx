import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  UserCheck,
  Building2,
  Clock,
  Send,
  Copy,
} from 'lucide-react';
import { issuesApi, workOrdersApi, staffApi, departmentsApi } from '../../services/api';
import { Issue, Staff, Department } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CivicMap } from '../../components/maps/CivicMap';

export const ManagerIssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Triage & Verification Form
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifiedCategory, setVerifiedCategory] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [departmentId, setDepartmentId] = useState<number>(1);
  const [managerNotes, setManagerNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Dispatch Work Order Form
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [workerId, setWorkerId] = useState<number>(1);
  const [instructions, setInstructions] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    if (id) loadData(parseInt(id));
  }, [id]);

  const loadData = async (issueId: number) => {
    try {
      const [issueRes, staffRes, deptsRes] = await Promise.all([
        issuesApi.get(issueId),
        staffApi.list(),
        departmentsApi.list(),
      ]);
      setIssue(issueRes.data);
      setStaffList(staffRes.data);
      setDepartments(deptsRes.data);

      setVerifiedCategory(issueRes.data.category);
      setPriority(issueRes.data.priority || 'HIGH');
      setDepartmentId(issueRes.data.department_id || 1);
      setInstructions(`Repair and resurface ${issueRes.data.category.toLowerCase()} near ${issueRes.data.address}.`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;
    setIsVerifying(true);
    try {
      await issuesApi.verify(issue.id, {
        verified_category: verifiedCategory,
        priority,
        department_id: departmentId,
        manager_notes: managerNotes || 'Verified by Operations Manager.',
      });
      setShowVerifyModal(false);
      loadData(issue.id);
      alert('Issue verified and updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;
    setIsCreatingOrder(true);
    try {
      await workOrdersApi.create({
        issue_id: issue.id,
        department_id: departmentId,
        worker_id: workerId,
        priority,
        instructions,
      });
      setShowWorkOrderModal(false);
      alert('Work order created and worker assigned!');
      navigate('/manager/work-orders');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create work order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading issue triage workspace...</div>;
  if (!issue) return <div className="p-12 text-center text-slate-500">Issue not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/manager/issues" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Issues Directory
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowVerifyModal(true)} icon={<CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />}>
            Verify Issue
          </Button>
          <Button variant="coral" size="sm" onClick={() => setShowWorkOrderModal(true)} icon={<ClipboardList className="w-4 h-4" />}>
            Dispatch Work Order
          </Button>
        </div>
      </div>

      {/* Duplicate Warning Alert (If applicable) */}
      {issue.possible_duplicates && issue.possible_duplicates.length > 0 && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 flex items-start gap-3 text-xs text-amber-900">
          <Copy className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Possible Duplicate Reports Detected Nearby:</span>
            <p className="mt-0.5">
              Found {issue.possible_duplicates.length} other ticket(s) with matching category within 400m of this location. Citizen records remain intact and linked for operational review.
            </p>
          </div>
        </div>
      )}

      {/* Two-Column Triage Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Visuals, AI & Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Large Image Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Ticket: {issue.ticket_code}
              </span>
              <span className="text-xs text-slate-400 font-medium">{issue.ward}</span>
            </div>

            <img
              src={issue.image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800'}
              alt={issue.category}
              className="w-full h-80 object-cover"
            />
          </div>

          {/* AI Analysis Dedicated Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white border border-teal-800/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-300">
                <Sparkles className="w-4 h-4 text-[#FF6B6B]" /> AI VISION DETECTION
              </span>
              <span className="text-[11px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                YOLOv8-CivicVision-v2.1
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-1">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block font-medium">Predicted Category</span>
                <span className="text-base font-extrabold text-white mt-1 block">
                  {issue.ai_classification || issue.category}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block font-medium">Inference Confidence</span>
                <span className="text-xl font-black text-[#14B8A6] mt-1 block">
                  {Math.round((issue.ai_confidence || 0.94) * 100)}%
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block font-medium">Hazard Severity</span>
                <span className="text-xs font-black text-[#FF6B6B] mt-1 inline-block bg-[#FFF0F0] px-2 py-0.5 rounded">
                  {issue.ai_severity || 'HIGH'}
                </span>
              </div>
            </div>
          </div>

          {/* Location Map Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#14B8A6]" /> Geolocation Context: {issue.address}
            </h3>
            <CivicMap issues={[issue]} center={[issue.latitude, issue.longitude]} zoom={15} height="240px" />
          </div>
        </div>

        {/* Right Column (1 Col): Triage & Status Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Ticket Triage</h3>
              <StatusBadge status={issue.status} />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Reported Category</span>
                <span className="text-sm font-bold text-slate-900">{issue.category}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Manager Verified Category</span>
                <span className="text-sm font-bold text-[#0F766E]">
                  {issue.verified_category || 'Pending Verification'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Current Priority</span>
                <PriorityBadge priority={issue.priority} />
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Assigned Department</span>
                <span className="font-semibold text-slate-800">
                  {issue.department?.name || 'Road Maintenance'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Citizen Description</span>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 mt-1">
                  {issue.description}
                </p>
              </div>

              {issue.manager_notes && (
                <div>
                  <span className="text-slate-400 font-medium block">Manager Review Notes</span>
                  <p className="p-2.5 bg-teal-50/50 rounded-lg border border-teal-200 text-[#0F766E] mt-1 font-medium">
                    {issue.manager_notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button variant="teal" onClick={() => setShowVerifyModal(true)} className="w-full">
                Verify / Change Priority
              </Button>
              <Button variant="coral" onClick={() => setShowWorkOrderModal(true)} className="w-full">
                Assign Work Order
              </Button>
            </div>
          </div>

          {/* Status History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
              Audit Status History
            </h3>

            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {(issue.status_history || []).map((h, i) => (
                <div key={i} className="flex gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#14B8A6] mt-1.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{h.to_status}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {h.comment && <p className="text-[11px] text-slate-500 mt-0.5">{h.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Verify Issue Modal */}
      <Modal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} title="Verify & Triage Civic Issue">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm Category</label>
            <input
              type="text"
              required
              value={verifiedCategory}
              onChange={(e) => setVerifiedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="CRITICAL">CRITICAL (Immediate Dispatch)</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Manager Notes</label>
            <textarea
              rows={3}
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              placeholder="Notes on severity, urgency or public safety..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowVerifyModal(false)}>
              Cancel
            </Button>
            <Button variant="teal" type="submit" isLoading={isVerifying}>
              Confirm Verification
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dispatch Work Order Modal */}
      <Modal isOpen={showWorkOrderModal} onClose={() => setShowWorkOrderModal(false)} title="Dispatch Field Work Order">
        <form onSubmit={handleCreateWorkOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Field Worker</label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.designation} ({s.department_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Instructions for Worker</label>
            <textarea
              rows={3}
              required
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Repair pothole near Ward 4 bus stop with asphalt compaction."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowWorkOrderModal(false)}>
              Cancel
            </Button>
            <Button variant="coral" type="submit" isLoading={isCreatingOrder}>
              Create Work Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
