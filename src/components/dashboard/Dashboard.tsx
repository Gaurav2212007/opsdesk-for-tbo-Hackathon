import React, { useMemo } from 'react';
import {
  Ticket as TicketIcon,
  AlertTriangle,
  ClockAlert,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Tag,
  Sparkles,
  ArrowRight,
  Filter,
  Inbox
} from 'lucide-react';
import { store } from '../../lib/storage';
import { IntentType, Region } from '../../types';

interface DashboardProps {
  onSelectTicket: (ticketId: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTicket, onNavigateToTab }) => {
  const tickets = store.getTickets();
  const insights = store.getInsights();

  // Metrics calculation
  const metrics = useMemo(() => {
    const active = tickets.filter(t => !t.isArchived && t.status !== 'Resolved' && t.status !== 'Closed');
    const unassigned = active.filter(t => !t.assignedAgentId || t.status === 'New');
    const critical = active.filter(t => t.priority === 'Critical');
    const atRisk = active.filter(t => t.slaStatus === 'At Risk');
    const breached = active.filter(t => t.slaStatus === 'Breached');
    const escalated = active.filter(t => t.isEscalated);
    const pendingAgency = active.filter(t => t.status === 'Pending');
    const pendingSupplier = active.filter(t => t.sideConversations.some(sc => sc.status === 'Waiting Reply'));
    const resolvedToday = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');

    return {
      totalOpen: active.length,
      unassigned: unassigned.length,
      critical: critical.length,
      atRisk: atRisk.length,
      breached: breached.length,
      escalated: escalated.length,
      pendingAgency: pendingAgency.length,
      pendingSupplier: pendingSupplier.length,
      resolvedToday: resolvedToday.length,
    };
  }, [tickets]);

  // Breakdown by Intent
  const intentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      counts[t.intent] = (counts[t.intent] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tickets]);

  // Breakdown by Region
  const regionCounts = useMemo(() => {
    const counts: Record<Region, number> = {
      APAC: 0,
      India: 0,
      Europe: 0,
      'Middle East': 0,
      Americas: 0,
    };
    tickets.forEach(t => {
      if (counts[t.region] !== undefined) counts[t.region]++;
    });
    return counts;
  }, [tickets]);

  // SLA Health breakdown
  const slaHealthCounts = useMemo(() => {
    const active = tickets.filter(t => !t.isArchived && t.status !== 'Resolved' && t.status !== 'Closed');
    return {
      healthy: active.filter(t => t.slaStatus === 'Healthy').length,
      atRisk: active.filter(t => t.slaStatus === 'At Risk').length,
      breached: active.filter(t => t.slaStatus === 'Breached').length,
    };
  }, [tickets]);

  const isAgency = store.getCurrentRole() === 'Agency';

  if (isAgency) {
    const active = tickets.filter(t => !t.isArchived && t.status !== 'Resolved' && t.status !== 'Closed');
    const waitingAgency = active.filter(t => t.status === 'Pending');
    const urgent = active.filter(t => t.slaStatus === 'At Risk' || t.slaStatus === 'Breached' || t.priority === 'Critical');
    const resolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');

    return (
      <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
        {/* Agency Portal Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Global Travel Partners · Operations Portal
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                Partner ID: agn-1 (Platinum Tier)
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Track your agency&apos;s active booking operations, refund status, and travel disruption support cases.
            </p>
          </div>

          {/* Quick jump to Agency Case */}
          <button
            onClick={() => onSelectTicket('TKT-10421')}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-950 to-slate-900 border border-sky-800/60 hover:border-sky-500 transition-all text-left group shadow-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                  View Primary Case
                </span>
                <span className="text-[10px] font-mono px-1.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  TBOH-847291
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                Refund &amp; Supplier Exception Request
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform ml-2" />
          </button>
        </div>

        {/* Agency Scoped KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigateToTab('tickets')}
            className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-slate-400 block font-mono">My Total Cases</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums">
              {tickets.length}
            </span>
            <span className="text-[10px] text-slate-500">All registered requests</span>
          </div>

          <div
            onClick={() => onNavigateToTab('tickets')}
            className="bg-slate-900 border border-sky-900/40 p-4 rounded-xl hover:border-sky-700 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-sky-400 block font-mono">In Progress</span>
            <span className="text-2xl font-bold font-mono text-sky-300 mt-1 block tabular-nums">
              {active.length}
            </span>
            <span className="text-[10px] text-sky-400/70">Under TBO operations review</span>
          </div>

          <div className="bg-slate-900 border border-amber-900/40 p-4 rounded-xl">
            <span className="text-[11px] text-amber-400 block font-mono">Awaiting Agency Reply</span>
            <span className="text-2xl font-bold font-mono text-amber-300 mt-1 block tabular-nums">
              {waitingAgency.length}
            </span>
            <span className="text-[10px] text-amber-400/70">Action required from your team</span>
          </div>

          <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-xl">
            <span className="text-[11px] text-emerald-400 block font-mono">Resolved</span>
            <span className="text-2xl font-bold font-mono text-emerald-300 mt-1 block tabular-nums">
              {resolved.length}
            </span>
            <span className="text-[10px] text-emerald-400/70">Completed cases</span>
          </div>
        </div>

        {/* Agency Breakdown & Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Intent Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white">Requests by Service Intent</h3>
                <p className="text-[11px] text-slate-400">Classification of your support tickets</p>
              </div>
              <Tag className="w-4 h-4 text-sky-400" />
            </div>

            <div className="space-y-3 pt-1">
              {intentCounts.map(([intent, count]) => {
                const pct = Math.round((count / (tickets.length || 1)) * 100);
                return (
                  <div key={intent} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{intent}</span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Agency Requests */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white">My Active Bookings &amp; Cases</h3>
                <p className="text-[11px] text-slate-400">Direct status tracking for your travellers</p>
              </div>
              <button
                onClick={() => onNavigateToTab('tickets')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                <span>View All Tickets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {tickets.slice(0, 5).map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30 px-2 rounded-lg transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400">{t.id}</span>
                      <span className="font-mono text-[11px] text-slate-400">{t.tboh}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {t.intent}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 group-hover:text-white truncate font-medium mt-0.5">
                      {t.title}
                    </p>
                    {t.travellerName && (
                      <p className="text-[11px] text-slate-500">Traveller: {t.travellerName}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        t.status === 'Resolved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : t.status === 'Pending'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-sky-950 text-sky-300 border border-sky-800'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-1">
                      Check-in: {new Date(t.checkInDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxIntentCount = intentCounts.length > 0 ? intentCounts[0][1] : 1;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* Welcome & Philosophy Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Operations Command Center
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              Live Operations State
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            From isolated reactive tickets to context-rich, relationship-aware, travel-aware operations cases.
          </p>
        </div>

        {/* Primary Demo Case Quick-Jump Hero Banner */}
        <button
          onClick={() => onSelectTicket('TKT-10421')}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-950 to-slate-900 border border-sky-800/60 hover:border-sky-500 transition-all text-left group shadow-lg"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                Open Primary Demo Case
              </span>
              <span className="text-[10px] font-mono px-1.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                TBOH-847291
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs">
              Refund pending · Imminent LCD · Marriott Side Convo
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform ml-2" />
        </button>
      </div>

      {/* KPI Cards Strip (Problem 6 & 7) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        <div
          onClick={() => onNavigateToTab('tickets')}
          className="bg-slate-900 border border-slate-800 p-3 rounded-xl hover:border-slate-700 transition-colors cursor-pointer"
        >
          <span className="text-[11px] text-slate-400 block font-mono">Open Cases</span>
          <span className="text-xl font-bold font-mono text-white mt-0.5 block tabular-nums">
            {metrics.totalOpen}
          </span>
          <span className="text-[10px] text-slate-500">Active caseload</span>
        </div>

        <div
          onClick={() => onNavigateToTab('triage')}
          className="bg-slate-900 border border-amber-900/40 p-3 rounded-xl hover:border-amber-700 transition-colors cursor-pointer"
        >
          <span className="text-[11px] text-amber-400 block font-mono">Unassigned</span>
          <span className="text-xl font-bold font-mono text-amber-300 mt-0.5 block tabular-nums">
            {metrics.unassigned}
          </span>
          <span className="text-[10px] text-amber-400/70">Awaiting routing</span>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 p-3 rounded-xl">
          <span className="text-[11px] text-rose-400 block font-mono">Critical</span>
          <span className="text-xl font-bold font-mono text-rose-300 mt-0.5 block tabular-nums">
            {metrics.critical}
          </span>
          <span className="text-[10px] text-rose-400/70">P1 disruptions</span>
        </div>

        <div
          onClick={() => onNavigateToTab('sla')}
          className="bg-slate-900 border border-amber-800/40 p-3 rounded-xl hover:border-amber-700 transition-colors cursor-pointer"
        >
          <span className="text-[11px] text-amber-400 block font-mono">SLA At Risk</span>
          <span className="text-xl font-bold font-mono text-amber-300 mt-0.5 block tabular-nums">
            {metrics.atRisk}
          </span>
          <span className="text-[10px] text-amber-400/70">&lt;60m remaining</span>
        </div>

        <div
          onClick={() => onNavigateToTab('sla')}
          className="bg-slate-900 border border-rose-800/50 p-3 rounded-xl hover:border-rose-700 transition-colors cursor-pointer"
        >
          <span className="text-[11px] text-rose-400 block font-mono">SLA Breached</span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-0.5 block tabular-nums">
            {metrics.breached}
          </span>
          <span className="text-[10px] text-rose-400/70">Deadline passed</span>
        </div>

        <div
          onClick={() => onNavigateToTab('sla')}
          className="bg-slate-900 border border-slate-800 p-3 rounded-xl hover:border-slate-700 transition-colors cursor-pointer"
        >
          <span className="text-[11px] text-slate-300 block font-mono">Escalated</span>
          <span className="text-xl font-bold font-mono text-white mt-0.5 block tabular-nums">
            {metrics.escalated}
          </span>
          <span className="text-[10px] text-slate-400">Escalation desk</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] text-slate-400 block font-mono">Wait Agency</span>
          <span className="text-xl font-bold font-mono text-slate-200 mt-0.5 block tabular-nums">
            {metrics.pendingAgency}
          </span>
          <span className="text-[10px] text-slate-500">Clarification</span>
        </div>

        <div
          onClick={() => onNavigateToTab('conversations')}
          className="bg-slate-900 border border-sky-900/40 p-3 rounded-xl hover:border-sky-700 transition-colors cursor-pointer"
        >
          <span className="text-[11px] text-sky-400 block font-mono">Wait Supplier</span>
          <span className="text-xl font-bold font-mono text-sky-300 mt-0.5 block tabular-nums">
            {metrics.pendingSupplier}
          </span>
          <span className="text-[10px] text-sky-400/70">Side thread open</span>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 p-3 rounded-xl">
          <span className="text-[11px] text-emerald-400 block font-mono">Resolved</span>
          <span className="text-xl font-bold font-mono text-emerald-300 mt-0.5 block tabular-nums">
            {metrics.resolvedToday}
          </span>
          <span className="text-[10px] text-emerald-400/70">Today</span>
        </div>
      </div>

      {/* Operational Visualizations (Section 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Tickets by Intent (Bar Distribution) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white">Tickets by Intent Classification</h3>
              <p className="text-[11px] text-slate-400">Calculated from live classification taxonomy</p>
            </div>
            <Tag className="w-4 h-4 text-sky-400" />
          </div>

          <div className="space-y-2.5 pt-1">
            {intentCounts.slice(0, 6).map(([intent, count]) => {
              const pct = Math.round((count / maxIntentCount) * 100);
              return (
                <div key={intent} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{intent}</span>
                    <span className="font-mono text-slate-400 tabular-nums">{count} cases</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        intent === 'Refund'
                          ? 'bg-amber-400'
                          : intent === 'Cancellation'
                          ? 'bg-rose-400'
                          : intent === 'Hotel Issue'
                          ? 'bg-sky-400'
                          : intent === 'Flight Issue'
                          ? 'bg-blue-400'
                          : 'bg-indigo-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Regional Operational Footprint */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white">Regional Operations Volume</h3>
              <p className="text-[11px] text-slate-400">Distribution across international hubs</p>
            </div>
            <MapPin className="w-4 h-4 text-sky-400" />
          </div>

          <div className="space-y-3 pt-1">
            {(Object.entries(regionCounts) as [Region, number][]).map(([reg, count]) => {
              const total = tickets.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={reg} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-200">{reg} Region</span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Travel-Aware SLA Health Radar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white">Dynamic SLA Health</h3>
              <p className="text-[11px] text-slate-400">Factors check-in &amp; LCD proximity</p>
            </div>
            <ClockAlert className="w-4 h-4 text-amber-400" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-lg">
              <span className="text-[10px] font-mono text-emerald-400 uppercase">Healthy</span>
              <span className="text-xl font-bold font-mono text-emerald-300 block mt-1 tabular-nums">
                {slaHealthCounts.healthy}
              </span>
            </div>
            <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-lg">
              <span className="text-[10px] font-mono text-amber-400 uppercase">At Risk</span>
              <span className="text-xl font-bold font-mono text-amber-300 block mt-1 tabular-nums">
                {slaHealthCounts.atRisk}
              </span>
            </div>
            <div className="bg-rose-950/30 border border-rose-800/40 p-3 rounded-lg">
              <span className="text-[10px] font-mono text-rose-400 uppercase">Breached</span>
              <span className="text-xl font-bold font-mono text-rose-300 block mt-1 tabular-nums">
                {slaHealthCounts.breached}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
            <span className="text-sky-400 font-semibold block mb-0.5">Travel-Aware Urgency Logic:</span>
            Cases with check-in within 24 hours or LCD expiring today automatically compress SLA clocks by up to 75%,
            preventing generic static SLA failures.
          </div>
        </div>
      </div>

      {/* Top Recurring Issues / Themes (Section 27 & Problem 5) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white">Top Recurring Operational Pain Points</h3>
            <p className="text-[11px] text-slate-400">
              Extracted operational signals linked to product bugs and process bottlenecks
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('insights')}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
          >
            <span>View All Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.slice(0, 3).map(theme => (
            <div
              key={theme.id}
              onClick={() => onNavigateToTab('insights')}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-sky-700/60 transition-colors cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {theme.category}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  +{theme.trendPercentage}% this week
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white">
                {theme.theme}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-2">{theme.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
                <span>{theme.ticketCount} cases</span>
                <span>{theme.affectedAgenciesCount} agencies</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
