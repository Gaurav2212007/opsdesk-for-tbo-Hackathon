import React, { useState } from 'react';
import { Building2, Mail, Phone, MapPin, Tag, ArrowRight, ShieldCheck } from 'lucide-react';
import { store } from '../../lib/storage';
import { Agency, Ticket } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';

interface AgenciesViewProps {
  onSelectTicket: (ticketId: string) => void;
}

export const AgenciesView: React.FC<AgenciesViewProps> = ({ onSelectTicket }) => {
  const agencies = store.getAgencies();
  const tickets = store.getTickets();
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(agencies[0]?.id || '');

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId) || agencies[0];
  const agencyTickets = tickets.filter(t => t.agencyId === selectedAgency?.id && !t.isArchived);

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/40 shrink-0">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          Agency 360 &amp; Relationship Context
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete visibility into partner operations, historical refund frequencies, SLA breaches,
          and current open caseload.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Agencies List */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/60 overflow-y-auto p-3 space-y-2 shrink-0">
          <div className="px-2 py-1 text-[11px] font-mono uppercase text-slate-400">
            Registered B2B Travel Partners ({agencies.length})
          </div>
          {agencies.map(ag => {
            const isSelected = ag.id === selectedAgency?.id;
            return (
              <button
                key={ag.id}
                onClick={() => setSelectedAgencyId(ag.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-600/60 shadow-sm'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{ag.code}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-sky-300">
                    {ag.tier}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white mt-1">{ag.name}</h3>
                <p className="text-[11px] text-slate-400">
                  {ag.country} · {ag.region}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{ag.totalTickets} total cases</span>
                  <span className="text-amber-400">{ag.refundCount} refunds</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Agency Detail Context Pane */}
        {selectedAgency && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Agency Banner Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selectedAgency.name}</h2>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                      {selectedAgency.tier}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{selectedAgency.code}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Primary Operations Contact: <strong className="text-slate-200">{selectedAgency.primaryContact}</strong> ({selectedAgency.email})
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  Region: <span className="text-white">{selectedAgency.region}</span> ({selectedAgency.country})
                </div>
              </div>

              {/* Historical Operations Metrics (Problem 1) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Cases</span>
                  <span className="text-lg font-bold text-white tabular-nums">{selectedAgency.totalTickets}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
                  <span className="text-[10px] text-amber-400 block uppercase">Refund Cases</span>
                  <span className="text-lg font-bold text-amber-300 tabular-nums">{selectedAgency.refundCount}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
                  <span className="text-[10px] text-rose-400 block uppercase">Cancellations</span>
                  <span className="text-lg font-bold text-rose-300 tabular-nums">{selectedAgency.cancellationCount}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
                  <span className="text-[10px] text-rose-400 block uppercase">SLA Breaches</span>
                  <span className="text-lg font-bold text-rose-400 tabular-nums">{selectedAgency.slaBreachCount}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
                  <span className="text-[10px] text-sky-400 block uppercase">Escalations</span>
                  <span className="text-lg font-bold text-sky-300 tabular-nums">{selectedAgency.escalationCount}</span>
                </div>
              </div>
            </div>

            {/* Recent Cases Timeline for this Agency */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">Agency Case History ({agencyTickets.length} cases)</h3>
                  <p className="text-[11px] text-slate-400">
                    Unified view of all operational requests across hotel, flight, refund, and payment
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-800/80">
                {agencyTickets.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No active cases currently on file for this agency.
                  </div>
                ) : (
                  agencyTickets.map(t => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTicket(t.id)}
                      className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-400">{t.id}</span>
                          <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
                            {t.tboh}
                          </span>
                          <StatusBadge status={t.status} />
                          <PriorityBadge priority={t.priority} />
                        </div>
                        <h4 className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                          {t.title}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Intent: {t.intent} · Created: {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transform group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
