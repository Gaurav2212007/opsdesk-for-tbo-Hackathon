import React, { useState } from 'react';
import { ArrowRightLeft, X, Check, Users, ShieldCheck } from 'lucide-react';
import { store } from '../../lib/storage';
import { Ticket } from '../../types';

interface TransferModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const teams = store.getTeams();
  const allAgents = store.getAgents();

  const [targetTeamId, setTargetTeamId] = useState(ticket.assignedTeamId);
  const [targetAgentId, setTargetAgentId] = useState(ticket.assignedAgentId || '');
  const [note, setNote] = useState('Reassigning to specialized queue. Preserving active supplier side threads.');

  if (!isOpen) return null;

  const eligibleAgents = allAgents.filter(a => a.teamId === targetTeamId);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    store.transferTicket(ticket.id, targetTeamId, targetAgentId || undefined, note);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-sky-400">
            <ArrowRightLeft className="w-5 h-5" />
            <h3 className="font-semibold text-sm text-slate-100">
              Transfer Ticket Ownership & Queue
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="p-5 space-y-4">
          {/* Critical Recipient Persistence Banner */}
          <div className="bg-sky-950/40 border border-sky-800/50 rounded-lg p-3 text-xs text-sky-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
            <div>
              <p className="font-semibold">Side Conversation Recipient Persistence Active</p>
              <p className="text-[11px] text-sky-300/80 mt-0.5">
                {ticket.sideConversations.length > 0 ? (
                  <>
                    This case has {ticket.sideConversations.length} active side conversation(s) with{' '}
                    <span className="font-semibold text-white">
                      {ticket.sideConversations.map(sc => sc.recipientName).join(', ')}
                    </span>
                    . Recipient addresses will <strong>NOT</strong> be wiped or changed upon transfer.
                  </>
                ) : (
                  'Transfers are tracked in audit timeline. Any future side-threads will retain dedicated recipients.'
                )}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Destination Team
            </label>
            <select
              value={targetTeamId}
              onChange={e => {
                setTargetTeamId(e.target.value);
                setTargetAgentId('');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.region}) — Lead: {t.leader}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assign Specific Agent (Optional — leave unselected for Team Queue dispatch)
            </label>
            <select
              value={targetAgentId}
              onChange={e => setTargetAgentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Unassigned (Dispatch to Team Queue) --</option>
              {eligibleAgents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role}) · Status: {a.status} · Load: {a.currentWorkload}/{a.maxWorkload}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Transfer Handover Note
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-sm shadow-sky-600/30"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
