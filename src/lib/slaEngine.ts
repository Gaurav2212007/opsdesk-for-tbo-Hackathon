import { Priority, Region, SLAStatus } from '../types';

export interface SLACalculationResult {
  slaMinutesRemaining: number;
  slaStatus: SLAStatus;
  slaDeadline: string;
  travelUrgencyLevel: 'Immediate' | 'Elevated' | 'Standard';
  urgencyFactors: string[];
  checkInProximityText: string;
  lcdProximityText: string;
}

export function calculateTicketSLA(
  createdAt: string,
  priority: Priority,
  checkInDate: string,
  lcdDate: string,
  referenceNow: number = Date.now(),
  dependency?: 'Supplier response pending' | 'Finance approval pending' | 'GDS sync pending' | 'None',
  regionalCalendarNote?: string,
  region?: Region
): SLACalculationResult {
  const createdTime = new Date(createdAt).getTime();
  const checkInTime = new Date(checkInDate).getTime();
  const lcdTime = new Date(lcdDate).getTime();

  // Base SLA minutes by priority
  let baseSlaMinutes = 480; // default 8 hours
  switch (priority) {
    case 'Critical':
      baseSlaMinutes = 60; // 1 hour
      break;
    case 'High':
      baseSlaMinutes = 180; // 3 hours
      break;
    case 'Medium':
      baseSlaMinutes = 480; // 8 hours
      break;
    case 'Low':
      baseSlaMinutes = 1440; // 24 hours
      break;
  }

  const urgencyFactors: string[] = [];
  let urgencyLevel: 'Immediate' | 'Elevated' | 'Standard' = 'Standard';

  // Check-in proximity
  const msUntilCheckIn = checkInTime - referenceNow;
  const hoursUntilCheckIn = msUntilCheckIn / (1000 * 60 * 60);

  // LCD proximity
  const msUntilLcd = lcdTime - referenceNow;
  const hoursUntilLcd = msUntilLcd / (1000 * 60 * 60);

  let checkInProximityText = '';
  if (hoursUntilCheckIn < 0) {
    checkInProximityText = `Checked in ${Math.abs(Math.round(hoursUntilCheckIn / 24))}d ago`;
  } else if (hoursUntilCheckIn < 24) {
    checkInProximityText = `Check-in in ${Math.max(1, Math.round(hoursUntilCheckIn))}h`;
    urgencyFactors.push(`Check-in is within 24h (${Math.round(hoursUntilCheckIn)} hours away)`);
    urgencyLevel = 'Immediate';
    baseSlaMinutes = Math.min(baseSlaMinutes, 30); // 30 min maximum for imminent check-in!
  } else if (hoursUntilCheckIn < 72) {
    checkInProximityText = `Check-in in ${Math.round(hoursUntilCheckIn / 24)}d`;
    urgencyFactors.push(`Check-in within 3 days (${Math.round(hoursUntilCheckIn / 24)} days)`);
    urgencyLevel = 'Elevated';
    baseSlaMinutes = Math.round(baseSlaMinutes * 0.5);
  } else {
    checkInProximityText = `Check-in ${new Date(checkInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  let lcdProximityText = '';
  if (hoursUntilLcd < 0) {
    lcdProximityText = 'LCD Passed (Strict supplier penalty)';
    urgencyFactors.push('Last Cancellation Date (LCD) has already passed');
  } else if (hoursUntilLcd < 24) {
    lcdProximityText = `LCD in ${Math.max(1, Math.round(hoursUntilLcd))}h`;
    urgencyFactors.push('Last Cancellation Date (LCD) expires today');
    urgencyLevel = 'Immediate';
    baseSlaMinutes = Math.min(baseSlaMinutes, 45);
  } else if (hoursUntilLcd < 72) {
    lcdProximityText = `LCD in ${Math.round(hoursUntilLcd / 24)}d`;
    urgencyFactors.push('LCD approaching in <72 hours');
    if (urgencyLevel !== 'Immediate') urgencyLevel = 'Elevated';
  } else {
    lcdProximityText = `LCD ${new Date(lcdDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  // Regional Calendar Evaluation (Problem 4 / Item #13)
  if (regionalCalendarNote) {
    urgencyFactors.push(`Regional Calendar: ${regionalCalendarNote}`);
  } else if (region === 'APAC') {
    urgencyFactors.push('Regional Calendar: Standard APAC Business Calendar (No bank holidays)');
  }

  // Team Dependency Evaluation (Problem 4 / Item #13)
  if (dependency && dependency !== 'None') {
    urgencyFactors.push(`External Dependency: ${dependency}`);
    // If waiting for external supplier or finance, adjust clock buffer slightly
    if (dependency === 'Supplier response pending') {
      baseSlaMinutes = Math.round(baseSlaMinutes * 1.25);
    }
  }

  const deadlineTime = createdTime + baseSlaMinutes * 60 * 1000;
  const deadlineIso = new Date(deadlineTime).toISOString();
  const minutesRemaining = Math.round((deadlineTime - referenceNow) / (1000 * 60));

  let slaStatus: SLAStatus = 'Healthy';
  if (minutesRemaining <= 0) {
    slaStatus = 'Breached';
  } else if (minutesRemaining <= 60 || (priority === 'Critical' && minutesRemaining <= 30)) {
    slaStatus = 'At Risk';
  }

  return {
    slaMinutesRemaining: minutesRemaining,
    slaStatus,
    slaDeadline: deadlineIso,
    travelUrgencyLevel: urgencyLevel,
    urgencyFactors,
    checkInProximityText,
    lcdProximityText,
  };
}
