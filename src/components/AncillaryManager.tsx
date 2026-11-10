import React from 'react';
import { VenueConfig, FinancialSummary } from '../types/budget';
import { formatAUD, formatPercent } from '../utils/calculations';
import { CheckCircle2, AlertTriangle, Wine } from 'lucide-react';

interface Props {
  venueConfig: VenueConfig;
  summary: FinancialSummary;
  onChange: (config: VenueConfig) => void;
}

export const AncillaryManager: React.FC<Props> = ({
  venueConfig,
  summary,
  onChange,
}) => {
  const updateField = <K extends keyof VenueConfig>(key: K, value: VenueConfig[K]) => {
    onChange({
      ...venueConfig,
      [key]: value,
    });
  };

  const cogsPct = summary.beverageCogsPercent;
  const gpPct = Math.max(0, 100 - cogsPct);

  return (
    <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Wine className="w-4 h-4 text-[#FFCC00]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Beverage Bar Turnover, COGS (≤22.0% Cap) & Cloakroom Sliders
            </h2>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-300">100% Retained by Venue</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust sliders to simulate Main & Basement Bar spend per head, COGS efficiency against the 22.0% ceiling, and Cloakroom utilization.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {summary.isCogsCompliant ? (
            <span className="text-[#FFCC00] flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>COGS {formatPercent(summary.beverageCogsPercent)} (Compliant ≤22.0%)</span>
            </span>
          ) : (
            <span className="text-red-400 flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>COGS {formatPercent(summary.beverageCogsPercent)} Exceeds 22.0% Cap!</span>
            </span>
          )}
        </div>
      </div>

      {/* Visual Bar Gross Margin vs COGS Gauge */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
          <span className="text-white font-bold uppercase">
            Bar Gross Profit vs. Beverage COGS Split ({formatAUD(summary.grossBarRevenue)} Gross Turnover)
          </span>
          <div className="flex items-center gap-4">
            <span className="text-[#FFCC00]">
              Net Bar GP ({formatPercent(gpPct)}): <strong>{formatAUD(summary.netBarGrossProfit)}</strong>
            </span>
            <span className={summary.isCogsCompliant ? 'text-slate-300' : 'text-red-400 font-bold'}>
              COGS ({formatPercent(cogsPct)}): <strong>-{formatAUD(summary.beverageCogsAmount)}</strong>
            </span>
          </div>
        </div>

        <div className="w-full h-3.5 bg-slate-800 rounded-md overflow-hidden flex relative">
          <div
            style={{ width: `${gpPct}%` }}
            className="bg-[#FFCC00] h-full transition-all"
            title={`Net Bar Gross Profit: ${formatAUD(summary.netBarGrossProfit)}`}
          />
          <div
            style={{ width: `${Math.min(100, cogsPct)}%` }}
            className={`${
              summary.isCogsCompliant ? 'bg-slate-500' : 'bg-red-500'
            } h-full transition-all`}
            title={`Beverage COGS: ${formatAUD(summary.beverageCogsAmount)}`}
          />
        </div>
      </div>

      {/* Interactive Sliders for Bar & Cloakroom */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Slider 1: Avg Gross Bar Spend / Head */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-white">Avg Bar Spend / Pax</label>
            <span className="font-mono tabular-nums text-[#FFCC00] font-bold text-sm">
              {formatAUD(venueConfig.avgGrossBarSpendPerHead, true)}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="75"
            step="0.2"
            value={venueConfig.avgGrossBarSpendPerHead}
            onChange={(e) =>
              updateField('avgGrossBarSpendPerHead', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFCC00]"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
            <span>$10</span>
            <span>Gross Bar: {formatAUD(summary.grossBarRevenue)}</span>
            <span>$75</span>
          </div>
        </div>

        {/* Slider 2: Beverage COGS % (Target <= 22.0%) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-white">Beverage COGS %</label>
            <span
              className={`font-mono tabular-nums font-bold text-sm ${
                summary.isCogsCompliant ? 'text-[#FFCC00]' : 'text-red-400'
              }`}
            >
              {formatPercent(venueConfig.beverageCogsPercent)}
            </span>
          </div>
          <input
            type="range"
            min="12"
            max="35"
            step="0.5"
            value={venueConfig.beverageCogsPercent}
            onChange={(e) =>
              updateField('beverageCogsPercent', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFCC00]"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
            <span>12%</span>
            <span className="text-white">Cap: ≤22.0%</span>
            <span>35%</span>
          </div>
        </div>

        {/* Slider 3: Cloakroom Fee / Item ($5.00 standard) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-white">Cloakroom Fee / Item</label>
            <span className="font-mono tabular-nums text-white font-bold text-sm">
              {formatAUD(venueConfig.cloakPricePerItem, true)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={venueConfig.cloakPricePerItem}
            onChange={(e) =>
              updateField('cloakPricePerItem', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
            <span>$0</span>
            <span>Standard: $5.00/item</span>
            <span>$15</span>
          </div>
        </div>

        {/* Slider 4: Cloakroom Utilization % */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-white">Cloak Utilization %</label>
            <span className="font-mono tabular-nums text-[#FFCC00] font-bold text-sm">
              {venueConfig.cloakUtilizationPercent}% ({summary.cloakItemsCount} items)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={venueConfig.cloakUtilizationPercent}
            onChange={(e) =>
              updateField('cloakUtilizationPercent', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFCC00]"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
            <span>0%</span>
            <span className="text-[#FFCC00] font-semibold">
              Receipts: {formatAUD(summary.grossCloakRevenue)}
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
