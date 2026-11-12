import React from 'react';
import { Priority, SLAStatus, TicketStatus } from '../../types';

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const styles: Record<TicketStatus, string> = {
    New: 'text-sky-400 bg-sky-950/60 border-sky-800/60',
    Open: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
    Pending: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
    Escalated: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
    Resolved: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
    Closed: 'text-slate-400 bg-slate-900 border-slate-700/60',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${styles[status] || styles.Open}`}
    >
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const styles: Record<Priority, string> = {
    Critical: 'text-rose-400 bg-rose-950/50 border-rose-800/60 font-semibold',
    High: 'text-orange-400 bg-orange-950/50 border-orange-800/60',
    Medium: 'text-amber-300 bg-amber-950/40 border-amber-800/50',
    Low: 'text-slate-400 bg-slate-900 border-slate-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs rounded border ${styles[priority]}`}
    >
      {priority}
    </span>
  );
};

export const SLABadge: React.FC<{ status: SLAStatus; minutesRemaining?: number }> = ({
  status,
  minutesRemaining,
}) => {
  if (status === 'Breached') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-rose-950/70 border border-rose-800/80 text-rose-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Breached {minutesRemaining !== undefined ? `(${Math.abs(minutesRemaining)}m ago)` : ''}
      </span>
    );
  }

  if (status === 'At Risk') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-amber-950/70 border border-amber-800/80 text-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        At Risk {minutesRemaining !== undefined ? `(${minutesRemaining}m left)` : ''}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-emerald-950/50 border border-emerald-800/60 text-emerald-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      Healthy
    </span>
  );
};
