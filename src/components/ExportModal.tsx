import React, { useState } from 'react';
import {
  VenueConfig,
  StaffRole,
  TicketTier,
  DirectOverheadItem,
  FinancialSummary,
} from '../types/budget';
import { formatAUD, formatPercent } from '../utils/calculations';
import { X, Download, Copy, Printer, Check, FileSpreadsheet } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  venueConfig: VenueConfig;
  staffRoster: StaffRole[];
  ticketTiers: TicketTier[];
  overheads: DirectOverheadItem[];
  summary: FinancialSummary;
}

export const ExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  venueConfig,
  staffRoster,
  ticketTiers,
  overheads,
  summary,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isHosted = venueConfig.operatingModel === 'promoter_hosted';
  const superRate = (venueConfig.superGuaranteeRate || 11.5) / 100;

  const handleDownloadCSV = () => {
    let csv = `TROUGH X SYDNEY — 273 CROWN STREET, SURRY HILLS NSW 2010\n`;
    csv += `Event,${venueConfig.eventName} - ${venueConfig.edition}\n`;
    csv += `Operating Model,${isHosted ? 'Promoter Hosted Night ($5.00 Ticket Clip)' : 'Trough Owned Party (100% Revenue Retention)'}\n`;
    csv += `Date,${venueConfig.eventDate} (${venueConfig.startTime} - ${venueConfig.endTime})\n`;
    csv += `Capacity Constraints,300 Total Licensed Cap / 60 Basement Occupancy Limit\n\n`;

    csv += `--- FINANCIAL & THRESHOLD SUMMARY ---\n`;
    csv += `Metric,Value\n`;
    csv += `Projected Attendance,${summary.projectedAttendance} / 300 (${summary.attendancePercent}%)\n`;
    csv += `Security Guards Required (1:100 Ratio),${summary.securityGuardsRequired} Guards\n`;
    csv += `Venue Retained Ticket Revenue,$${summary.venueRetainedTicketRevenue.toFixed(2)}\n`;
    if (isHosted) {
      csv += `Promoter Retained Ticket Revenue,$${summary.promoterRetainedTicketRevenue.toFixed(2)}\n`;
      csv += `Mandatory Booking Deposit Collected,$${summary.bookingDepositCollected.toFixed(2)}\n`;
    }
    csv += `Gross Bar Turnover (100% Venue),$${summary.grossBarRevenue.toFixed(2)}\n`;
    csv += `Cloakroom Receipts ($5.00/item),$${summary.grossCloakRevenue.toFixed(2)}\n`;
    csv += `TOTAL VENUE GROSS REVENUE,$${summary.totalVenueGrossRevenue.toFixed(2)}\n`;
    csv += `Beverage COGS (${summary.beverageCogsPercent.toFixed(1)}% vs <=22.0% Cap),-$${summary.beverageCogsAmount.toFixed(2)}\n`;
    csv += `Merchant Processing (${summary.merchantFeeRatePercent.toFixed(1)}%),-$${summary.merchantProcessingCost.toFixed(2)}\n`;
    csv += `VENUE CONTRIBUTION MARGIN ($),$${summary.venueContributionMarginDollar.toFixed(2)}\n`;
    csv += `VENUE CONTRIBUTION MARGIN (%),${summary.venueContributionMarginPercent.toFixed(1)}%\n`;
    csv += `Contribution Per Attendee ($/pax),$${summary.contributionPerAttendee.toFixed(2)}\n`;
    csv += `Base IFA Wages,$${summary.baseWagesTotal.toFixed(2)}\n`;
    csv += `Superannuation Guarantee (11.5%),$${summary.superannuationTotal.toFixed(2)}\n`;
    csv += `TOTAL STAFFING ROSTER COST,$${summary.totalStaffingCost.toFixed(2)}\n`;
    csv += `Wage Ratio % (Target <${summary.wageTargetThresholdPercent.toFixed(0)}%),${summary.wageRatioPercent.toFixed(1)}%\n`;
    csv += `Venue Direct Overheads,$${summary.venueDirectOverheads.toFixed(2)}\n`;
    csv += `VENUE NET OPERATING PROFIT,$${summary.venueNetProfit.toFixed(2)}\n`;
    csv += `Base Breakeven Attendees,${summary.baseBreakevenAttendees} pax\n`;
    if (isHosted) {
      csv += `Deposit-Adjusted Breakeven ($550 Deposit),${summary.depositAdjustedBreakevenAttendees} pax\n`;
    }
    csv += `\n`;

    csv += `--- IFA STAFFING ROSTER (BOOT TEST COMPLIANT) ---\n`;
    csv += `Role,Hourly Rate ($/hr),Super Status,Headcount,Shift Hours,Base Wage ($),Super 11.5% ($),Total Cost ($)\n`;
    staffRoster.forEach((r) => {
      const hc = r.autoScaleSecurity ? summary.securityGuardsRequired : r.headcount;
      const base = hc * r.hours * r.hourlyRate;
      const sup = r.superEligible ? base * superRate : 0;
      const tot = base + sup;
      csv += `"${r.roleName}",${r.hourlyRate},${r.superEligible ? '11.5% Super' : 'Contract Exempt'},${hc},${r.hours},$${base.toFixed(2)},$${sup.toFixed(2)},$${tot.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Trough_X_273_Crown_St_${venueConfig.operatingModel}_${venueConfig.eventDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateBriefingText = () => {
    return `TROUGH X SYDNEY — 273 CROWN STREET, SURRY HILLS NSW 2010
Event: ${venueConfig.eventName} (${venueConfig.edition}) | Date: ${venueConfig.eventDate}
Commercial Model: ${isHosted ? '1. Promoter Hosted Night ($5.00 Ticket Clip)' : '2. Trough Owned Party (100% Revenue Retention)'}
Capacity Constraints: 300 Total Cap / 60 Basement Cap | Projected: ${summary.projectedAttendance} pax (${summary.attendancePercent}%)

KEY MATHEMATICAL AUDIT & THRESHOLDS:
• Venue Net Profit: ${formatAUD(summary.venueNetProfit, true)} (Margin: ${formatPercent(summary.venueNetMarginPercent)})
• Contribution Margin: ${formatAUD(summary.venueContributionMarginDollar, true)} (${formatPercent(summary.venueContributionMarginPercent)} | ${formatAUD(summary.contributionPerAttendee, true)}/pax)
• IFA Wage Ratio: ${formatPercent(summary.wageRatioPercent)} vs Target <${summary.wageTargetThresholdPercent.toFixed(0)}% [${summary.isWageRatioCompliant ? 'COMPLIANT' : 'BREACH'}]
• Beverage COGS: ${formatPercent(summary.beverageCogsPercent)} vs Cap ≤22.0% [${summary.isCogsCompliant ? 'COMPLIANT' : 'BREACH'}]
• Breakeven Threshold: ${summary.baseBreakevenAttendees} pax base${isHosted ? ` | ${summary.depositAdjustedBreakevenAttendees} pax with $550 deposit` : ''}
• Security Guard Ratio (1:100): ${summary.securityGuardsRequired} Guards (${summary.projectedAttendance >= 250 ? '250+ Pax 3-Guard Trigger Active' : 'Under 250 Pax 2-Guard Base'})

REVENUE & COST BREAKDOWN:
• Total Venue Gross Revenue: ${formatAUD(summary.totalVenueGrossRevenue, true)} (Tickets: ${formatAUD(summary.venueRetainedTicketRevenue, true)}, Bar: ${formatAUD(summary.grossBarRevenue, true)}, Cloak: ${formatAUD(summary.grossCloakRevenue, true)}${summary.bookingDepositCollected > 0 ? `, Deposit: ${formatAUD(summary.bookingDepositCollected, true)}` : ''})
• Variable Costs: -${formatAUD(summary.totalVariableCosts, true)} (Bar COGS: -${formatAUD(summary.beverageCogsAmount, true)}, Merchant ${formatPercent(summary.merchantFeeRatePercent)}: -${formatAUD(summary.merchantProcessingCost, true)})
• Total IFA Staffing Cost: -${formatAUD(summary.totalStaffingCost, true)} (Base: ${formatAUD(summary.baseWagesTotal, true)} + 11.5% Super: ${formatAUD(summary.superannuationTotal, true)})
• Venue Direct Overheads: -${formatAUD(summary.venueDirectOverheads, true)}`;
  };

  const handleCopyBriefing = () => {
    navigator.clipboard.writeText(generateBriefingText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-w-2xl w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#FFCC00]" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Export 273 Crown St Cashflow & Roster Statement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded p-4 font-mono text-xs text-neutral-200 space-y-1.5 whitespace-pre-line max-h-64 overflow-y-auto">
          {generateBriefingText()}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            onClick={handleCopyBriefing}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#FFCC00]" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Cashflow Briefing</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print P&L</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 text-xs font-bold text-neutral-950 bg-[#FFCC00] hover:bg-[#ffe066] rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV (Excel)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
