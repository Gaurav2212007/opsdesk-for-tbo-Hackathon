import React, { useState } from 'react';
import {
  ShieldAlert,
  ClockAlert,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Building2,
  Sparkles
} from 'lucide-react';
import { store } from '../../lib/storage';
import { Ticket } from '../../types';
import { PriorityBadge, SLABadge, StatusBadge } from '../common/Badge';

interface SLAViewProps {
  onSelectTicket: (ticketId: string) => void;
}

export const SLAView: React.FC<SLAViewProps> = ({ onSelectTicket }) => {
  const tickets = store.getTickets();

  // Escalated cases (Dedicated Escalation Manager Queue)
  const escalatedTickets = tickets.filter(
    t => t.isEscalated && t.status !== 'Resolved' && t.status !== 'Closed' && !t.isArchived
  );

  // SLA At Risk / Breached cases
  const atRiskTickets = tickets.filter(
    t =>
      (t.slaStatus === 'At Risk' || t.slaStatus === 'Breached') &&
      t.status !== 'Resolved' &&
      t.status !== 'Closed' &&
      !t.isArchived
  );

  const [activeTab, setActiveTab] = useState<'escalations' | 'at_risk'>('escalations');

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            SLA &amp; Escalation Command Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Travel-aware urgency engine considering Check-in Proximity, LCD, and dedicated Escalation Manager workflows.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('escalations')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'escalations'
              ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Escalation Manager Queue ({escalatedTickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('at_risk')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'at_risk'
              ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClockAlert className="w-4 h-4 text-amber-400" />
          <span>SLA At Risk &amp; Breached ({atRiskTickets.length})</span>
        </button>
      </div>

      {/* Tab 1: Escalation Manager Queue (Section 26) */}
      {activeTab === 'escalations' && (
        <div className="space-y-4">
          <div className="bg-rose-950/20 border border-rose-800/40 p-4 rounded-xl text-xs text-rose-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Formal Managerial Escalation Queue</p>
              <p className="text-[11px] text-rose-300/80 mt-0.5">
                Escalation in OpsDesk transfers direct operational ownership to designated Escalation Managers
                with authority to override supplier penalties, unfreeze wallet credits, and dispatch hotel relocations.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {escalatedTickets.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
                No tickets currently in the Escalation Manager Queue.
              </div>
            ) : (
              escalatedTickets.map(ticket => {
                const checkInDate = new Date(ticket.checkInDate);
                const lcdDate = new Date(ticket.lcdDate);
                const hoursUntilCheckIn = Math.round((checkInDate.getTime() - Date.now()) / (1000 * 3600));
                const hoursUntilLcd = Math.round((lcdDate.getTime() - Date.now()) / (1000 * 3600));

                return (
                  <div
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket.id)}
                    className="bg-slate-900 border border-slate-800 hover:border-rose-700/60 p-5 rounded-xl transition-all cursor-pointer group space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-rose-400">{ticket.id}</span>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                            {ticket.tboh}
                          </span>
                          <PriorityBadge priority={ticket.priority} />
                          <StatusBadge status={ticket.status} />
                          <SLABadge status={ticket.slaStatus} minutesRemaining={ticket.slaMinutesRemaining} />
                        </div>
                        <h3 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                          {ticket.title}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Agency: <strong className="text-slate-300">{ticket.agencyName}</strong> ({ticket.agencyTier}) · {ticket.region}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Assigned Manager</span>
                        <span className="text-xs font-semibold text-white">{ticket.assignedAgentName}</span>
                      </div>
                    </div>

                    {/* Escalation Reason Box */}
                    <div className="p-3 bg-rose-950/40 rounded-lg border border-rose-800/60 text-xs text-rose-200">
                      <span className="font-semibold block text-[11px] text-rose-400 uppercase tracking-wider">
                        Escalation Directive:
                      </span>
                      <p className="mt-0.5 leading-relaxed">{ticket.escalationReason}</p>
                      <div className="mt-1 text-[10px] font-mono text-rose-300/70">
                        Escalated by {ticket.escalatedBy} to {ticket.escalatedTo}
                      </div>
                    </div>

                    {/* Travel Urgency Indicators */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 text-slate-400 font-mono">
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className={hoursUntilLcd <= 3 ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                          LCD: {hoursUntilLcd <= 0 ? 'Passed' : `in ${hoursUntilLcd}h`}
                        </span>
                        <span className={hoursUntilCheckIn <= 24 ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                          Check-in: {hoursUntilCheckIn <= 0 ? 'Today' : `in ${hoursUntilCheckIn}h`}
                        </span>
                      </div>

                      <span className="text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-sans text-xs">
                        Open Case <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: At Risk & Breached Radar */}
      {activeTab === 'at_risk' && (
        <div className="space-y-4">
          <div className="bg-amber-950/20 border border-amber-800/40 p-4 rounded-xl text-xs text-amber-300 flex items-start gap-3">
            <ClockAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Dynamic Proximity SLA Radar</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Cases approaching deadline based on actual timestamps. Critical cases with imminent check-in (&lt;24h)
                count down at compressed velocity.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-800 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {atRiskTickets.map(t => (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t.id)}
                className="p-4 hover:bg-slate-800/40 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400">{t.id}</span>
                    <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      {t.tboh}
                    </span>
                    <PriorityBadge priority={t.priority} />
                    <SLABadge status={t.slaStatus} minutesRemaining={t.slaMinutesRemaining} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    {t.title}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {t.agencyName} · Assigned: {t.assignedAgentName} ({t.assignedTeamName})
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-mono font-bold block ${
                      t.slaMinutesRemaining <= 0 ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {t.slaMinutesRemaining <= 0
                      ? `Breached by ${Math.abs(t.slaMinutesRemaining)}m`
                      : `${t.slaMinutesRemaining}m left`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Target: {new Date(t.slaDeadline).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
