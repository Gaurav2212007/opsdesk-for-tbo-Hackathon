import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Link2
} from 'lucide-react';
import { IntentType, Priority, Region, SLAStatus, Ticket, TicketStatus } from '../../types';
import { StatusBadge, PriorityBadge, SLABadge } from '../common/Badge';

interface TicketTableProps {
  tickets: Ticket[];
  onSelectTicket: (ticketId: string) => void;
  title?: string;
  subtitle?: string;
  initialGroupBy?: 'region' | 'intent';
}

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  onSelectTicket,
  title = 'Operations Cases',
  subtitle = 'Context-aware travel operations tickets across all regions',
  initialGroupBy,
}) => {
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterIntent, setFilterIntent] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPreset, setFilterPreset] = useState<string>('all');

  const [activeGrouping, setActiveGrouping] = useState<'none' | 'region' | 'intent'>(
    initialGroupBy || 'none'
  );

  const [sortBy, setSortBy] = useState<'createdAt' | 'slaMinutes' | 'checkIn' | 'priority'>('slaMinutes');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Filtered Tickets
  const filtered = useMemo(() => {
    return tickets.filter(t => {
      // Exclude archived from primary views
      if (t.isArchived) return false;

      // Presets
      if (filterPreset === 'urgent' && t.slaStatus === 'Healthy') return false;
      if (filterPreset === 'critical' && t.priority !== 'Critical') return false;
      if (filterPreset === 'escalated' && !t.isEscalated) return false;
      if (filterPreset === 'linked' && t.linkedTicketIds.length === 0) return false;

      // Dropdown filters
      if (filterRegion !== 'all' && t.region !== filterRegion) return false;
      if (filterIntent !== 'all' && t.intent !== filterIntent) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;

      // Text Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          t.id.toLowerCase().includes(q) ||
          t.tboh.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.agencyName.toLowerCase().includes(q) ||
          (t.assignedAgentName && t.assignedAgentName.toLowerCase().includes(q)) ||
          (t.travellerName && t.travellerName.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [tickets, search, filterRegion, filterIntent, filterPriority, filterStatus, filterPreset]);

  // Sorted Tickets
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'slaMinutes') {
        comparison = a.slaMinutesRemaining - b.slaMinutesRemaining;
      } else if (sortBy === 'createdAt') {
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'checkIn') {
        comparison = new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime();
      } else if (sortBy === 'priority') {
        const pOrder: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        comparison = pOrder[a.priority] - pOrder[b.priority];
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [filtered, sortBy, sortAsc]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Table Header & Presets */}
      <div className="p-6 pb-3 border-b border-slate-800 space-y-3 bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            {sorted.length} cases matching filters
          </span>
        </div>

        {/* Filter Presets Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Cases' },
            { id: 'urgent', label: 'SLA At Risk / Breached' },
            { id: 'escalated', label: 'Escalated Cases' },
            { id: 'critical', label: 'Critical Priority' },
            { id: 'linked', label: 'TBOH Linked Clusters' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setFilterPreset(p.id)}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filterPreset === p.id
                  ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Dynamic Category Bar for By Region / By Intent */}
        {activeGrouping === 'region' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-800/50">
            <span className="text-[11px] font-mono text-slate-500 uppercase mr-1">Region:</span>
            {['all', 'APAC', 'India', 'Europe', 'Middle East', 'Americas'].map(r => {
              const count = r === 'all' ? tickets.length : tickets.filter(t => t.region === r).length;
              return (
                <button
                  key={r}
                  onClick={() => setFilterRegion(r)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    filterRegion === r
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{r === 'all' ? 'All Regions' : r}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${filterRegion === r ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeGrouping === 'intent' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-800/50">
            <span className="text-[11px] font-mono text-slate-500 uppercase mr-1">Intent:</span>
            {['all', 'Refund', 'Cancellation', 'Hotel Issue', 'Flight Issue', 'Payment', 'Emergency Travel Issue'].map(intnt => {
              const count = intnt === 'all' ? tickets.length : tickets.filter(t => t.intent === intnt).length;
              return (
                <button
                  key={intnt}
                  onClick={() => setFilterIntent(intnt)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                    filterIntent === intnt
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{intnt === 'all' ? 'All Intents' : intnt === 'Emergency Travel Issue' ? 'Emergency' : intnt}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${filterIntent === intnt ? 'bg-amber-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search & Granular Dropdown Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by TBOH, title, agent, or agency..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={filterRegion}
            onChange={e => setFilterRegion(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Regions</option>
            <option value="APAC">APAC</option>
            <option value="India">India</option>
            <option value="Europe">Europe</option>
            <option value="Middle East">Middle East</option>
            <option value="Americas">Americas</option>
          </select>

          <select
            value={filterIntent}
            onChange={e => setFilterIntent(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Intents</option>
            <option value="Refund">Refund</option>
            <option value="Cancellation">Cancellation</option>
            <option value="Booking Modification">Booking Modification</option>
            <option value="Hotel Issue">Hotel Issue</option>
            <option value="Flight Issue">Flight Issue</option>
            <option value="Payment">Payment</option>
            <option value="Availability">Availability</option>
            <option value="Emergency Travel Issue">Emergency</option>
          </select>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Open">Open</option>
            <option value="Pending">Pending</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Table Body */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400 sticky top-0 z-10 select-none">
            <tr>
              <th className="py-2.5 px-4 font-semibold">TICKET &amp; TBOH</th>
              <th className="py-2.5 px-4 font-semibold">TITLE &amp; AGENCY</th>
              <th className="py-2.5 px-4 font-semibold">INTENT</th>
              <th
                onClick={() => handleSort('priority')}
                className="py-2.5 px-4 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>PRIORITY</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-2.5 px-4 font-semibold">STATUS</th>
              <th
                onClick={() => handleSort('slaMinutes')}
                className="py-2.5 px-4 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>SLA HEALTH</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('checkIn')}
                className="py-2.5 px-4 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>CHECK-IN</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-2.5 px-4 font-semibold">ASSIGNEE</th>
              <th className="py-2.5 px-4 font-semibold text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                  No operational cases match current filters.
                </td>
              </tr>
            ) : (
              sorted.map(ticket => {
                const checkInDate = new Date(ticket.checkInDate);
                const hoursUntilCheckIn = Math.round((checkInDate.getTime() - Date.now()) / (1000 * 3600));

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Ticket ID & TBOH */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-semibold text-sky-400">{ticket.id}</span>
                        {ticket.linkedTicketIds.length > 0 && (
                          <span
                            title={`${ticket.linkedTicketIds.length} linked cases under this TBOH cluster`}
                            className="p-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/70"
                          >
                            <Link2 className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {ticket.tboh}
                      </div>
                    </td>

                    {/* Title & Agency */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-medium text-slate-200 group-hover:text-white truncate">
                        {ticket.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{ticket.agencyName}</span>
                        <span className="text-[10px] font-mono px-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {ticket.agencyTier}
                        </span>
                      </div>
                    </td>

                    {/* Intent */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-300 font-medium">{ticket.intent}</span>
                      <span className="block text-[10px] text-slate-500 font-mono">
                        {ticket.region}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={ticket.status} />
                        {ticket.isEscalated && (
                          <span
                            title="Escalated to Manager"
                            className="p-1 rounded bg-rose-950/80 text-rose-400 border border-rose-800"
                          >
                            <ShieldAlert className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SLA Health */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SLABadge status={ticket.slaStatus} minutesRemaining={ticket.slaMinutesRemaining} />
                    </td>

                    {/* Check-In Urgency */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                      <span
                        className={
                          hoursUntilCheckIn <= 24
                            ? 'text-amber-400 font-semibold'
                            : 'text-slate-300'
                        }
                      >
                        {hoursUntilCheckIn <= 0
                          ? 'Today'
                          : hoursUntilCheckIn <= 24
                          ? `In ${hoursUntilCheckIn}h`
                          : checkInDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-200 block truncate max-w-[120px]">
                        {ticket.assignedAgentName || 'Unassigned'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px] block">
                        {ticket.assignedTeamName}
                      </span>
                    </td>

                    {/* Action Arrow */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button className="p-1 text-slate-400 group-hover:text-sky-400 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
