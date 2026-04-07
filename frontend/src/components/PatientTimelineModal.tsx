import { useEffect, useState } from 'react';
import { patientService, type Patient, type PatientTimelineEvent } from '../services/patient.service';

type PatientTimelineModalProps = {
  patientId: string;
  onClose: () => void;
};

const PatientTimelineModal = ({ patientId, onClose }: PatientTimelineModalProps) => {
  const [data, setData] = useState<{ patient: Patient; timeline: PatientTimelineEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const response = await patientService.getTimeline(patientId);
        setData(response);
      } catch (err: any) {
        setError(err.message || 'Failed to load patient history');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [patientId]);

  if (loading) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="rounded-2xl bg-white p-8 shadow-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Loading patient history...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-inner">
              {data?.patient.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{data?.patient.fullName}</h3>
              <p className="text-sm font-medium text-slate-500">MRN: {data?.patient.mrn} • {data?.patient.gender}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {error ? (
            <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : data?.timeline.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
              <div className="mb-4 rounded-full bg-slate-100 p-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900">No History Found</h4>
              <p className="mt-1 text-sm text-slate-500">This patient hasn't had any imaging events recorded yet.</p>
            </div>
          ) : (
            <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-slate-100">
              {data?.timeline.map((event, idx) => (
                <div key={event.id} className="relative pl-12">
                  {/* Dot icon based on type */}
                  <div className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white shadow-sm ${
                    event.type === 'Request' ? 'bg-amber-100 text-amber-600' :
                    event.type === 'Study' ? 'bg-sky-100 text-sky-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {event.type === 'Request' && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )}
                    {event.type === 'Study' && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    )}
                    {event.type === 'Report' && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <h5 className="font-bold text-slate-900">{event.title}</h5>
                      <span className="shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-tighter">
                        {new Date(event.date).toLocaleDateString(undefined, { 
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-600">{event.subtitle}</p>
                    
                    <div className="mt-3 rounded-xl border border-slate-50 bg-slate-50/50 p-3">
                        <div className="flex items-center gap-2 mb-2">
                             <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                event.status === 'Final' || event.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                event.status === 'STAT' || event.isCritical ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                             }`}>
                                {event.status}
                             </span>
                             {event.priority && (
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Priority: {event.priority}</span>
                             )}
                        </div>
                        <p className="text-xs italic text-slate-500 line-clamp-2">
                            {event.details || 'No additional details available.'}
                        </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50 p-6">
          <button 
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 active:scale-[0.98]"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientTimelineModal;
