import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  GitFork,
  MessageSquareShare,
  ClockAlert,
  Lightbulb,
  DatabaseZap,
  UserCheck,
  Building2,
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';
import { store } from '../../lib/storage';
import { UserRole } from '../../types';

interface GuidedEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicket: (ticketId: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const GuidedEvaluationModal: React.FC<GuidedEvaluationModalProps> = ({
  isOpen,
  onClose,
  onSelectTicket,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const currentRole = store.getCurrentRole();

  if (!isOpen) return null;

  const features = [
    {
      id: 'p1',
      problemNumber: 'Problem 1',
      title: 'Context Over Isolated Tickets (TBOH Linkage)',
      icon: Layers,
      color: 'sky',
      badge: 'TBOH-847291',
      summary:
        'Instead of fragmenting refund, cancellation, and guest requests into separate disconnected tickets, OpsDesk links them under the TBOH booking reference with full traveler itinerary context and agency history.',
      actionLabel: 'Launch Primary Demo Case (TKT-10421)',
      onAction: () => {
        store.setCurrentRole('Agent');
        onSelectTicket('TKT-10421');
        onClose();
      },
      highlights: [
        'TBOH-847291 links 3 related tickets together in real time',
        'Separates active booking context from general agency interaction history',
        'Tracks guest name, supplier bedbank (Marriott), check-in in 8h, and imminent LCD',
      ],
    },
    {
      id: 'p2',
      problemNumber: 'Problem 2',
      title: 'Intelligent Routing & Operating Windows',
      icon: GitFork,
      color: 'blue',
      badge: 'IST Shift Simulation',
      summary:
        'Routing evaluates Region, Priority, Agency Tier, Intent, and live agent capacity. Out-of-window requests dynamically route to the Global 24/7 Operations Desk.',
      actionLabel: 'Open Routing Engine & Shift Simulator',
      onAction: () => {
        store.setCurrentRole('Lead');
        onNavigateToTab('routing');
        onClose();
      },
      highlights: [
        'Simulate IST Shifts: India Day (11:00), EMEA Overlap (15:30), APAC Night (20:00), Overnight (03:30)',
        'Live Agent Workload Balancing assigns to lowest-capacity qualified specialist',
        'Fully explainable routing decisions viewable in ticket details',
      ],
    },
    {
      id: 'p3',
      problemNumber: 'Problem 3',
      title: 'Persistent Side Conversations',
      icon: MessageSquareShare,
      color: 'indigo',
      badge: 'Decoupled Recipients',
      summary:
        'Supplier emails (e.g., Marriott Central Accounts, Emirates Desk) maintain explicit recipients. Transferring a ticket across teams or agents never breaks external threads.',
      actionLabel: 'Inspect Side Conversations Desk',
      onAction: () => {
        store.setCurrentRole('Agent');
        onNavigateToTab('conversations');
        onClose();
      },
      highlights: [
        'Explicit external recipients stay preserved through ticket transfers',
        'Real-time replies from hoteliers and GDS desks update the unified timeline',
        'Test inbound simulation via the "Demo Event Sim" button in the top navbar',
      ],
    },
    {
      id: 'p4',
      problemNumber: 'Problem 4',
      title: 'Travel-Aware Dynamic SLA & Escalations',
      icon: ClockAlert,
      color: 'amber',
      badge: 'Check-in & LCD Compression',
      summary:
        'Travel operations cannot use static timers. OpsDesk compresses SLA countdowns by up to 75% when check-in is <24 hours away or LCD expires today, with direct escalation paths to the Escalation Manager.',
      actionLabel: 'Inspect SLA & Escalation Dashboard',
      onAction: () => {
        store.setCurrentRole('Escalation Manager');
        onNavigateToTab('sla');
        onClose();
      },
      highlights: [
        'Dynamic SLA compression: Check-in <24h and LCD proximity accelerate deadlines',
        'Regional calendar rules (e.g., Middle East Friday/Saturday weekends, India holidays)',
        'True managerial escalation path with override and dedicated queue',
      ],
    },
    {
      id: 'p5',
      problemNumber: 'Problem 5',
      title: 'Closing the Broken Feedback Loop',
      icon: Lightbulb,
      color: 'emerald',
      badge: 'Bug & Jira Linkage',
      summary:
        'Unstructured agency friction is converted into visible operational patterns. Operations leads can classify recurring issues as product bugs, supplier flaws, or process disputes linked to issue trackers.',
      actionLabel: 'View Operational Insights & Bug Tracking',
      onAction: () => {
        store.setCurrentRole('Lead');
        onNavigateToTab('insights');
        onClose();
      },
      highlights: [
        'Clustered recurring themes across 18 travel agencies',
        'Link recurring issues directly to bug tracker tickets (e.g., TBO-OPS-4921)',
        'Root-cause analysis and actionable recommended remedies',
      ],
    },
    {
      id: 'p6',
      problemNumber: 'Problem 6',
      title: 'Zero Artificial 3,000-Row Limitation',
      icon: DatabaseZap,
      color: 'cyan',
      badge: 'Streaming & Archive',
      summary:
        'Legacy systems choke at 3K rows. OpsDesk demonstrates full keyset pagination, streaming CSV/JSON export, and compliance archival with zero artificial truncation.',
      actionLabel: 'Test Data Export & Cold Archival',
      onAction: () => {
        store.setCurrentRole('Lead');
        onNavigateToTab('data');
        onClose();
      },
      highlights: [
        'No 3K row cap on search, filtering, or bulk exports',
        '1-click CSV & JSON dataset downloads with complete operational metadata',
        'Cold retention archive with verifiable restoration',
      ],
    },
    {
      id: 'rbac',
      problemNumber: 'Security & RBAC',
      title: 'Strict Agency Data Isolation',
      icon: UserCheck,
      color: 'rose',
      badge: 'Global Travel Partners (agn-1)',
      summary:
        'Agency users can ONLY see their own tickets. Direct URL attempts to access other agencies return an Access Denied screen. Internal ops notes, supplier threads, and routing telemetry are strictly hidden.',
      actionLabel: 'Switch to Agency Persona to Test Isolation',
      onAction: () => {
        store.setCurrentRole('Agency');
        onNavigateToTab('dashboard');
        onClose();
      },
      highlights: [
        'Bound to Global Travel Partners (agn-1, Platinum VIP)',
        'Complete isolation: other agencies, internal queues, and notes are inaccessible',
        'Direct link navigation to unauthorized tickets triggers access-denied rejection',
      ],
    },
  ];

  const current = features[activeTab];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-sm shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  OpsDesk for TBO — Interactive Evaluation Guide
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  Ready to Evaluate
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every requirement from Part A of the TBO Hackathon is fully implemented and testable.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Left Nav List + Right Detail View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Navigation Tabs */}
          <div className="w-72 border-r border-slate-800 bg-slate-950/60 p-3 overflow-y-auto space-y-1.5 shrink-0">
            <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 font-semibold">
              Evaluation Tracks
            </div>
            {features.map((feat, index) => {
              const TabIcon = feat.icon;
              const isSelected = activeTab === index;
              return (
                <button
                  key={feat.id}
                  onClick={() => setActiveTab(index)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-sky-600/15 border border-sky-500/40 text-white shadow-sm'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <TabIcon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isSelected ? 'text-sky-400' : 'text-slate-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">
                        {feat.problemNumber}
                      </span>
                    </div>
                    <div className="text-xs font-semibold truncate mt-0.5">
                      {feat.title}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Quick Persona Switcher Strip */}
            <div className="pt-3 border-t border-slate-800/80 mt-2">
              <div className="px-2 pb-1 text-[10px] font-mono uppercase text-slate-400 font-semibold">
                Current Persona: <strong className="text-sky-400">{currentRole}</strong>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                {(['Agent', 'Agency', 'Escalation Manager', 'Lead'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    onClick={() => store.setCurrentRole(r)}
                    className={`px-2 py-1 rounded text-left transition-colors truncate ${
                      currentRole === r
                        ? 'bg-sky-500 text-white font-semibold'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Detail Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-900/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800/80 flex items-center justify-center text-sky-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-sky-400 uppercase">
                      {current.problemNumber}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {current.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">{current.title}</h3>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
              {current.summary}
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase font-mono text-slate-400">
                Key Functionality Implemented:
              </h4>
              <div className="space-y-2">
                {current.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Launch Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Click below to launch this feature in the live workspace:
              </span>
              <button
                onClick={current.onAction}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-sky-600 hover:bg-sky-500 transition-all shadow-md shadow-sky-600/30 group"
              >
                <span>{current.actionLabel}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OpsDesk is live · Fully interactive B2B prototype</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm('Reset application to original default state?')) {
                  store.resetToDefaultSeedData();
                  onClose();
                }
              }}
              className="text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Reset Seed Data
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
            >
              Close &amp; Explore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
