import React from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  UserPlus, 
  Clock,
  Volume2
} from 'lucide-react';
import { LiveAlert } from '../types';
import { StorageService } from '../services/storage';

interface RealTimeAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: LiveAlert[];
  onAlertClick?: (alert: LiveAlert) => void;
}

export const RealTimeAlertsDrawer: React.FC<RealTimeAlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAlertClick
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    StorageService.markAllAlertsAsRead();
  };

  const getAlertIcon = (type: LiveAlert['type'], severity: LiveAlert['severity']) => {
    if (severity === 'critical' || type === 'line_stop_warning') {
      return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
    if (type === 'approval_action') {
      return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    }
    if (type === 'staff_added') {
      return <UserPlus className="w-4 h-4 text-indigo-400" />;
    }
    return <Layers className="w-4 h-4 text-sky-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-panel-deep/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-panel border-l border-panel-line-subtle shadow-2xl flex flex-col text-content">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-panel-line-subtle flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Real-Time Event Stream</h3>
                <p className="text-[10px] text-content-muted">Live floor updates, shortages & approvals</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold px-2 py-1 rounded bg-panel-raised hover:bg-panel-high"
                title="Mark all as read"
              >
                Mark Read
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-content-muted hover:text-white hover:bg-panel-raised transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Alerts List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-content-faint text-xs">
                No active notifications. Live floor events will stream here automatically.
              </div>
            ) : (
              alerts.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => {
                    StorageService.markAlertAsRead(alt.id);
                    if (onAlertClick) onAlertClick(alt);
                  }}
                  className={`p-3 rounded-2xl border transition text-xs cursor-pointer ${
                    alt.severity === 'critical'
                      ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                      : !alt.read
                      ? 'bg-panel-raised border-sky-500/50 shadow-md'
                      : 'bg-panel-raised/40 border-panel-line-subtle hover:bg-panel-raised/70 text-content-dim'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {getAlertIcon(alt.type, alt.severity)}
                      <span className="font-bold text-content">{alt.title}</span>
                    </div>
                    <span className="text-[10px] text-content-muted font-mono shrink-0">
                      {alt.timestamp}
                    </span>
                  </div>

                  <p className="mt-1.5 text-[11px] text-content-dim leading-relaxed">
                    {alt.message}
                  </p>

                  {(alt.line || alt.subLine) && (
                    <div className="mt-2 flex items-center space-x-2 text-[10px]">
                      {alt.line && (
                        <span className="px-2 py-0.5 rounded bg-panel border border-panel-line text-sky-400 font-bold">
                          {alt.line}
                        </span>
                      )}
                      {alt.subLine && (
                        <span className="text-content-muted">{alt.subLine}</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-panel-line-subtle bg-panel-deep text-center text-[11px] text-content-faint">
            Broadcast channel synchronized • Real-time floor notifications
          </div>

        </div>
      </div>
    </div>
  );
};
