export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketStatus = 'New' | 'Open' | 'Pending' | 'Escalated' | 'Resolved' | 'Closed';

export type SLAStatus = 'Healthy' | 'At Risk' | 'Breached';

export type UserRole = 'Agency' | 'Agent' | 'Escalation Manager' | 'Lead';

export type Region = 'APAC' | 'India' | 'Europe' | 'Middle East' | 'Americas';

export type IntentType =
  | 'Refund'
  | 'Cancellation'
  | 'Booking Modification'
  | 'Hotel Issue'
  | 'Flight Issue'
  | 'Payment'
  | 'Availability'
  | 'Supplier Issue'
  | 'Technical Issue'
  | 'Policy Clarification'
  | 'Emergency Travel Issue';

export type AgentStatus = 'Available' | 'Busy' | 'Away' | 'Offline';

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'Agent' | 'Senior Specialist' | 'Team Lead' | 'Escalation Manager';
  teamId: string;
  region: Region;
  skills: IntentType[];
  status: AgentStatus;
  currentWorkload: number;
  maxWorkload: number;
  avatar?: string;
}

export interface TeamCoverageWindow {
  startTimeIST: string; // e.g. "09:00"
  endTimeIST: string;   // e.g. "18:00"
  timezone: string;     // e.g. "IST (UTC+5:30)"
  shiftName: string;    // e.g. "India Prime Day Shift"
}

export interface Team {
  id: string;
  name: string;
  region: Region;
  leader: string;
  coverageWindow?: TeamCoverageWindow;
}

export interface Agency {
  id: string;
  name: string;
  code: string;
  tier: 'Platinum VIP' | 'Gold' | 'Silver' | 'Standard';
  region: Region;
  country: string;
  primaryContact: string;
  email: string;
  totalTickets: number;
  refundCount: number;
  cancellationCount: number;
  slaBreachCount: number;
  escalationCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  type: 'Hotel Bedbank' | 'Airline GDS' | 'Car Rental' | 'Transfer/Tours' | 'Payment Gateway';
  contactEmail: string;
  contactName: string;
  slaAgreementHours: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO string
  actor: string;
  actorRole?: string;
  type:
    | 'created'
    | 'classified'
    | 'linked'
    | 'unlinked'
    | 'assigned'
    | 'reassigned'
    | 'transferred'
    | 'sla_changed'
    | 'escalated'
    | 'side_convo_created'
    | 'side_convo_reply'
    | 'note_added'
    | 'status_changed'
    | 'resolved'
    | 'archived'
    | 'restored';
  description: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  sender: string;
  senderRole: string;
  senderEmail?: string;
  isInternal: boolean;
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface SideConversation {
  id: string;
  ticketId: string;
  targetType: 'Supplier' | 'Agency' | 'Internal Team' | 'Escalation Manager';
  recipientName: string;
  recipientEmail: string;
  subject: string;
  status: 'Open' | 'Waiting Reply' | 'Closed';
  createdAt: string;
  messages: {
    id: string;
    sender: string;
    isExternal: boolean;
    content: string;
    timestamp: string;
  }[];
}

export interface RoutingExplanation {
  assignedToAgentId: string;
  assignedToAgentName: string;
  matchedRuleId?: string;
  matchedRuleName?: string;
  reasons: string[];
  evaluatedAt: string;
  timeEvaluation?: {
    currentIST: string;
    windowActive: boolean;
    coverageTeam: string;
    shiftName: string;
  };
}

export interface Ticket {
  id: string; // e.g. TKT-10421
  title: string;
  description: string;
  agencyId: string;
  agencyName: string;
  agencyTier: 'Platinum VIP' | 'Gold' | 'Silver' | 'Standard';
  tboh: string; // TBO Booking Reference e.g. TBOH-847291
  bookingReference?: string;
  travellerName?: string;
  supplierId?: string;
  supplierName?: string;
  
  intent: IntentType;
  intentConfidence: 'High' | 'Medium' | 'Low';
  intentSource: 'AI / Rule Engine' | 'Manual Agent' | 'Customer Tag';
  suggestedIntent?: IntentType;
  intentReasoning?: string;

  priority: Priority;
  status: TicketStatus;
  region: Region;
  country: string;

  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedTeamId: string;
  assignedTeamName: string;

  // Travel Dates & Urgency
  checkInDate: string; // ISO date/time
  lcdDate: string; // Last Cancellation Date ISO
  createdAt: string;
  updatedAt: string;

  // SLA
  slaDeadline: string; // ISO
  slaStatus: SLAStatus;
  slaMinutesRemaining: number;
  dependency?: 'Supplier response pending' | 'Finance approval pending' | 'GDS sync pending' | 'None';
  regionalCalendarNote?: string;

  // Linkage
  linkedTicketIds: string[];
  isDuplicateOf?: string;

  // Escalation
  isEscalated: boolean;
  escalationReason?: string;
  escalatedTo?: string;
  escalatedAt?: string;
  escalatedBy?: string;

  // Routing
  routingExplanation?: RoutingExplanation;

  // Communication
  messages: Message[];
  sideConversations: SideConversation[];
  timeline: TimelineEvent[];

  // Archival
  isArchived?: boolean;
  archivedAt?: string;
  archiveRetentionDays?: number;

  // Insight Tagging
  productBugLinked?: string;
  feedbackCategory?: 'Product issue' | 'Supplier issue' | 'Process issue' | 'Policy issue' | 'Feature request';
}

export interface RoutingRule {
  id: string;
  name: string;
  priorityOrder: number;
  active: boolean;
  criteria: {
    region?: Region;
    country?: string;
    intent?: IntentType;
    priority?: Priority;
    agencyTier?: 'Platinum VIP' | 'Gold' | 'Silver' | 'Standard';
    hasImminentCheckIn?: boolean; // check-in within 24h
  };
  targetTeamId: string;
  targetSpecialistSkill?: IntentType;
  description: string;
}

export interface InsightTheme {
  id: string;
  theme: string;
  ticketCount: number;
  impactScore: 'Critical' | 'High' | 'Medium';
  affectedAgenciesCount: number;
  regions: Region[];
  trendPercentage: number;
  category: 'Product issue' | 'Supplier issue' | 'Process issue' | 'Policy issue' | 'Feature request';
  description: string;
  sampleTicketIds: string[];
  recommendedAction: string;
  bugTrackingLink?: string;
}
