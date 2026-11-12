import React from 'react';
import { MessageSquareShare, ArrowRight, ShieldCheck, Mail, Building, Clock } from 'lucide-react';
import { store } from '../../lib/storage';

interface ConversationsViewProps {
  onSelectTicket: (ticketId: string) => void;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({ onSelectTicket }) => {
  const tickets = store.getTickets();

  // Extract all side conversations across tickets
  const allSideConvos = tickets.flatMap(ticket =>
    ticket.sideConversations.map(convo => ({
      ...convo,
      ticketTitle: ticket.title,
      tboh: ticket.tboh,
      agencyName: ticket.agencyName,
      ticketStatus: ticket.status,
    }))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Side Conversations &amp; External Supplier Threads
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated threads with hoteliers, bedbanks, airline GDS desks, and escalation teams that
            preserve explicit recipients across reassignments.
          </p>
        </div>
      </div>

      {/* Recipient Persistence Architecture Banner */}
      <div className="bg-sky-950/30 border border-sky-800/50 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-sky-300">Problem 3 Solved: Recipient Persistence</p>
          <p className="text-slate-300 leading-relaxed">
            Unlike legacy helpdesks where side conversation recipients get overwritten or broken whenever
            a ticket is reassigned or transferred to another team, OpsDesk decouples recipients from queue
            groups. A supplier thread opened with Marriott or Emirates stays bound to that exact contact.
          </p>
        </div>
      </div>

      {/* Grid of Conversations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Active External &amp; Supplier Threads ({allSideConvos.length})</span>
          <span className="font-mono text-[11px]">Real-time synchronization</span>
        </div>

        {allSideConvos.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
            No active side conversations found. Open any ticket and click &quot;Side Convo&quot; to initiate a thread.
          </div>
        ) : (
          allSideConvos.map(convo => (
            <div
              key={convo.id}
              onClick={() => onSelectTicket(convo.ticketId)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-sky-600/60 transition-all cursor-pointer group shadow-sm flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-semibold uppercase">
                    {convo.targetType}
                  </span>
                  <span className="font-mono text-xs font-bold text-sky-400">{convo.ticketId}</span>
                  <span className="font-mono text-xs text-slate-400">({convo.tboh})</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      convo.status === 'Waiting Reply'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {convo.status}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                  {convo.subject}
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <strong>{convo.recipientName}</strong>
                    <span className="text-slate-500 font-mono text-[11px]">({convo.recipientEmail})</span>
                  </span>
                  <span>·</span>
                  <span>Agency: {convo.agencyName}</span>
                </div>

                {convo.messages.length > 0 && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 italic bg-slate-950/60 p-2 rounded border border-slate-800/80 mt-1">
                    Latest: &quot;{convo.messages[convo.messages.length - 1].content}&quot;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button className="px-3 py-1.5 text-xs font-semibold text-sky-400 bg-sky-950/60 group-hover:bg-sky-600 group-hover:text-white rounded-lg border border-sky-800/80 transition-all flex items-center gap-1">
                  <span>Open Thread</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
