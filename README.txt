Quick Launch for Judges: Download or clone this repository and double-click OpenMe.html to open the live application directly in your browser (no Node.js or installation required).

# OpsDesk for TBO — Context-Aware Operations Platform

> **Next-Generation Travel Operations Ticketing Architecture**  
> Moving from *isolated, reactive tickets* to *context-rich, relationship-aware, travel-aware operations cases.*

---

## 1. Project Overview

**OpsDesk** is an enterprise B2B operations web platform designed specifically for TBO's high-volume global travel operations. 

Traditional helpdesk ticketing systems ask:
> *"How quickly can we close this ticket?"*

**OpsDesk** asks:
> *"What is happening with this travel agency? What is the booking context? How urgent is the check-in or cancellation window? Who is the best-equipped specialist available right now? Who else needs to be involved across suppliers and internal desks? And what macro operational insight can we learn to prevent this failure tomorrow?"*

---

## 2. Problem Statement & Solutions (Part A Solved)

| Hackathon Problem | Legacy Limitation | OpsDesk Solution |
| :--- | :--- | :--- |
| **Problem 1: Tickets Without Context** | Inquiries arrive fragmented; agents have zero agency history; same refund creates multiple disjoint tickets; linkages rely on 3P tools. | **TBOH First-Class Linkage Key** automatically binds all cases sharing booking references. Full **Agency 360 Context** displays historical refund counts, cancellation frequency, and SLA breaches on every case. |
| **Problem 2: Inefficient Routing & Ownership** | Hardcoded triggers, rigid FIFO/LIFO queues, lack of country-level rules, zero consideration of agent availability or current load. | **Configurable Explainable Routing Engine** evaluates Priority, Region, Agency Tier, Intent, and live Agent Availability/Capacity. Decision factors are clearly enumerated on every ticket. |
| **Problem 3: Fragile Side Conversations** | Side threads inherit ticket queue groups; transferring a ticket resets or corrupts external recipient emails; messages fail silently. | **Decoupled Recipient Integrity**: Side conversation recipients (hotel bedbanks, airline desks, escalation leads) are strictly decoupled and remain intact through transfers. |
| **Problem 4: SLA & Escalation Complexity** | Generic one-size-fits-all SLA clocks ignore travel dates; tickets nearing check-in fail silently; escalations merely add followers. | **Travel-Aware SLA Radar** factor in Check-in Proximity (<24h compress clocks) and Last Cancellation Date (LCD). Dedicated **Escalation Manager Queue** assigns true managerial ownership. |
| **Problem 5: Broken Feedback Loop** | High-value operational intelligence (recurring bugs, supplier faults, policy gaps) remains trapped in resolved ticket text. | **Operational Insight Engine** aggregates recurring patterns across tickets/agencies with trend velocities, linking directly to engineering bug trackers. |
| **Problem 6: Real-Time Data & Archival Limits** | Artificial 3,000-row export caps; weak synchronization; lack of structured compliance archival storage. | **Infinite Scalable Data Architecture** with cursor pagination, streaming CSV/JSON exports without 3K row caps, and cold retention archiving. |

---

## 3. Architecture & Tech Stack

- **Framework**: React 19 (SPA with modular functional components & hooks)
- **Language**: TypeScript throughout with strict types (`src/types/index.ts`)
- **Styling**: Tailwind CSS v4 with dark mode and Plus Jakarta Sans + JetBrains Mono typography
- **State & Persistence**: Observable, reactive state store with local storage caching (`src/lib/storage.ts`) and automatic dynamic countdown ticks
- **Domain Engines**:
  - `src/lib/classifier.ts`: Modular intent classification with rule-based heuristics & confidence scoring
  - `src/lib/routingEngine.ts`: Explainable multi-factor routing & capacity load-balancing
  - `src/lib/slaEngine.ts`: Travel proximity SLA calculation (LCD and check-in compression)
- **Icons**: Lucide React

---

## 4. Key Data Models

