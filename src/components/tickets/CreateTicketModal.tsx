import React, { useState, useMemo } from 'react';
import { PlusCircle, X, Sparkles, Link2, GitFork, AlertCircle } from 'lucide-react';
import { store } from '../../lib/storage';
import { classifyTicketIntent } from '../../lib/classifier';
import { calculateTicketSLA } from '../../lib/slaEngine';
import { evaluateRouting } from '../../lib/routingEngine';
import { IntentType, Priority, Region, Ticket } from '../../types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (ticketId: string) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated,
}) => {
  const agencies = store.getAgencies();
  const rules = store.getRoutingRules();
  const agents = store.getAgents();
  const teams = store.getTeams();
  const suppliers = store.getSuppliers();
  const existingTickets = store.getTickets();

  // Form State
  const [agencyId, setAgencyId] = useState(agencies[0]?.id || '');
  const [tboh, setTboh] = useState('TBOH-847291');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('High');
  const [manualIntent, setManualIntent] = useState<IntentType | ''>('');
  const [travellerName, setTravellerName] = useState('');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  
  // Dates
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  const [checkInDate, setCheckInDate] = useState(tomorrow);
  const [lcdDate, setLcdDate] = useState(today);

  // Live Intent Classification
  const classification = useMemo(() => {
    return classifyTicketIntent(title, description);
  }, [title, description]);

  const activeIntent: IntentType = (manualIntent || classification.suggestedIntent) as IntentType;

  // Live TBOH Linkage Detection
  const existingWithTboh = useMemo(() => {
    if (!tboh.trim()) return [];
    return existingTickets.filter(t => t.tboh.trim().toUpperCase() === tboh.trim().toUpperCase());
  }, [tboh, existingTickets]);

  const selectedAgency = agencies.find(a => a.id === agencyId) || agencies[0];

  // Live Routing Prediction
  const routingPrediction = useMemo(() => {
    return evaluateRouting(
      {
        region: selectedAgency?.region || 'APAC',
        country: selectedAgency?.country || 'Singapore',
        priority,
        agencyTier: selectedAgency?.tier || 'Gold',
        intent: activeIntent,
        checkInDate: new Date(checkInDate).toISOString(),
      },
      rules,
      agents,
      teams
    );
  }, [selectedAgency, priority, activeIntent, checkInDate, rules, agents, teams]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTicketId = `TKT-${Math.floor(10500 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();
    const checkInIso = new Date(checkInDate).toISOString();
    const lcdIso = new Date(lcdDate).toISOString();

    const sla = calculateTicketSLA(nowIso, priority, checkInIso, lcdIso);

    const supplier = suppliers.find(s => s.id === supplierId);

    const newTicket: Ticket = {
      id: newTicketId,
      title: title.trim(),
      description: description.trim(),
      agencyId: selectedAgency.id,
      agencyName: selectedAgency.name,
      agencyTier: selectedAgency.tier,
      tboh: tboh.trim().toUpperCase(),
      travellerName: travellerName.trim() || undefined,
      supplierId: supplier?.id,
      supplierName: supplier?.name,
      intent: activeIntent,
      intentConfidence: manualIntent ? 'High' : classification.confidence,
      intentSource: manualIntent ? 'Manual Agent' : 'AI / Rule Engine',
      suggestedIntent: classification.suggestedIntent,
      intentReasoning: classification.reasoning,
      priority,
      status: 'Open',
      region: selectedAgency.region,
      country: selectedAgency.country,
      assignedAgentId: routingPrediction.assignedToAgentId || undefined,
      assignedAgentName: routingPrediction.assignedToAgentName,
      assignedTeamId: routingPrediction.targetTeamId,
      assignedTeamName: routingPrediction.targetTeamName,
      checkInDate: checkInIso,
      lcdDate: lcdIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      slaDeadline: sla.slaDeadline,
      slaStatus: sla.slaStatus,
      slaMinutesRemaining: sla.slaMinutesRemaining,
      linkedTicketIds: existingWithTboh.map(t => t.id),
      isEscalated: false,
      routingExplanation: routingPrediction,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: selectedAgency.primaryContact,
          senderRole: 'Agency Requester',
          senderEmail: selectedAgency.email,
          isInternal: false,
          content: description.trim(),
          timestamp: nowIso,
        },
      ],
      sideConversations: [],
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          timestamp: nowIso,
          actor: 'Agency Portal Ingestion',
          type: 'created',
          description: `Ticket submitted by ${selectedAgency.name}`,
        },
        {
          id: `tl-${Date.now()}-2`,
          timestamp: nowIso,
          actor: 'Classifier Heuristic Engine',
          type: 'classified',
          description: `Intent classified as "${activeIntent}" (${classification.confidence} confidence)`,
        },
        ...(existingWithTboh.length > 0
          ? [
              {
                id: `tl-${Date.now()}-3`,
                timestamp: nowIso,
                actor: 'TBOH Linkage Engine',
                type: 'linked' as const,
                description: `Auto-linked with ${existingWithTboh.length} existing tickets under TBOH ${tboh.toUpperCase()}`,
              },
            ]
          : []),
        {
          id: `tl-${Date.now()}-4`,
          timestamp: nowIso,
          actor: 'Routing Engine',
          type: 'assigned',
          description: `Assigned to ${routingPrediction.assignedToAgentName} (${routingPrediction.targetTeamName})`,
        },
      ],
    };

    store.addTicket(newTicket);
    onTicketCreated(newTicketId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold text-white">Create Context-Aware Operations Case</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Row 1: Agency and TBOH */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Travel Agency (Partner)
              </label>
              <select
                value={agencyId}
                onChange={e => setAgencyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {agencies.map(ag => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.tier}) · {ag.country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                TBOH Reference (Booking Key)
              </label>
              <input
                required
                type="text"
                placeholder="e.g. TBOH-847291"
                value={tboh}
                onChange={e => setTboh(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 uppercase focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* TBOH Duplicate Warning Banner */}
          {existingWithTboh.length > 0 && (
            <div className="bg-sky-950/40 border border-sky-800/60 rounded-lg p-3 text-xs text-sky-300 flex items-start gap-2.5">
              <Link2 className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Found {existingWithTboh.length} existing ticket(s) with TBOH &quot;{tboh.toUpperCase()}&quot;!
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  OpsDesk will automatically link this new case with{' '}
                  <span className="font-mono text-white">
                    {existingWithTboh.map(t => t.id).join(', ')}
                  </span>
                  . Context and interaction history will be unified.
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Case Title</label>
            <input
              required
              type="text"
              placeholder="e.g. Urgent refund requested for cancelled Bali resort stay"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description &amp; Context</label>
            <textarea
              required
              rows={3}
              placeholder="Describe the operational issue, guest details, or supplier block..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Reactive Intent Classification Box */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Live Intent Classification Engine
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Confidence: <strong className="text-white">{classification.confidence}</strong>
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-slate-300">
                Suggested Intent:{' '}
                <span className="font-semibold text-sky-400 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800">
                  {classification.suggestedIntent}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">{classification.reasoning}</p>
              </div>

              {/* Manual Override dropdown */}
              <div className="shrink-0 text-right">
                <label className="block text-[10px] text-slate-500 mb-0.5">Override Intent?</label>
                <select
                  value={manualIntent}
                  onChange={e => setManualIntent(e.target.value as IntentType)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="">Use AI Suggestion</option>
                  <option value="Refund">Refund</option>
                  <option value="Cancellation">Cancellation</option>
                  <option value="Booking Modification">Booking Modification</option>
                  <option value="Hotel Issue">Hotel Issue</option>
                  <option value="Flight Issue">Flight Issue</option>
                  <option value="Payment">Payment</option>
                  <option value="Availability">Availability</option>
                  <option value="Supplier Issue">Supplier Issue</option>
                  <option value="Emergency Travel Issue">Emergency Travel Issue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Priority & Traveller Details */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Low">Low (24h SLA)</option>
                <option value="Medium">Medium (8h SLA)</option>
                <option value="High">High (3h SLA)</option>
                <option value="Critical">Critical (1h SLA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Check-in Date</label>
              <input
                type="date"
                value={checkInDate}
                onChange={e => setCheckInDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">LCD (Last Cancel Date)</label>
              <input
                type="date"
                value={lcdDate}
                onChange={e => setLcdDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Traveller Name / Group
              </label>
              <input
                type="text"
                placeholder="e.g. Elena Rostova / 2 Guests"
                value={travellerName}
                onChange={e => setTravellerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Bedbank / GDS</label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Routing Engine Preview */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <GitFork className="w-3.5 h-3.5 text-sky-400" />
              <span>Intelligent Routing Preview:</span>
            </div>
            <p className="text-slate-300">
              Assigned To:{' '}
              <strong className="text-white">
                {routingPrediction.assignedToAgentName} ({routingPrediction.targetTeamName})
              </strong>
            </p>
            <p className="text-[11px] text-slate-500">
              {routingPrediction.reasons[0] || 'Standard availability & regional rule evaluation'}
            </p>
          </div>

          {/* Footer CTAs */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-sm shadow-sky-600/30"
            >
              Dispatch Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
