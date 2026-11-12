import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  ArrowRightLeft,
  MessageSquarePlus,
  Building2,
  Calendar,
  Clock,
  Send,
  Lock,
  GitFork,
  Link2,
  Unlink2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Tag,
  Hotel,
  Plane,
  CreditCard,
  User,
  History,
  Info,
  Shield
} from 'lucide-react';
import { Ticket, TicketStatus, UserRole } from '../../types';
import { store, DEMO_AGENCY_ID } from '../../lib/storage';
import { StatusBadge, PriorityBadge, SLABadge } from '../common/Badge';
import { EscalateModal } from './EscalateModal';
import { TransferModal } from './TransferModal';
import { CreateSideConvoModal } from './CreateSideConvoModal';

interface TicketWorkspaceProps {
  ticketId: string;
  onBack: () => void;
  onSelectTicket: (id: string) => void;
}

export const TicketWorkspace: React.FC<TicketWorkspaceProps> = ({
  ticketId,
  onBack,
  onSelectTicket,
}) => {
  const currentRole = store.getCurrentRole();
  const { ticket, unauthorized } = store.getScopedTicketById(ticketId);

  // Modals
  const [showEscalate, setShowEscalate] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showSideConvo, setShowSideConvo] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'timeline' | 'side_convos' | 'linked_cluster'>('timeline');

  // Composer
  const [messageType, setMessageType] = useState<'external' | 'internal'>('external');
  const [messageContent, setMessageContent] = useState('');
  const [sideConvoReplyContent, setSideConvoReplyContent] = useState<Record<string, string>>({});

  // Unauthorized Access Rejection (Item #3)
  if (unauthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-950/40">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-white">Access Denied — Data Isolation Active</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
          You do not have permission to view this ticket. Under TBO operational data isolation rules,
          travel agencies may only access tickets belonging to their own organization.
        </p>
        <button
          onClick={onBack}
          className="mt-5 px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors shadow-sm"
        >
          Return to My Agency Cases
        </button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Ticket not found or has been removed.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 text-xs bg-slate-800 text-white rounded">
          Return to list
        </button>
      </div>
    );
  }

  const agency = store.getAgencies().find(a => a.id === ticket.agencyId);
  const relatedResults = store.getRelatedTickets(ticket);
  const agencyHistory = store.getAgencyHistoryTickets(ticket.agencyId, ticket.id);

  // Internal Note Protection (Item #4)
  const visibleMessages = currentRole === 'Agency'
    ? ticket.messages.filter(m => !m.isInternal)
    : ticket.messages;

  const visibleTimeline = currentRole === 'Agency'
    ? ticket.timeline.filter(e => e.type !== 'note_added')
    : ticket.timeline;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    store.addMessage(ticket.id, {
      id: `msg-${Date.now()}`,
      sender: currentRole === 'Agency' ? 'Agency Consultant (Global Travel Partners)' : `${currentRole} User`,
      senderRole: currentRole,
      isInternal: currentRole === 'Agency' ? false : messageType === 'internal',
      content: messageContent.trim(),
      timestamp: new Date().toISOString(),
    });

    setMessageContent('');
  };

  const handleSendSideReply = (sideConvoId: string) => {
    const content = sideConvoReplyContent[sideConvoId];
    if (!content || !content.trim()) return;

    store.addSideConversationReply(
      ticket.id,
      sideConvoId,
      `${currentRole} (TBO Operations)`,
      true,
      content
    );

    setSideConvoReplyContent(prev => ({ ...prev, [sideConvoId]: '' }));
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    store.updateTicket(ticket.id, { status: newStatus });
  };

  const handleLink = (targetTicketId: string) => {
    store.linkTickets(ticket.id, targetTicketId);
  };

  const handleUnlink = (targetTicketId: string) => {
    store.unlinkTickets(ticket.id, targetTicketId);
  };

  // Travel Proximity calculations
  const checkInDate = new Date(ticket.checkInDate);
  const lcdDate = new Date(ticket.lcdDate);
  const createdDate = new Date(ticket.createdAt);
  const hoursUntilCheckIn = Math.round((checkInDate.getTime() - Date.now()) / (1000 * 3600));
  const hoursUntilLcd = Math.round((lcdDate.getTime() - Date.now()) / (1000 * 3600));

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Breadcrumb & Action Bar */}
      <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-sky-400">{ticket.id}</span>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/80">
              {ticket.tboh}
            </span>

            {/* Status: Selectable for internal roles, view-only badge for Agency */}
            {currentRole !== 'Agency' ? (
              <div className="relative">
                <select
                  value={ticket.status}
                  onChange={e => handleStatusChange(e.target.value as TicketStatus)}
                  className="bg-slate-950 border border-slate-800 text-xs font-medium rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="New">New</option>
                  <option value="Open">Open</option>
                  <option value="Pending">Pending</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            ) : (
              <StatusBadge status={ticket.status} />
            )}

            <PriorityBadge priority={ticket.priority} />
            <SLABadge status={ticket.slaStatus} minutesRemaining={ticket.slaMinutesRemaining} />
          </div>
        </div>

        {/* Action Controls - Hidden for Agency Persona (Item #5) */}
        {currentRole !== 'Agency' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSideConvo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-sky-400" />
              <span>Side Convo ({ticket.sideConversations.length})</span>
            </button>

            <button
              onClick={() => setShowTransfer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Transfer Case</span>
            </button>

            <button
              onClick={() => setShowEscalate(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-sm ${
                ticket.isEscalated
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{ticket.isEscalated ? 'Escalated' : 'Escalate to Manager'}</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>TBO Operations Case Active</span>
          </div>
        )}
      </div>

      {/* Travel-Aware Urgency & Visual Timeline Bar */}
      <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-4 text-xs shrink-0 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Travel Urgency Timeline:</span>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-400">
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </span>
            <span className="text-slate-600">→</span>
            <span
              className={`px-2 py-0.5 rounded font-semibold ${
                hoursUntilLcd <= 3
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              LCD: {hoursUntilLcd <= 0 ? 'Passed' : `in ${hoursUntilLcd}h`} ({lcdDate.toLocaleDateString()})
            </span>
            <span className="text-slate-600">→</span>
            <span
              className={`px-2 py-0.5 rounded font-semibold ${
                hoursUntilCheckIn <= 24
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              Check-in: {hoursUntilCheckIn <= 0 ? 'Active' : `in ${hoursUntilCheckIn}h`} ({checkInDate.toLocaleDateString()})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hoursUntilCheckIn <= 24 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              Check-in Imminent (&lt;24h)
            </span>
          )}
          {currentRole !== 'Agency' && ticket.isEscalated && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
              Under Escalation Management
            </span>
          )}
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center Area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 overflow-hidden">
          {/* Ticket Title & Metadata */}
          <div className="p-6 border-b border-slate-800 bg-slate-900/30">
            <h1 className="text-lg font-bold text-white tracking-tight">{ticket.title}</h1>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed max-w-4xl">{ticket.description}</p>

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-200 font-medium">{ticket.agencyName}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                  {ticket.agencyTier}
                </span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Intent: <strong className="text-sky-300">{ticket.intent}</strong></span>
                <span className="text-[10px] text-slate-500 font-mono">({ticket.intentConfidence} conf)</span>
              </span>
              <span>·</span>
              <span>
                Assigned Team: <strong className="text-slate-200">{ticket.assignedTeamName}</strong>
              </span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center px-6 border-b border-slate-800 bg-slate-900/40 text-xs">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-3 font-medium border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-sky-500 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Conversation &amp; Updates ({visibleMessages.length})
            </button>

            {/* Side Conversations are Internal Operations Only (Item #5) */}
            {currentRole !== 'Agency' && (
              <button
                onClick={() => setActiveTab('side_convos')}
                className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'side_convos'
                    ? 'border-sky-500 text-sky-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Side Conversations</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                  {ticket.sideConversations.length}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('linked_cluster')}
              className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'linked_cluster'
                  ? 'border-sky-500 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>TBOH Linkage &amp; Related Cases</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800">
                {relatedResults.length}
              </span>
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'timeline' && (
              <div className="space-y-4 max-w-4xl">
                {/* Messages Stream */}
                <div className="space-y-3">
                  {visibleMessages.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No communications logged yet.
                    </div>
                  ) : (
                    visibleMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl border ${
                          msg.isInternal
                            ? 'bg-amber-950/20 border-amber-800/40'
                            : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{msg.sender}</span>
                            <span className="text-slate-500 text-[11px]">({msg.senderRole})</span>
                            {msg.isInternal && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/60">
                                <Lock className="w-2.5 h-2.5" /> Internal Ops Note
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Audit Timeline Events (Problem 1 & 44) */}
                <div className="pt-4 border-t border-slate-800/80">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Case Activity Trail
                  </h4>
                  <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-4">
                    {visibleTimeline.map(event => (
                      <div key={event.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-300">{event.actor}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'side_convos' && currentRole !== 'Agency' && (
              <div className="space-y-6 max-w-4xl">
                <div className="bg-sky-950/30 border border-sky-800/50 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-sky-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-sky-400" />
                      Decoupled Recipient Integrity
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Side conversation recipients are strictly preserved when this case is transferred or reassigned.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSideConvo(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
                  >
                    + New Side Thread
                  </button>
                </div>

                {ticket.sideConversations.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No active side conversations. Click &quot;+ New Side Thread&quot; to contact a hotel supplier or airline desk.
                  </div>
                ) : (
                  ticket.sideConversations.map(convo => (
                    <div
                      key={convo.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm"
                    >
                      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                              {convo.targetType} Thread
                            </span>
                            <span className="text-xs font-semibold text-white">{convo.recipientName}</span>
                            <span className="text-xs font-mono text-slate-400">({convo.recipientEmail})</span>
                          </div>
                          <h4 className="text-xs font-medium text-slate-300 mt-1">{convo.subject}</h4>
                        </div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {convo.status}
                        </span>
                      </div>

                      <div className="p-4 space-y-3 bg-slate-950/40">
                        {convo.messages.map(scm => (
                          <div key={scm.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between text-slate-400 text-[11px]">
                              <span className="font-semibold text-slate-200">{scm.sender}</span>
                              <span className="font-mono">{new Date(scm.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{scm.content}</p>
                          </div>
                        ))}

                        <div className="pt-2 flex gap-2">
                          <input
                            type="text"
                            placeholder={`Reply directly to ${convo.recipientName}...`}
                            value={sideConvoReplyContent[convo.id] || ''}
                            onChange={e =>
                              setSideConvoReplyContent({
                                ...sideConvoReplyContent,
                                [convo.id]: e.target.value,
                              })
                            }
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSendSideReply(convo.id);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                          />
                          <button
                            onClick={() => handleSendSideReply(convo.id)}
                            className="px-3 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'linked_cluster' && (
              <div className="space-y-4 max-w-4xl">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-white">TBOH Linkage Key: {ticket.tboh}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {relatedResults.length} related cases share this booking key or reference.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {relatedResults.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No other cases share this TBOH or strong relationship criteria.
                    </div>
                  ) : (
                    relatedResults.map(({ ticket: relTkt, matchReasons }) => {
                      const isLinked = ticket.linkedTicketIds.includes(relTkt.id);
                      return (
                        <div
                          key={relTkt.id}
                          className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-sky-400">{relTkt.id}</span>
                              <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
                                {relTkt.tboh}
                              </span>
                              <StatusBadge status={relTkt.status} />
                              <PriorityBadge priority={relTkt.priority} />
                            </div>
                            <h4 className="text-xs font-medium text-slate-200">{relTkt.title}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{relTkt.description}</p>
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-sky-400">
                              <span>Relationship:</span>
                              {matchReasons.map(r => (
                                <span
                                  key={r}
                                  className="px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/80 text-[10px] font-mono text-sky-300"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => onSelectTicket(relTkt.id)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> View
                            </button>
                            {currentRole !== 'Agency' && (
                              isLinked ? (
                                <button
                                  onClick={() => handleUnlink(relTkt.id)}
                                  className="px-2.5 py-1 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-950 border border-rose-800/80 rounded transition-colors flex items-center gap-1"
                                >
                                  <Unlink2 className="w-3 h-3" /> Unlink
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleLink(relTkt.id)}
                                  className="px-2.5 py-1 text-xs font-medium text-sky-300 hover:text-sky-200 bg-sky-950/60 hover:bg-sky-950 border border-sky-800/80 rounded transition-colors flex items-center gap-1"
                                >
                                  <Link2 className="w-3 h-3" /> Link
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Persistent Message Composer at Bottom */}
          {activeTab === 'timeline' && (
            <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
              <form onSubmit={handleSendMessage} className="space-y-3 max-w-4xl">
                <div className="flex items-center justify-between text-xs">
                  {/* Selector: Only available for internal roles; Agency is strictly external message */}
                  {currentRole !== 'Agency' ? (
                    <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setMessageType('external')}
                        className={`px-3 py-1 font-medium rounded-md transition-colors ${
                          messageType === 'external'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Public Reply to Agency
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessageType('internal')}
                        className={`flex items-center gap-1.5 px-3 py-1 font-medium rounded-md transition-colors ${
                          messageType === 'internal'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Lock className="w-3 h-3" /> Internal Ops Note
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-sky-400" /> Reply to TBO Operations
                    </span>
                  )}

                  <span className="text-[11px] text-slate-500">
                    {currentRole === 'Agency'
                      ? 'Transmitted securely to the TBO Operations Desk'
                      : messageType === 'internal'
                      ? '🔒 Only visible to authorized internal ops staff'
                      : '✉ Transmitted directly to travel agency partner'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={messageContent}
                    onChange={e => setMessageContent(e.target.value)}
                    placeholder={
                      currentRole === 'Agency'
                        ? 'Type your message or additional documents for the operations team...'
                        : messageType === 'internal'
                        ? 'Write internal audit note, handoff instructions, or supplier remarks...'
                        : `Compose external reply to ${ticket.agencyName}...`
                    }
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm ${
                      currentRole !== 'Agency' && messageType === 'internal'
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Context Panel */}
        <div className="w-96 bg-slate-900/60 overflow-y-auto p-5 space-y-4 shrink-0">
          {/* Section 1: TBOH First-Class Linkage Key */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                TBOH Linkage Key
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">{ticket.tboh}</span>
            </div>

            {relatedResults.length > 0 ? (
              <div className="bg-sky-950/40 border border-sky-800/60 rounded-lg p-2.5 text-xs text-sky-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  {relatedResults.length} related cases found for this TBOH
                </p>
                <div className="space-y-1 pt-1">
                  {relatedResults.slice(0, 3).map(({ ticket: rel }) => (
                    <button
                      key={rel.id}
                      onClick={() => onSelectTicket(rel.id)}
                      className="w-full text-left text-[11px] font-mono text-slate-300 hover:text-white flex items-center justify-between py-0.5 hover:bg-slate-800/50 rounded px-1"
                    >
                      <span className="truncate">{rel.id} · {rel.title}</span>
                      <StatusBadge status={rel.status} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Single active case for this booking reference.</p>
            )}
          </div>

          {/* Section 2: Agency 360 & Historical Context (Item #17) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Agency 360 Context
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-semibold">
                {ticket.agencyTier}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white">{ticket.agencyName}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {agency?.primaryContact} · {agency?.email}
              </p>
            </div>

            {agency && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-400 block text-[10px]">Total Cases</span>
                  <span className="text-slate-100 font-bold">{agency.totalTickets}</span>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-400 block text-[10px]">Refund Cases</span>
                  <span className="text-amber-400 font-bold">{agency.refundCount}</span>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-400 block text-[10px]">SLA Breaches</span>
                  <span className="text-rose-400 font-bold">{agency.slaBreachCount}</span>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-400 block text-[10px]">Escalations</span>
                  <span className="text-sky-400 font-bold">{agency.escalationCount}</span>
                </div>
              </div>
            )}

            {/* Separated Agency History (Item #17) */}
            {agencyHistory.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Other Agency Cases ({agencyHistory.length})
                </span>
                <div className="space-y-1">
                  {agencyHistory.slice(0, 2).map(h => (
                    <button
                      key={h.id}
                      onClick={() => onSelectTicket(h.id)}
                      className="w-full text-left text-[11px] text-slate-400 hover:text-white flex items-center justify-between p-1 hover:bg-slate-800/60 rounded font-mono truncate"
                    >
                      <span className="truncate">{h.id} · {h.intent}</span>
                      <span className="text-[10px] text-slate-500">{new Date(h.createdAt).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Explainable Routing Decision (Internal Only, Item #5) */}
          {currentRole !== 'Agency' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Explainable Routing Decision
                </span>
                <GitFork className="w-3.5 h-3.5 text-sky-400" />
              </div>

              <div className="text-xs">
                <p className="text-slate-300">
                  Assigned to: <strong className="text-white">{ticket.assignedAgentName || 'Queue'}</strong>
                </p>
                <p className="text-[11px] text-slate-400">{ticket.assignedTeamName}</p>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Decision factors:</span>
                {(ticket.routingExplanation?.reasons || [
                  `Region affinity: ${ticket.region}`,
                  `Specialized in ${ticket.intent}`,
                  `Priority tier: ${ticket.priority}`,
                  'Evaluated against active routing rule matrix',
                ]).map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Travel & Supplier Reference */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Travel Reference Data
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Traveller / Lead:</span>
                <span className="text-slate-200 font-medium">{ticket.travellerName || 'Not specified'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Supplier Reference:</span>
                <span className="text-slate-200 font-mono">{ticket.bookingReference || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Wholesaler / Bedbank:</span>
                <span className="text-slate-200">{ticket.supplierName || 'Direct'}</span>
              </div>
            </div>
          </div>

          {/* Section 5: SLA & Operational Context */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                SLA Status
              </span>
              <SLABadge status={ticket.slaStatus} minutesRemaining={ticket.slaMinutesRemaining} />
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Target Response:</span>
                <span className="text-slate-200 font-mono">{new Date(ticket.slaDeadline).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Time Remaining:</span>
                <span
                  className={`font-mono font-bold ${
                    ticket.slaMinutesRemaining <= 0
                      ? 'text-rose-400'
                      : ticket.slaMinutesRemaining <= 30
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {ticket.slaMinutesRemaining} minutes
                </span>
              </div>

              {/* Dependency info (Item #13) */}
              {ticket.dependency && ticket.dependency !== 'None' && (
                <div className="pt-1 text-[11px] text-amber-300">
                  Dependency: {ticket.dependency}
                </div>
              )}
            </div>

            {/* Escalation File: Only visible to internal operations */}
            {currentRole !== 'Agency' && ticket.isEscalated && (
              <div className="mt-2 p-2.5 rounded bg-rose-950/40 border border-rose-800/60 text-xs space-y-1">
                <span className="text-rose-300 font-semibold block">Escalation File</span>
                <p className="text-[11px] text-rose-200/90 leading-tight">{ticket.escalationReason}</p>
                <div className="text-[10px] text-rose-300/70 font-mono pt-1">
                  Owner: {ticket.escalatedTo} · By: {ticket.escalatedBy}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals (Internal only) */}
      {currentRole !== 'Agency' && (
        <>
          <EscalateModal
            ticket={ticket}
            isOpen={showEscalate}
            onClose={() => setShowEscalate(false)}
            onSuccess={() => {}}
          />
          <TransferModal
            ticket={ticket}
            isOpen={showTransfer}
            onClose={() => setShowTransfer(false)}
            onSuccess={() => {}}
          />
          <CreateSideConvoModal
            ticket={ticket}
            isOpen={showSideConvo}
            onClose={() => setShowSideConvo(false)}
            onSuccess={() => {}}
          />
        </>
      )}
    </div>
  );
};
