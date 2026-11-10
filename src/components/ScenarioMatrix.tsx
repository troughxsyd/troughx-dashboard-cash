import React from 'react';
import {
  VenueConfig,
  StaffRole,
  TicketTier,
  DirectOverheadItem,
} from '../types/budget';
import {
  calculateScenarioAtAttendance,
  formatAUD,
  formatPercent,
} from '../utils/calculations';
import { CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';

interface Props {
  venueConfig: VenueConfig;
  staffRoster: StaffRole[];
  ticketTiers: TicketTier[];
  overheads: DirectOverheadItem[];
  onSelectAttendance?: (pax: number) => void;
}

export const ScenarioMatrix: React.FC<Props> = ({
  venueConfig,
  staffRoster,
  ticketTiers,
  overheads,
  onSelectAttendance,
}) => {
  const isHosted = venueConfig.operatingModel === 'promoter_hosted';
  const wageTarget = isHosted ? 50.0 : 30.0;

  const attendanceBenchmarks = [
    { pax: 100, shortLabel: '100 Pax', label: '100 Pax (Low Volume / Slump)' },
    {
      pax: 121,
      shortLabel: '121 Pax (Dep B/E)',
      label: '121 Pax (Hosted Breakeven w/ $550 Deposit)',
    },
    {
      pax: 144,
      shortLabel: '144 Pax (Base B/E)',
      label: '144 Pax (Hosted Base Breakeven)',
    },
    { pax: 180, shortLabel: '180 Pax', label: '180 Pax (60% Venue Capacity)' },
    {
      pax: 249,
      shortLabel: '249 Pax (2G Max)',
      label: '249 Pax (Max 2-Guard Security Threshold)',
    },
    {
      pax: 250,
      shortLabel: '250 Pax (3G Trigger)',
      label: '250 Pax (3rd Security Guard Triggered)',
    },
    {
      pax: 300,
      shortLabel: '300 Pax (Cap)',
      label: '300 Pax (Strict Licensed Capacity Cap)',
    },
  ];

  const rows = attendanceBenchmarks.map((b) => ({
    ...b,
    metrics: calculateScenarioAtAttendance(
      b.pax,
      venueConfig,
      staffRoster,
      ticketTiers,
      overheads
    ),
  }));

  const maxRev = Math.max(...rows.map((r) => r.metrics.venueGrossRevenue), 1);
  const maxAbsProfit = Math.max(
    ...rows.map((r) => Math.abs(r.metrics.venueNetProfit)),
    1000
  );

  return (
    <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#FFCC00]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Attendance & Step-Cost Profit Curve (100 → 300 Pax)
            </h2>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-300">
              Target Wage Ratio: &lt;{wageTarget}% ({isHosted ? 'Promoter Hosted' : 'Trough Owned'})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any bar or row to jump the simulator to that exact attendance benchmark (121 Deposit B/E, 144 Base B/E, 250 3-Guard Trigger, 300 Cap).
          </p>
        </div>
      </div>

      {/* Visual Bar Chart: Gross Revenue vs Total Wages vs Net Profit */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold uppercase tracking-wider text-white">
            Visual Cashflow & Breakeven Progression Graph
          </span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-2.5 h-2.5 rounded-xs bg-white inline-block" /> Venue Gross Revenue
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-500 inline-block" /> Total IFA Wages
            </span>
            <span className="flex items-center gap-1.5 text-[#FFCC00]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#FFCC00] inline-block" /> Venue Net Profit
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-4 pb-1 items-end h-52 border-b border-slate-800 px-1">
          {rows.map(({ pax, shortLabel, metrics }) => {
            const revHeight = Math.max(8, Math.round((metrics.venueGrossRevenue / maxRev) * 100));
            const wageHeight = Math.max(
              6,
              Math.round((metrics.totalStaffingCost / maxRev) * 100)
            );
            const profitHeight =
              metrics.venueNetProfit > 0
                ? Math.max(4, Math.round((metrics.venueNetProfit / maxRev) * 100))
                : 4;
            const isLoss = metrics.venueNetProfit < -0.5;

            return (
              <button
                key={pax}
                type="button"
                onClick={() => onSelectAttendance && onSelectAttendance(pax)}
                title={`${shortLabel}: Net Profit ${formatAUD(metrics.venueNetProfit, true)} | Wage Ratio ${formatPercent(metrics.wageRatioPercent)}`}
                className="group flex flex-col items-center justify-end h-full gap-1.5 cursor-pointer focus:outline-none"
              >
                <div className="text-[10px] font-mono tabular-nums font-bold text-[#FFCC00] group-hover:scale-105 transition-transform">
                  {formatAUD(metrics.venueNetProfit)}
                </div>

                <div className="w-full flex items-end justify-center gap-1 h-36 px-0.5">
                  {/* Gross Rev Bar (White) */}
                  <div
                    style={{ height: `${revHeight}%` }}
                    className="w-1/3 bg-white/90 group-hover:bg-white rounded-t transition-all"
                  />
                  {/* Wages Bar (Steel Grey) */}
                  <div
                    style={{ height: `${wageHeight}%` }}
                    className="w-1/3 bg-slate-500 group-hover:bg-slate-400 rounded-t transition-all"
                  />
                  {/* Net Profit Bar (#FFCC00 or Red if Deficit) */}
                  <div
                    style={{ height: `${profitHeight}%` }}
                    className={`w-1/3 rounded-t transition-all ${
                      isLoss
                        ? 'bg-red-500'
                        : 'bg-[#FFCC00] group-hover:bg-[#ffe066]'
                    }`}
                  />
                </div>

                <div className="text-[10px] font-mono text-slate-300 group-hover:text-white truncate max-w-full">
                  {shortLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-700/80 text-slate-300 font-mono uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3">Attendance Benchmark</th>
              <th className="py-2.5 px-3 text-center">Cap %</th>
              <th className="py-2.5 px-3 text-center">Guards</th>
              <th className="py-2.5 px-3 text-right">Venue Gross Rev</th>
              <th className="py-2.5 px-3 text-right">Total IFA Wages</th>
              <th className="py-2.5 px-3 text-right">Wage Ratio %</th>
              <th className="py-2.5 px-3 text-right">Venue Net P&L</th>
              {isHosted && <th className="py-2.5 px-3 text-right">Promoter Net</th>}
              <th className="py-2.5 px-3 text-center">Wage Threshold (&lt;{wageTarget}%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map(({ label, pax, metrics }) => {
              const isProfit = metrics.venueNetProfit >= -0.5;
              const isBreakevenRow = pax === 121 || pax === 144;

              return (
                <tr
                  key={pax}
                  onClick={() => onSelectAttendance && onSelectAttendance(pax)}
                  className={`transition-colors cursor-pointer ${
                    isBreakevenRow
                      ? 'bg-slate-800/50 hover:bg-slate-800/80'
                      : 'hover:bg-slate-800/35'
                  }`}
                >
                  <td className="py-3 px-3 font-medium text-white">{label}</td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-300">
                    {metrics.capacityPercent}%
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums">
                    <span
                      className={
                        metrics.securityGuards === 3
                          ? 'text-[#FFCC00] font-bold'
                          : 'text-slate-300'
                      }
                    >
                      {metrics.securityGuards}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-white">
                    {formatAUD(metrics.venueGrossRevenue, true)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                    {formatAUD(metrics.totalStaffingCost, true)}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono tabular-nums font-semibold ${
                      metrics.isWageCompliant ? 'text-white' : 'text-red-400'
                    }`}
                  >
                    {formatPercent(metrics.wageRatioPercent)}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono tabular-nums font-bold ${
                      isProfit ? 'text-[#FFCC00]' : 'text-red-400'
                    }`}
                  >
                    {formatAUD(metrics.venueNetProfit, true)}
                  </td>
                  {isHosted && (
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      {formatAUD(metrics.promoterNetProfit, true)}
                    </td>
                  )}
                  <td className="py-3 px-3 text-center font-mono text-[11px]">
                    {metrics.isWageCompliant ? (
                      <span className="text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                      </span>
                    ) : (
                      <span className="text-red-400 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Over &gt;{wageTarget}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
