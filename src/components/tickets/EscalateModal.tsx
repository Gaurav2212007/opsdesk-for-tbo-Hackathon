import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { store } from '../../lib/storage';
import { Ticket } from '../../types';

interface EscalateModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EscalateModal: React.FC<EscalateModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState(
    'Imminent LCD expiry (<3 hours) and unresponsive supplier channel requiring senior managerial intervention.'
  );
  const [destination, setDestination] = useState('Global Escalation Desk');
  const [managerId, setManagerId] = useState('agent-5'); // Deepak Verma
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const escalationManagers = store
    .getAgents()
    .filter(a => a.role === 'Escalation Manager' || a.role === 'Team Lead');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const selectedManager = escalationManagers.find(m => m.id === managerId);
    const destinationLabel = `${destination} (${selectedManager ? selectedManager.name : 'Queue Dispatch'})`;

    store.escalateTicket(
      ticket.id,
      reason + (note ? ` | Note: ${note}` : ''),
      destinationLabel,
      store.getCurrentRole()
    );

    setSubmitting(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-semibold text-sm text-slate-100">
              Escalate Case to Escalation Manager
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold">Formal Managerial Escalation</p>
              <p className="text-[11px] text-rose-300/80 mt-0.5">
                Escalating will transfer ticket ownership to the Escalation Desk, bump priority to
                Critical, and trigger priority SLA monitoring. All active side-conversation recipients
                will be preserved.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Escalation Destination
            </label>
            <select
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="Global Escalation Desk">Global Escalation Desk (Deepak Verma)</option>
              <option value="Regional Operations Lead">Regional Operations Lead (Priya Sharma)</option>
              <option value="Supplier Governance Committee">Supplier Governance Committee (Direct Wholesaler Intervention)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assigned Escalation Manager
            </label>
            <select
              value={managerId}
              onChange={e => setManagerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {escalationManagers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role} ({m.region}) · Load: {m.currentWorkload}/{m.maxWorkload}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Escalation Reason (Required)
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Internal Escalation Directive (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Authorize manual financial wallet credit if supplier token delayed past 14:00"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm shadow-rose-600/30"
            >
              {submitting ? 'Escalating...' : 'Confirm Escalation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
