import {
  DirectOverheadItem,
  FinancialSummary,
  StaffRole,
  TicketTier,
  VenueConfig,
} from '../types/budget';

export function calculateFinancialSummary(
  venueConfig: VenueConfig,
  staffRoster: StaffRole[],
  ticketTiers: TicketTier[],
  overheads: DirectOverheadItem[]
): FinancialSummary {
  const isHosted = venueConfig.operatingModel === 'promoter_hosted';
  const totalCapacity = 300; // Strictly capped at 300 pax max
  const basementCapacity = 60; // Strictly capped at 60 pax max

  const totalTicketsAllocated = ticketTiers.reduce((acc, t) => acc + (t.allocation || 0), 0);
  const rawAttendance = ticketTiers.reduce((acc, t) => acc + (t.soldCount || 0), 0);
  const projectedAttendance = Math.max(0, rawAttendance);
  const attendancePercent = Math.round((projectedAttendance / totalCapacity) * 100);
  const isCapacityExceeded = projectedAttendance > totalCapacity || totalTicketsAllocated > totalCapacity;

  // 1:100 Security Guard Ratio (2 guards up to 249 pax, 3 guards at 250+ pax)
  const securityGuardsRequired = projectedAttendance >= 250 ? 3 : 2;

  // 1. Ticket Revenue Split (Hosted vs Owned)
  let grossTicketTurnover = 0;
  ticketTiers.forEach((tier) => {
    grossTicketTurnover += (tier.soldCount || 0) * (tier.price || 0);
  });

  const clipPerTicket = venueConfig.promoterTicketClip || 5.0;
  const venueRetainedTicketRevenue = isHosted
    ? projectedAttendance * clipPerTicket
    : grossTicketTurnover;

  const promoterRetainedTicketRevenue = isHosted
    ? Math.max(0, grossTicketTurnover - venueRetainedTicketRevenue)
    : 0;

  const bookingDepositCollected =
    isHosted && venueConfig.collectPromoterDeposit
      ? venueConfig.promoterBookingDeposit || 550
      : 0;

  // 2. Beverage Bar & Cloakroom Revenue (100% Retained by Venue in both models)
  const grossBarRevenue = projectedAttendance * (venueConfig.avgGrossBarSpendPerHead || 0);
  const beverageCogsPercent = venueConfig.beverageCogsPercent || 22.0;
  const isCogsCompliant = beverageCogsPercent <= 22.0;
  const beverageCogsAmount = grossBarRevenue * (beverageCogsPercent / 100);
  const netBarGrossProfit = grossBarRevenue - beverageCogsAmount;

  const cloakUtilization = (venueConfig.cloakUtilizationPercent || 0) / 100;
  const cloakItemsCount = Math.round(projectedAttendance * cloakUtilization);
  const grossCloakRevenue = cloakItemsCount * (venueConfig.cloakPricePerItem || 5.0);

  // Total Venue Gross Revenue
  const totalVenueOperatingRevenue =
    venueRetainedTicketRevenue + grossBarRevenue + grossCloakRevenue;
  const totalVenueGrossRevenue = totalVenueOperatingRevenue + bookingDepositCollected;

  // 3. Variable Costs (Beverage COGS + Merchant Processing)
  const merchantFeeRatePercent = isHosted
    ? venueConfig.merchantFeeHostedPercent || 1.5
    : venueConfig.merchantFeeOwnedPercent || 2.5;

  const merchantProcessingCost =
    totalVenueOperatingRevenue * (merchantFeeRatePercent / 100);

  const totalVariableCosts = beverageCogsAmount + merchantProcessingCost;

  // 4. Contribution Margin
  const venueContributionMarginDollar =
    totalVenueOperatingRevenue - totalVariableCosts;
  const venueContributionMarginPercent =
    totalVenueOperatingRevenue > 0
      ? (venueContributionMarginDollar / totalVenueOperatingRevenue) * 100
      : 0;

  // Theoretical per-attendee contribution margin (for strict mathematical breakeven)
  const avgTicketRetentionPerHead =
    projectedAttendance > 0
      ? venueRetainedTicketRevenue / projectedAttendance
      : isHosted
      ? clipPerTicket
      : 50;

  const grossRevPerHead =
    avgTicketRetentionPerHead +
    (venueConfig.avgGrossBarSpendPerHead || 0) +
    ((venueConfig.cloakUtilizationPercent || 0) / 100) *
      (venueConfig.cloakPricePerItem || 5.0);

  const varCostPerHead =
    (venueConfig.avgGrossBarSpendPerHead || 0) * (beverageCogsPercent / 100) +
    grossRevPerHead * (merchantFeeRatePercent / 100);

  const contributionPerAttendee = Math.max(0.01, grossRevPerHead - varCostPerHead);

  // 5. Staffing Roster & IFA Wages (with 11.5% Super Guarantee on eligible employees)
  let baseWagesTotal = 0;
  let superannuationTotal = 0;
  const superRate = (venueConfig.superGuaranteeRate || 11.5) / 100;

  staffRoster.forEach((role) => {
    const effectiveHeadcount = role.autoScaleSecurity
      ? securityGuardsRequired
      : role.headcount;
    const baseRoleCost = effectiveHeadcount * (role.hours || 0) * (role.hourlyRate || 0);
    const superRoleCost = role.superEligible ? baseRoleCost * superRate : 0;

    baseWagesTotal += baseRoleCost;
    superannuationTotal += superRoleCost;
  });

  const totalStaffingCost = baseWagesTotal + superannuationTotal;

  // Wage Ratio Compliance (<30% for Owned, <50% for Hosted)
  const wageTargetThresholdPercent = isHosted ? 50.0 : 30.0;
  const wageRatioPercent =
    totalVenueGrossRevenue > 0
      ? (totalStaffingCost / totalVenueGrossRevenue) * 100
      : 0;
  const isWageRatioCompliant =
    totalVenueGrossRevenue > 0 && wageRatioPercent <= wageTargetThresholdPercent;

  // 6. Direct Overheads (Venue vs External Promoter)
  let venueDirectOverheads = 0;
  let promoterDirectExpenses = 0;

  overheads.forEach((item) => {
    const matchesModel =
      item.appliesTo === 'both' || item.appliesTo === venueConfig.operatingModel;
    if (!matchesModel) return;

    if (item.paidBy === 'venue') {
      venueDirectOverheads += item.amount || 0;
    } else {
      promoterDirectExpenses += item.amount || 0;
    }
  });

  const totalVenueFixedCosts = totalStaffingCost + venueDirectOverheads;
  const totalVenueAllInCosts = totalVenueFixedCosts + totalVariableCosts;

  // 7. Net Operating Profit (Venue & Promoter)
  const venueNetProfit = totalVenueGrossRevenue - totalVenueAllInCosts;
  const venueNetMarginPercent =
    totalVenueGrossRevenue > 0
      ? (venueNetProfit / totalVenueGrossRevenue) * 100
      : 0;
  const venueRoiPercent =
    totalVenueAllInCosts > 0 ? (venueNetProfit / totalVenueAllInCosts) * 100 : 0;

  const promoterNetProfit = isHosted
    ? promoterRetainedTicketRevenue -
      promoterDirectExpenses -
      bookingDepositCollected
    : 0;

  // 8. Breakeven Thresholds (Base vs Deposit-Adjusted)
  // Note: For <250 pax breakeven, compute fixed staffing using 2 security guards
  let baseStaffingUnder250 = 0;
  staffRoster.forEach((role) => {
    const hc = role.autoScaleSecurity ? 2 : role.headcount;
    const base = hc * (role.hours || 0) * (role.hourlyRate || 0);
    const sup = role.superEligible ? base * superRate : 0;
    baseStaffingUnder250 += base + sup;
  });

  const baseFixedUnder250 = baseStaffingUnder250 + venueDirectOverheads;
  const baseBreakevenAttendees = Math.round(
    baseFixedUnder250 / contributionPerAttendee
  );
  const depositAdjustedBreakevenAttendees = Math.round(
    Math.max(0, baseFixedUnder250 - (venueConfig.promoterBookingDeposit || 550)) /
      contributionPerAttendee
  );

  const activeBreakevenAttendees =
    isHosted && venueConfig.collectPromoterDeposit
      ? depositAdjustedBreakevenAttendees
      : baseBreakevenAttendees;

  const activeBreakevenPercentOfCap = Math.min(
    100,
    Math.round((activeBreakevenAttendees / totalCapacity) * 100)
  );

  return {
    operatingModel: venueConfig.operatingModel,
    totalCapacity,
    basementCapacity,
    totalTicketsAllocated,
    projectedAttendance,
    attendancePercent,
    isCapacityExceeded,
    securityGuardsRequired,

    grossTicketTurnover,
    venueRetainedTicketRevenue,
    promoterRetainedTicketRevenue,
    bookingDepositCollected,

    grossBarRevenue,
    beverageCogsAmount,
    beverageCogsPercent,
    isCogsCompliant,
    netBarGrossProfit,

    cloakItemsCount,
    grossCloakRevenue,

    totalVenueGrossRevenue,

    merchantFeeRatePercent,
    merchantProcessingCost,
    totalVariableCosts,

    venueContributionMarginDollar,
    venueContributionMarginPercent,
    contributionPerAttendee,
    grossRevenuePerAttendee: grossRevPerHead,

    baseWagesTotal,
    superannuationTotal,
    totalStaffingCost,
    wageRatioPercent,
    wageTargetThresholdPercent,
    isWageRatioCompliant,

    venueDirectOverheads,
    promoterDirectExpenses,

    totalVenueFixedCosts,
    totalVenueAllInCosts,

    venueNetProfit,
    venueNetMarginPercent,
    venueRoiPercent,
    promoterNetProfit,

    baseBreakevenAttendees,
    depositAdjustedBreakevenAttendees,
    activeBreakevenAttendees,
    activeBreakevenPercentOfCap,
  };
}

