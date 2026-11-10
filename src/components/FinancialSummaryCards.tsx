import React from 'react';
import { FinancialSummary, VenueConfig, OperatingModelType } from '../types/budget';
import { formatAUD, formatPercent } from '../utils/calculations';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Target,
  Percent,
} from 'lucide-react';

interface Props {
  summary: FinancialSummary;
  venueConfig: VenueConfig;
  onChangeModel: (model: OperatingModelType) => void;
  onToggleDeposit: (collect: boolean) => void;
  onAttendanceChange: (targetPax: number) => void;
}

export const FinancialSummaryCards: React.FC<Props> = ({
  summary,
  venueConfig,
  onChangeModel,
  onToggleDeposit,
  onAttendanceChange,
}) => {
  const isHosted = venueConfig.operatingModel === 'promoter_hosted';
  const isProfitable = summary.venueNetProfit >= 0;
  const breakEvenMet = summary.projectedAttendance >= summary.activeBreakevenAttendees;

  return (
    <div className="space-y-4">
      {/* Operating Mode Switcher & Live 300-Pax Attendance Simulator */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3.5">
          {/* Commercial Model Segmented Control */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Operating Model:
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-700/80 rounded-lg">
              <button
                onClick={() => onChangeModel('promoter_hosted')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  isHosted
                    ? 'bg-[#FFCC00] text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                1. Promoter Hosted ($5.00 Ticket Clip)
              </button>
              <button
                onClick={() => onChangeModel('trough_owned')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  !isHosted
                    ? 'bg-[#FFCC00] text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                2. Trough Owned Party (100% Retention)
              </button>
            </div>

            {isHosted && (
              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer select-none ml-1">
                <input
                  type="checkbox"
                  checked={venueConfig.collectPromoterDeposit}
                  onChange={(e) => onToggleDeposit(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-950 text-[#FFCC00] focus:ring-[#FFCC00]"
                />
                <span className="font-mono">
                  Collect $550 Mandatory Deposit (Lowers Breakeven 144 → 121 Pax)
                </span>
              </label>
            )}
          </div>

          {/* Operational Constraints Readout */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono tabular-nums">
            <span>273 Crown St</span>
            <span>·</span>
            <span className="text-white font-semibold">Max Cap: 300 Pax</span>
            <span>·</span>
            <span className="text-[#FFCC00]">Basement Limit: 60 Pax</span>
            <span>·</span>
            <span>
              Security: {summary.securityGuardsRequired} Guards (
              {summary.projectedAttendance >= 250 ? '250+ Pax 3-Guard Trigger' : 'Base 2 Guards'})
            </span>
          </div>
        </div>

        {/* Attendance Slider (0 to 300 Pax Licensed Limit) */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-slate-200">
                Interactive Attendance Slider:
              </span>
              <span className="font-mono tabular-nums text-[#FFCC00] font-bold text-sm">
                {summary.projectedAttendance} / 300 Pax ({summary.attendancePercent}%)
              </span>
              {summary.projectedAttendance >= 300 && (
                <span className="text-[#FFCC00] font-mono text-[11px]">
                  · One-In, One-Out Door Control Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
              <span className="text-slate-300">
                Base Breakeven: <strong className="text-white">{summary.baseBreakevenAttendees} pax</strong>
              </span>
              {isHosted && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-300">
                    With $550 Deposit:{' '}
                    <strong className="text-[#FFCC00]">
                      {summary.depositAdjustedBreakevenAttendees} pax
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>

          <input
            type="range"
            min="60"
            max="300"
            step="1"
            value={Math.min(300, summary.projectedAttendance)}
            onChange={(e) => onAttendanceChange(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFCC00] focus:outline-none"
            aria-label="Simulate event attendance up to 300 licensed capacity"
          />

          <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
            <button
              type="button"
              onClick={() => onAttendanceChange(121)}
              className="hover:text-[#FFCC00] cursor-pointer transition-colors"
            >
              121 Pax (Deposit B/E)
            </button>
            <button
              type="button"
              onClick={() => onAttendanceChange(144)}
              className="hover:text-[#FFCC00] cursor-pointer transition-colors"
            >
              144 Pax (Base B/E)
            </button>
            <button
              type="button"
              onClick={() => onAttendanceChange(200)}
              className="hover:text-white cursor-pointer transition-colors"
            >
              200 Pax (67% Cap)
            </button>
            <button
              type="button"
              onClick={() => onAttendanceChange(250)}
              className="hover:text-[#FFCC00] cursor-pointer transition-colors"
            >
              250 Pax (3rd Guard Trigger)
            </button>
            <button
              type="button"
              onClick={() => onAttendanceChange(300)}
              className="hover:text-[#FFCC00] font-bold text-white cursor-pointer transition-colors"
            >
              300 Pax (Licensed Max)
            </button>
          </div>
        </div>
      </div>

      {/* 5-Column Core Mathematical Audit Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Tile 1: Venue Net Profit */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>Venue Net Profit</span>
            {isProfitable ? (
              <TrendingUp className="w-4 h-4 text-[#FFCC00]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                isProfitable ? 'text-[#FFCC00]' : 'text-red-400'
              }`}
            >
              {formatAUD(summary.venueNetProfit, true)}
            </div>
            <div className="text-xs text-slate-300 font-mono tabular-nums">
              Net Margin: {formatPercent(summary.venueNetMarginPercent)} · Gross:{' '}
              {formatAUD(summary.totalVenueGrossRevenue)}
            </div>
          </div>
        </div>

        {/* Tile 2: Contribution Margin % & Per-Head Yield */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>Contribution Margin</span>
            <Percent className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono tabular-nums text-white">
              {formatPercent(summary.venueContributionMarginPercent)}
            </div>
            <div className="text-xs text-slate-300 font-mono tabular-nums">
              {formatAUD(summary.contributionPerAttendee, true)} / pax · Total{' '}
              {formatAUD(summary.venueContributionMarginDollar)}
            </div>
          </div>
        </div>

        {/* Tile 3: Wage Ratio Audit (<30% Owned / <50% Hosted) */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>IFA Wage Ratio</span>
            {summary.isWageRatioCompliant ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                summary.isWageRatioCompliant ? 'text-white' : 'text-red-400'
              }`}
            >
              {formatPercent(summary.wageRatioPercent)}
            </div>
            <div className="text-xs text-slate-300 font-mono tabular-nums">
              Target: &lt;{summary.wageTargetThresholdPercent.toFixed(0)}% ({isHosted ? 'Hosted' : 'Owned'}) ·{' '}
              {formatAUD(summary.totalStaffingCost)}
            </div>
          </div>
        </div>

        {/* Tile 4: Breakeven Threshold */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>Breakeven Threshold</span>
            <Target className="w-4 h-4 text-[#FFCC00]" />
          </div>
          <div className="space-y-0.5">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                breakEvenMet ? 'text-[#FFCC00]' : 'text-amber-400'
              }`}
            >
              {summary.activeBreakevenAttendees}{' '}
              <span className="text-xs font-normal text-slate-300">pax</span>
            </div>
            <div className="text-xs text-slate-300 font-mono tabular-nums">
              {isHosted
                ? `Base: ${summary.baseBreakevenAttendees} · Dep: ${summary.depositAdjustedBreakevenAttendees} pax`
                : `${summary.activeBreakevenPercentOfCap}% of 300-pax cap`}
            </div>
          </div>
        </div>

        {/* Tile 5: Beverage COGS Compliance (<= 22.0%) */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-4 flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>Beverage COGS Cap</span>
            {summary.isCogsCompliant ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                summary.isCogsCompliant ? 'text-white' : 'text-red-400'
              }`}
            >
              {formatPercent(summary.beverageCogsPercent)}
            </div>
            <div className="text-xs text-slate-300 font-mono tabular-nums">
              Cap: ≤22.0% · Bar GP: {formatAUD(summary.netBarGrossProfit)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
