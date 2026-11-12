import { IntentType } from '../types';

interface ClassificationResult {
  suggestedIntent: IntentType;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

const INTENT_RULES: {
  intent: IntentType;
  keywords: string[];
  patterns: RegExp[];
  reason: string;
}[] = [
  {
    intent: 'Emergency Travel Issue',
    keywords: ['emergency', 'stranded', 'deported', 'medical emergency', 'immediate assistance', 'urgent airport', 'trapped'],
    patterns: [/\b(emergency|stranded|airport stuck|immediate)\b/i],
    reason: 'Critical emergency keywords detected requiring immediate ops intervention',
  },
  {
    intent: 'Refund',
    keywords: ['refund', 'money back', 'chargeback', 'reimbursement', 'credit note', 'overcharged', 'refund status', 'refund pending'],
    patterns: [/\b(refund|reimburse|credit\s+note|chargeback)\b/i],
    reason: 'Detected financial refund / reimbursement terms in ticket text',
  },
  {
    intent: 'Cancellation',
    keywords: ['cancel', 'cancellation', 'cancelled', 'abort booking', 'void voucher', 'non-refundable fee'],
    patterns: [/\b(cancel|cancellation|void)\b/i],
    reason: 'Cancellation intention matched in request subject and booking body',
  },
  {
    intent: 'Booking Modification',
    keywords: ['modify', 'change date', 'name change', 'add guest', 'room upgrade', 'amend booking', 'extension', 'amendment'],
    patterns: [/\b(modify|amend|amendment|date\s+change|name\s+change)\b/i],
    reason: 'Requested date, name, or room booking amendment detected',
  },
  {
    intent: 'Hotel Issue',
    keywords: ['hotel', 'room not clean', 'front desk refused', 'no booking found at hotel', 'check-in denied', 'hotel overbooked', 'relocation'],
    patterns: [/\b(hotel|check-in|overbooked|front\s+desk|room)\b/i],
    reason: 'On-property accommodation / front-desk check-in friction identified',
  },
  {
    intent: 'Flight Issue',
    keywords: ['flight', 'pnr', 'airline', 'gate closed', 'missed connection', 'baggage', 'boarding pass', 'gds error'],
    patterns: [/\b(flight|airline|pnr|gds|boarding|terminal)\b/i],
    reason: 'Air transport / airline PNR ticketing error recognized',
  },
  {
    intent: 'Payment',
    keywords: ['payment failed', 'double deduction', 'gateway timeout', '3ds failure', 'invoice', 'gst invoice', 'wire transfer'],
    patterns: [/\b(payment|transaction|gateway|invoice|double\s+deduction)\b/i],
    reason: 'Billing gateway transaction or payment reconciliation terms detected',
  },
  {
    intent: 'Availability',
    keywords: ['sold out', 'inventory', 'rate parity', 'allotment', 'rates changed', 'no rooms available'],
    patterns: [/\b(availability|sold\s+out|inventory|allotment)\b/i],
    reason: 'Hotel allotment or rate disparity query detected',
  },
  {
    intent: 'Supplier Issue',
    keywords: ['supplier offline', 'bedbank', 'api error', 'xml feed down', 'supplier voucher invalid'],
    patterns: [/\b(supplier|bedbank|wholesaler|voucher\s+invalid)\b/i],
    reason: 'Upstream travel inventory wholesaler/supplier failure signaled',
  },
  {
    intent: 'Technical Issue',
    keywords: ['bug', 'crash', 'session expired', 'portal 500 error', 'api timeout', 'login failed'],
    patterns: [/\b(portal|crash|500\s+error|session|timeout)\b/i],
    reason: 'B2B portal platform technical or authentication anomaly',
  },
  {
    intent: 'Policy Clarification',
    keywords: ['policy', 'terms and conditions', 'visa requirement', 'child age policy', 'force majeure'],
    patterns: [/\b(policy|terms|guidelines|regulations)\b/i],
    reason: 'Contractual, visa or supplier policy inquiry identified',
  },
];

export function classifyTicketIntent(title: string, description: string): ClassificationResult {
  const combined = `${title} ${description}`.toLowerCase();

  for (const rule of INTENT_RULES) {
    let matchCount = 0;
    for (const kw of rule.keywords) {
      if (combined.includes(kw)) matchCount += 2;
    }
    for (const pat of rule.patterns) {
      if (pat.test(combined)) matchCount += 3;
    }

    if (matchCount >= 4) {
      return {
        suggestedIntent: rule.intent,
        confidence: 'High',
        reasoning: rule.reason + ` (${matchCount} key signals matched)`,
      };
    } else if (matchCount >= 2) {
      return {
        suggestedIntent: rule.intent,
        confidence: 'Medium',
        reasoning: rule.reason + ` (moderate signal density)`,
      };
    }
  }

  // Fallback heuristic
  return {
    suggestedIntent: 'Policy Clarification',
    confidence: 'Low',
    reasoning: 'Standard operations review requested; no high-confidence trigger patterns matched',
  };
}