export function calculateScenarioAtAttendance(
  targetPax: number,
  venueConfig: VenueConfig,
  staffRoster: StaffRole[],
  ticketTiers: TicketTier[],
  overheads: DirectOverheadItem[]
) {
  const totalAlloc = Math.max(
    1,
    ticketTiers.reduce((acc, t) => acc + (t.allocation || 0), 0)
  );

  // Distribute targetPax across tiers proportionally
  let remaining = targetPax;
  const scaledTiers = ticketTiers.map((tier, idx) => {
    if (idx === ticketTiers.length - 1) {
      return { ...tier, soldCount: Math.max(0, remaining) };
    }
    const share = Math.round((tier.allocation / totalAlloc) * targetPax);
    const allocated = Math.min(remaining, share);
    remaining -= allocated;
    return { ...tier, soldCount: allocated };
  });

  const summary = calculateFinancialSummary(
    venueConfig,
    staffRoster,
    scaledTiers,
    overheads
  );

  return {
    targetPax,
    capacityPercent: Math.round((targetPax / 300) * 100),
    securityGuards: summary.securityGuardsRequired,
    venueGrossRevenue: summary.totalVenueGrossRevenue,
    totalStaffingCost: summary.totalStaffingCost,
    wageRatioPercent: summary.wageRatioPercent,
    isWageCompliant: summary.isWageRatioCompliant,
    contributionMarginPercent: summary.venueContributionMarginPercent,
    venueNetProfit: summary.venueNetProfit,
    promoterNetProfit: summary.promoterNetProfit,
  };
}

export function formatAUD(val: number, showCents = false): string {
  const isNeg = val < -0.005;
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString('en-AU', {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  return isNeg ? `-$${formatted}` : `$${formatted}`;
}

export function formatPercent(val: number): string {
  return `${val.toFixed(1)}%`;
}
