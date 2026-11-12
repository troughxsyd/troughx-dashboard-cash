import React, { useState, useMemo } from 'react';
import type { PipelineEvent, OwnedDirectOverheads } from '../App';

export type SimMode = 'owned' | 'promoter' | 'fixed_hire';

interface SimMetricsSummary {
  fixedHireRevenue: number;
  ticketRevenue: number;
  depositRevenue: number;
  barRevenue: number;
  cloakRevenue: number;
  grossTurnover: number;
  beverageCogs: number;
  consumables: number;
  grossMargin: number;
  guards: number;
  bartenders: number;
  staffCount: number;
  baseRosterWages: number;
  talentCost: number;
  productionCost: number;
  marketingCost: number;
  otherCost: number;
  terminalFees: number;
  fixedDirectOverheads: number;
  totalOverheads: number;
  netSurplus: number;
  wageRatio: number;
  marginRatio: number;
}

interface VenueProgrammingCalendarProps {
  events: PipelineEvent[];
  editingEventIndex: number | null;
  simEventDate: string;
  setSimEventDate: (val: string) => void;
  simEventTitle: string;
  setSimEventTitle: (val: string) => void;
  simEventFormat: string;
  setSimEventFormat: (val: string) => void;
  simMode: SimMode;
  setSimMode: (mode: SimMode) => void;
  simPax: number;
  setSimPax: (val: number) => void;
  simTicketPrice: number;
  setSimTicketPrice: (val: number) => void;
  simTicketClip: number;
  setSimTicketClip: (val: number) => void;
  simBarSpend: number;
  setSimBarSpend: (val: number) => void;
  simCloakRate: number;
  setSimCloakRate: (val: number) => void;
  simCogsRate: number;
  setSimCogsRate: (val: number) => void;
  simPromoterDeposit: boolean;
  setSimPromoterDeposit: (val: boolean) => void;
  simFixedHireFee: number;
  updateFixedHireFee: (val: number) => void;
  ownedOverheads: OwnedDirectOverheads;
  updateOwnedOverhead: (field: keyof OwnedDirectOverheads, value: number) => void;
  resetOwnedOverheads: () => void;
  simMetrics: SimMetricsSummary;
  onSelectEventForEdit: (event: PipelineEvent, indexInEvents: number) => void;
  onStartNewEventOnDate: (dateStr: string) => void;
  onSaveToExistingEvent: () => void;
  onSaveAsNewEvent: () => void;
  onDeleteEvent: (indexInEvents: number) => void;
  onMoveEventDate: (indexInEvents: number, newDateStr: string) => void;
  simSaveNotice: string | null;
  cloudSyncState: 'idle' | 'syncing' | 'synced' | 'error';
  cloudSyncMessage: string | null;
  isSignedIn: boolean;
  userEmail?: string | null;
  onSignIn: () => void;
  onManualCloudRefresh: () => void;
  onForcePushToCloud: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function parseEventDateDMY(
  dateStr: string
): { day: number; month: number; year: number } | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  const parts = trimmed.split(/[/-]/);
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;
  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    month < 0 ||
    month > 11 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  return { day, month, year };
}

export function formatDMY(day: number, monthZeroIndexed: number, year: number): string {
  const dd = String(day).padStart(2, '0');
  const mm = String(monthZeroIndexed + 1).padStart(2, '0');
  return `${dd}/${mm}/${year}`;
}

