import React from 'react';
import {
  VenueConfig,
  StaffRole,
  TicketTier,
  DirectOverheadItem,
  FinancialSummary,
} from '../types/budget';
import {
  calculateFinancialSummary,
  formatAUD,
  formatPercent,
} from '../utils/calculations';
import { AIBudgetAdvisor } from './AIBudgetAdvisor';
import { Scale, BarChart2 } from 'lucide-react';

interface Props {
  venueConfig: VenueConfig;
  staffRoster: StaffRole[];
  ticketTiers: TicketTier[];
  overheads: DirectOverheadItem[];
  summary: FinancialSummary;
  onChangeConfig: (config: VenueConfig) => void;
  onChangeOverheads: (overheads: DirectOverheadItem[]) => void;
  onAttendanceChange?: (targetPax: number) => void;
}

export const PromoterDealAnalyzer: React.FC<Props> = ({
  venueConfig,
  staffRoster,
  ticketTiers,
  overheads,
  summary,
  onChangeConfig,
  onChangeOverheads,
  onAttendanceChange,
}) => {
  const hostedConfig: VenueConfig = {
    ...venueConfig,
    operatingModel: 'promoter_hosted',
  };
  const ownedConfig: VenueConfig = {
    ...venueConfig,
    operatingModel: 'trough_owned',
  };

  const hasOwnedOverheads = overheads.some((o) => o.appliesTo === 'trough_owned');
  const comparisonOverheads: DirectOverheadItem[] = hasOwnedOverheads
    ? overheads
    : [
        ...overheads,
        {
          id: 'cmp-dj',
          category: 'talent',
          name: 'In-House DJs',
          amount: 900,
          appliesTo: 'trough_owned',
          paidBy: 'venue',
        },
        {
          id: 'cmp-av',
          category: 'av_sound',
          name: 'AV Engineer',
          amount: 350,
          appliesTo: 'trough_owned',
          paidBy: 'venue',
        },
        {
          id: 'cmp-mkt',
          category: 'marketing',
          name: 'Marketing',
          amount: 400,
          appliesTo: 'trough_owned',
          paidBy: 'venue',
        },
        {
          id: 'cmp-stg',
          category: 'staging_ops',
          name: 'Staging',
          amount: 250,
          appliesTo: 'trough_owned',
          paidBy: 'venue',
        },
      ];

  const hostedMetrics = calculateFinancialSummary(
    hostedConfig,
    staffRoster,
    ticketTiers,
    comparisonOverheads
  );

  const ownedMetrics = calculateFinancialSummary(
    ownedConfig,
    staffRoster,
    ticketTiers,
    comparisonOverheads
  );

  const avgTicketPrice =
    summary.projectedAttendance > 0
      ? summary.grossTicketTurnover / summary.projectedAttendance
      : 45;

  const promoterClipPerTicket = venueConfig.promoterTicketClip || 5.0;
  const netTicketToPromoter = Math.max(0, avgTicketPrice - promoterClipPerTicket);
  const promoterFixedExpenses =
    hostedMetrics.promoterDirectExpenses +
    (venueConfig.collectPromoterDeposit ? venueConfig.promoterBookingDeposit : 0);
  const promoterBreakevenPax =
    netTicketToPromoter > 0
      ? Math.ceil(promoterFixedExpenses / netTicketToPromoter)
      : 0;

  const maxNetComparison = Math.max(
    Math.abs(hostedMetrics.venueNetProfit),
    Math.abs(ownedMetrics.venueNetProfit),
    Math.abs(hostedMetrics.promoterNetProfit),
    1000
  );

  return (
    <div className="space-y-6">
      {/* Top Deal Structuring Sliders */}
      <div className="bg-neutral-900/80 border border-neutral-700/80 rounded-lg p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#FFCC00]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Promoter Deal Structuring Sliders & Model Comparison
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Slide attendance, venue ticket clip ($), and booking deposit ($) to compare Promoter Hosted vs. Trough Owned returns.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-neutral-200">
            <span>Base Breakeven: {hostedMetrics.baseBreakevenAttendees} Pax</span>
            <span>·</span>
            <span className="text-[#FFCC00] font-bold">
              With Deposit: {hostedMetrics.depositAdjustedBreakevenAttendees} Pax
            </span>
          </div>
        </div>

        {/* Interactive Deal Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Slider 1: Attendance Volume */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-2.5">
            <div className="flex justify-between text-xs">
              <label className="font-semibold text-white">Simulated Attendance</label>
              <span className="font-mono tabular-nums text-[#FFCC00] font-bold">
                {summary.projectedAttendance} / 300 Pax
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="300"
              step="1"
              value={Math.min(300, summary.projectedAttendance)}
              onChange={(e) =>
                onAttendanceChange && onAttendanceChange(parseInt(e.target.value, 10))
              }
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#FFCC00]"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
              <span>60 Pax</span>
              <span>144 Base B/E</span>
              <span>300 Cap</span>
            </div>
          </div>

          {/* Slider 2: Venue Ticket Clip ($/ticket) */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-2.5">
            <div className="flex justify-between text-xs">
              <label className="font-semibold text-white">Venue Ticket Clip ($/tix)</label>
              <span className="font-mono tabular-nums text-[#FFCC00] font-bold">
                {formatAUD(venueConfig.promoterTicketClip, true)} / tix
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={venueConfig.promoterTicketClip}
              onChange={(e) =>
                onChangeConfig({
                  ...venueConfig,
                  promoterTicketClip: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#FFCC00]"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
              <span>$0</span>
              <span className="text-white">Standard: $5.00/tix</span>
              <span>$20</span>
            </div>
          </div>

          {/* Slider 3: Mandatory Booking Deposit ($550) */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-white">Booking Deposit ($)</label>
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums text-white font-bold">
                  {venueConfig.collectPromoterDeposit
                    ? formatAUD(venueConfig.promoterBookingDeposit)
                    : '$0 (Waived)'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChangeConfig({
                      ...venueConfig,
                      collectPromoterDeposit: !venueConfig.collectPromoterDeposit,
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                    venueConfig.collectPromoterDeposit
                      ? 'bg-[#FFCC00] text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {venueConfig.collectPromoterDeposit ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1500"
              step="50"
              value={venueConfig.promoterBookingDeposit}
              onChange={(e) =>
                onChangeConfig({
                  ...venueConfig,
                  promoterBookingDeposit: parseFloat(e.target.value),
                  collectPromoterDeposit: true,
                })
              }
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
              <span>$0</span>
              <span className="text-[#FFCC00]">Standard: $550 (121 Pax B/E)</span>
              <span>$1,500</span>
            </div>
          </div>
        </div>

        {/* Visual Comparison Bar Graph: Hosted Venue vs Owned Venue vs Promoter */}
        <div className="bg-neutral-950/90 border border-neutral-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-[#FFCC00]" />
              Net Operating Profit Comparison at {summary.projectedAttendance} Pax
            </span>
            <span className="font-mono text-[11px] text-[#FFCC00]">
              Owned vs Hosted Venue Delta:{' '}
              {ownedMetrics.venueNetProfit - hostedMetrics.venueNetProfit >= 0 ? '+' : ''}
              {formatAUD(ownedMetrics.venueNetProfit - hostedMetrics.venueNetProfit)}
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {/* Bar 1: Model 1 Hosted Venue Net */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono tabular-nums">
                <span className="text-neutral-300">
                  1. Venue Net Profit — Promoter Hosted (${venueConfig.promoterTicketClip.toFixed(2)} Clip)
                </span>
                <span className="text-white font-bold">
                  {formatAUD(hostedMetrics.venueNetProfit, true)} (Wage Ratio:{' '}
                  {formatPercent(hostedMetrics.wageRatioPercent)})
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(4, (Math.abs(hostedMetrics.venueNetProfit) / maxNetComparison) * 100)
                    )}%`,
                  }}
                  className={`h-full transition-all ${
                    hostedMetrics.venueNetProfit >= 0 ? 'bg-white' : 'bg-red-500'
                  }`}
                />
              </div>
            </div>

            {/* Bar 2: Model 2 Trough Owned Venue Net */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono tabular-nums">
                <span className="text-neutral-300">
                  2. Venue Net Profit — Trough Owned Party (100% Retention)
                </span>
                <span className="text-[#FFCC00] font-bold">
                  {formatAUD(ownedMetrics.venueNetProfit, true)} (Wage Ratio:{' '}
                  {formatPercent(ownedMetrics.wageRatioPercent)})
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(4, (Math.abs(ownedMetrics.venueNetProfit) / maxNetComparison) * 100)
                    )}%`,
                  }}
                  className={`h-full transition-all ${
                    ownedMetrics.venueNetProfit >= 0 ? 'bg-[#FFCC00]' : 'bg-red-500'
                  }`}
                />
              </div>
            </div>

            {/* Bar 3: External Promoter Counterparty Net */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono tabular-nums">
                <span className="text-neutral-300">
                  3. External Promoter Net Profit (Counterparty P&L)
                </span>
                <span className="text-neutral-200 font-bold">
                  {formatAUD(hostedMetrics.promoterNetProfit, true)} (Promoter B/E:{' '}
                  {promoterBreakevenPax} Pax)
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        4,
                        (Math.abs(hostedMetrics.promoterNetProfit) / maxNetComparison) * 100
                      )
                    )}%`,
                  }}
                  className={`h-full transition-all ${
                    hostedMetrics.promoterNetProfit >= 0 ? 'bg-neutral-400' : 'bg-red-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Commercial Model Matrix: Hosted vs Owned vs External Promoter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Venue Under Model 1 (Promoter Hosted) */}
        <div className="bg-neutral-900/80 border border-neutral-700/80 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-white font-semibold">
                  Model 1 · Venue Perspective
                </span>
                <h3 className="text-sm font-bold text-white">
                  Promoter Hosted Night (${venueConfig.promoterTicketClip.toFixed(2)} Clip)
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-300">
                {summary.projectedAttendance} Pax
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-neutral-300">
                <span>Ticket Clip (${venueConfig.promoterTicketClip.toFixed(2)}/pax):</span>
                <span>{formatAUD(hostedMetrics.venueRetainedTicketRevenue, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>100% Bar Turnover:</span>
                <span>{formatAUD(hostedMetrics.grossBarRevenue, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>100% Cloakroom ($5/item):</span>
                <span>{formatAUD(hostedMetrics.grossCloakRevenue, true)}</span>
              </div>
              <div className="flex justify-between text-[#FFCC00]">
                <span>Mandatory Booking Deposit:</span>
                <span>+{formatAUD(hostedMetrics.bookingDepositCollected, true)}</span>
              </div>
              <div className="flex justify-between font-bold text-white border-t border-neutral-800 pt-1.5">
                <span>Total Venue Gross Revenue:</span>
                <span>{formatAUD(hostedMetrics.totalVenueGrossRevenue, true)}</span>
              </div>

              <div className="flex justify-between text-neutral-400 pt-1">
                <span>Beverage COGS ({formatPercent(hostedMetrics.beverageCogsPercent)}):</span>
                <span>-{formatAUD(hostedMetrics.beverageCogsAmount, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Merchant Processing (1.5%):</span>
                <span>-{formatAUD(hostedMetrics.merchantProcessingCost, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Full IFA Roster (+11.5% Super):</span>
                <span>-{formatAUD(hostedMetrics.totalStaffingCost, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Waste Reinstatement:</span>
                <span>-{formatAUD(hostedMetrics.venueDirectOverheads, true)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-neutral-200">
                Venue Net Profit
              </span>
              <span
                className={`text-lg font-bold font-mono tabular-nums ${
                  hostedMetrics.venueNetProfit >= 0 ? 'text-white' : 'text-red-400'
                }`}
              >
                {formatAUD(hostedMetrics.venueNetProfit, true)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-neutral-400">Wage Ratio Target (&lt;50%):</span>
              <span
                className={
                  hostedMetrics.isWageRatioCompliant
                    ? 'text-[#FFCC00] font-bold'
                    : 'text-red-400 font-bold'
                }
              >
                {formatPercent(hostedMetrics.wageRatioPercent)} (
                {hostedMetrics.isWageRatioCompliant ? 'PASS' : 'OVER'})
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Venue Under Model 2 (Trough Owned Party) */}
        <div className="bg-neutral-900/80 border border-[#FFCC00]/50 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#FFCC00] font-bold">
                  Model 2 · Venue Perspective
                </span>
                <h3 className="text-sm font-bold text-white">
                  Trough Owned Party (100% Retention)
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-300">
                {summary.projectedAttendance} Pax
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-neutral-300">
                <span>100% Ticket Box Office:</span>
                <span>{formatAUD(ownedMetrics.venueRetainedTicketRevenue, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>100% Bar Turnover:</span>
                <span>{formatAUD(ownedMetrics.grossBarRevenue, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>100% Cloakroom ($5/item):</span>
                <span>{formatAUD(ownedMetrics.grossCloakRevenue, true)}</span>
              </div>
              <div className="flex justify-between font-bold text-white border-t border-neutral-800 pt-1.5">
                <span>Total Venue Gross Revenue:</span>
                <span>{formatAUD(ownedMetrics.totalVenueGrossRevenue, true)}</span>
              </div>

              <div className="flex justify-between text-neutral-400 pt-1">
                <span>Beverage COGS ({formatPercent(ownedMetrics.beverageCogsPercent)}):</span>
                <span>-{formatAUD(ownedMetrics.beverageCogsAmount, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Payment Processing (2.5%):</span>
                <span>-{formatAUD(ownedMetrics.merchantProcessingCost, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Full IFA Roster (+11.5% Super):</span>
                <span>-{formatAUD(ownedMetrics.totalStaffingCost, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Direct Overheads (DJs/AV/Mktg/Waste):</span>
                <span>-{formatAUD(ownedMetrics.venueDirectOverheads, true)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-neutral-200">
                Venue Net Profit
              </span>
              <span
                className={`text-lg font-bold font-mono tabular-nums ${
                  ownedMetrics.venueNetProfit >= 0 ? 'text-[#FFCC00]' : 'text-red-400'
                }`}
              >
                {formatAUD(ownedMetrics.venueNetProfit, true)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-neutral-400">Wage Ratio Target (&lt;30%):</span>
              <span
                className={
                  ownedMetrics.isWageRatioCompliant
                    ? 'text-[#FFCC00] font-bold'
                    : 'text-red-400 font-bold'
                }
              >
                {formatPercent(ownedMetrics.wageRatioPercent)} (
                {ownedMetrics.isWageRatioCompliant ? 'PASS' : 'OVER'})
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: External Promoter P&L (Hosted Deal Counterparty) */}
        <div className="bg-neutral-900/80 border border-neutral-700/80 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  External Promoter P&L
                </span>
                <h3 className="text-sm font-bold text-white">
                  Promoter Counterparty Economics
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-300">
                B/E: {promoterBreakevenPax} Pax
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-neutral-300">
                <span>Gross Ticket Box Office:</span>
                <span>{formatAUD(hostedMetrics.grossTicketTurnover, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Less: Trough Venue Clip ($5/tix):</span>
                <span>-{formatAUD(hostedMetrics.venueRetainedTicketRevenue, true)}</span>
              </div>
              <div className="flex justify-between font-bold text-white border-t border-neutral-800 pt-1.5">
                <span>Net Ticket Balance Retained:</span>
                <span>{formatAUD(hostedMetrics.promoterRetainedTicketRevenue, true)}</span>
              </div>

              <div className="flex justify-between text-neutral-500 pt-1">
                <span>Bar & Cloakroom Share:</span>
                <span>$0.00 (100% Venue)</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Promoter DJs, Sound & Marketing:</span>
                <span>-{formatAUD(hostedMetrics.promoterDirectExpenses, true)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Mandatory Booking Deposit:</span>
                <span>-{formatAUD(hostedMetrics.bookingDepositCollected, true)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-neutral-200">
                Promoter Net Profit
              </span>
              <span
                className={`text-lg font-bold font-mono tabular-nums ${
                  hostedMetrics.promoterNetProfit >= 0
                    ? 'text-white'
                    : 'text-red-400'
                }`}
              >
                {formatAUD(hostedMetrics.promoterNetProfit, true)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-neutral-400">Owned vs Hosted Venue Upside:</span>
              <span className="text-[#FFCC00] font-bold">
                +{formatAUD(ownedMetrics.venueNetProfit - hostedMetrics.venueNetProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded AI Deal & Cashflow Intelligence Engine */}
      <AIBudgetAdvisor
        venueConfig={venueConfig}
        staffRoster={staffRoster}
        ticketTiers={ticketTiers}
        overheads={overheads}
        summary={summary}
      />
    </div>
  );
};
