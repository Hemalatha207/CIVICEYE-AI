import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Upload,
  CheckCircle2,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Camera,
  FileText,
  Activity,
  Navigation,
  Crosshair,
  RefreshCw,
  X,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { issuesApi, aiApi } from '../../services/api';
import { Button } from '../../components/ui/Button';

// Fix default leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const CATEGORIES = [
  { name: 'Pothole', icon: '🕳️', desc: 'Cavity or sunken depression in road bitumen', defaultSev: 'HIGH' },
  { name: 'Garbage', icon: '🗑️', desc: 'Uncollected refuse or illegal trash dumps', defaultSev: 'MEDIUM' },
  { name: 'Streetlight Damage', icon: '💡', desc: 'Broken pole, dark fixture, or exposed wires', defaultSev: 'MEDIUM' },
  { name: 'Water Leakage', icon: '💧', desc: 'Burst pipeline or continuous main overflow', defaultSev: 'HIGH' },
  { name: 'Road Damage', icon: '🚧', desc: 'Bitumen rupture, structural crack or cave-in', defaultSev: 'CRITICAL' },
  { name: 'Drainage Issue', icon: '🌊', desc: 'Clogged sewer, flood basin or stagnant water', defaultSev: 'HIGH' },
  { name: 'Fallen Tree', icon: '🌳', desc: 'Uprooted timber blocking road or electric lines', defaultSev: 'CRITICAL' },
  { name: 'Other', icon: '📌', desc: 'General civic hazard or neighborhood issue', defaultSev: 'LOW' },
];

// ─── Map click handler ────────────────────────────────────────────────────────
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ─── Re-center map programmatically ─────────────────────────────────────────
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng]);
  return null;
}

