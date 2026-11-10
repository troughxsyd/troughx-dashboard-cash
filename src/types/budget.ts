export type OperatingModelType = 'promoter_hosted' | 'trough_owned';

export interface StaffRole {
  id: string;
  roleName: string;
  hourlyRate: number; // IFA rate ($55, $45, $35, $50)
  superEligible: boolean; // True = +11.5% super, False = contracted agency (super exempt)
  headcount: number;
  hours: number;
  autoScaleSecurity?: boolean; // If true, headcount = 2 for <250 pax, 3 for >=250 pax
  dutyScope: string;
}

export interface TicketTier {
  id: string;
  name: string;
  price: number; // Gross ticket price ($ AUD)
  allocation: number;
  soldCount: number;
  description?: string;
}

export interface DirectOverheadItem {
  id: string;
  category: 'talent' | 'av_sound' | 'marketing' | 'staging_ops' | 'waste_reinstatement';
  name: string;
  amount: number;
  appliesTo: 'both' | 'trough_owned' | 'promoter_hosted';
  paidBy: 'venue' | 'promoter';
  notes?: string;
}

export interface VenueConfig {
  eventName: string;
  edition: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  operatingModel: OperatingModelType;

  // Strict Venue Constraints (273 Crown St, Surry Hills)
  totalCapacityCap: number; // Strictly 300 pax max
  basementCapacityCap: number; // Strictly 60 pax max
  superGuaranteeRate: number; // 11.5%

  // Commercial Parameters
  promoterTicketClip: number; // $5.00 flat clip per ticket sold on Hosted nights
  collectPromoterDeposit: boolean; // Mandatory $550 booking deposit toggle
  promoterBookingDeposit: number; // $550.00
  wasteReinstatementCost: number; // Absorbed by venue on hosted/owned nights

  // Bar & Cloakroom Parameters
  avgGrossBarSpendPerHead: number; // e.g. $32.00 per attendee
  beverageCogsPercent: number; // Target <= 22.0% of bar gross turnover
  cloakPricePerItem: number; // $5.00 per item
  cloakUtilizationPercent: number; // % of attendees checking a bag/coat (e.g. 25%)

  // Merchant / Payment Processing Rates
  merchantFeeHostedPercent: number; // 1.5% on Promoter Hosted Night
  merchantFeeOwnedPercent: number; // 2.5% on Trough Owned Party
}

export interface BudgetPreset {
  id: string;
  name: string;
  description: string;
  venueConfig: VenueConfig;
  staffRoster: StaffRole[];
  ticketTiers: TicketTier[];
  overheads: DirectOverheadItem[];
}

export interface FinancialSummary {
  operatingModel: OperatingModelType;
  totalCapacity: number; // 300
  basementCapacity: number; // 60
  totalTicketsAllocated: number;
  projectedAttendance: number;
  attendancePercent: number;
  isCapacityExceeded: boolean;
  securityGuardsRequired: number; // 2 up to 249, 3 at 250+

  // Gross & Venue Retained Ticket Revenue
  grossTicketTurnover: number;
  venueRetainedTicketRevenue: number; // $5 * soldCount (Hosted) OR 100% grossTicketTurnover (Owned)
  promoterRetainedTicketRevenue: number; // Remaining ticket balance on Hosted night
  bookingDepositCollected: number; // $550 if Hosted & enabled, else $0

  // Bar & Cloakroom Revenue (100% Venue Retained in both models)
  grossBarRevenue: number;
  beverageCogsAmount: number;
  beverageCogsPercent: number;
  isCogsCompliant: boolean; // <= 22.0%
  netBarGrossProfit: number;

  cloakItemsCount: number;
  grossCloakRevenue: number;

  // Total Venue Revenue
  totalVenueGrossRevenue: number; // Ticket retention + Bar Gross + Cloak Gross (+ Deposit if applicable)

  // Variable & Processing Costs
  merchantFeeRatePercent: number; // 1.5% Hosted, 2.5% Owned
  merchantProcessingCost: number;
  totalVariableCosts: number; // Beverage COGS + Merchant Processing

  // Contribution Margin
  venueContributionMarginDollar: number; // Total Venue Revenue (excl deposit) - Variable Costs
  venueContributionMarginPercent: number; // CM$ / Total Venue Revenue
  contributionPerAttendee: number; // CM$ / projectedAttendance
  grossRevenuePerAttendee: number;

  // Staffing Roster & IFA Wages
  baseWagesTotal: number;
  superannuationTotal: number; // 11.5% on superEligible roles
  totalStaffingCost: number; // Base + Super
  wageRatioPercent: number; // totalStaffingCost / totalVenueGrossRevenue
  wageTargetThresholdPercent: number; // 30% for Owned, 50% for Hosted
  isWageRatioCompliant: boolean;

  // Direct Overheads (Venue Paid vs Promoter Paid)
  venueDirectOverheads: number; // Waste reinstatement + (DJs $900, AV $350, Marketing $400, Staging $250 on Owned)
  promoterDirectExpenses: number; // Promoter's own DJ/Sound/Marketing costs on Hosted nights

  // Total Venue Fixed & Operating Costs
  totalVenueFixedCosts: number; // totalStaffingCost + venueDirectOverheads
  totalVenueAllInCosts: number; // totalStaffingCost + venueDirectOverheads + totalVariableCosts

  // Net Operating Profit (Venue) & Promoter Net P&L
  venueNetProfit: number;
  venueNetMarginPercent: number;
  venueRoiPercent: number;
  promoterNetProfit: number;

  // Breakeven Math (Exact Attendees)
  baseBreakevenAttendees: number; // Without $550 deposit (144 pax baseline on Hosted)
  depositAdjustedBreakevenAttendees: number; // With $550 deposit (121 pax baseline on Hosted)
  activeBreakevenAttendees: number;
  activeBreakevenPercentOfCap: number;
}
