import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  Star,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
} from 'lucide-react';
import { issuesApi, feedbackApi } from '../../services/api';
import { Issue } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const CitizenIssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  // Feedback form state
  const [resolvedStatus, setResolvedStatus] = useState<'YES' | 'PARTIALLY' | 'NO'>('YES');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Reopen state
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);

  useEffect(() => {
    if (id) loadIssue(parseInt(id));
  }, [id]);

  const loadIssue = async (issueId: number) => {
    try {
      const res = await issuesApi.get(issueId);
      setIssue(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;
    setSubmittingFeedback(true);
    try {
      await feedbackApi.submit({
        issue_id: issue.id,
        resolved_status: resolvedStatus,
        rating,
        comment,
      });
      setFeedbackSuccess(true);
      loadIssue(issue.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleReopen = async () => {
    if (!issue || !reopenReason) return;
    setIsReopening(true);
    try {
      await issuesApi.reopen(issue.id, { reason: reopenReason });
      alert('Issue has been reopened for manager review');
      loadIssue(issue.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reopen issue');
    } finally {
      setIsReopening(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading issue details...</div>;
  }

  if (!issue) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-slate-600">Issue not found.</p>
        <Link to="/citizen/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isResolvedOrClosed = ['RESOLVED', 'CLOSED', 'COMPLETED'].includes(issue.status);
  const evidence = issue.work_evidences?.[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link to="/citizen/dashboard" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#0F766E]">{issue.ticket_code}</span>
          <PriorityBadge priority={issue.priority} />
          <StatusBadge status={issue.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Visuals & Evidence */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Photo Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Submitted Image & Geolocation
              </span>
              <span className="text-xs text-slate-400">{issue.ward}</span>
            </div>

            <img
              src={issue.image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800'}
              alt={issue.category}
              className="w-full h-80 object-cover"
            />

            <div className="p-5 space-y-2">
              <h2 className="text-xl font-black text-slate-900">{issue.category}</h2>
              <p className="text-sm text-slate-600">{issue.description}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {issue.address}
              </p>
            </div>
          </div>

          {/* AI Analysis Card */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0F172A] rounded-2xl p-6 text-white border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-300">
                <Sparkles className="w-4 h-4 text-[#FF6B6B]" /> AI DETECTION
              </span>
              <span className="text-[11px] font-mono text-slate-400">YOLOv8-CivicVision-v2.1</span>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-1">
              <div>
                <span className="text-[11px] text-slate-400 block">Classified Category</span>
                <span className="text-base font-bold text-white mt-0.5 block">{issue.ai_classification || issue.category}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">AI Confidence</span>
                <span className="text-base font-extrabold text-[#14B8A6] mt-0.5 block">
                  {Math.round((issue.ai_confidence || 0.94) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Computed Severity</span>
                <span className="text-xs font-bold text-[#FF6B6B] mt-0.5 block">
                  {issue.ai_severity || 'HIGH'}
                </span>
              </div>
            </div>
          </div>

          {/* Before & After Visual Evidence Section (If Resolved) */}
          {evidence && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Work Evidence: Before & After
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ✓ VERIFIED BY MANAGER
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1.5">BEFORE REPAIR</span>
                  <img
                    src={evidence.before_image_url}
                    alt="Before"
                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F766E] uppercase block mb-1.5">AFTER REPAIR</span>
                  <img
                    src={evidence.after_image_url}
                    alt="After"
                    className="w-full h-48 object-cover rounded-xl border border-[#14B8A6]/40 shadow-xs"
                  />
                </div>
              </div>

              {evidence.description && (
                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <strong>Manager Note:</strong> {evidence.description}
                </p>
              )}
            </div>
          )}

          {/* Citizen Feedback Form (When resolved) */}
          {isResolvedOrClosed && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">How would you rate the resolution?</h3>
              <p className="text-xs text-slate-500">
                Your direct evaluation holds municipal crews accountable and improves city services.
              </p>

              {feedbackSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Thank you! Your feedback has been logged and reflected in city analytics.</span>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Is the problem truly resolved?
                    </label>
                    <div className="flex gap-3">
                      {(['YES', 'PARTIALLY', 'NO'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setResolvedStatus(opt)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            resolvedStatus === opt
                              ? opt === 'YES'
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                : opt === 'NO'
                                ? 'bg-rose-50 border-rose-500 text-[#FF6B6B]'
                                : 'bg-amber-50 border-amber-500 text-amber-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Rating ({rating} Stars)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                        >
                          <Star
                            className={`w-7 h-7 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Comments / Feedback
                    </label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Comment on the repair quality and crew response..."
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#14B8A6]"
                    />
                  </div>

                  <Button type="submit" variant="teal" isLoading={submittingFeedback} className="w-full">
                    Submit Satisfaction Rating <Send className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </form>
              )}

              {/* If Unsatisfied: Reopen option */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500 block mb-2">Still not resolved properly?</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Reason for reopening..."
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <Button
                    variant="coral"
                    size="sm"
                    onClick={handleReopen}
                    isLoading={isReopening}
                    disabled={!reopenReason}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reopen Issue
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Progress Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Resolution Progress
            </h3>

            <div className="space-y-4">
              {[
                { status: 'REPORTED', title: 'Issue Reported', desc: 'Registered with image and coordinates' },
                { status: 'VERIFIED', title: 'Manager Verified', desc: 'Category and priority confirmed' },
                { status: 'ASSIGNED', title: 'Work Order Dispatched', desc: 'Assigned to municipal field crew' },
                { status: 'IN_PROGRESS', title: 'Repair In Progress', desc: 'Crew deployed on site' },
                { status: 'RESOLVED', title: 'Verified & Resolved', desc: 'Visual evidence verified by manager' },
              ].map((step, idx) => {
                const isPassed =
                  (step.status === 'REPORTED') ||
                  (step.status === 'VERIFIED' && issue.is_verified_by_manager) ||
                  (step.status === 'ASSIGNED' && ['ASSIGNED', 'IN_PROGRESS', 'VERIFICATION', 'RESOLVED', 'CLOSED'].includes(issue.status)) ||
                  (step.status === 'IN_PROGRESS' && ['IN_PROGRESS', 'VERIFICATION', 'RESOLVED', 'CLOSED'].includes(issue.status)) ||
                  (step.status === 'RESOLVED' && isResolvedOrClosed);

                return (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isPassed
                            ? 'bg-[#14B8A6] text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isPassed ? '✓' : idx + 1}
                      </div>
                      {idx < 4 && (
                        <div
                          className={`w-0.5 h-8 my-1 ${
                            isPassed ? 'bg-[#14B8A6]' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>

                    <div className="pt-0.5">
                      <p className={`text-xs font-bold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
