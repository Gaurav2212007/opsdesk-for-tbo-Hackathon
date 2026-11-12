import React from 'react';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Inbox,
  Filter,
  Building2,
  MessageSquareShare,
  GitFork,
  ClockAlert,
  Lightbulb,
  DatabaseZap,
  RotateCcw,
  Sparkles,
  Globe2,
  Tag,
  Link2,
  Shield,
  Layers
} from 'lucide-react';
import { store, DEMO_AGENCY_NAME } from '../../lib/storage';

export type NavTab =
  | 'dashboard'
  | 'tickets'
  | 'my_queue'
  | 'triage'
  | 'by_region'
  | 'by_intent'
  | 'linked_cases'
  | 'agencies'
  | 'conversations'
  | 'routing'
  | 'sla'
  | 'insights'
  | 'data';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onLoadScenario?: (scenarioId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onLoadScenario }) => {
  const currentRole = store.getCurrentRole();
  const tickets = store.getTickets(); // Scoped automatically by store
  const currentAgentId = store.getCurrentAgentId();

  const triageCount = tickets.filter(t => !t.assignedAgentId || t.status === 'New').length;
  const myQueueCount = tickets.filter(
    t => t.assignedAgentId === currentAgentId && t.status !== 'Resolved' && t.status !== 'Closed'
  ).length;
  const urgentCount = tickets.filter(
    t => (t.slaStatus === 'At Risk' || t.slaStatus === 'Breached' || t.isEscalated) && t.status !== 'Resolved' && t.status !== 'Closed'
  ).length;
  const linkedCount = tickets.filter(t => t.linkedTicketIds.length > 0).length;

  // Agency Navigation: Strict isolation (Item #5, #30)
  const agencyNavItems = [
    { id: 'dashboard' as NavTab, label: 'Agency Dashboard', icon: LayoutDashboard },
    { id: 'tickets' as NavTab, label: 'My Tickets', icon: TicketIcon, count: tickets.length },
    { id: 'linked_cases' as NavTab, label: 'My Linked Cases', icon: Link2, count: linkedCount },
    { id: 'conversations' as NavTab, label: 'My Messages', icon: MessageSquareShare },
  ];

  // Internal Navigation: Includes all 5 required queue views (Item #8) + management desks
  const internalNavViews = [
    { id: 'dashboard' as NavTab, label: 'Ops Dashboard', icon: LayoutDashboard },
    { id: 'tickets' as NavTab, label: 'All Cases', icon: TicketIcon },
    { id: 'triage' as NavTab, label: '1. Triage (Unassigned)', icon: Filter, count: triageCount, highlight: triageCount > 0 },
    { id: 'my_queue' as NavTab, label: '2. My Queue', icon: Inbox, count: myQueueCount },
    { id: 'by_region' as NavTab, label: '3. By Region', icon: Globe2 },
    { id: 'by_intent' as NavTab, label: '4. By Intent', icon: Tag },
    { id: 'linked_cases' as NavTab, label: '5. Linked Cases', icon: Link2, count: linkedCount },
  ];

  const internalNavManagement = [
    { id: 'agencies' as NavTab, label: 'Agencies 360', icon: Building2 },
    { id: 'conversations' as NavTab, label: 'Side Conversations', icon: MessageSquareShare },
    { id: 'routing' as NavTab, label: 'Routing Engine', icon: GitFork },
    { id: 'sla' as NavTab, label: 'SLA & Escalations', icon: ClockAlert, count: urgentCount, alert: urgentCount > 0 },
    { id: 'insights' as NavTab, label: 'Operational Insights', icon: Lightbulb },
    { id: 'data' as NavTab, label: 'Data & Archive', icon: DatabaseZap },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Zone */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-sm shadow-blue-500/20">
          O
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white font-sans">OpsDesk</span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
              TBO
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-[140px]">Context Operations</p>
        </div>
      </div>

      {/* Role Banner / Badge */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">Persona:</span>
          <strong className="text-white font-medium">{currentRole}</strong>
        </div>
        {currentRole === 'Agency' && (
          <p className="text-[10px] text-sky-400 font-mono truncate mt-0.5">
            {DEMO_AGENCY_NAME}
          </p>
        )}
      </div>

      {/* Main Nav Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {currentRole === 'Agency' ? (
          <>
            <div className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
              Agency Workspace
            </div>
            {agencyNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-slate-800 text-slate-400">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        ) : (
          <>
            <div className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
              Operational Views (5 Required)
            </div>
            {internalNavViews.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md ${
                        item.highlight
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3 px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
              Management &amp; Analytics
            </div>
            {internalNavManagement.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md ${
                        item.alert
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Demo Scenario Shortcuts Drawer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-slate-400 font-mono uppercase">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-sky-400" /> Demo Scenarios
          </span>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onLoadScenario?.('primary')}
            className="w-full text-left px-2 py-1.5 rounded-md bg-slate-800/70 hover:bg-sky-950/50 border border-slate-700/60 hover:border-sky-700/60 text-xs text-slate-200 hover:text-sky-300 transition-colors flex items-center justify-between"
          >
            <span className="truncate">Primary: TBOH-847291</span>
            <span className="text-[10px] font-mono text-rose-400 shrink-0">VIP Urgent</span>
          </button>
          {currentRole !== 'Agency' && (
            <>
              <button
                onClick={() => onLoadScenario?.('checkin')}
                className="w-full text-left px-2 py-1.5 rounded-md bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between"
              >
                <span className="truncate">Check-in in 8h (Hyatt)</span>
                <span className="text-[10px] font-mono text-amber-400 shrink-0">Overbooked</span>
              </button>
              <button
                onClick={() => onLoadScenario?.('sideconvo')}
                className="w-full text-left px-2 py-1.5 rounded-md bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between"
              >
                <span className="truncate">Supplier Side Convo</span>
                <span className="text-[10px] font-mono text-sky-400 shrink-0">Emirates</span>
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => {
            if (confirm('Reset application to original hackathon seed demo state? All edits will be restored.')) {
              store.resetToDefaultSeedData();
            }
          }}
          className="w-full mt-2 flex items-center justify-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800/80 rounded border border-slate-800 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </aside>
  );
};
