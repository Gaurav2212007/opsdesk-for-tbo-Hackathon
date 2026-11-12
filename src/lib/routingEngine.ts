import { Agent, IntentType, Priority, Region, RoutingExplanation, RoutingRule, Team } from '../types';

export interface RouteTicketInput {
  region: Region;
  country: string;
  priority: Priority;
  agencyTier: 'Platinum VIP' | 'Gold' | 'Silver' | 'Standard';
  intent: IntentType;
  checkInDate?: string;
  simulatedTimeIST?: string; // e.g. "19:30"
}

export function getCurrentISTTime(): string {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5);
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function isTimeInWindow(timeIST: string, startIST: string, endIST: string): boolean {
  const [h, m] = timeIST.split(':').map(Number);
  const currentMins = h * 60 + m;

  const [sh, sm] = startIST.split(':').map(Number);
  const startMins = sh * 60 + sm;

  const [eh, em] = endIST.split(':').map(Number);
  const endMins = eh * 60 + em;

  if (startMins <= endMins) {
    return currentMins >= startMins && currentMins <= endMins;
  } else {
    // Overnight window (e.g. 18:00 to 02:00)
    return currentMins >= startMins || currentMins <= endMins;
  }
}

export function evaluateRouting(
  input: RouteTicketInput,
  rules: RoutingRule[],
  agents: Agent[],
  teams: Team[]
): RoutingExplanation & { targetTeamId: string; targetTeamName: string } {
  const reasons: string[] = [];
  const currentIST = input.simulatedTimeIST || getCurrentISTTime();

  // 1. Sort rules by priority order
  const sortedRules = [...rules].filter(r => r.active).sort((a, b) => a.priorityOrder - b.priorityOrder);

  let matchedRule: RoutingRule | undefined;
  for (const rule of sortedRules) {
    const crit = rule.criteria;
    let match = true;

    if (crit.priority && crit.priority !== input.priority) match = false;
    if (crit.region && crit.region !== input.region) match = false;
    if (crit.agencyTier && crit.agencyTier !== input.agencyTier) match = false;
    if (crit.intent && crit.intent !== input.intent) match = false;
    if (crit.country && crit.country.toLowerCase() !== input.country.toLowerCase()) match = false;

    if (match) {
      matchedRule = rule;
      break;
    }
  }

  // 2. Determine initial target team
  let targetTeamId = matchedRule ? matchedRule.targetTeamId : '';
  if (!targetTeamId) {
    const regionalTeam = teams.find(t => t.region === input.region) || teams[0];
    targetTeamId = regionalTeam?.id || 'team-triage';
  }

  let targetTeam = teams.find(t => t.id === targetTeamId) || teams[0];

  // 3. Evaluate Time Coverage Window (Part A Problem 2)
  let windowActive = true;
  let shiftName = targetTeam.coverageWindow?.shiftName || 'Standard Working Hours';

  if (targetTeam.coverageWindow) {
    windowActive = isTimeInWindow(
      currentIST,
      targetTeam.coverageWindow.startTimeIST,
      targetTeam.coverageWindow.endTimeIST
    );

    if (windowActive) {
      reasons.push(`Current time: ${currentIST} IST`);
      reasons.push(`${targetTeam.name} coverage window active (${targetTeam.coverageWindow.shiftName}: ${targetTeam.coverageWindow.startTimeIST}–${targetTeam.coverageWindow.endTimeIST} IST)`);
    } else {
      reasons.push(`Current time: ${currentIST} IST (Outside ${targetTeam.name} shift: ${targetTeam.coverageWindow.startTimeIST}–${targetTeam.coverageWindow.endTimeIST})`);

      // If urgent or critical and team is outside coverage, route to active Global 24/7 Desk
      const emergencyTeam = teams.find(t => t.id === 'team-escalation') || teams[0];
      if (input.priority === 'Critical' || input.intent === 'Emergency Travel Issue') {
        targetTeam = emergencyTeam;
        targetTeamId = emergencyTeam.id;
        reasons.push(`Critical after-hours override: Rerouted to 24/7 ${emergencyTeam.name}`);
        shiftName = '24/7 Global Critical Escalations';
        windowActive = true;
      } else {
        reasons.push(`Queued in ${targetTeam.name} dispatch queue for shift start`);
      }
    }
  } else {
    reasons.push(`Current time: ${currentIST} IST (24/7 Global Queue)`);
  }

  if (matchedRule) {
    reasons.push(`Matched Routing Rule #${matchedRule.priorityOrder}: "${matchedRule.name}"`);
  } else {
    reasons.push(`Standard regional fallback applied for ${input.region}`);
  }

  // Region and Tier reason checks
  reasons.push(`Region affinity: ${input.region}`);
  if (input.agencyTier === 'Platinum VIP') {
    reasons.push('High-touch tier: Platinum VIP agency priority handling');
  }
  reasons.push(`Intent alignment: Specialized in ${input.intent}`);

  // 4. Candidate agents in target team or eligible pool
  let eligibleAgents = agents.filter(a => a.teamId === targetTeamId);
  if (eligibleAgents.length === 0) {
    eligibleAgents = agents.filter(a => a.region === input.region);
  }

  // Filter for available status or busy with available capacity
  const availableAgents = eligibleAgents.filter(
    a => (a.status === 'Available' || a.status === 'Busy') && a.currentWorkload < a.maxWorkload
  );

  // Preference agents with matching intent skill
  const skillMatchedAgents = availableAgents.filter(a => a.skills.includes(input.intent));
  const candidatePool = skillMatchedAgents.length > 0 ? skillMatchedAgents : availableAgents;

  if (candidatePool.length === 0) {
    reasons.push('Notice: No eligible specialist currently active with spare capacity; routed to Team Dispatch Queue');
    return {
      assignedToAgentId: '',
      assignedToAgentName: 'Unassigned (In Team Queue)',
      matchedRuleId: matchedRule?.id,
      matchedRuleName: matchedRule?.name,
      reasons,
      evaluatedAt: new Date().toISOString(),
      targetTeamId: targetTeam.id,
      targetTeamName: targetTeam.name,
      timeEvaluation: {
        currentIST,
        windowActive,
        coverageTeam: targetTeam.name,
        shiftName,
      },
    };
  }

  // Pick candidate with lowest current workload (load-balancing)
  candidatePool.sort((a, b) => a.currentWorkload - b.currentWorkload);
  const bestAgent = candidatePool[0];

  reasons.push(`Selected Agent: ${bestAgent.name} (${bestAgent.role})`);
  reasons.push(`Agent availability status verified: ${bestAgent.status}`);
  reasons.push(`Skill match verified: ${bestAgent.skills.join(', ')}`);
  reasons.push(`Load balancing: Lowest workload in team (${bestAgent.currentWorkload}/${bestAgent.maxWorkload} active cases)`);

  return {
    assignedToAgentId: bestAgent.id,
    assignedToAgentName: bestAgent.name,
    matchedRuleId: matchedRule?.id,
    matchedRuleName: matchedRule?.name,
    reasons,
    evaluatedAt: new Date().toISOString(),
    targetTeamId: targetTeam.id,
    targetTeamName: targetTeam.name,
    timeEvaluation: {
      currentIST,
      windowActive,
      coverageTeam: targetTeam.name,
      shiftName,
    },
  };
}
