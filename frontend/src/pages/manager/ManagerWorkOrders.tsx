import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Play,
  CheckSquare,
  Upload,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  Camera,
  Image,
  X,
  RefreshCw,
} from 'lucide-react';
import { workOrdersApi } from '../../services/api';
import { WorkOrder } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const ManagerWorkOrders: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Evidence modal state
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState('');
  const [afterUrl, setAfterUrl] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState<'before' | 'after' | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const beforeFileInputRef = React.useRef<HTMLInputElement>(null);
  const afterFileInputRef = React.useRef<HTMLInputElement>(null);

  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (target: 'before' | 'after') => {
    stopCamera();
    setCameraActive(target);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert('Camera access denied or device has no camera available.');
      setCameraActive(null);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `${cameraActive}_repair_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      if (cameraActive === 'before') {
        setBeforeFile(file);
        setBeforeUrl(previewUrl);
      } else {
        setAfterFile(file);
        setAfterUrl(previewUrl);
      }
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleDeviceUpload = (target: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (target === 'before') {
      setBeforeFile(file);
      setBeforeUrl(previewUrl);
    } else {
      setAfterFile(file);
      setAfterUrl(previewUrl);
    }
  };

  const handleClearImage = (target: 'before' | 'after') => {
    if (target === 'before') {
      setBeforeFile(null);
      setBeforeUrl('');
      if (beforeFileInputRef.current) beforeFileInputRef.current.value = '';
    } else {
      setAfterFile(null);
      setAfterUrl('');
      if (afterFileInputRef.current) afterFileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    try {
      const res = await workOrdersApi.list({ limit: 100 });
      setWorkOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, nextStatus: string) => {
    try {
      await workOrdersApi.updateStatus(id, { status: nextStatus });
      loadWorkOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update work order status');
    }
  };

  const handleOpenEvidence = (order: WorkOrder) => {
    stopCamera();
    setSelectedOrder(order);
    setBeforeFile(null);
    setAfterFile(null);
    setBeforeUrl(order.issue?.image_url || '');
    setAfterUrl('');
    setEvidenceDesc('Maintenance and repairs verified on-site by operations crew.');
    setShowEvidenceModal(true);
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      if (beforeFile) {
        formData.append('before_image', beforeFile);
      } else if (beforeUrl) {
        formData.append('before_image_url', beforeUrl);
      }

      if (afterFile) {
        formData.append('after_image', afterFile);
      } else if (afterUrl) {
        formData.append('after_image_url', afterUrl);
      }

      formData.append('description', evidenceDesc);

      await workOrdersApi.uploadEvidence(selectedOrder.id, formData);
      await workOrdersApi.verify(selectedOrder.id);
      alert('Work evidence uploaded and order verified! Issue marked RESOLVED.');
      setShowEvidenceModal(false);
      stopCamera();
      loadWorkOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to upload evidence');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Work Orders & Workforce Dispatch</h1>
        <p className="text-xs text-slate-500">
          Supervise assigned field orders, verify before/after repairs, and monitor crew output.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading work orders...</div>
        ) : workOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No active work orders.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {workOrders.map((wo) => {
              const isAssigned = wo.status === 'ASSIGNED';
              const isInProgress = wo.status === 'WORK_STARTED';
              const isCompleted = wo.status === 'WORK_COMPLETED';
              const isVerified = wo.status === 'VERIFIED';

              return (
                <div
                  key={wo.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0F766E]">{wo.order_code}</span>
                      <span className="text-[11px] font-mono text-slate-400">Ticket: {wo.issue_ticket}</span>
                      <PriorityBadge priority={wo.priority} />
                      <StatusBadge status={wo.status} />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{wo.instructions}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <User className="w-3.5 h-3.5 text-[#14B8A6]" /> Assigned Worker: {wo.worker_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> Dept: {wo.department_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Created: {new Date(wo.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions for Manager */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isAssigned && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(wo.id, 'WORK_STARTED')}
                        icon={<Play className="w-3.5 h-3.5 text-blue-600" />}
                      >
                        Start Work
                      </Button>
                    )}

                    {isInProgress && (
                      <Button
                        variant="teal"
                        size="sm"
                        onClick={() => handleStatusChange(wo.id, 'WORK_COMPLETED')}
                        icon={<CheckSquare className="w-3.5 h-3.5" />}
                      >
                        Mark Completed
                      </Button>
                    )}

                    {(isCompleted || isInProgress) && (
                      <Button
                        variant="coral"
                        size="sm"
                        onClick={() => handleOpenEvidence(wo)}
                        icon={<Upload className="w-3.5 h-3.5" />}
                      >
                        Upload Evidence & Verify
                      </Button>
                    )}

                    {isVerified && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Work Verified & Closed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Before & After Evidence Modal */}
      <Modal
        isOpen={showEvidenceModal}
        onClose={() => {
          stopCamera();
          setShowEvidenceModal(false);
        }}
        title="Upload Work Evidence & Verify Completion"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitEvidence} className="space-y-4">
          <p className="text-xs text-slate-500">
            Compare Before and After photographs to inspect the field crew's repair work before closing the ticket.
          </p>

          {/* Hidden Canvas for Camera Snapshots */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden File Inputs */}
          <input
            ref={beforeFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleDeviceUpload('before', e)}
          />
          <input
            ref={afterFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleDeviceUpload('after', e)}
          />

          {/* Live Camera Viewfinder Overlay (when camera active) */}
          {cameraActive && (
            <div className="p-3 bg-slate-900 rounded-xl border border-teal-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Live Camera: {cameraActive === 'before' ? 'Before Repair' : 'After Repair'}
                </span>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-dashed border-teal-400/40 pointer-events-none rounded-lg" />
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="teal"
                  size="sm"
                  onClick={capturePhoto}
                  icon={<Camera className="w-4 h-4" />}
                >
                  Capture Live Photo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={stopCamera}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Repair Column */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase">
                  Before Repair Image
                </label>
                {beforeUrl && (
                  <button
                    type="button"
                    onClick={() => handleClearImage('before')}
                    className="text-[11px] text-red-500 hover:underline flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {beforeUrl ? (
                <div className="relative group">
                  <img
                    src={beforeUrl}
                    alt="Before Repair"
                    className="w-full h-40 object-cover rounded-lg border border-slate-200 shadow-xs"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded font-medium">
                    {beforeFile ? '📁 Local File / 📸 Camera' : 'Ticket Image'}
                  </span>
                </div>
              ) : (
                <div className="w-full h-40 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                  <Image className="w-8 h-8 text-slate-300 mb-1" />
                  <span>No before photo provided</span>
                </div>
              )}

              {/* Action Buttons: Camera & Device Upload */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startCamera('before')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition"
                >
                  <Camera className="w-3.5 h-3.5 text-[#0F766E]" /> Live Camera
                </button>
                <button
                  type="button"
                  onClick={() => beforeFileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-[#0F766E]" /> Upload File
                </button>
              </div>

              {/* URL Fallback */}
              <input
                type="text"
                value={beforeUrl}
                onChange={(e) => {
                  setBeforeFile(null);
                  setBeforeUrl(e.target.value);
                }}
                placeholder="Or paste image URL"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#14B8A6] outline-none"
              />
            </div>

            {/* After Repair Column */}
            <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0F766E] uppercase">
                  After Repair Image
                </label>
                {afterUrl && (
                  <button
                    type="button"
                    onClick={() => handleClearImage('after')}
                    className="text-[11px] text-red-500 hover:underline flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {afterUrl ? (
                <div className="relative group">
                  <img
                    src={afterUrl}
                    alt="After Repair"
                    className="w-full h-40 object-cover rounded-lg border border-teal-400 shadow-xs"
                  />
                  <span className="absolute bottom-2 left-2 bg-[#0F766E]/90 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded font-medium">
                    {afterFile ? '📁 Local File / 📸 Camera' : 'Provided Photo'}
                  </span>
                </div>
              ) : (
                <div className="w-full h-40 rounded-lg border-2 border-dashed border-teal-300 bg-white/70 flex flex-col items-center justify-center text-teal-700 text-xs p-4 text-center">
                  <Camera className="w-8 h-8 text-teal-400 mb-1" />
                  <span className="font-semibold">Capture or upload verified repair</span>
                </div>
              )}

              {/* Action Buttons: Camera & Device Upload */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startCamera('after')}
                  className="px-2.5 py-1.5 bg-white border border-teal-300 hover:border-teal-500 hover:bg-teal-100/50 rounded-lg text-xs font-semibold text-teal-800 flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5 text-[#0F766E]" /> Live Camera
                </button>
                <button
                  type="button"
                  onClick={() => afterFileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-white border border-teal-300 hover:border-teal-500 hover:bg-teal-100/50 rounded-lg text-xs font-semibold text-teal-800 flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-[#0F766E]" /> Upload File
                </button>
              </div>

              {/* URL Fallback */}
              <input
                type="text"
                value={afterUrl}
                onChange={(e) => {
                  setAfterFile(null);
                  setAfterUrl(e.target.value);
                }}
                placeholder="Or paste image URL"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-teal-200 rounded-lg focus:ring-1 focus:ring-[#14B8A6] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Verification Note</label>
            <textarea
              rows={2}
              value={evidenceDesc}
              onChange={(e) => setEvidenceDesc(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#14B8A6] outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                stopCamera();
                setShowEvidenceModal(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="teal" type="submit" isLoading={isUploading}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Verify Completion & Close Issue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