function formatMoney(val: number): string {
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const VenueProgrammingCalendar: React.FC<VenueProgrammingCalendarProps> = ({
  events,
  editingEventIndex,
  simEventDate,
  setSimEventDate,
  simEventTitle,
  setSimEventTitle,
  simEventFormat,
  setSimEventFormat,
  simMode,
  setSimMode,
  simPax,
  setSimPax,
  simTicketPrice,
  setSimTicketPrice,
  simTicketClip,
  setSimTicketClip,
  simBarSpend,
  setSimBarSpend,
  simCloakRate,
  setSimCloakRate,
  simCogsRate,
  setSimCogsRate,
  simPromoterDeposit,
  setSimPromoterDeposit,
  simFixedHireFee,
  updateFixedHireFee,
  ownedOverheads,
  updateOwnedOverhead,
  resetOwnedOverheads,
  simMetrics,
  onSelectEventForEdit,
  onStartNewEventOnDate,
  onSaveToExistingEvent,
  onSaveAsNewEvent,
  onDeleteEvent,
  onMoveEventDate,
  simSaveNotice,
  cloudSyncState,
  cloudSyncMessage,
  isSignedIn,
  userEmail,
  onSignIn,
  onManualCloudRefresh,
  onForcePushToCloud,
}) => {
  // Determine initial month/year from first scheduled event or Nov 2026
  const initialMonthYear = useMemo(() => {
    for (const ev of events) {
      const parsed = parseEventDateDMY(ev.date);
      if (parsed) {
        return { month: parsed.month, year: parsed.year };
      }
    }
    return { month: 10, year: 2026 }; // November 2026
  }, []);

  const [viewMonth, setViewMonth] = useState<number>(initialMonthYear.month);
  const [viewYear, setViewYear] = useState<number>(initialMonthYear.year);
  const [calendarFilter, setCalendarFilter] = useState<
    'all' | 'owned' | 'promoter' | 'fixed_hire'
  >('all');
  const [highlightPrimeSlots, setHighlightPrimeSlots] = useState<boolean>(true);
  const [showOverheadsDrawer, setShowOverheadsDrawer] = useState<boolean>(false);
  const [draggedEventIndex, setDraggedEventIndex] = useState<number | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);

  // Build list of quick-jump season months from Nov 2026 to Apr 2027 + any custom event months
  const seasonMonths = useMemo(() => {
    const baseMonths = [
      { month: 10, year: 2026 }, // Nov 2026
      { month: 11, year: 2026 }, // Dec 2026
      { month: 0, year: 2027 }, // Jan 2027
      { month: 1, year: 2027 }, // Feb 2027
      { month: 2, year: 2027 }, // Mar 2027
      { month: 3, year: 2027 }, // Apr 2027
    ];
    const seen = new Set(baseMonths.map((m) => `${m.year}-${m.month}`));
    events.forEach((ev) => {
      const p = parseEventDateDMY(ev.date);
      if (p) {
        const key = `${p.year}-${p.month}`;
        if (!seen.has(key)) {
          seen.add(key);
          baseMonths.push({ month: p.month, year: p.year });
        }
      }
    });
    baseMonths.sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );
    return baseMonths;
  }, [events]);

  // Map events by DD/MM/YYYY date string
  const eventsWithMeta = useMemo(() => {
    return events.map((item, originalIndex) => {
      const parsed = parseEventDateDMY(item.date);
      const isFixedHire =
        item.format.toLowerCase().includes('fixed') ||
        (item.barGross === 0 && item.clip + item.ticketRev + item.deposit > 0);
      return {
        item,
        originalIndex,
        parsed,
        isFixedHire,
      };
    });
  }, [events]);

  const filteredEventsWithMeta = useMemo(() => {
    return eventsWithMeta.filter(({ item, isFixedHire }) => {
      if (calendarFilter === 'owned') return item.type === 'owned' && !isFixedHire;
      if (calendarFilter === 'promoter')
        return item.type === 'promoter' && !isFixedHire;
      if (calendarFilter === 'fixed_hire') return isFixedHire;
      return true;
    });
  }, [eventsWithMeta, calendarFilter]);

  const eventsByDateMap = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        item: PipelineEvent;
        originalIndex: number;
        isFixedHire: boolean;
      }>
    >();
    filteredEventsWithMeta.forEach(({ item, originalIndex, parsed, isFixedHire }) => {
      const normalizedKey = parsed
        ? formatDMY(parsed.day, parsed.month, parsed.year)
        : item.date.trim();
      const existing = map.get(normalizedKey) || [];
      existing.push({ item, originalIndex, isFixedHire });
      map.set(normalizedKey, existing);
    });
    return map;
  }, [filteredEventsWithMeta]);

  // Events in currently viewed month
  const currentMonthEvents = useMemo(() => {
    return filteredEventsWithMeta
      .filter(
        ({ parsed }) =>
          parsed && parsed.month === viewMonth && parsed.year === viewYear
      )
      .sort((a, b) => (a.parsed!.day || 0) - (b.parsed!.day || 0));
  }, [filteredEventsWithMeta, viewMonth, viewYear]);

  // Monthly KPI totals
  const monthTotals = useMemo(() => {
    let gross = 0;
    let wages = 0;
    let surplus = 0;
    let totalPax = 0;
    let ownedCount = 0;
    let promoterCount = 0;
    let fixedHireCount = 0;

    currentMonthEvents.forEach(({ item, isFixedHire }) => {
      const evGross = item.barGross + item.clip + item.ticketRev + item.deposit;
      gross += evGross;
      wages += item.wages;
      surplus += item.surplus;
      totalPax += item.pax;
      if (isFixedHire) fixedHireCount++;
      else if (item.type === 'owned') ownedCount++;
      else promoterCount++;
    });

    return {
      count: currentMonthEvents.length,
      gross,
      wages,
      surplus,
      totalPax,
      ownedCount,
      promoterCount,
      fixedHireCount,
    };
  }, [currentMonthEvents]);

  // Build calendar cells for current month (Monday-first 7-column grid)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Convert JS Sunday=0..Saturday=6 into Monday=0..Sunday=6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    const cells: Array<{
      day: number;
      month: number;
      year: number;
      dateStr: string;
      isCurrentMonth: boolean;
      dayOfWeekIndex: number; // 0=Mon .. 5=Sat, 6=Sun
      isPrimeNight: boolean; // Fri (4) or Sat (5)
    }> = [];

    // Leading days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dow = cells.length % 7;
      cells.push({
        day: d,
        month: m,
        year: y,
        dateStr: formatDMY(d, m, y),
        isCurrentMonth: false,
        dayOfWeekIndex: dow,
        isPrimeNight: dow === 4 || dow === 5,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = cells.length % 7;
      cells.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        dateStr: formatDMY(d, viewMonth, viewYear),
        isCurrentMonth: true,
        dayOfWeekIndex: dow,
        isPrimeNight: dow === 4 || dow === 5,
      });
    }

    // Trailing days to complete 5 or 6 full weeks
    const totalNeeded = cells.length <= 35 ? 35 : 42;
    let nextDay = 1;
    while (cells.length < totalNeeded) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dow = cells.length % 7;
      cells.push({
        day: nextDay,
        month: m,
        year: y,
        dateStr: formatDMY(nextDay, m, y),
        isCurrentMonth: false,
        dayOfWeekIndex: dow,
        isPrimeNight: dow === 4 || dow === 5,
      });
      nextDay++;
    }

    return cells;
  }, [viewMonth, viewYear]);

  // Count open prime nights (Fri/Sat) in current month
  const openPrimeDatesInMonth = useMemo(() => {
    return calendarCells.filter(
      (c) =>
        c.isCurrentMonth &&
        c.isPrimeNight &&
        !(eventsByDateMap.get(c.dateStr) && eventsByDateMap.get(c.dateStr)!.length > 0)
    );
  }, [calendarCells, eventsByDateMap]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleCellClick = (
    dateStr: string,
    cellEvents: Array<{
      item: PipelineEvent;
      originalIndex: number;
      isFixedHire: boolean;
    }>,
    isCurrentMonth: boolean,
    month: number,
    year: number
  ) => {
    if (!isCurrentMonth) {
      setViewMonth(month);
      setViewYear(year);
    }
    if (cellEvents.length > 0) {
      // Load the first event on that date into the right-hand simulator
      onSelectEventForEdit(cellEvents[0].item, cellEvents[0].originalIndex);
    } else {
      // Start programming a new event on that clicked date
      onStartNewEventOnDate(dateStr);
    }
  };

  return (
    <section className="space-y-4">
      {/* TOP BAR: CLOUD SYNC & WORKSPACE SUMMARY */}
      <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-3.5 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-trough-yellow/15 border border-trough-yellow/40 flex items-center justify-center text-trough-yellow shrink-0">
            <i className="fa-solid fa-calendar-days text-base"></i>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Trough X Interactive Venue Programming Calendar
              </h2>
              <span className="text-xs text-neutral-400 font-mono">
                · 3/4 Schedule Grid + 1/4 Live Budget Simulator
              </span>
            </div>
            <p className="text-xs text-trough-muted">
              Click any date on the calendar to program a new event or click an existing booking to
              model its budget, format, and surplus on the right. Drag events between dates to
              reschedule.
            </p>
          </div>
        </div>

        {/* Cloud Sync Pill & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isSignedIn ? (
            <>
              <span
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  cloudSyncState === 'syncing'
                    ? 'bg-trough-yellow/15 text-trough-yellow border-trough-yellow/30'
                    : cloudSyncState === 'error'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                <i
                  className={`fa-solid ${
                    cloudSyncState === 'syncing'
                      ? 'fa-arrows-rotate fa-spin'
                      : cloudSyncState === 'error'
                      ? 'fa-triangle-exclamation'
                      : 'fa-cloud-check'
                  }`}
                ></i>
                <span>
                  {cloudSyncMessage || `Synced (${userEmail?.split('@')[0]})`}
                </span>
              </span>
              <button
                type="button"
                onClick={onManualCloudRefresh}
                className="px-2.5 py-1.5 rounded-lg bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Pull latest schedule from Firestore cloud"
              >
                <i className="fa-solid fa-cloud-arrow-down text-trough-yellow"></i>
                <span>Pull Cloud</span>
              </button>
              <button
                type="button"
                onClick={onForcePushToCloud}
                className="px-2.5 py-1.5 rounded-lg bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Push this device's schedule to all devices"
              >
                <i className="fa-solid fa-cloud-arrow-up text-emerald-400"></i>
                <span>Push Cloud</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="px-3 py-1.5 rounded-lg bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <i className="fa-brands fa-google"></i>
              <span>Sign in to Sync Schedule Across Devices</span>
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP 3/4 LEFT CALENDAR + 1/4 RIGHT SIMULATOR & EVENT ENTRY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ==================== LEFT 3/4 COLUMN (9 COLS): INTERACTIVE CALENDAR ==================== */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Month Navigation & Season Quick-Jump Strip */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-neutral-800 pb-3.5">
              {/* Month Title + Prev/Next Controls */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="w-9 h-9 rounded-xl bg-[#191919] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center transition cursor-pointer"
                  title="Previous Month"
                >
                  <i className="fa-solid fa-chevron-left text-xs"></i>
                </button>
                <div className="min-w-[175px] text-center">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </h3>
                  <span className="text-[11px] text-trough-muted font-mono block">
                    {monthTotals.count} Booked · {openPrimeDatesInMonth.length} Open Fri/Sat
                  </span>
                </div>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="w-9 h-9 rounded-xl bg-[#191919] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center transition cursor-pointer"
                  title="Next Month"
                >
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>

              {/* Season Month Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {seasonMonths.map((sm) => {
                  const isActive = sm.month === viewMonth && sm.year === viewYear;
                  const countInMonth = eventsWithMeta.filter(
                    (e) =>
                      e.parsed &&
                      e.parsed.month === sm.month &&
                      e.parsed.year === sm.year
                  ).length;
                  return (
                    <button
                      key={`${sm.year}-${sm.month}`}
                      type="button"
                      onClick={() => {
                        setViewMonth(sm.month);
                        setViewYear(sm.year);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border ${
                        isActive
                          ? 'bg-trough-yellow text-black font-bold border-trough-yellow'
                          : 'bg-[#191919] text-neutral-300 border-neutral-800 hover:border-neutral-600 hover:text-white'
                      }`}
                    >
                      <span>
                        {SHORT_MONTH_NAMES[sm.month]} ’{String(sm.year).slice(-2)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded ${
                          isActive
                            ? 'bg-black/20 text-black font-extrabold'
                            : countInMonth > 0
                            ? 'bg-neutral-800 text-trough-yellow'
                            : 'bg-neutral-800/60 text-neutral-500'
                        }`}
                      >
                        {countInMonth}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Filter & Prime Slot Highlight Controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center bg-[#191919] p-1 rounded-xl border border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setCalendarFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      calendarFilter === 'all'
                        ? 'bg-trough-yellow text-black font-bold'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    All ({events.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarFilter('owned')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      calendarFilter === 'owned'
                        ? 'bg-trough-yellow text-black font-bold'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Owned
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarFilter('promoter')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      calendarFilter === 'promoter'
                        ? 'bg-trough-yellow text-black font-bold'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Promoter
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarFilter('fixed_hire')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      calendarFilter === 'fixed_hire'
                        ? 'bg-trough-yellow text-black font-bold'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Fixed Hire
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setHighlightPrimeSlots((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    highlightPrimeSlots
                      ? 'bg-trough-yellow/15 text-trough-yellow border-trough-yellow/40'
                      : 'bg-[#191919] text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                  title="Highlight unbooked Friday & Saturday nights"
                >
                  <i className="fa-solid fa-sparkles text-[10px]"></i>
                  <span>Open Fri/Sat Slots</span>
                </button>
              </div>
            </div>

            {/* Monthly Financial Rollup Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="bg-[#191919] border border-neutral-800 rounded-xl p-2.5">
                <span className="text-[11px] text-trough-muted block">
                  {SHORT_MONTH_NAMES[viewMonth]} Programmed Nights
                </span>
                <div className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                  {monthTotals.count} Events
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {monthTotals.ownedCount} Owned · {monthTotals.promoterCount} Prom ·{' '}
                  {monthTotals.fixedHireCount} Flat
                </span>
              </div>

              <div className="bg-[#191919] border border-neutral-800 rounded-xl p-2.5">
                <span className="text-[11px] text-trough-muted block">
                  Projected Monthly Footfall
                </span>
                <div className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                  {monthTotals.totalPax.toLocaleString()} Pax
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Avg{' '}
                  {monthTotals.count > 0
                    ? Math.round(monthTotals.totalPax / monthTotals.count)
                    : 0}{' '}
                  Pax / Night
                </span>
              </div>

              <div className="bg-[#191919] border border-neutral-800 rounded-xl p-2.5">
                <span className="text-[11px] text-trough-muted block">
                  Month Gross Venue Turnover
                </span>
                <div className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                  ${Math.round(monthTotals.gross).toLocaleString()}
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Bar + Door + Hire Fees
                </span>
              </div>

              <div className="bg-[#191919] border border-neutral-800 rounded-xl p-2.5">
                <span className="text-[11px] text-trough-muted block">
                  Month Committed Wages
                </span>
                <div className="text-base font-bold font-mono text-rose-300 tabular-nums mt-0.5">
                  (${Math.round(monthTotals.wages).toLocaleString()})
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Flat-Rate IFA Roster
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-[#191919] border border-trough-yellow/50 rounded-xl p-2.5">
                <span className="text-[11px] text-trough-yellow font-semibold block">
                  {SHORT_MONTH_NAMES[viewMonth]} Net Operating Surplus
                </span>
                <div
                  className={`text-base font-extrabold font-mono tabular-nums mt-0.5 ${
                    monthTotals.surplus >= 0 ? 'text-trough-yellow' : 'text-rose-400'
                  }`}
                >
                  {monthTotals.surplus >= 0
                    ? `+$${Math.round(monthTotals.surplus).toLocaleString()}`
                    : `-$${Math.round(Math.abs(monthTotals.surplus)).toLocaleString()}`}
                </div>
                <span className="text-[10px] text-neutral-300 font-mono">
                  Season Total: +$
                  {Math.round(
                    events.reduce((acc, e) => acc + e.surplus, 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            {/* 7-COLUMN CALENDAR GRID */}
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-[#191919]">
              {/* Weekday Headers (Mon - Sun) */}
              <div className="grid grid-cols-7 border-b border-neutral-800 bg-[#202020]">
                {WEEKDAYS.map((dayName, idx) => {
                  const isWeekendHeader = idx === 4 || idx === 5;
                  return (
                    <div
                      key={dayName}
                      className={`py-2.5 px-2 text-center text-xs font-bold tracking-wider uppercase ${
                        isWeekendHeader ? 'text-trough-yellow bg-trough-yellow/5' : 'text-neutral-400'
                      }`}
                    >
                      <span>{dayName}</span>
                      {isWeekendHeader && (
                        <span className="hidden sm:inline text-[10px] font-mono ml-1 text-trough-yellow/80">
                          · Prime
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Calendar Day Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-neutral-800/90">
                {calendarCells.map((cell) => {
                  const cellEvents = eventsByDateMap.get(cell.dateStr) || [];
                  const isSelectedDate = simEventDate.trim() === cell.dateStr;
                  const hasSelectedEvent = cellEvents.some(
                    (ce) => ce.originalIndex === editingEventIndex
                  );
                  const isOpenPrimeSlot =
                    highlightPrimeSlots &&
                    cell.isCurrentMonth &&
                    cell.isPrimeNight &&
                    cellEvents.length === 0;
                  const isDragTarget = dragOverDateStr === cell.dateStr;

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() =>
                        handleCellClick(
                          cell.dateStr,
                          cellEvents,
                          cell.isCurrentMonth,
                          cell.month,
                          cell.year
                        )
                      }
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverDateStr !== cell.dateStr) {
                          setDragOverDateStr(cell.dateStr);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverDateStr === cell.dateStr) {
                          setDragOverDateStr(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverDateStr(null);
                        if (draggedEventIndex !== null) {
                          onMoveEventDate(draggedEventIndex, cell.dateStr);
                          setDraggedEventIndex(null);
                        }
                      }}
                      className={`min-h-[118px] sm:min-h-[134px] p-1.5 sm:p-2 flex flex-col justify-between transition cursor-pointer group relative ${
                        !cell.isCurrentMonth
                          ? 'bg-[#151515] opacity-45 hover:opacity-80'
                          : hasSelectedEvent || isSelectedDate
                          ? 'bg-trough-yellow/10 ring-1 ring-inset ring-trough-yellow'
                          : isDragTarget
                          ? 'bg-emerald-500/15 ring-1 ring-inset ring-emerald-400'
                          : isOpenPrimeSlot
                          ? 'bg-[#1D1D1D] hover:bg-[#252525]'
                          : 'bg-[#191919] hover:bg-[#222222]'
                      }`}
                    >
                      {/* Top Row of Day Cell: Day Number & Quick Add Affordance */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                            hasSelectedEvent || isSelectedDate
                              ? 'bg-trough-yellow text-black'
                              : cell.isPrimeNight && cell.isCurrentMonth
                              ? 'text-white'
                              : 'text-neutral-400'
                          }`}
                        >
                          {cell.day}
                        </span>

                        {cellEvents.length === 0 && cell.isCurrentMonth && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartNewEventOnDate(cell.dateStr);
                            }}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition ${
                              isOpenPrimeSlot
                                ? 'text-trough-yellow/90 bg-trough-yellow/10 group-hover:bg-trough-yellow group-hover:text-black font-semibold'
                                : 'opacity-0 group-hover:opacity-100 bg-neutral-800 text-neutral-200'
                            }`}
                            title={`Program event on ${cell.dateStr}`}
                          >
                            + Program
                          </button>
                        )}

                        {cellEvents.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartNewEventOnDate(cell.dateStr);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-trough-yellow hover:text-black text-neutral-300 transition"
                            title={`Add another event on ${cell.dateStr}`}
                          >
                            +
                          </button>
                        )}
                      </div>

                      {/* Event Cards inside Cell */}
                      <div className="space-y-1.5 my-1 flex-1 flex flex-col justify-center">
                        {cellEvents.map(({ item, originalIndex, isFixedHire }) => {
                          const isBeingEdited = editingEventIndex === originalIndex;
                          const evGross =
                            item.barGross + item.clip + item.ticketRev + item.deposit;

                          return (
                            <div
                              key={`${item.date}-${item.title}-${originalIndex}`}
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                setDraggedEventIndex(originalIndex);
                              }}
                              onDragEnd={() => {
                                setDraggedEventIndex(null);
                                setDragOverDateStr(null);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectEventForEdit(item, originalIndex);
                              }}
                              className={`p-1.5 sm:p-2 rounded-lg border text-left transition select-none ${
                                isBeingEdited
                                  ? 'bg-trough-yellow text-black border-trough-yellow shadow-sm'
                                  : isFixedHire
                                  ? 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40 text-white'
                                  : item.type === 'owned'
                                  ? 'bg-trough-yellow/15 hover:bg-trough-yellow/25 border-trough-yellow/40 text-white'
                                  : 'bg-[#262626] hover:bg-[#2E2E2E] border-neutral-600 text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                                <span
                                  className={`font-bold uppercase truncate ${
                                    isBeingEdited
                                      ? 'text-black'
                                      : isFixedHire
                                      ? 'text-sky-300'
                                      : item.type === 'owned'
                                      ? 'text-trough-yellow'
                                      : 'text-neutral-300'
                                  }`}
                                >
                                  {isFixedHire
                                    ? 'Fixed Hire'
                                    : item.type === 'owned'
                                    ? 'Owned'
                                    : 'Promoter'}
                                </span>
                                <span
                                  className={`tabular-nums ${
                                    isBeingEdited ? 'text-black/80 font-bold' : 'text-neutral-400'
                                  }`}
                                >
                                  {isFixedHire ? 'Flat' : `${item.pax}p`}
                                </span>
                              </div>

                              <div
                                className={`text-[11px] sm:text-xs font-bold leading-tight line-clamp-2 mt-0.5 ${
                                  isBeingEdited ? 'text-black' : 'text-white'
                                }`}
                                title={item.title}
                              >
                                {item.title}
                              </div>

                              <div className="mt-1 pt-1 border-t border-current/10 flex items-center justify-between gap-1 text-[10px] font-mono tabular-nums">
                                <span
                                  className={
                                    isBeingEdited ? 'text-black/80' : 'text-neutral-400'
                                  }
                                  title="Venue Gross Turnover"
                                >
                                  G: ${(evGross / 1000).toFixed(1)}k
                                </span>
                                <span
                                  className={`font-bold ${
                                    isBeingEdited
                                      ? 'text-black'
                                      : item.surplus >= 0
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                  }`}
                                  title="Projected Net Operating Surplus"
                                >
                                  {item.surplus >= 0
                                    ? `+$${item.surplus.toLocaleString()}`
                                    : `-$${Math.abs(item.surplus).toLocaleString()}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Subtle Prime Slot Hint when unbooked */}
                        {isOpenPrimeSlot && (
                          <div className="text-center py-2 px-1 rounded-lg border border-dashed border-neutral-800 group-hover:border-trough-yellow/40 transition">
                            <span className="text-[10px] font-mono text-neutral-500 group-hover:text-trough-yellow block">
                              Open {cell.dayOfWeekIndex === 4 ? 'Friday' : 'Saturday'}
                            </span>
                            <span className="text-[9px] text-neutral-600 group-hover:text-neutral-300 hidden sm:block">
                              Click to program
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Date Label on Hover */}
                      <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500">
                        <span>{cell.dateStr.slice(0, 5)}</span>
                        {isSelectedDate && cellEvents.length === 0 && (
                          <span className="text-trough-yellow font-bold">Editing Draft</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend & Prime Slot Quick Programmer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-4 flex-wrap text-[11px] text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-trough-yellow/25 border border-trough-yellow"></span>
                  <span>Trough-Owned Party (100% Door + Bar)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#262626] border border-neutral-500"></span>
                  <span>Promoter Hosted (Ticket Clip + Bar)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-sky-500/25 border border-sky-400"></span>
                  <span>Fixed Venue Hire (Flat Rate)</span>
                </span>
              </div>

              {openPrimeDatesInMonth.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Quick-Program Open Fri/Sat:
                  </span>
                  {openPrimeDatesInMonth.slice(0, 4).map((slot) => (
                    <button
                      key={slot.dateStr}
                      type="button"
                      onClick={() => onStartNewEventOnDate(slot.dateStr)}
                      className="px-2 py-1 rounded bg-[#191919] hover:bg-trough-yellow hover:text-black text-trough-yellow border border-trough-yellow/30 text-[11px] font-mono transition cursor-pointer"
                    >
                      {slot.dayOfWeekIndex === 4 ? 'Fri' : 'Sat'} {slot.dateStr.slice(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CHRONOLOGICAL MONTH SCHEDULE STRIP (BELOW CALENDAR ON LEFT 3/4) */}
          <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {MONTH_NAMES[viewMonth]} {viewYear} Programmed Run-Sheet (
                  {currentMonthEvents.length} Events)
                </h3>
                <p className="text-xs text-trough-muted">
                  Click any row to load into the right-hand Budget Simulator &amp; Event Editor
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartNewEventOnDate(
                    openPrimeDatesInMonth[0]?.dateStr ||
                      formatDMY(15, viewMonth, viewYear)
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Add {SHORT_MONTH_NAMES[viewMonth]} Event</span>
              </button>
            </div>

            {currentMonthEvents.length === 0 ? (
              <div className="p-6 text-center bg-[#191919] rounded-xl border border-neutral-800 space-y-2">
                <p className="text-xs text-neutral-300">
                  No events programmed for {MONTH_NAMES[viewMonth]} {viewYear} yet.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onStartNewEventOnDate(
                      openPrimeDatesInMonth[0]?.dateStr ||
                        formatDMY(14, viewMonth, viewYear)
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-trough-yellow text-black font-bold text-xs cursor-pointer"
                >
                  Program First Event in {MONTH_NAMES[viewMonth]}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#191919] text-neutral-400 uppercase text-[10px] font-mono border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Event Title</th>
                      <th className="py-2.5 px-3">Model / Format</th>
                      <th className="py-2.5 px-3 text-right">Target Pax</th>
                      <th className="py-2.5 px-3 text-right">Venue Gross</th>
                      <th className="py-2.5 px-3 text-right">IFA Wages</th>
                      <th className="py-2.5 px-3 text-right text-trough-yellow">
                        Net Surplus
                      </th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {currentMonthEvents.map(({ item, originalIndex, isFixedHire }) => {
                      const isEditing = editingEventIndex === originalIndex;
                      const gross =
                        item.barGross + item.clip + item.ticketRev + item.deposit;
                      return (
                        <tr
                          key={`${item.date}-${item.title}-${originalIndex}`}
                          onClick={() => onSelectEventForEdit(item, originalIndex)}
                          className={`transition cursor-pointer ${
                            isEditing
                              ? 'bg-trough-yellow/15'
                              : 'hover:bg-neutral-800/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-semibold text-white whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {item.title}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-300">
                            {isFixedHire ? 'Fixed Venue Hire' : item.format}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-200">
                            {isFixedHire ? 'Flat' : `${item.pax} Pax`}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-200">
                            ${gross.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-300">
                            (${item.wages.toLocaleString()})
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-trough-yellow">
                            +${item.surplus.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectEventForEdit(item, originalIndex);
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                isEditing
                                  ? 'bg-trough-yellow text-black'
                                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                              }`}
                            >
                              {isEditing ? 'Editing' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEvent(originalIndex);
                              }}
                              className="px-2 py-1 rounded bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 text-[10px] cursor-pointer"
                              title="Delete Event"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT 1/4 COLUMN (3 COLS): BUDGET SIMULATOR & EVENT ENTRY ==================== */}
        <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
          <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 space-y-4 shadow-sm">
            {/* Simulator / Event Entry Header */}
            <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      editingEventIndex !== null
                        ? 'bg-trough-yellow text-black'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {editingEventIndex !== null
                      ? `Editing Event #${editingEventIndex + 1}`
                      : 'New Event Entry'}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    {simEventDate}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">
                  Budget Simulator &amp; Event Entry
                </h3>
              </div>

              {editingEventIndex !== null && (
                <button
                  type="button"
                  onClick={() => onStartNewEventOnDate(simEventDate)}
                  className="px-2 py-1 rounded-lg bg-[#191919] hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px] font-mono cursor-pointer whitespace-nowrap"
                  title="Switch to creating a new event"
                >
                  + New
                </button>
              )}
            </div>

            {/* Save Confirmation Banner */}
            {simSaveNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-emerald-400 shrink-0"></i>
                <span className="leading-snug">{simSaveNotice}</span>
              </div>
            )}

            {/* 1. Event Identity Fields */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                  Event Date (DD/MM/YYYY)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={simEventDate}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      setSimEventDate(nextDate);
                      const parsed = parseEventDateDMY(nextDate);
                      if (parsed) {
                        setViewMonth(parsed.month);
                        setViewYear(parsed.year);
                      }
                    }}
                    placeholder="14/11/2026"
                    className="w-full h-9 bg-[#191919] border border-neutral-700 rounded-lg px-3 text-xs text-white font-mono focus:border-trough-yellow focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                  Event Title &amp; Promoter
                </label>
                <input
                  type="text"
                  value={simEventTitle}
                  onChange={(e) => setSimEventTitle(e.target.value)}
                  placeholder="e.g. ACTION by Thick N Juicy"
                  className="w-full h-9 bg-[#191919] border border-neutral-700 rounded-lg px-3 text-xs text-white focus:border-trough-yellow focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                  Format Label
                </label>
                <input
                  type="text"
                  value={simEventFormat}
                  onChange={(e) => setSimEventFormat(e.target.value)}
                  placeholder="Owned Hero Night"
                  className="w-full h-9 bg-[#191919] border border-neutral-700 rounded-lg px-3 text-xs text-white focus:border-trough-yellow focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Operating & Revenue Mode Switch */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <label className="block text-[11px] font-semibold text-trough-muted uppercase tracking-wider">
                Revenue &amp; Deal Model
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[#191919] p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setSimMode('owned');
                    if (
                      simEventFormat === 'Promoter Hosted' ||
                      simEventFormat === 'Fixed Venue Hire'
                    ) {
                      setSimEventFormat('Owned Hero Night');
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    simMode === 'owned'
                      ? 'bg-trough-yellow text-black font-bold'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  Owned
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimMode('promoter');
                    if (
                      simEventFormat === 'Owned Hero Night' ||
                      simEventFormat === 'Fixed Venue Hire'
                    ) {
                      setSimEventFormat('Promoter Hosted');
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    simMode === 'promoter'
                      ? 'bg-trough-yellow text-black font-bold'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  Promoter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimMode('fixed_hire');
                    if (
                      simEventFormat === 'Owned Hero Night' ||
                      simEventFormat === 'Promoter Hosted'
                    ) {
                      setSimEventFormat('Fixed Venue Hire');
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    simMode === 'fixed_hire'
                      ? 'bg-trough-yellow text-black font-bold'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  Fixed Hire
                </button>
              </div>
            </div>

            {/* 3. Dynamic Budget Parameters */}
            <div className="space-y-3 pt-1">
              {simMode === 'fixed_hire' ? (
                <div className="p-3 rounded-xl bg-[#191919] border border-trough-yellow/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-trough-yellow">
                      Flat Venue Hire Fee
                    </label>
                    <div className="h-8 inline-flex items-center bg-[#222222] border border-trough-yellow/50 rounded-lg px-2">
                      <span className="text-trough-yellow font-mono text-xs font-bold mr-1">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={simFixedHireFee}
                        onChange={(e) =>
                          updateFixedHireFee(parseFloat(e.target.value) || 0)
                        }
                        className="w-20 bg-transparent text-right font-mono font-bold text-white text-xs focus:outline-none tabular-nums"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="25000"
                    step="250"
                    value={Math.min(25000, Math.max(500, simFixedHireFee))}
                    onChange={(e) => updateFixedHireFee(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block"
                  />
                  <div className="flex flex-wrap gap-1 font-mono">
                    {[2500, 3500, 5000, 7500, 10000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateFixedHireFee(preset)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                          simFixedHireFee === preset
                            ? 'bg-trough-yellow text-black border-trough-yellow'
                            : 'bg-[#222222] text-neutral-300 border-neutral-700 hover:text-white'
                        }`}
                      >
                        ${preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    Flat contracted hire fee only. Does not scale with attendance or include bar or
                    door splits.
                  </p>
                </div>
              ) : (
                <>
                  {/* Attendance Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300 font-medium">
                        Attendance (Pax)
                      </span>
                      <span className="font-mono font-bold text-trough-yellow tabular-nums">
                        {simPax} Pax
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={simPax}
                      onChange={(e) => setSimPax(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block"
                    />
                  </div>

                  {/* Ticket Price (Owned) OR Ticket Clip (Promoter) */}
                  {simMode === 'owned' ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-300 font-medium">
                          Avg Door Ticket Price
                        </span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          ${simTicketPrice.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="60"
                        step="1"
                        value={simTicketPrice}
                        onChange={(e) => setSimTicketPrice(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-trough-yellow font-semibold">
                          Venue Ticket Clip / Head
                        </span>
                        <div className="flex items-center bg-[#191919] border border-trough-yellow/50 rounded px-2 py-0.5">
                          <span className="text-trough-yellow font-mono text-xs mr-1">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            step="0.5"
                            value={simTicketClip}
                            onChange={(e) =>
                              setSimTicketClip(
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="w-12 bg-transparent text-right font-mono font-bold text-white text-xs focus:outline-none tabular-nums"
                          />
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.5"
                        value={Math.min(20, simTicketClip)}
                        onChange={(e) => setSimTicketClip(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block"
                      />
                    </div>
                  )}

                  {/* Bar Spend / Head */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300 font-medium">
                        Bar Spend / Head
                      </span>
                      <span className="font-mono font-bold text-white tabular-nums">
                        ${simBarSpend.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="45"
                      step="0.5"
                      value={simBarSpend}
                      onChange={(e) => setSimBarSpend(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block"
                    />
                  </div>

                  {/* Cloak & COGS compact row */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-[#191919] border border-neutral-800 rounded-lg p-2">
                      <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>Cloak %</span>
                        <span className="font-mono text-white font-bold">
                          {simCloakRate}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={simCloakRate}
                        onChange={(e) => setSimCloakRate(parseInt(e.target.value, 10))}
                        className="w-full h-1 bg-neutral-800 rounded-lg cursor-pointer mt-1 block"
                      />
                    </div>

                    <div className="bg-[#191919] border border-neutral-800 rounded-lg p-2">
                      <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>Bev COGS</span>
                        <span className="font-mono text-white font-bold">
                          {simCogsRate.toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="35"
                        step="0.5"
                        value={simCogsRate}
                        onChange={(e) => setSimCogsRate(parseFloat(e.target.value))}
                        className="w-full h-1 bg-neutral-800 rounded-lg cursor-pointer mt-1 block"
                      />
                    </div>
                  </div>

                  {/* Promoter Deposit OR Owned Direct Overheads Drawer */}
                  {simMode === 'promoter' ? (
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#191919] border border-neutral-800 cursor-pointer text-xs">
                      <span className="text-neutral-200 font-medium">
                        Include $550 Venue Deposit
                      </span>
                      <input
                        type="checkbox"
                        checked={simPromoterDeposit}
                        onChange={(e) => setSimPromoterDeposit(e.target.checked)}
                        className="accent-trough-yellow w-4 h-4 rounded cursor-pointer"
                      />
                    </label>
                  ) : (
                    <div className="bg-[#191919] border border-neutral-800 rounded-xl p-2.5 space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowOverheadsDrawer((v) => !v)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-neutral-200 cursor-pointer"
                      >
                        <span>
                          Direct Overheads ($
                          {Math.round(simMetrics.fixedDirectOverheads).toLocaleString()})
                        </span>
                        <i
                          className={`fa-solid fa-chevron-${
                            showOverheadsDrawer ? 'up' : 'down'
                          } text-[10px] text-trough-yellow`}
                        ></i>
                      </button>

                      {showOverheadsDrawer && (
                        <div className="space-y-2 pt-2 border-t border-neutral-800 text-[11px]">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-neutral-400 block mb-0.5">
                                DJs / Talent ($)
                              </label>
                              <input
                                type="number"
                                value={ownedOverheads.talentCost}
                                onChange={(e) =>
                                  updateOwnedOverhead(
                                    'talentCost',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white"
                              />
                            </div>
                            <div>
                              <label className="text-neutral-400 block mb-0.5">
                                Production ($)
                              </label>
                              <input
                                type="number"
                                value={ownedOverheads.productionCost}
                                onChange={(e) =>
                                  updateOwnedOverhead(
                                    'productionCost',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white"
                              />
                            </div>
                            <div>
                              <label className="text-neutral-400 block mb-0.5">
                                Marketing ($)
                              </label>
                              <input
                                type="number"
                                value={ownedOverheads.marketingCost}
                                onChange={(e) =>
                                  updateOwnedOverhead(
                                    'marketingCost',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white"
                              />
                            </div>
                            <div>
                              <label className="text-neutral-400 block mb-0.5">
                                Other ($)
                              </label>
                              <input
                                type="number"
                                value={ownedOverheads.otherCost}
                                onChange={(e) =>
                                  updateOwnedOverhead(
                                    'otherCost',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={resetOwnedOverheads}
                            className="text-[10px] text-trough-yellow hover:underline cursor-pointer"
                          >
                            Reset Default Overheads ($1,750)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 4. Live Pro-Forma Breakdown Card */}
            <div className="bg-[#191919] border border-neutral-800 rounded-xl p-3 space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between items-center text-white font-bold border-b border-neutral-800 pb-1.5">
                <span className="font-sans text-[11px] uppercase tracking-wider text-neutral-300">
                  1. Gross Venue Revenue
                </span>
                <span>${formatMoney(simMetrics.grossTurnover)}</span>
              </div>

              {simMode === 'fixed_hire' ? (
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Flat Venue Hire Fee:</span>
                  <span>${formatMoney(simMetrics.fixedHireRevenue)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>
                      {simMode === 'owned' ? 'Door Tickets:' : 'Venue Ticket Clip:'}
                    </span>
                    <span>${formatMoney(simMetrics.ticketRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Bar Gross + Cloak:</span>
                    <span>
                      ${formatMoney(simMetrics.barRevenue + simMetrics.cloakRevenue)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-[11px] text-rose-300 pt-1 border-t border-neutral-800/70">
                <span>2. COGS &amp; Overheads:</span>
                <span>
                  ($
                  {formatMoney(
                    simMetrics.beverageCogs +
                      simMetrics.consumables +
                      simMetrics.totalOverheads
                  )}
                  )
                </span>
              </div>

              <div className="flex justify-between text-[11px] text-rose-300">
                <span>
                  3. IFA Wages ({simMetrics.staffCount} Staff):
                </span>
                <span>(${formatMoney(simMetrics.baseRosterWages)})</span>
              </div>

              <div className="pt-2 border-t border-neutral-700 flex items-baseline justify-between">
                <div>
                  <span className="font-sans text-[11px] font-bold text-white block">
                    Net Operating Surplus
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Margin: {simMetrics.marginRatio.toFixed(1)}% · Labour:{' '}
                    {simMetrics.wageRatio.toFixed(1)}%
                  </span>
                </div>
                <span
                  className={`text-lg font-extrabold ${
                    simMetrics.netSurplus >= 0 ? 'text-trough-yellow' : 'text-rose-400'
                  }`}
                >
                  {simMetrics.netSurplus >= 0
                    ? `+$${Math.round(simMetrics.netSurplus).toLocaleString()}`
                    : `-$${Math.round(Math.abs(simMetrics.netSurplus)).toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* 5. Action Buttons: Save / Update / Add / Delete */}
            <div className="space-y-2 pt-1">
              {editingEventIndex !== null ? (
                <>
                  <button
                    type="button"
                    onClick={onSaveToExistingEvent}
                    className="w-full py-2.5 px-4 rounded-xl bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Update Event on Calendar</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onSaveAsNewEvent}
                      className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-copy"></i>
                      <span>Save as Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEvent(editingEventIndex)}
                      className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                      <span>Delete Event</span>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onSaveAsNewEvent}
                  className="w-full py-2.5 px-4 rounded-xl bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-calendar-plus"></i>
                  <span>Add Event to {simEventDate}</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
