import React, { useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  Bug,
  ShieldCheck,
  Building2,
  ExternalLink,
  Tag,
  CheckCircle2,
  X
} from 'lucide-react';
import { store } from '../../lib/storage';
import { InsightTheme, Ticket } from '../../types';

interface InsightsViewProps {
  onSelectTicket: (ticketId: string) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ onSelectTicket }) => {
  const isAgency = store.getCurrentRole() === 'Agency';
  const insights = store.getInsights();
  const allTickets = store.getTickets();

  const [selectedTheme, setSelectedTheme] = useState<InsightTheme | null>(null);
  const [editingCategory, setEditingCategory] = useState<InsightTheme['category']>('Product issue');
  const [editingBugLink, setEditingBugLink] = useState('');

  const handleOpenDrilldown = (theme: InsightTheme) => {
    setSelectedTheme(theme);
    setEditingCategory(theme.category);
    setEditingBugLink(theme.bugTrackingLink || '');
  };

  const handleSaveSignal = () => {
    if (!selectedTheme) return;
    store.tagInsight(selectedTheme.id, editingCategory, editingBugLink || undefined);
    setSelectedTheme({
      ...selectedTheme,
      category: editingCategory,
      bugTrackingLink: editingBugLink || undefined,
    });
  };

  if (isAgency) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4">
          <ShieldCheck className="w-6 h-6 text-slate-500" />
        </div>
        <h2 className="text-base font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">
          Operational Insights, cross-agency pattern clustering, and engineering bug tracking are restricted to internal Operations Leads and Escalation Managers.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Operational Insights &amp; Bug Signals
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Converts isolated agency conversations and ticket friction into visible operational patterns
            linked directly to product engineering.
          </p>
        </div>
      </div>

      {/* Philosophy Card */}
      <div className="bg-sky-950/20 border border-sky-800/40 p-4 rounded-xl text-xs text-sky-200 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sky-300">Problem 5 Solved: Closing the Broken Feedback Loop</p>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
            Instead of trapping customer pain points inside individual closed tickets, OpsDesk continuously
            extracts recurring themes. Operations leads can flag patterns as product bugs, supplier flaws,
            or policy disputes with direct Jira/Linear issue tracking links.
          </p>
        </div>
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map(theme => (
          <div
            key={theme.id}
            onClick={() => handleOpenDrilldown(theme)}
            className="bg-slate-900 border border-slate-800 hover:border-sky-600/70 p-5 rounded-xl transition-all cursor-pointer space-y-3 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                {theme.category}
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  theme.trendPercentage > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {theme.trendPercentage > 0 ? `+${theme.trendPercentage}%` : `${theme.trendPercentage}%`} vs last week
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                {theme.theme}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {theme.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">Volume</span>
                <span className="text-slate-200 font-bold">{theme.ticketCount} cases</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">Agencies</span>
                <span className="text-slate-200 font-bold">{theme.affectedAgenciesCount} partners</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">Linked Bug</span>
                <span className="text-sky-400 font-bold truncate block">
                  {theme.bugTrackingLink || 'Unlinked'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="text-[11px]">Regions: {theme.regions.join(', ')}</span>
              <span className="text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold text-[11px]">
                Drill Down →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Drill-down Modal (Section 28 & 29) */}
      {selectedTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-sky-400">{selectedTheme.category}</span>
                <h2 className="text-sm font-bold text-white mt-0.5">{selectedTheme.theme}</h2>
              </div>
              <button onClick={() => setSelectedTheme(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Root Cause Analysis</span>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedTheme.description}</p>
                <div className="pt-2 text-xs text-emerald-400 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Recommended Action:</strong> {selectedTheme.recommendedAction}
                  </span>
                </div>
              </div>

              {/* Product / Bug Signal Assignment (Section 29) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  <Bug className="w-4 h-4 text-sky-400" />
                  Operational Issue Signal &amp; Bug Linkage
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Feedback Category</label>
                    <select
                      value={editingCategory}
                      onChange={e => setEditingCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="Product issue">Product issue</option>
                      <option value="Supplier issue">Supplier issue</option>
                      <option value="Process issue">Process issue</option>
                      <option value="Policy issue">Policy issue</option>
                      <option value="Feature request">Feature request</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Jira / Bug Tracker Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. TBO-OPS-4921"
                      value={editingBugLink}
                      onChange={e => setEditingBugLink(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveSignal}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors"
                  >
                    Update Signal
                  </button>
                </div>
              </div>

              {/* Sample Related Tickets */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-slate-400 font-semibold block">
                  Sample Correlated Tickets ({selectedTheme.sampleTicketIds.length})
                </span>
                <div className="divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  {selectedTheme.sampleTicketIds.map(id => {
                    const tkt = allTickets.find(t => t.id === id);
                    if (!tkt) return null;
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          setSelectedTheme(null);
                          onSelectTicket(id);
                        }}
                        className="p-3 hover:bg-slate-900 transition-colors cursor-pointer flex items-center justify-between group text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sky-400">{tkt.id}</span>
                            <span className="font-mono text-slate-400">({tkt.tboh})</span>
                            <span className="text-slate-300 font-medium">{tkt.agencyName}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">{tkt.title}</p>
                        </div>
                        <span className="text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-mono text-[11px]">
                          View Case <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