// ─── Reverse Geocode (Nominatim) ─────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const ReportIssue: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('Pothole');

  // Image / Camera state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [captureMode, setCaptureMode] = useState<'idle' | 'camera'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Location state
  const [latitude, setLatitude] = useState(20.5937);
  const [longitude, setLongitude] = useState(78.9629);
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('Ward 4');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  const [description, setDescription] = useState('');

  // AI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [newIssueId, setNewIssueId] = useState<number | null>(null);

  // ── Camera helpers ────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCaptureMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert('Camera access denied or not available.');
      setCaptureMode('idle');
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCaptureMode('idle');
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      await handleImageChange(file);
    }, 'image/jpeg', 0.92);
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Image / AI handler ────────────────────────────────────────────────────
  const handleImageChange = async (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category_hint', category);
      const res = await aiApi.analyze(formData);
      setAiResult(res.data.ai_result);
    } catch {
      console.warn('AI analysis fallback used');
    } finally {
      setTimeout(() => setIsAnalyzing(false), 600);
    }
  };

  // ── GPS ───────────────────────────────────────────────────────────────────
  const getGPS = () => {
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setFlyTarget({ lat, lng });
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError('Could not get GPS location. Please drop the pin manually.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('address', address);
      formData.append('ward', ward);

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePreview) {
        formData.append('image_url', imagePreview);
      }

      const res = await issuesApi.create(formData);
      setSubmittedTicket(res.data.ticket_code);
      setNewIssueId(res.data.id);
      setStep(6);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#14B8A6', '#FF6B6B', '#0F766E'] });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Report a Civic Problem</h1>
        <p className="text-xs text-slate-500">
          Guided 5-step reporting with automatic computer vision classification.
        </p>
      </div>

      {/* Stepper */}
      {step < 6 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
          {[
            { num: 1, label: 'Category' },
            { num: 2, label: 'Photo' },
            { num: 3, label: 'Location' },
            { num: 4, label: 'Details' },
            { num: 5, label: 'AI Review' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s.num
                    ? 'bg-[#14B8A6] text-white shadow-xs'
                    : step > s.num
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs font-semibold hidden md:inline ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">

        {/* ── STEP 1: CATEGORY ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 1: What type of problem are you seeing?</h2>
              <p className="text-xs text-slate-500">Select the civic hazard closest to your observation.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CATEGORIES.map((c) => (
                <div
                  key={c.name}
                  onClick={() => setCategory(c.name)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    category === c.name
                      ? 'border-[#14B8A6] bg-teal-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-3xl block mb-2">{c.icon}</span>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{c.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="teal" onClick={() => setStep(2)}>
                Next: Upload Photo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PHOTO / CAMERA ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 2: Capture or Upload Evidence Photo</h2>
              <p className="text-xs text-slate-500">
                Use your device camera or upload from gallery. AI vision will auto-classify the issue.
              </p>
            </div>

            {/* Camera live view */}
            {captureMode === 'camera' && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#14B8A6] shadow-lg bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-72 object-cover"
                />
                {/* Viewfinder overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white/50 rounded-xl" />
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-[#14B8A6] flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#14B8A6]" />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="w-10 h-10 rounded-full bg-slate-800/70 border border-white/20 flex items-center justify-center text-white hover:bg-slate-700 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload / Preview area — shown when camera is NOT active */}
            {captureMode !== 'camera' && (
              <>
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                      <img
                        src={imagePreview}
                        alt="Evidence Preview"
                        className="w-full max-h-64 object-cover"
                      />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(''); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Change options */}
                    <div className="flex gap-3 justify-center flex-wrap">
                      <button
                        onClick={startCamera}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#14B8A6] text-white rounded-lg text-xs font-bold hover:bg-[#0F766E] transition shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" /> Retake with Camera
                      </button>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
                        />
                        <ImageIcon className="w-3.5 h-3.5" /> Choose from Gallery
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Empty state: two big call-to-action cards */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Camera card */}
                    <button
                      onClick={startCamera}
                      className="group flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-[#14B8A6]/60 bg-teal-50/40 hover:bg-teal-50 hover:border-[#14B8A6] transition-all cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[#14B8A6]/10 group-hover:bg-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] transition">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-800">Open Camera</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Take a photo right now</p>
                      </div>
                    </button>

                    {/* Upload card */}
                    <label className="group flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
                      />
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-500 transition">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-800">Upload from Gallery</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WEBP up to 10MB</p>
                      </div>
                    </label>
                  </div>
                )}
              </>
            )}

            {/* AI analyzing indicator */}
            {isAnalyzing && (
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center gap-3 text-xs text-[#0F766E]">
                <Activity className="w-4 h-4 animate-spin text-[#14B8A6]" />
                <span>AI vision engine analyzing image features and textures...</span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => { stopCamera(); setStep(1); }} icon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="teal" onClick={() => { stopCamera(); setStep(3); }}>
                Next: Confirm Location <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: LOCATION MAP ───────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 3: Pin the Issue Location</h2>
              <p className="text-xs text-slate-500">
                Tap the map to drop a pin, or use GPS to auto-detect your current location.
              </p>
            </div>

            {/* GPS button */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={getGPS}
                disabled={gpsLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white rounded-xl text-xs font-bold hover:bg-[#1E293B] transition disabled:opacity-60 shadow-sm"
              >
                {gpsLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {gpsLoading ? 'Getting GPS…' : 'Use My Live Location'}
              </button>
              <span className="text-xs text-slate-400">or tap anywhere on the map to drop a pin</span>
            </div>

            {gpsError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
                {gpsError}
              </div>
            )}

            {/* Interactive Map */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md" style={{ height: 340 }}>
              {/* crosshair hint */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-black/60 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
                <Crosshair className="w-3 h-3" /> Click map to drop pin
              </div>

              <MapContainer
                center={[latitude, longitude]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} />
                {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
                <Marker position={[latitude, longitude]} icon={customIcon} />
              </MapContainer>
            </div>

            {/* Coordinates display */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Latitude</p>
                <p className="text-sm font-mono font-bold text-slate-800">{latitude.toFixed(6)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Longitude</p>
                <p className="text-sm font-mono font-bold text-slate-800">{longitude.toFixed(6)}</p>
              </div>
            </div>

            {/* Address (auto-filled from geocoding) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-[#14B8A6]" />
                Detected Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Tap the map or use GPS to auto-fill…"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#14B8A6] outline-none"
              />
            </div>

            {/* Ward selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ward Area</label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#14B8A6] outline-none bg-white"
              >
                <option value="Ward 1 Downtown">Ward 1 Downtown</option>
                <option value="Ward 2 Harbor">Ward 2 Harbor</option>
                <option value="Ward 3 North">Ward 3 North</option>
                <option value="Ward 4 Civic Center">Ward 4 Civic Center</option>
                <option value="Ward 5 University">Ward 5 University</option>
                <option value="Ward 6 Tech Corridor">Ward 6 Tech Corridor</option>
                <option value="Ward 7 West End">Ward 7 West End</option>
              </select>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="teal" onClick={() => setStep(4)}>
                Next: Description <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: DESCRIPTION ────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 4: Describe the Issue</h2>
              <p className="text-xs text-slate-500">Add any specific notes for the municipal repair crew.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Observations</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#14B8A6] outline-none"
                placeholder="Describe size, depth, danger to pedestrians or vehicles…"
              />
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep(3)} icon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="teal" onClick={() => setStep(5)}>
                Next: AI Analysis <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: AI REVIEW ─────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 5: Review & AI Vision Classification</h2>
              <p className="text-xs text-slate-500">
                Inspect how CivicEye AI categorized your problem before final submission.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white border border-teal-800/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF6B6B]" />
                  <span className="font-extrabold text-sm uppercase tracking-wider text-teal-300">
                    AI DETECTION RESULTS
                  </span>
                </div>
                {aiResult?.model_name && (
                  <span className="text-[11px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded">
                    {aiResult.model_name}
                  </span>
                )}
              </div>

              {aiResult ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 font-medium block">Detected Category</span>
                    <span className="text-lg font-extrabold text-white mt-1 block">{aiResult.category || category}</span>
                  </div>
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 font-medium block">Inference Confidence</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-[#14B8A6]">
                        {Math.round((aiResult.confidence || 0) * 100)}%
                      </span>
                      <span className="text-xs text-slate-400">Precision</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 font-medium block">Computed Severity</span>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded font-black text-xs bg-[#FFF0F0] text-[#E85D5D] border border-[#FF6B6B]/40">
                      {aiResult.severity}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs">
                  <p className="font-medium">No photo uploaded — AI classification skipped.</p>
                  <p className="mt-1 text-slate-500">You can still submit with the selected category: <strong className="text-white">{category}</strong></p>
                </div>
              )}

              <p className="text-[11px] text-slate-400 italic">
                * AI classifications are preliminary and subject to final verification by the City Manager.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2 text-slate-600">
              {imagePreview && (
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="thumb" className="w-14 h-10 rounded-lg object-cover border border-slate-200" />
                  <span className="font-medium text-slate-700">{imageFile?.name || 'Captured photo'}</span>
                </div>
              )}
              <div><strong>Location:</strong> {address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`} ({ward})</div>
              <div><strong>Description:</strong> {description || '—'}</div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep(4)} icon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="coral" size="lg" onClick={handleSubmit} isLoading={isSubmitting} className="font-extrabold shadow-md">
                Submit Civic Issue Report
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 6: CONFIRMATION ──────────────────────────────────────────── */}
        {step === 6 && (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">
                ✓ REPORT SUBMITTED
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Ticket Code: <span className="text-[#0F766E] font-mono">{submittedTicket || 'CV-1042'}</span>
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
                Your report has been logged and forwarded to the Manager Portal for priority verification and crew dispatch.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <Button
                variant="teal"
                onClick={() => newIssueId ? navigate(`/citizen/report/${newIssueId}`) : navigate('/citizen/dashboard')}
              >
                Track Issue Progress &rarr;
              </Button>
              <Button variant="outline" onClick={() => navigate('/citizen/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
