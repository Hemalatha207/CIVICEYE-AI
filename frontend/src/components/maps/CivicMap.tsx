import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Issue } from '../../types';

interface CivicMapProps {
  issues: Issue[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onSelectIssue?: (issue: Issue) => void;
  selectedIssueId?: number;
}

export const CivicMap: React.FC<CivicMapProps> = ({
  issues,
  center = [40.7128, -74.0060],
  zoom = 13,
  height = '450px',
  onSelectIssue,
  selectedIssueId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | CivicEye AI',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map alive or cleanup if unmounted
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    issues.forEach((issue) => {
      const isHighPriority = issue.priority === 'HIGH' || issue.priority === 'CRITICAL';
      const isResolved = ['RESOLVED', 'CLOSED', 'COMPLETED', 'VERIFIED'].includes(issue.status);
      const isInProgress = ['IN_PROGRESS', 'ASSIGNED', 'VERIFICATION'].includes(issue.status);

      let pinColor = '#F59E0B'; // Amber default for Pending
      if (isHighPriority && !isResolved) {
        pinColor = '#FF6B6B'; // Coral for High Priority
      } else if (isResolved) {
        pinColor = '#14B8A6'; // Teal for Resolved
      } else if (isInProgress) {
        pinColor = '#3B82F6'; // Blue for In Progress
      }

      const isSelected = selectedIssueId === issue.id;

      // Custom SVG Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="
            background-color: ${pinColor};
            width: ${isSelected ? '24px' : '18px'};
            height: ${isSelected ? '24px' : '18px'};
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          ">
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 180px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #0F766E; font-size: 13px;">${issue.ticket_code}</strong>
            <span style="background: ${pinColor}20; color: ${pinColor}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid ${pinColor}40;">
              ${issue.priority}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #172033;">${issue.category}</h4>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748B;">${issue.address}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 6px;">
            <span style="font-size: 11px; font-weight: 600; color: #475569;">${issue.status.replace('_', ' ')}</span>
            <button id="view-issue-${issue.id}" style="
              background: #14B8A6;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 4px 8px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
            ">View Issue &rarr;</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-issue-${issue.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectIssue) onSelectIssue(issue);
            else window.location.href = `/manager/issues/${issue.id}`;
          };
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [issues, selectedIssueId, onSelectIssue]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Legend Badge */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-slate-200 text-xs shadow-md flex items-center gap-3">
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" /> High Priority
        </span>
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending
        </span>
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> In Progress
        </span>
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]" /> Resolved
        </span>
      </div>
    </div>
  );
};
