import {
  Agency,
  Agent,
  InsightTheme,
  Message,
  RoutingRule,
  SideConversation,
  Supplier,
  Team,
  Ticket,
  TimelineEvent,
  UserRole
} from '../types';
import {
  SEED_AGENCIES,
  SEED_AGENTS,
  SEED_INSIGHTS,
  SEED_ROUTING_RULES,
  SEED_SUPPLIERS,
  SEED_TEAMS,
  SEED_TICKETS
} from '../data/seedData';
import { calculateTicketSLA } from './slaEngine';

const STORAGE_KEYS = {
  TICKETS: 'opsdesk_tickets_v1',
  AGENTS: 'opsdesk_agents_v1',
  AGENCIES: 'opsdesk_agencies_v1',
  TEAMS: 'opsdesk_teams_v1',
  SUPPLIERS: 'opsdesk_suppliers_v1',
  RULES: 'opsdesk_rules_v1',
  INSIGHTS: 'opsdesk_insights_v1',
  CURRENT_USER_ROLE: 'opsdesk_role_v1',
};

// Safe JSON parser with fallback
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to read ${key} from localStorage, using fallback:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to write ${key} to localStorage:`, err);
  }
}

export const DEMO_AGENCY_ID = 'agn-1';
export const DEMO_AGENCY_NAME = 'Global Travel Partners';

export class OpsDeskStore {
  private static instance: OpsDeskStore;
  private listeners: Set<() => void> = new Set();

  private tickets: Ticket[] = [];
  private agents: Agent[] = [];
  private agencies: Agency[] = [];
  private teams: Team[] = [];
  private suppliers: Supplier[] = [];
  private rules: RoutingRule[] = [];
  private insights: InsightTheme[] = [];
  private currentRole: UserRole = 'Agent';
  private currentAgentId: string = 'agent-1'; // Priya Sharma by default
  private simulatedTimeIST: string = '19:30'; // Default evening shift for demo evaluation

  private constructor() {
    this.init();
  }

  public static getInstance(): OpsDeskStore {
    if (!OpsDeskStore.instance) {
      OpsDeskStore.instance = new OpsDeskStore();
    }
    return OpsDeskStore.instance;
  }

  private init() {
    this.tickets = loadFromStorage<Ticket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);
    this.agents = loadFromStorage<Agent[]>(STORAGE_KEYS.AGENTS, SEED_AGENTS);
    this.agencies = loadFromStorage<Agency[]>(STORAGE_KEYS.AGENCIES, SEED_AGENCIES);
    this.teams = loadFromStorage<Team[]>(STORAGE_KEYS.TEAMS, SEED_TEAMS);
    this.suppliers = loadFromStorage<Supplier[]>(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
    this.rules = loadFromStorage<RoutingRule[]>(STORAGE_KEYS.RULES, SEED_ROUTING_RULES);
    this.insights = loadFromStorage<InsightTheme[]>(STORAGE_KEYS.INSIGHTS, SEED_INSIGHTS);
    this.currentRole = loadFromStorage<UserRole>(STORAGE_KEYS.CURRENT_USER_ROLE, 'Agent');
    // Schema migration check: ensure teams have coverageWindow and primary tickets exist
    if (!this.teams[0]?.coverageWindow || !this.tickets.some(t => t.id === 'TKT-10421')) {
      this.tickets = [...SEED_TICKETS];
      this.teams = [...SEED_TEAMS];
      this.rules = [...SEED_ROUTING_RULES];
      this.agents = [...SEED_AGENTS];
      this.insights = [...SEED_INSIGHTS];
      this.suppliers = [...SEED_SUPPLIERS];
      this.agencies = [...SEED_AGENCIES];
      saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
      saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
      saveToStorage(STORAGE_KEYS.RULES, this.rules);
      saveToStorage(STORAGE_KEYS.AGENTS, this.agents);
      saveToStorage(STORAGE_KEYS.INSIGHTS, this.insights);
      saveToStorage(STORAGE_KEYS.SUPPLIERS, this.suppliers);
      saveToStorage(STORAGE_KEYS.AGENCIES, this.agencies);
    }

    // Run SLA tick on active tickets to ensure dynamic countdown accuracy
    this.tickSLAs();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public resetToDefaultSeedData(): void {
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    localStorage.removeItem(STORAGE_KEYS.AGENTS);
    localStorage.removeItem(STORAGE_KEYS.AGENCIES);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.RULES);
    localStorage.removeItem(STORAGE_KEYS.INSIGHTS);

    this.tickets = [...SEED_TICKETS];
    this.agents = [...SEED_AGENTS];
    this.agencies = [...SEED_AGENCIES];
    this.teams = [...SEED_TEAMS];
    this.suppliers = [...SEED_SUPPLIERS];
    this.rules = [...SEED_ROUTING_RULES];
    this.insights = [...SEED_INSIGHTS];

    this.persistAll();
    this.notify();
  }

  private persistAll() {
    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    saveToStorage(STORAGE_KEYS.AGENTS, this.agents);
    saveToStorage(STORAGE_KEYS.AGENCIES, this.agencies);
    saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
    saveToStorage(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    saveToStorage(STORAGE_KEYS.RULES, this.rules);
    saveToStorage(STORAGE_KEYS.INSIGHTS, this.insights);
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ROLE, this.currentRole);
  }

  // SLA background calculation
  public tickSLAs() {
    let changed = false;
    const now = Date.now();

    this.tickets = this.tickets.map(ticket => {
      if (ticket.status === 'Resolved' || ticket.status === 'Closed' || ticket.isArchived) {
        return ticket;
      }

      const res = calculateTicketSLA(ticket.createdAt, ticket.priority, ticket.checkInDate, ticket.lcdDate, now);
      if (res.slaStatus !== ticket.slaStatus || Math.abs(res.slaMinutesRemaining - ticket.slaMinutesRemaining) > 1) {
        changed = true;
        return {
          ...ticket,
          slaStatus: res.slaStatus,
          slaMinutesRemaining: res.slaMinutesRemaining,
          slaDeadline: res.slaDeadline,
        };
      }
      return ticket;
    });

    if (changed) {
      saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
      this.notify();
    }
  }

  // Role-Based Sanitization for Agency Persona (Item #2, #3, #4)
  public sanitizeTicketForAgency(ticket: Ticket): Ticket {
    return {
      ...ticket,
      messages: ticket.messages.filter(m => !m.isInternal),
      timeline: ticket.timeline.filter(e => e.type !== 'note_added'),
      routingExplanation: undefined, // Hide internal routing engine decisions
      escalationReason: undefined,   // Hide internal escalation management notes
      productBugLinked: undefined,   // Hide internal product bug tracking numbers
    };
  }

  // Getters with Role Scoping
  public getTickets(): Ticket[] {
    if (this.currentRole === 'Agency') {
      return this.tickets
        .filter(t => t.agencyId === DEMO_AGENCY_ID)
        .map(t => this.sanitizeTicketForAgency(t));
    }
    return this.tickets;
  }

  // Raw internal tickets for background operations
  public getAllTicketsInternal(): Ticket[] {
    return this.tickets;
  }

  public getTicketById(id: string): Ticket | undefined {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return undefined;

    if (this.currentRole === 'Agency') {
      if (ticket.agencyId !== DEMO_AGENCY_ID) {
        return undefined; // Reject access to other agency's ticket
      }
      return this.sanitizeTicketForAgency(ticket);
    }
    return ticket;
  }

  public getScopedTicketById(id: string): { ticket: Ticket | null; unauthorized: boolean } {
    const raw = this.tickets.find(t => t.id === id);
    if (!raw) return { ticket: null, unauthorized: false };

    if (this.currentRole === 'Agency') {
      if (raw.agencyId !== DEMO_AGENCY_ID) {
        return { ticket: null, unauthorized: true };
      }
      return { ticket: this.sanitizeTicketForAgency(raw), unauthorized: false };
    }

    return { ticket: raw, unauthorized: false };
  }

  // Related cases: Strict relationship signals only (Item #17)
  public getRelatedTickets(ticket: Ticket): { ticket: Ticket; matchReasons: string[] }[] {
    const results: { ticket: Ticket; matchReasons: string[] }[] = [];
    const pool = this.currentRole === 'Agency'
      ? this.tickets.filter(t => t.agencyId === DEMO_AGENCY_ID)
      : this.tickets;

    for (const other of pool) {
      if (other.id === ticket.id) continue;
      const reasons: string[] = [];

      // Check TBOH match (primary context key)
      if (ticket.tboh && other.tboh && ticket.tboh.trim().toUpperCase() === other.tboh.trim().toUpperCase()) {
        reasons.push('Same TBOH reference');
      }

      // Same booking reference
      if (ticket.bookingReference && other.bookingReference && ticket.bookingReference === other.bookingReference) {
        reasons.push('Same Hotel/Flight Reference');
      }

      // Same supplier + same intent
      if (ticket.supplierId && other.supplierId && ticket.supplierId === other.supplierId && ticket.intent === other.intent) {
        reasons.push('Same Supplier + Same Intent');
      }

      // Explicitly linked
      if (ticket.linkedTicketIds.includes(other.id)) {
        reasons.push('Explicitly Linked');
      }

      if (reasons.length > 0) {
        const sanitized = this.currentRole === 'Agency' ? this.sanitizeTicketForAgency(other) : other;
        results.push({ ticket: sanitized, matchReasons: reasons });
      }
    }

    return results;
  }

  // Agency History: Separated from linked cases cluster (Item #17)
  public getAgencyHistoryTickets(agencyId: string, currentTicketId?: string): Ticket[] {
    const pool = this.tickets.filter(t => t.agencyId === agencyId && t.id !== currentTicketId);
    if (this.currentRole === 'Agency') {
      return pool.map(t => this.sanitizeTicketForAgency(t));
    }
    return pool;
  }

  public getSimulatedTimeIST(): string {
    return this.simulatedTimeIST;
  }

  public setSimulatedTimeIST(time?: string): void {
    this.simulatedTimeIST = time || '';
    this.notify();
  }

  public getAgents(): Agent[] {
    return this.agents;
  }

  public getAgencies(): Agency[] {
    return this.agencies;
  }

  public getTeams(): Team[] {
    return this.teams;
  }

  public getSuppliers(): Supplier[] {
    return this.suppliers;
  }

  public getRoutingRules(): RoutingRule[] {
    return this.rules;
  }

  public getInsights(): InsightTheme[] {
    return this.insights;
  }

  public getCurrentRole(): UserRole {
    return this.currentRole;
  }

  public getCurrentAgentId(): string {
    return this.currentAgentId;
  }

  // Mutators
  public setCurrentRole(role: UserRole) {
    this.currentRole = role;
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ROLE, this.currentRole);
    this.notify();
  }

  public setCurrentAgentId(agentId: string) {
    this.currentAgentId = agentId;
    this.notify();
  }

  public updateAgentStatus(agentId: string, status: Agent['status']) {
    this.agents = this.agents.map(a => (a.id === agentId ? { ...a, status } : a));
    saveToStorage(STORAGE_KEYS.AGENTS, this.agents);
    this.notify();
  }

  public addTicket(ticket: Ticket): void {
    this.tickets = [ticket, ...this.tickets];
    
    // Update agency stats
    this.agencies = this.agencies.map(ag => {
      if (ag.id === ticket.agencyId) {
        return {
          ...ag,
          totalTickets: ag.totalTickets + 1,
          refundCount: ticket.intent === 'Refund' ? ag.refundCount + 1 : ag.refundCount,
          cancellationCount: ticket.intent === 'Cancellation' ? ag.cancellationCount + 1 : ag.cancellationCount,
        };
      }
      return ag;
    });

    // Update agent workload if assigned
    if (ticket.assignedAgentId) {
      this.agents = this.agents.map(a =>
        a.id === ticket.assignedAgentId ? { ...a, currentWorkload: a.currentWorkload + 1 } : a
      );
      saveToStorage(STORAGE_KEYS.AGENTS, this.agents);
    }

    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    saveToStorage(STORAGE_KEYS.AGENCIES, this.agencies);
    this.notify();
  }

  public updateTicket(id: string, updates: Partial<Ticket>): void {
    this.tickets = this.tickets.map(t => {
      if (t.id === id) {
        return { ...t, ...updates, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    this.notify();
  }

  public addMessage(ticketId: string, message: Message): void {
    const tkt = this.getTicketById(ticketId);
    if (!tkt) return;

    const timelineEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: message.sender,
      actorRole: message.senderRole,
      type: message.isInternal ? 'note_added' : 'status_changed',
      description: message.isInternal ? 'Internal note added' : 'External message sent to agency',
    };

    this.tickets = this.tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          messages: [...t.messages, message],
          timeline: [...t.timeline, timelineEvent],
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    this.notify();
  }

  public linkTickets(ticketIdA: string, ticketIdB: string): void {
    const tA = this.getTicketById(ticketIdA);
    const tB = this.getTicketById(ticketIdB);
    if (!tA || !tB) return;

    const eventA: TimelineEvent = {
      id: `tl-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      actor: 'Agent',
      type: 'linked',
      description: `Linked case to ${ticketIdB} (${tB.title})`,
    };

    const eventB: TimelineEvent = {
      id: `tl-${Date.now()}-2`,
      timestamp: new Date().toISOString(),
      actor: 'Agent',
      type: 'linked',
      description: `Linked case to ${ticketIdA} (${tA.title})`,
    };

    this.tickets = this.tickets.map(t => {
      if (t.id === ticketIdA) {
        const linked = Array.from(new Set([...t.linkedTicketIds, ticketIdB]));
        return { ...t, linkedTicketIds: linked, timeline: [...t.timeline, eventA] };
      }
      if (t.id === ticketIdB) {
        const linked = Array.from(new Set([...t.linkedTicketIds, ticketIdA]));
        return { ...t, linkedTicketIds: linked, timeline: [...t.timeline, eventB] };
      }
      return t;
    });

    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    this.notify();
  }

  public unlinkTickets(ticketIdA: string, ticketIdB: string): void {
    const eventA: TimelineEvent = {
      id: `tl-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      actor: 'Agent',
      type: 'unlinked',
      description: `Unlinked case from ${ticketIdB}`,
    };

    this.tickets = this.tickets.map(t => {
      if (t.id === ticketIdA) {
        return {
          ...t,
          linkedTicketIds: t.linkedTicketIds.filter(id => id !== ticketIdB),
          timeline: [...t.timeline, eventA],
        };
      }
      if (t.id === ticketIdB) {
        return {
          ...t,
          linkedTicketIds: t.linkedTicketIds.filter(id => id !== ticketIdA),
        };
      }
      return t;
    });

    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    this.notify();
  }

  public escalateTicket(
    ticketId: string,
    reason: string,
    destination: string,
    escalatedBy: string
  ): void {
    const tkt = this.getTicketById(ticketId);
    if (!tkt) return;

    // Find escalation agent
    const escAgent = this.agents.find(a => a.role === 'Escalation Manager' && a.status !== 'Offline') || this.agents[4];

    const timelineEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: escalatedBy,
      type: 'escalated',
      description: `Escalated to ${destination}. Reason: ${reason}`,
    };

    this.tickets = this.tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'Escalated',
          isEscalated: true,
          escalationReason: reason,
          escalatedTo: destination,
          escalatedBy,
          escalatedAt: new Date().toISOString(),
          assignedAgentId: escAgent.id,
          assignedAgentName: escAgent.name,
          assignedTeamId: 'team-escalation',
          assignedTeamName: 'Global Escalation Desk',
          priority: 'Critical', // Auto-elevate
          timeline: [...t.timeline, timelineEvent],
        };
      }
      return t;
    });

    // Update agency escalation count
    this.agencies = this.agencies.map(ag =>
      ag.id === tkt.agencyId ? { ...ag, escalationCount: ag.escalationCount + 1 } : ag
    );

    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    saveToStorage(STORAGE_KEYS.AGENCIES, this.agencies);
    this.notify();
  }

  public transferTicket(
    ticketId: string,
    targetTeamId: string,
    targetAgentId?: string,
    transferNote?: string
  ): void {
    const tkt = this.getTicketById(ticketId);
    const targetTeam = this.teams.find(t => t.id === targetTeamId);
    const targetAgent = this.agents.find(a => a.id === targetAgentId);
    if (!tkt || !targetTeam) return;

    // Notice: Any existing side conversation recipients MUST be preserved!
    const timelineEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: this.currentRole,
      type: 'transferred',
      description: `Transferred to ${targetTeam.name} ${targetAgent ? `(${targetAgent.name})` : ''}. All active side conversation recipients preserved intact.`,
      metadata: { transferNote },
    };

    this.tickets = this.tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          assignedTeamId: targetTeam.id,
          assignedTeamName: targetTeam.name,
          assignedAgentId: targetAgent?.id,
          assignedAgentName: targetAgent?.name || 'Unassigned',
          timeline: [...t.timeline, timelineEvent],
          // sideConversations remain unchanged — preserving explicit recipients!
        };
      }
      return t;
    });

    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    this.notify();
  }

  public addSideConversation(ticketId: string, sideConvo: SideConversation): void {
    const timelineEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Agent',
      type: 'side_convo_created',
      description: `Opened side conversation with ${sideConvo.targetType}: ${sideConvo.recipientName} (${sideConvo.recipientEmail})`,
    };

    this.tickets = this.tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          sideConversations: [...t.sideConversations, sideConvo],
          timeline: [...t.timeline, timelineEvent],
        };
      }
      return t;
    });

    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    this.notify();
  }

  public addSideConversationReply(
    ticketId: string,
    sideConvoId: string,
    sender: string,
    isExternal: boolean,
    content: string
  ): void {
    const msg = {
      id: `scm-${Date.now()}`,
      sender,
      isExternal,
      content,
      timestamp: new Date().toISOString(),
    };

    const timelineEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: sender,
      type: 'side_convo_reply',
      description: `Side conversation reply from ${sender}`,
    };

    this.tickets = this.tickets.map(t => {
      if (t.id === ticketId) {
        const updatedConvos = t.sideConversations.map(sc => {
          if (sc.id === sideConvoId) {
            return {
              ...sc,
              messages: [...sc.messages, msg],
              status: isExternal ? ('Open' as const) : ('Waiting Reply' as const),
            };
          }
          return sc;
        });

        return {
          ...t,
          sideConversations: updatedConvos,
          timeline: [...t.timeline, timelineEvent],
        };
      }
      return t;
    });

    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    this.notify();
  }

  public toggleRoutingRule(ruleId: string): void {
    this.rules = this.rules.map(r => (r.id === ruleId ? { ...r, active: !r.active } : r));
    saveToStorage(STORAGE_KEYS.RULES, this.rules);
    this.notify();
  }

  public addRoutingRule(rule: RoutingRule): void {
    this.rules = [...this.rules, rule];
    saveToStorage(STORAGE_KEYS.RULES, this.rules);
    this.notify();
  }

  public tagInsight(themeId: string, category: InsightTheme['category'], bugTrackingLink?: string): void {
    this.insights = this.insights.map(th => {
      if (th.id === themeId) {
        return { ...th, category, bugTrackingLink };
      }
      return th;
    });
    saveToStorage(STORAGE_KEYS.INSIGHTS, this.insights);
    this.notify();
  }

  public archiveTicket(ticketId: string, retentionDays: number = 365): void {
    const timelineEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Compliance System',
      type: 'archived',
      description: `Ticket archived to cold retention tier (${retentionDays} days retention policy)`,
    };

    this.tickets = this.tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          isArchived: true,
          archivedAt: new Date().toISOString(),
          archiveRetentionDays: retentionDays,
          timeline: [...t.timeline, timelineEvent],
        };
      }
      return t;
    });

    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    this.notify();
  }

  public restoreTicket(ticketId: string): void {
    const timelineEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Operations Lead',
      type: 'restored',
      description: 'Ticket restored from archive to active operations index',
    };

    this.tickets = this.tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          isArchived: false,
          archivedAt: undefined,
          timeline: [...t.timeline, timelineEvent],
        };
      }
      return t;
    });

    saveToStorage(STORAGE_KEYS.TICKETS, this.tickets);
    this.notify();
  }
}

export const store = OpsDeskStore.getInstance();
