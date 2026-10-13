import React from 'react';
import { FileText, Download, Table, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ManagerReports: React.FC = () => {
  const downloadReport = (endpoint: string, filename: string) => {
    const token = localStorage.getItem('civiceye_token');
    fetch(`/api/reports/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((e) => alert('Failed to download report'));
  };

  const reports = [
    {
      title: 'Civic Issues Comprehensive Dataset',
      desc: 'Complete civic issues dataset including location coordinates, AI prediction accuracy, priority, and resolution turnaround times.',
      filename: 'civiceye_issues_report.csv',
      endpoint: 'issues/csv',
      format: 'CSV / Excel Compatible',
      accent: 'teal',
    },
    {
      title: 'Staff Workload & Performance Audit',
      desc: 'Complete employee metrics across municipal divisions including assigned tasks, completion rates, and attendance logs.',
      filename: 'civiceye_staff_workload_report.csv',
      endpoint: 'staff/csv',
      format: 'CSV / HR Compatible',
      accent: 'blue',
    },
    {
      title: 'Citizen Feedback & Satisfaction Ledger',
      desc: 'Public ratings, repair quality verifications (YES/PARTIALLY/NO), citizen comments, and service feedback.',
      filename: 'civiceye_citizen_feedback_report.csv',
      endpoint: 'feedback/csv',
      format: 'CSV / Public Audit',
      accent: 'coral',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Data Exports</h1>
        <p className="text-xs text-slate-500">
          Generate compliant municipal audit reports and raw datasets for government evaluation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((r) => (
          <div
            key={r.title}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-[#14B8A6]">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{r.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
              <span className="inline-block text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Format: {r.format}
              </span>
            </div>

            <Button
              variant="teal"
              size="sm"
              onClick={() => downloadReport(r.endpoint, r.filename)}
              icon={<Download className="w-4 h-4" />}
              className="w-full"
            >
              Export CSV Report
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
