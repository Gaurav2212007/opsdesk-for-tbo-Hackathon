import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, ArrowRight, Building2, User, Calendar, Tag, Shield } from 'lucide-react';
import { store, DEMO_AGENCY_ID, DEMO_AGENCY_NAME } from '../../lib/storage';
import { Ticket } from '../../types';
import { StatusBadge, PriorityBadge } from './Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicket: (ticketId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTicket,
}) => {
  const [query, setQuery] = useState('');
  const currentRole = store.getCurrentRole();
  const rawTickets = store.getTickets(); // Automatically scoped if Agency

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    // Agency Data Isolation Check (Item #28)
    const basePool = currentRole === 'Agency'
      ? rawTickets.filter(t => t.agencyId === DEMO_AGENCY_ID)
      : rawTickets;

    if (!query.trim()) {
      return basePool.slice(0, 5);
    }
    const q = query.toLowerCase().trim();
    return basePool.filter(t => {
      // For messages: Never match internal notes if role is Agency!
      const msgMatch = t.messages.some(m => {
        if (currentRole === 'Agency' && m.isInternal) return false;
        return m.content.toLowerCase().includes(q);
      });

      return (
        t.id.toLowerCase().includes(q) ||
        t.tboh.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (currentRole !== 'Agency' && t.agencyName.toLowerCase().includes(q)) ||
        t.intent.toLowerCase().includes(q) ||
        (t.supplierName && t.supplierName.toLowerCase().includes(q)) ||
        (t.travellerName && t.travellerName.toLowerCase().includes(q)) ||
        msgMatch
      );
    });
  }, [query, rawTickets, currentRole]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={
              currentRole === 'Agency'
                ? `Search ${DEMO_AGENCY_NAME} cases by TBOH (e.g. TBOH-847291), Ticket ID, or keywords...`
                : 'Search by TBOH (e.g. TBOH-847291), Ticket ID, Agency, Intent, or keyword...'
            }
            className="flex-1 bg-transparent border-0 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-800/40">
          <div className="px-3 py-1.5 text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>
              {query ? `Matching Results (${results.length})` : 'Recent Cases'}
            </span>
            <span className="text-[10px]">
              {currentRole === 'Agency' ? `Scoped to ${DEMO_AGENCY_NAME}` : 'Indexed across all global operations'}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching travel cases found for &quot;{query}&quot; in your authorized scope.
            </div>
          ) : (
            results.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTicket(t.id);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-slate-800/60 transition-colors flex items-center justify-between group"
              >
                <div className="space-y-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-sky-400">{t.id}</span>
                    <span className="font-mono text-xs font-semibold px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                      {t.tboh}
                    </span>
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                    {currentRole !== 'Agency' && t.isEscalated && (
                      <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide">
                        Escalated
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                    {t.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {t.agencyName}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {t.intent}
                    </span>
                    {t.supplierName && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[120px]">{t.supplierName}</span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transform group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