```typescript
interface Ticket {
  id: string;                      // e.g. TKT-10421
  title: string;
  description: string;
  agencyId: string;
  agencyName: string;
  agencyTier: 'Platinum VIP' | 'Gold' | 'Silver' | 'Standard';
  tboh: string;                    // TBO Booking Reference e.g. TBOH-847291
  bookingReference?: string;       // GDS / Hotel Supplier Reference
  travellerName?: string;
  supplierId?: string;
  supplierName?: string;
  
  intent: IntentType;
  intentConfidence: 'High' | 'Medium' | 'Low';
  intentSource: 'AI / Rule Engine' | 'Manual Agent' | 'Customer Tag';
  
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'Open' | 'Pending' | 'Escalated' | 'Resolved' | 'Closed';
  region: 'APAC' | 'India' | 'Europe' | 'Middle East' | 'Americas';
  
  checkInDate: string;             // ISO date
  lcdDate: string;                 // Last Cancellation Date ISO
  
  slaDeadline: string;             // ISO
  slaStatus: 'Healthy' | 'At Risk' | 'Breached';
  slaMinutesRemaining: number;
  
  linkedTicketIds: string[];       // TBOH cluster linkage
  isEscalated: boolean;
  escalationReason?: string;
  escalatedTo?: string;
  
  routingExplanation?: RoutingExplanation;
  messages: Message[];
  sideConversations: SideConversation[];
  timeline: TimelineEvent[];
  isArchived?: boolean;
}
```

---

## 5. Walkthrough of the Hackathon Demo Scenarios

### Step 1 — Primary Demo Case (`TBOH-847291`)
1. Click **"Primary: TBOH-847291"** in the sidebar.
2. View the case: *Refund pending for booking - Guest demanding instant credit*.
3. Notice:
   - **TBOH First-Class Linkage**: 2 other tickets sharing `TBOH-847291` are automatically highlighted and clustered in the right panel.
   - **Agency 360**: Displays Global Travel Partners (Platinum VIP) with 14 past refunds and 5 escalations.
   - **Travel Timeline**: Shows LCD expiring in 3 hours and Check-in tomorrow morning.
   - **Explainable Routing**: Enumerates every reason why Priya Sharma was selected.
   - **Side Conversation**: Active thread with Elena Rostova at Marriott APAC.
   - **Escalation**: Case is under escalation with Deepak Verma.

### Step 2 — Side Conversation Recipient Persistence
1. In `TKT-10421` (or click **"Supplier Side Convo"** in the sidebar demo drawer), open the **Side Conversations** tab.
2. Click **Transfer Case** at the top bar and reassign the ticket to another team (e.g. *EMEA Air & Ground Desk*).
3. Confirm the transfer: Note how the side conversation recipient strictly remains `Elena Rostova (Marriott APAC)` without resetting to the new group.

### Step 3 — Reactive Ticket Creation & Live Routing
1. Click **+ New Case** in the top bar.
2. Type `TBOH-847291` as the booking reference: OpsDesk immediately alerts you that existing cases share this TBOH and will automatically link them.
3. Type `"Hotel refused check-in because front desk claims overbooking"`:
   - Watch the **Live Intent Classifier** immediately detect `Hotel Issue` with High confidence.
   - Watch the **Intelligent Routing Preview** instantly assign the ticket to an available APAC Hotel specialist with spare capacity.

### Step 4 — Operational Insights & Bug Linkage
1. Open the **Operational Insights** tab from the sidebar.
2. View recurring themes such as *Refund Delays via International Gateway* (42 tickets, 18 agencies, +32% velocity).
3. Click to drill down into root causes, view sample tickets, and link the operational issue directly to engineering issue `TBO-OPS-4921`.

### Step 5 — Data & Archival Without 3K Limit
1. Open **Data & Archive** from the sidebar.
2. Observe scalable pagination (10, 25, 50, 100 records per page).
3. Click **Export CSV** or **Export JSON** to export entire datasets directly in the browser.
4. Click **Archive** to index tickets into cold retention storage, or switch to the **Cold Retention Archive** tab to restore records.

---

## 6. Simulated Demo Assumptions & Production Extensions

| Component | Prototype Status | Production Architecture Path |
| :--- | :--- | :--- |
| **Agent Availability** | Simulated for demonstration (toggleable in Routing tab) | Real-time agent telephony/SSO presence sync (Genesys / Twilio / Slack) |
| **Intent Classifier** | Deterministic token heuristics with confidence rating | Vertex AI / Gemini API fine-tuned on historical TBO GDS/CRS transcripts |
| **Travel Booking Data** | Synthetic TBOH and PNR records | Direct REST/XML connector to TBO Core Booking Engine and TPS APIs |
| **Live Webhooks** | In-app live event bus simulator | Cloud Pub/Sub and Kafka cluster processing incoming GDS ticketing TTLs |
