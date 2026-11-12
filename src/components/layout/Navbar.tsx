import React, { useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Shield,
  User,
  Zap,
  CheckCircle2,
  X,
  Radio,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types';
import { store } from '../../lib/storage';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenCreateModal: () => void;
  onSelectTicket?: (ticketId: string) => void;
  onOpenTour?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenCreateModal,
  onSelectTicket,
  onOpenTour,
}) => {
  const currentRole = store.getCurrentRole();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const notifications = [
    {
      id: 'n-1',
      ticketId: 'TKT-10421',
      title: 'TBOH-847291 SLA At Risk (24m left)',
      time: 'Just now',
      unread: true,
      type: 'urgent',
    },
    {
      id: 'n-2',
      ticketId: 'TKT-10425',
      title: 'Emirates Partner Desk replied to Side Conversation',
      time: '12m ago',
      unread: true,
      type: 'info',
    },
    {
      id: 'n-3',
      ticketId: 'TKT-10426',
      title: 'Payment Gateway Timeout: Ticket Escalated to Lead',
      time: '34m ago',
      unread: false,
      type: 'alert',
    },
  ];

  const handleSimulateInboundEvent = () => {
    setSimulating(true);
    setTimeout(() => {
      // Pick a random event to inject into primary case or create new ticket
      const primary = store.getTicketById('TKT-10421');
      if (primary) {
        store.addSideConversationReply(
          'TKT-10421',
          'sc-1',
          'Elena Rostova (Marriott APAC Desk)',
          true,
          'UPDATE: Marriott Central Accounts has approved the waiver credit token MR-WVR-99214. Credit is officially authorized.'
        );
      }
      setSimulating(false);
    }, 700);
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between gap-4 select-none">
      {/* Left zone: Global Search trigger */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-400 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
            <span>Search by TBOH (e.g. TBOH-847291), Ticket ID, Agency, or Supplier...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-900 border border-slate-800 rounded">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right zone: Tour, Live Event Bus, Role Switcher, Notifications, New Case */}
      <div className="flex items-center gap-2.5">
        {/* Interactive Guided Evaluation Tour */}
        <button
          onClick={onOpenTour}
          title="Interactive Guided Tour: Walk through all 6 TBO Hackathon problems and test live features"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:text-white bg-sky-950/80 hover:bg-sky-900 border border-sky-700/80 hover:border-sky-500 rounded-lg transition-all shadow-sm group"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Guided Tour</span>
        </button>

        {/* Real-time simulation event trigger (Accurately labeled per Item #22) */}
        {currentRole !== 'Agency' && (
          <button
            onClick={handleSimulateInboundEvent}
            disabled={simulating}
            title="Demo Event Simulator: Injects incoming supplier webhook event for demonstration"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg transition-colors"
          >
            <Radio className={`w-3.5 h-3.5 ${simulating ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
            <span>{simulating ? 'Simulating...' : 'Demo Event Sim'}</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowRoleMenu(false);
            }}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400" />
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs font-semibold text-slate-200">
                <span>{currentRole === 'Agency' ? 'Agency Case Alerts' : 'Operations Alerts'}</span>
                <span className="text-[10px] text-sky-400 font-mono">
                  {currentRole === 'Agency' ? '1 Active' : '3 Active'}
                </span>
              </div>
              <div className="divide-y divide-slate-800/60">
                {(currentRole === 'Agency'
                  ? notifications.filter(n => n.ticketId === 'TKT-10421')
                  : notifications
                ).map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setShowNotifMenu(false);
                      onSelectTicket?.(n.ticketId);
                    }}
                    className="w-full text-left p-3 hover:bg-slate-800/60 transition-colors flex items-start gap-2.5"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        n.type === 'urgent' ? 'bg-rose-500' : n.type === 'alert' ? 'bg-amber-400' : 'bg-sky-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{n.title}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher - Clearly labeled as Demo Persona (Item #6) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-slate-300">Demo Persona:</span>
            <span className="font-bold text-white">{currentRole}</span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 font-semibold border-b border-slate-800 mb-1">
                Switch Demo Persona (Simulated)
              </div>
              {(['Agency', 'Agent', 'Escalation Manager', 'Lead'] as UserRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => {
                    store.setCurrentRole(role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-start justify-between p-2 text-xs rounded-lg transition-colors ${
                    currentRole === role
                      ? 'bg-sky-600/20 text-sky-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{role}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {role === 'Agency'
                        ? 'Scoped to Global Travel Partners (agn-1)'
                        : role === 'Agent'
                        ? 'Frontline specialist desk (Priya Sharma)'
                        : role === 'Escalation Manager'
                        ? 'Managerial escalations & overrides'
                        : 'Operations Lead & routing control'}
                    </div>
                  </div>
                  {currentRole === role && <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create Ticket Primary CTA */}
        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-sm shadow-sky-600/30 whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Case</span>
        </button>
      </div>
    </header>
  );
};
