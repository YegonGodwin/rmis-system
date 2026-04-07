import { useEffect } from 'react';
import type { NotificationData } from '../hooks/useSocket';

type NotificationToastProps = {
  notification: NotificationData | null;
  onClear: () => void;
};

const NotificationToast = ({ notification, onClear }: NotificationToastProps) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClear();
      }, 5000); // 5 seconds duration
      return () => clearTimeout(timer);
    }
  }, [notification, onClear]);

  if (!notification) return null;

  const getStyle = () => {
    switch (notification.type) {
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    if (notification.type === 'success') return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
    if (notification.isCritical || notification.type === 'error') return (
        <svg className="h-5 w-5 animate-pulse text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[9999] max-w-sm rounded-2xl border p-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${getStyle()} ${notification.isCritical ? 'ring-4 ring-red-500/20' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1 pr-4">
          <h4 className="text-sm font-bold uppercase tracking-wider">{notification.title}</h4>
          <p className="mt-1 text-sm leading-relaxed">{notification.message}</p>
        </div>
        <button 
          onClick={onClear}
          className="rounded-lg p-1 transition hover:bg-black/5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
