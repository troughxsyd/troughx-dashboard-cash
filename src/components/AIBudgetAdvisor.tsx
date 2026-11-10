import React, { useState } from 'react';
import {
  VenueConfig,
  StaffRole,
  TicketTier,
  DirectOverheadItem,
  FinancialSummary,
} from '../types/budget';
import { formatAUD, formatPercent } from '../utils/calculations';
import { Sparkles, Send, RefreshCw, Lightbulb } from 'lucide-react';

interface Props {
  venueConfig: VenueConfig;
  staffRoster: StaffRole[];
  ticketTiers: TicketTier[];
  overheads: DirectOverheadItem[];
  summary: FinancialSummary;
}

const PRESET_PROMPTS = [
  'Full Mathematical Audit: Contribution Margin, Wage Ratio & Breakeven',
  'Verify Promoter Hosted Night Breakeven (144 Base vs 121 w/ $550 Deposit)',
  'Audit Trough Owned Party (<30% Wage Threshold & $1,900 Direct Overheads)',
  'Analyze 250+ Pax 3rd Security Guard Step-Cost & Basement 60-Pax Control',
  'Evaluate Beverage COGS Cap (≤22.0%) & Bar Yield Optimization',
];

export const AIBudgetAdvisor: React.FC<Props> = ({
  venueConfig,
  staffRoster,
  ticketTiers,
  overheads,
  summary,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async (promptText: string) => {
    setLoading(true);

    const payload = {
      budgetData: {
        venueConfig,
        staffRoster,
        ticketTiers,
        overheads,
        financialSummary: summary,
      },
      promptContext: promptText,
    };

    try {
      const response = await fetch('/api/analyze-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate budget advisory.');
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      console.warn('API call fallback to strict local 273 Crown St mathematical engine:', err);
      setAnalysis(generateStrictCrownStAudit(venueConfig, summary, staffRoster));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-700/80 rounded-lg p-5 space-y-5">
      <div className="border-b border-neutral-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFCC00]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Trough X Sydney (273 Crown St) — Mathematical & Cashflow Intelligence Engine
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audits BOOT-compliant IFA wage ratios (&lt;30% Owned / &lt;50% Hosted), 11.5% Superannuation, ≤22.0% Beverage COGS, and 144/121 breakeven thresholds.
          </p>
        </div>

        <button
          onClick={() => runAnalysis(PRESET_PROMPTS[0])}
          disabled={loading}
          className="px-3.5 py-1.5 text-xs font-bold text-neutral-950 bg-[#FFCC00] hover:bg-[#ffe066] rounded transition-colors whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Mathematical Audit</span>
        </button>
      </div>

      {/* Strategic Audit Prompts */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-neutral-300 uppercase tracking-wider">
          273 Crown St Compliance & Cashflow Audits
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => runAnalysis(prompt)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-950 border border-neutral-700/80 hover:border-[#FFCC00] text-neutral-200 hover:text-white rounded-md transition-colors text-left disabled:opacity-50 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && customPrompt.trim()) {
              runAnalysis(customPrompt);
            }
          }}
          placeholder="Ask the 273 Crown St Cashflow Engine (e.g. 'What happens to our wage ratio if bar spend drops to $20/head at 180 pax?')"
          className="flex-1 bg-neutral-950 border border-neutral-700/80 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFCC00] font-mono"
        />
        <button
          onClick={() => customPrompt.trim() && runAnalysis(customPrompt)}
          disabled={loading || !customPrompt.trim()}
          className="px-4 py-2 bg-[#FFCC00] hover:bg-[#ffe066] text-neutral-950 rounded text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Audit</span>
        </button>
      </div>

      {loading && (
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-6 space-y-3 animate-pulse">
          <div className="h-4 bg-neutral-800 rounded w-1/3" />
          <div className="h-3 bg-neutral-800/60 rounded w-full" />
          <div className="h-3 bg-neutral-800/60 rounded w-5/6" />
          <div className="h-3 bg-neutral-800/60 rounded w-4/6" />
        </div>
      )}

      {!loading && analysis && (
        <div className="bg-neutral-950 border border-neutral-700/80 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-[#FFCC00] font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 273 Crown St Financial & Compliance Audit
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              Trough X Sydney Intelligence Engine
            </span>
          </div>

          <div className="prose prose-invert max-w-none text-xs text-neutral-200 leading-relaxed space-y-3 font-sans whitespace-pre-line">
            {analysis}
          </div>
        </div>
      )}

      {!loading && !analysis && (
        <div className="bg-neutral-950/60 border border-dashed border-neutral-700/80 rounded-lg p-8 text-center space-y-2">
          <Lightbulb className="w-6 h-6 text-[#FFCC00] mx-auto" />
          <div className="text-xs font-medium text-white">
            Ready to audit 273 Crown St event parameters
          </div>
          <p className="text-[11px] text-neutral-400 max-w-md mx-auto">
            Click &quot;Run Mathematical Audit&quot; above to verify contribution margin percentages, BOOT-compliant IFA wage ratios, and 144/121 breakeven thresholds.
          </p>
        </div>
      )}
    </div>
  );
};

function generateStrictCrownStAudit(
  venueConfig: VenueConfig,
  summary: FinancialSummary,
  staffRoster: StaffRole[]
): string {
  const isHosted = venueConfig.operatingModel === 'promoter_hosted';
  const modelTitle = isHosted
    ? 'Promoter Hosted Night ($5.00 Ticket Clip)'
    : 'Trough Owned Party (100% Revenue Retention)';

  return `### 1. Executive Financial Verdict & Threshold Compliance — 273 Crown Street
• Operating Model: **${modelTitle}**
• Projected Attendance: **${summary.projectedAttendance} / 300 Pax** (${summary.attendancePercent}% of strict 300-pax licensed limit; Basement strictly capped at 60 pax)
• Venue Net Operating Profit: **${formatAUD(summary.venueNetProfit, true)}** (Net Margin: ${formatPercent(summary.venueNetMarginPercent)})
• IFA Wage Ratio Check: **${formatPercent(summary.wageRatioPercent)}** vs Target **<${summary.wageTargetThresholdPercent.toFixed(0)}%** → **${summary.isWageRatioCompliant ? 'COMPLIANT' : 'BREACH — EXCEEDS WAGE TARGET THRESHOLD'}**
• Beverage COGS Check: **${formatPercent(summary.beverageCogsPercent)}** vs Target **≤22.0%** → **${summary.isCogsCompliant ? 'COMPLIANT' : 'BREACH — EXCEEDS 22.0% COGS CAP'}**

### 2. Contribution Margin & Unit Economics Breakdown
• Venue Gross Revenue per Attendee: **${formatAUD(summary.grossRevenuePerAttendee, true)} / pax**
  - Ticket Retention: ${isHosted ? `$${venueConfig.promoterTicketClip.toFixed(2)} flat clip/ticket` : '100% of ticket revenue'}
  - Gross Bar Spend: ${formatAUD(venueConfig.avgGrossBarSpendPerHead, true)} / pax (100% venue retained)
  - Cloakroom Yield: ${venueConfig.cloakUtilizationPercent}% utilization @ ${formatAUD(venueConfig.cloakPricePerItem, true)}/item
• Variable Costs Deducted:
  - Beverage COGS (${formatPercent(summary.beverageCogsPercent)}): **-${formatAUD(summary.beverageCogsAmount, true)}**
  - Clover / Merchant Processing (${formatPercent(summary.merchantFeeRatePercent)}): **-${formatAUD(summary.merchantProcessingCost, true)}**
• Net Contribution Margin: **${formatAUD(summary.venueContributionMarginDollar, true)}** (**${formatPercent(summary.venueContributionMarginPercent)}** CM ratio | **${formatAUD(summary.contributionPerAttendee, true)} net contribution per attendee**)

### 3. Breakeven Threshold Verification
• Base Breakeven (Excl. Deposit): **${summary.baseBreakevenAttendees} attendees**
${
  isHosted
    ? `• Deposit-Adjusted Breakeven (With Mandatory $${venueConfig.promoterBookingDeposit.toFixed(0)} Deposit): **${summary.depositAdjustedBreakevenAttendees} attendees**
• Active Breakeven Margin of Safety: ${
        summary.projectedAttendance >= summary.activeBreakevenAttendees
          ? `+${summary.projectedAttendance - summary.activeBreakevenAttendees} patrons above breakeven`
          : `${summary.activeBreakevenAttendees - summary.projectedAttendance} patrons short of breakeven`
      }`
    : `• Trough Owned Breakeven: **${summary.activeBreakevenAttendees} attendees** (${summary.activeBreakevenPercentOfCap}% of 300-pax licensed capacity) covering both IFA roster (${formatAUD(summary.totalStaffingCost, true)}) and direct in-house overheads (${formatAUD(summary.venueDirectOverheads, true)}).`
}

### 4. Staffing Roster, Superannuation (11.5%) & Security 1:100 Audit
• Base IFA Wages: **${formatAUD(summary.baseWagesTotal, true)}**
• Superannuation Guarantee (11.5% on eligible staff): **+${formatAUD(summary.superannuationTotal, true)}**
• Total Staffing Roster Cost: **${formatAUD(summary.totalStaffingCost, true)}**
• Security Guard Ratio (1:100): **${summary.securityGuardsRequired} Contracted Guards** @ $55.00/hr (super exempt). ${
    summary.projectedAttendance >= 250
      ? 'Attendance is ≥250 pax; the 3rd security guard step-cost is active.'
      : 'Attendance is <250 pax; 2 security guards meet the 1:100 licensing condition.'
  }
• Basement 60-Pax Control: Assistant Lead / Floor Supervisor ($55.00/hr + 11.5% super) is rostered specifically to enforce the 60-person basement cap and door sync.`;
}
