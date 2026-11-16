<script>
(function () {
  'use strict';

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const SHORT_MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const DEFAULT_OWNED_OVERHEADS = {
    talentCost: 900,
    productionCost: 450,
    marketingCost: 400,
    otherCost: 0,
    merchantFeePct: 1.5
  };

  const LOCAL_FALLBACK_KEY = 'troughx_php_offline_cache_v1';

  const initial = window.__INITIAL_TROUGHX_STATE__ || {};
  const clone = (v) => JSON.parse(JSON.stringify(v));

  const BASELINE_EVENTS = clone(initial.events || []);
  const BASELINE_ROSTER = clone(initial.roster || []);
  const BASELINE_INVENTORY = clone(initial.inventory || []);

  const state = {
    dbConnected: Boolean(initial.connected),
    activeTab: 'programming',
    events: clone(initial.events || []),
    roster: clone(initial.roster || []),
    templates: clone(initial.templates || []),
    inventory: clone(initial.inventory || []),
    purchases: clone(initial.purchases || []),
    ownedOverheads: Object.assign({}, DEFAULT_OWNED_OVERHEADS, initial.settings?.ownedOverheads || {}),
    wagesIncludeSuper: initial.settings?.wagesIncludeSuper !== undefined ? Boolean(initial.settings.wagesIncludeSuper) : true,
    simFixedHireFee: Number(initial.settings?.fixedHireFee ?? 5000),
    simCogsRate: Number(initial.settings?.simCogsRate ?? 22.0),
    inventoryOpeningValue: Number(initial.settings?.openingStockValue ?? 3850),
    inventoryPeriodSales: Number(initial.settings?.periodBarSales ?? 10000),

    // Simulator & Programming Calendar state
    editingEventIndex: null,
    simEventDate: '20/03/2027',
    simEventTitle: 'Trough X Custom Night',
    simEventFormat: 'Owned Hero Night',
    simMode: 'owned', // 'owned' | 'promoter' | 'fixed_hire'
    simPax: 200,
    simTicketPrice: 30,
    simTicketClip: 5.0,
    simBarSpend: 22.5,
    simCloakRate: 50,
    simPromoterDeposit: true,
    simSaveNotice: null,

    // Programming Calendar View State
    viewMonth: 10, // Nov 2026
    viewYear: 2026,
    calendarFilter: 'all', // 'all' | 'owned' | 'promoter' | 'fixed_hire'
    highlightPrimeSlots: true,
    showOverheadsDrawer: false,
    draggedEventIndex: null,
    dragOverDateStr: null,

    // Wages State
    wagesSavedNotice: null,

    // Promoter Deal Tester State
    dealMode: 'clip_bar', // 'clip_bar' | 'fixed_hire'
    dealPax: 220,
    dealClip: 5.0,
    dealSpend: 24.0,

    // Inventory View State
    invSearchQuery: '',
    invCategoryFilter: 'bar',
    invOnlyNegativeOrRecipe: false,
    invStatusNotice: null,

    // Events Table View State
    eventFilter: 'all',
    eventSearchQuery: '',
    eventsSavedNotice: null,
    inlineEditIndex: null,
    inlineEditDraft: null
  };

  // Initialize viewMonth/Year from first scheduled event
  for (let i = 0; i < state.events.length; i++) {
    const parsed = parseEventDateDMY(state.events[i].date);
    if (parsed) {
      state.viewMonth = parsed.month;
      state.viewYear = parsed.year;
      break;
    }
  }

  // If DB is offline, restore offline cache if present
  if (!state.dbConnected) {
    try {
      const cached = localStorage.getItem(LOCAL_FALLBACK_KEY);
      if (cached) {
        const p = JSON.parse(cached);
        if (Array.isArray(p.events) && p.events.length) state.events = p.events;
        if (Array.isArray(p.roster) && p.roster.length) state.roster = p.roster;
        if (Array.isArray(p.templates) && p.templates.length) state.templates = p.templates;
        if (Array.isArray(p.inventory) && p.inventory.length) state.inventory = p.inventory;
        if (Array.isArray(p.purchases)) state.purchases = p.purchases;
        if (p.ownedOverheads) state.ownedOverheads = Object.assign({}, DEFAULT_OWNED_OVERHEADS, p.ownedOverheads);
        if (typeof p.wagesIncludeSuper === 'boolean') state.wagesIncludeSuper = p.wagesIncludeSuper;
        if (typeof p.simFixedHireFee === 'number') state.simFixedHireFee = p.simFixedHireFee;
        if (typeof p.simCogsRate === 'number') state.simCogsRate = p.simCogsRate;
        if (typeof p.inventoryOpeningValue === 'number') state.inventoryOpeningValue = p.inventoryOpeningValue;
        if (typeof p.inventoryPeriodSales === 'number') state.inventoryPeriodSales = p.inventoryPeriodSales;
      }
    } catch (_) {}
  }

  // ===================== HELPERS =====================
  function saveOfflineCache() {
    try {
      localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify({
        events: state.events,
        roster: state.roster,
        templates: state.templates,
        inventory: state.inventory,
        purchases: state.purchases,
        ownedOverheads: state.ownedOverheads,
        wagesIncludeSuper: state.wagesIncludeSuper,
        simFixedHireFee: state.simFixedHireFee,
        simCogsRate: state.simCogsRate,
        inventoryOpeningValue: state.inventoryOpeningValue,
        inventoryPeriodSales: state.inventoryPeriodSales
      }));
    } catch (_) {}
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function formatMoney(val) {
    const n = Number(val) || 0;
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatInt(val) {
    return Math.round(Number(val) || 0).toLocaleString('en-US');
  }

  function parseEventDateDMY(dateStr) {
    if (!dateStr) return null;
    const parts = String(dateStr).trim().split(/[/-]/);
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year) || month < 0 || month > 11 || day < 1 || day > 31) {
      return null;
    }
    return { day, month, year };
  }

  function formatDMY(day, monthZeroIndexed, year) {
    return String(day).padStart(2, '0') + '/' + String(monthZeroIndexed + 1).padStart(2, '0') + '/' + year;
  }

  function isFixedHireEventObj(ev) {
    return (
      String(ev.format || '').toLowerCase().includes('fixed') ||
      (Number(ev.barGross) === 0 && Number(ev.clip) + Number(ev.ticketRev) + Number(ev.deposit) > 0)
    );
  }

  function setDbStatus(connected, msg) {
    state.dbConnected = connected;
    const badge = document.getElementById('db-status-badge');
    const calPill = document.getElementById('cal-db-pill');
    const progPill = document.getElementById('prog-sync-pill');
    if (badge) {
      badge.className = 'px-3 py-1.5 rounded-lg text-xs font-mono border flex items-center gap-1.5 ' +
        (connected
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-amber-500/15 text-amber-300 border-amber-500/30');
      badge.innerHTML = '<i class="fa-solid fa-database"></i><span>' +
        escapeHtml(msg || (connected ? 'MySQL Live' : 'Offline Fallback (Local)')) + '</span>';
    }
    if (calPill) {
      calPill.className = 'text-[11px] px-2 py-0.5 rounded-full font-mono border ' +
        (connected
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : 'bg-amber-500/15 text-amber-300 border-amber-500/30');
      calPill.textContent = connected ? 'Live MySQL Backend' : 'Local Cache Mode (Check MySQL)';
    }
    if (progPill) {
      progPill.className = 'text-[11px] font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ' +
        (connected
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-amber-500/15 text-amber-300 border-amber-500/30');
      progPill.innerHTML = '<i class="fa-solid fa-database"></i><span>' +
        (connected ? 'MySQL Auto-Sync Active' : 'Local Cache Fallback') + '</span>';
    }
  }

  async function apiRequest(url, method, body) {
    saveOfflineCache();
    try {
      const opts = {
        method: method || 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      };
      if (body !== undefined && method !== 'GET') {
        opts.body = JSON.stringify(body);
      }
      const res = await fetch(url, opts);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status >= 500) setDbStatus(false, 'Offline Fallback (DB Unavailable)');
        throw new Error((data && data.error) ? data.error : 'HTTP ' + res.status);
      }
      setDbStatus(true, 'MySQL Live');
      return data;
    } catch (err) {
      setDbStatus(false, 'Offline Fallback (Local)');
      return null;
    }
  }

  const debounceTimers = {};
  function debounced(key, fn, waitMs) {
    clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(fn, waitMs || 350);
  }

  function nowTimeLabel() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function elVal(id, value) {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) {
      el.value = value;
    }
  }

  function elText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ===================== CALCULATIONS =====================
  function computeRosterSummary() {
    let totalHeadcount = 0;
    let totalHours = 0;
    let grossWages = 0;
    let grandTotal = 0;
    const itemsWithTotals = state.roster.map((item) => {
      const hc = Number(item.headcount) || 0;
      const hrs = Number(item.hours) || 0;
      const rate = Number(item.rate) || 0;
      const itemHours = hc * hrs;
      const baseCost = itemHours * rate;
      const superCost = state.wagesIncludeSuper && item.hasSuper ? baseCost * 0.115 : 0;
      const itemTotal = baseCost + superCost;
      totalHeadcount += hc;
      totalHours += itemHours;
      grossWages += baseCost;
      grandTotal += itemTotal;
      return Object.assign({}, item, { itemTotal });
    });
    return { itemsWithTotals, totalHeadcount, totalHours, grossWages, grandTotal };
  }

  function computeSimMetrics() {
    const isFixedHire = state.simMode === 'fixed_hire';
    const cloakFraction = state.simCloakRate / 100;
    const cogsFraction = state.simCogsRate / 100;

    let fixedHireRevenue = 0;
    let ticketRevenue = 0;
    let depositRevenue = 0;
    let barRevenue = 0;
    let cloakRevenue = 0;

    if (isFixedHire) {
      fixedHireRevenue = state.simFixedHireFee;
    } else if (state.simMode === 'owned') {
      ticketRevenue = state.simPax * state.simTicketPrice;
      barRevenue = state.simPax * state.simBarSpend;
      cloakRevenue = Math.round(state.simPax * cloakFraction) * 5.0;
    } else {
      ticketRevenue = state.simPax * state.simTicketClip;
      depositRevenue = state.simPromoterDeposit ? 550.0 : 0.0;
      barRevenue = state.simPax * state.simBarSpend;
      cloakRevenue = Math.round(state.simPax * cloakFraction) * 5.0;
    }

    const grossTurnover = isFixedHire
      ? fixedHireRevenue
      : ticketRevenue + barRevenue + cloakRevenue + depositRevenue;

    const beverageCogs = isFixedHire ? 0 : barRevenue * cogsFraction;
    const consumables = isFixedHire ? 0 : (state.simPax > 220 ? 200.0 : state.simPax > 150 ? 150.0 : 100.0);
    const grossMargin = grossTurnover - beverageCogs - consumables;

    let baseRosterWages = 0;
    let staffCount = 0;
    let guards = 0;
    let bartenders = 0;

    state.roster.forEach((item) => {
      let count = Number(item.headcount) || 0;
      const role = String(item.role || '');
      if (role.includes('Crowd Control') || role.includes('Security')) {
        if (!isFixedHire && state.simPax > 240) count += 1;
        guards += count;
      } else if (role.includes('Bartender')) {
        if (!isFixedHire && state.simPax > 220) count += 1;
        bartenders += count;
      }
      staffCount += count;
      baseRosterWages += count * (Number(item.hours) || 0) * (Number(item.rate) || 0);
    });

    const feeRate = isFixedHire ? 0 : (state.simMode === 'owned' ? state.ownedOverheads.merchantFeePct / 100 : 0.015);
    const talentCost = state.simMode === 'owned' ? state.ownedOverheads.talentCost : 0;
    const productionCost = isFixedHire ? 0 : (state.simMode === 'owned' ? state.ownedOverheads.productionCost : 150);
    const marketingCost = state.simMode === 'owned' ? state.ownedOverheads.marketingCost : 0;
    const otherCost = state.simMode === 'owned' ? state.ownedOverheads.otherCost : 0;
    const terminalFees = isFixedHire ? 0 : grossTurnover * feeRate;
    const fixedDirectOverheads = talentCost + productionCost + marketingCost + otherCost;
    const totalOverheads = fixedDirectOverheads + terminalFees;

    const netSurplus = grossMargin - baseRosterWages - totalOverheads;
    const wageRatio = grossTurnover > 0 ? (baseRosterWages / grossTurnover) * 100 : 0;
    const marginRatio = grossTurnover > 0 ? (netSurplus / grossTurnover) * 100 : 0;

    return {
      fixedHireRevenue, ticketRevenue, depositRevenue, barRevenue, cloakRevenue,
      grossTurnover, beverageCogs, consumables, grossMargin,
      guards, bartenders, staffCount, baseRosterWages,
      talentCost, productionCost, marketingCost, otherCost, terminalFees,
      fixedDirectOverheads, totalOverheads, netSurplus, wageRatio, marginRatio
    };
  }

  function computeDealMetrics(rosterSummary) {
    const isFixedHire = state.dealMode === 'fixed_hire';
    const pax = state.dealPax || 0;
    const clip = state.dealClip >= 0 ? state.dealClip : 0;
    const spend = state.dealSpend || 0;

    const fixedHireTotal = isFixedHire ? state.simFixedHireFee : 0;
    const clipTotal = isFixedHire ? 0 : pax * clip;
    const barTotal = isFixedHire ? 0 : pax * spend;
    const cloakTotal = isFixedHire ? 0 : pax * 0.5 * 5.0;
    const grossTurnover = isFixedHire ? fixedHireTotal : clipTotal + barTotal + cloakTotal;

    const cogs = isFixedHire ? 0 : barTotal * 0.22 + 150.0;
    const wages = rosterSummary.grossWages;
    const overheads = isFixedHire ? 0 : grossTurnover * 0.015 + 150.0;
    const netSurplus = grossTurnover - cogs - wages - overheads;

    const barNetPerHead = spend * (1 - 0.22);
    const cloakPerHead = 2.5;
    const netMarginPerHead = clip + barNetPerHead + cloakPerHead;
    const fixedOverhead = wages + 300.0;
    const breakevenNoDeposit = netMarginPerHead > 0 ? Math.ceil(fixedOverhead / netMarginPerHead) : 300;
    const breakevenWithDeposit = netMarginPerHead > 0 ? Math.ceil(Math.max(0, fixedOverhead - 550.0) / netMarginPerHead) : 300;

    return {
      isFixedHire, fixedHireTotal, clip, clipTotal, barTotal, cloakTotal,
      grossTurnover, cogs, wages, fixedOverhead, overheads, netSurplus,
      barNetPerHead, netMarginPerHead, breakevenNoDeposit, breakevenWithDeposit
    };
  }

  function computePerformanceMatrix(rosterSummary) {
    const baseWages = rosterSummary.grossWages;
    let peakWages = 0;
    state.roster.forEach((item) => {
      let count = Number(item.headcount) || 0;
      const role = String(item.role || '');
      if (role.includes('Crowd Control') || role.includes('Security')) count += 1;
      else if (role.includes('Bartender')) count += 1;
      peakWages += count * (Number(item.hours) || 0) * (Number(item.rate) || 0);
    });

    const ownedFixedOverheads =
      state.ownedOverheads.talentCost +
      state.ownedOverheads.productionCost +
      state.ownedOverheads.marketingCost +
      state.ownedOverheads.otherCost;
    const feeRate = state.ownedOverheads.merchantFeePct / 100;

    const actuals = {
      id: 'actuals',
      name: 'Actuals (11 Sept Historical)',
      dotClass: 'bg-neutral-400',
      paxLabel: '150 Pax',
      gross: 4881.0, totalCogs: 857.0, wages: 1290.0, overheads: 90.0,
      labourPct: (1290.0 / 4881.0) * 100, surplus: 2644.0
    };

    const consGross = 6060.0, consCogs = 528.0 + 100.0;
    const consOverheads = ownedFixedOverheads + consGross * feeRate;
    const conservativeOwned = {
      id: 'conservative-owned',
      name: 'Conservative Owned Party',
      dotClass: 'bg-blue-400',
      paxLabel: '120 Pax',
      gross: consGross, totalCogs: consCogs, wages: baseWages, overheads: consOverheads,
      labourPct: (baseWages / consGross) * 100,
      surplus: consGross - consCogs - baseWages - consOverheads
    };

    const targetGross = 11000.0, targetCogs = 990.0 + 150.0;
    const targetOverheads = ownedFixedOverheads + targetGross * feeRate;
    const targetSurplus = targetGross - targetCogs - baseWages - targetOverheads;
    const targetOwned = {
      id: 'target-owned',
      name: 'Target Owned Party (Baseline)',
      dotClass: 'bg-trough-yellow',
      paxLabel: '200 Pax',
      gross: targetGross, totalCogs: targetCogs, wages: baseWages, overheads: targetOverheads,
      labourPct: (baseWages / targetGross) * 100,
      surplus: targetSurplus,
      marginPct: (targetSurplus / targetGross) * 100
    };

    const peakGross = 18440.0, peakCogs = 1725.0 + 200.0;
    const peakOverheads = ownedFixedOverheads + peakGross * feeRate;
    const peakOwned = {
      id: 'peak-owned',
      name: 'Peak Sell-Out Owned Party',
      dotClass: 'bg-purple-400',
      paxLabel: '280 Pax',
      gross: peakGross, totalCogs: peakCogs, wages: peakWages, overheads: peakOverheads,
      labourPct: (peakWages / peakGross) * 100,
      surplus: peakGross - peakCogs - peakWages - peakOverheads
    };

    const promTargetGross = 6000.0, promTargetCogs = 990.0 + 150.0;
    const promTargetOverheads = 150.0 + promTargetGross * 0.015;
    const promoterTarget = {
      id: 'promoter-target',
      name: 'Promoter Hosted Target ($5 Clip)',
      dotClass: 'bg-emerald-400',
      paxLabel: '200 Pax',
      gross: promTargetGross, totalCogs: promTargetCogs, wages: baseWages, overheads: promTargetOverheads,
      labourPct: (baseWages / promTargetGross) * 100,
      surplus: promTargetGross - promTargetCogs - baseWages - promTargetOverheads
    };

    const promLowGross = 3300.0, promLowCogs = 528.0 + 100.0;
    const promLowOverheads = 150.0 + promLowGross * 0.015;
    const promLowSurplus = promLowGross - promLowCogs - baseWages - promLowOverheads;
    const promoterLow = {
      id: 'promoter-low',
      name: promLowSurplus >= 0 ? 'Promoter Hosted Low Attendance' : 'Promoter Hosted Under-Breakeven',
      dotClass: promLowSurplus >= 0 ? 'bg-amber-400' : 'bg-red-400',
      paxLabel: '120 Pax',
      gross: promLowGross, totalCogs: promLowCogs, wages: baseWages, overheads: promLowOverheads,
      labourPct: (baseWages / promLowGross) * 100,
      surplus: promLowSurplus
    };

    const fixedHireGross = state.simFixedHireFee;
    const fixedHire = {
      id: 'fixed-hire',
      name: 'Fixed Venue Hire ($' + formatInt(state.simFixedHireFee) + ' Flat Fee)',
      dotClass: 'bg-cyan-400',
      paxLabel: 'Flat Rate (No Scale)',
      gross: fixedHireGross, totalCogs: 0, wages: baseWages, overheads: 0,
      labourPct: fixedHireGross > 0 ? (baseWages / fixedHireGross) * 100 : 0,
      surplus: fixedHireGross - baseWages
    };

    const baselineNetMarginPerHead = 5.0 + 22.5 * (1 - 0.22) + 2.5;
    const fixedPromoterCost = baseWages + 300.0;
    const promoterBreakevenNoDeposit = Math.ceil(fixedPromoterCost / baselineNetMarginPerHead);
    const promoterBreakevenWithDeposit = Math.ceil(Math.max(0, fixedPromoterCost - 550.0) / baselineNetMarginPerHead);

    return {
      ownedFixedOverheads, actuals, conservativeOwned, targetOwned, peakOwned,
      promoterTarget, promoterLow, fixedHire,
      rows: [actuals, conservativeOwned, targetOwned, peakOwned, promoterTarget, promoterLow, fixedHire],
      promoterBreakevenNoDeposit, promoterBreakevenWithDeposit
    };
  }

  // ===================== INVENTORY HELPERS =====================
  function isBarBeverageCategory(category) {
    const lower = String(category || '').toLowerCase();
    if (lower.includes('entries') || lower.includes('hardware') || lower.includes('unassigned')) return false;
    return lower.includes('beer') || lower.includes('pre-mix') || lower.includes('spirit') ||
      lower.includes('cocktail') || lower.includes('non-alcohol') || lower.includes('happy hour');
  }

  function estimateDefaultWholesaleCost(name, category, bottleSizeMl, price) {
    const ln = String(name || '').toLowerCase();
    const lc = String(category || '').toLowerCase();
    if (!isBarBeverageCategory(category)) {
      return lc.includes('hardware') ? Number((price * 0.35).toFixed(2)) : 0;
    }
    if (bottleSizeMl && bottleSizeMl >= 45000) return ln.includes('stone') ? 365.0 : 335.0;
    if (lc.includes('beer')) return ln.includes('guin') ? 3.6 : 2.95;
    if (lc.includes('pre-mix')) {
      if (ln.includes('suntory') || ln.includes('smirnoff')) return 3.85;
      if (ln.includes('whiteclaw') || ln.includes('brookvale')) return 3.35;
      return 3.45;
    }
    if (lc.includes('cocktail') && !lc.includes('spirit') && bottleSizeMl === 250) {
      if (ln.includes('long island')) return 4.95;
      if (ln.includes('margarita') || ln.includes('mojito') || ln.includes('cosmo')) return 3.85;
      if (ln.includes('redbull')) return 3.45;
      return 2.75;
    }
    if (lc.includes('spirit') || lc.includes('happy hour')) {
      if (ln.includes('laphoraig') || ln.includes('laphroaig')) return 96.0;
      if (ln.includes('hendrix') || ln.includes('hendrick')) return 78.0;
      if (ln.includes('1800')) return 72.0;
      if (ln.includes('green fairy')) return 82.0;
      if (ln.includes('tanqueray') || ln.includes('cointreau')) return 56.0;
      if (ln.includes('makers') || ln.includes('altos') || ln.includes('mount gay')) return 54.0;
      if (ln.includes('aperol')) return 34.0;
      if (ln.includes('wet bussy')) return 2.1;
      if (bottleSizeMl && bottleSizeMl >= 1100) return 54.0;
      if (bottleSizeMl && bottleSizeMl >= 950) return 48.0;
      return 44.0;
    }
    if (lc.includes('non-alcohol')) {
      if (ln.includes('redbull')) return 1.85;
      if (ln.includes('gatorade')) return 1.95;
      if (ln.includes('water')) return 0.75;
      if (ln.includes('mixer - coke') || ln.includes('soda') || ln.includes('tonic')) return 2.45;
      if (ln.includes('juice')) return 3.8;
      return 1.35;
    }
    return 0;
  }

  function calculateItemMetrics(item) {
    const isPosRecipeOnly =
      item.bottleSizeMl === 250 &&
      item.pourSizeMl === 250 &&
      String(item.category || '').toLowerCase().includes('cocktail');
    const isPackagedCanOrSingle =
      item.bottleSizeMl === null ||
      item.pourSizeMl === null ||
      item.pourSizeMl === 0 ||
      item.bottleSizeMl === item.pourSizeMl;
    const poursPerUnit =
      !isPosRecipeOnly && item.bottleSizeMl && item.pourSizeMl && item.pourSizeMl > 0
        ? item.bottleSizeMl / item.pourSizeMl
        : 1;
    const costPerPour = poursPerUnit > 0 ? item.unitCost / poursPerUnit : item.unitCost;
    const cogsPct = item.price > 0 ? (costPerPour / item.price) * 100 : 0;
    const gpPerPour = item.price - costPerPour;
    const effectiveCount = item.actualCount !== null && item.actualCount !== undefined ? item.actualCount : item.expectedStock;
    const stockValue = isPosRecipeOnly ? 0 : Math.max(0, effectiveCount) * item.unitCost;
    const varianceUnits = item.actualCount !== null && item.actualCount !== undefined ? item.actualCount - item.expectedStock : null;
    const varianceCost = varianceUnits !== null && !isPosRecipeOnly ? varianceUnits * item.unitCost : null;
    return {
      isPosRecipeOnly, isPackagedCanOrSingle, poursPerUnit, costPerPour, cogsPct,
      gpPerPour, effectiveCount, stockValue, varianceUnits, varianceCost
    };
  }

  function computeInventorySummary() {
    const enriched = state.inventory.map((item, idx) => ({ item, idx, metrics: calculateItemMetrics(item) }));
    const barItems = enriched.filter((x) => isBarBeverageCategory(x.item.category));
    const physicalBarItems = barItems.filter((x) => !x.metrics.isPosRecipeOnly);

    let currentOnHandValue = 0;
    let expectedStockValue = 0;
    let totalCountedSkus = 0;
    let totalVarianceCost = 0;
    let negativeSkuCount = 0;
    let weightedCostSum = 0;
    let weightedRetailSum = 0;
    let verifiedCostCount = 0;

    physicalBarItems.forEach(({ item, metrics }) => {
      currentOnHandValue += metrics.stockValue;
      expectedStockValue += Math.max(0, item.expectedStock) * item.unitCost;
      if (item.actualCount !== null && item.actualCount !== undefined) {
        totalCountedSkus++;
        if (metrics.varianceCost !== null) totalVarianceCost += metrics.varianceCost;
      }
      if (item.expectedStock < 0 || item.liveCloverStock < 0) negativeSkuCount++;
      if (item.costVerified) verifiedCostCount++;
      if (item.price > 0 && item.unitCost > 0) {
        const w = Math.max(1, Math.abs(item.liveCloverStock) || 1);
        weightedCostSum += metrics.costPerPour * w;
        weightedRetailSum += item.price * w;
      }
    });

    const pricedPhysical = physicalBarItems.filter(({ item }) => item.price > 0 && item.unitCost > 0);
    const simpleAvgCogsPct = pricedPhysical.length > 0
      ? pricedPhysical.reduce((acc, x) => acc + x.metrics.cogsPct, 0) / pricedPhysical.length
      : 22.0;
    const theoreticalWeightedCogsPct = weightedRetailSum > 0 ? (weightedCostSum / weightedRetailSum) * 100 : simpleAvgCogsPct;

    const totalPurchases = state.purchases.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const consumedCogsDollar = Math.max(0, state.inventoryOpeningValue + totalPurchases - currentOnHandValue);
    const periodRunningCogsPct = state.inventoryPeriodSales > 0 ? (consumedCogsDollar / state.inventoryPeriodSales) * 100 : 0;

    const catDefs = [
      { id: 'beer', label: 'Beer (Kegs & Cans)', match: (c) => c.toLowerCase().includes('beer') },
      { id: 'premix', label: 'Pre-mix RTD Cans', match: (c) => c.toLowerCase().includes('pre-mix') },
      { id: 'spirits', label: 'Spirits (Bottles)', match: (c) => c.toLowerCase().includes('spirit') },
      { id: 'nonalcohol', label: 'Non-alcohol & Mixers', match: (c) => c.toLowerCase().includes('non-alcohol') },
      { id: 'cocktails', label: 'Cocktail Recipes (POS)', match: (c) => c.toLowerCase().includes('cocktail') && !c.toLowerCase().includes('spirit') }
    ];
    const categoryStats = catDefs.map((def) => {
      const matched = barItems.filter(({ item }) => def.match(item.category));
      const priced = matched.filter(({ item, metrics }) => item.price > 0 && metrics.costPerPour > 0);
      const avgCogs = priced.length > 0 ? priced.reduce((acc, x) => acc + x.metrics.cogsPct, 0) / priced.length : 0;
      const stockVal = matched.reduce((acc, x) => acc + x.metrics.stockValue, 0);
      const negCount = matched.filter(({ item }) => item.expectedStock < 0 || item.liveCloverStock < 0).length;
      return Object.assign({}, def, { skuCount: matched.length, avgCogs, stockVal, negCount });
    });

    const negativeCocktailsCount = barItems.filter(
      ({ item, metrics }) => metrics.isPosRecipeOnly && (item.expectedStock < 0 || item.liveCloverStock < 0)
    ).length;

    return {
      enriched,
      barSkuCount: barItems.length,
      physicalBarSkuCount: physicalBarItems.length,
      currentOnHandValue, expectedStockValue, totalCountedSkus, totalVarianceCost,
      negativeSkuCount: negativeSkuCount + negativeCocktailsCount,
      theoreticalWeightedCogsPct, simpleAvgCogsPct, verifiedCostCount,
      totalPurchases, consumedCogsDollar, periodRunningCogsPct, categoryStats
    };
  }

  // ===================== CSV PARSING =====================
  function parseCsvRow(line) {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  }

  function parseCloverCsvText(csvText) {
    const lines = String(csvText || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) return [];
    const existingMap = new Map(state.inventory.map((it) => [it.cloverId, it]));
    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvRow(lines[i]);
      if (cols.length < 4) continue;
      const cloverId = cols[0] || ('ROW-' + i);
      const name = cols[1] || 'Unnamed Item';
      const category = cols[2] || 'Unassigned';
      const price = parseFloat((cols[3] || '0').replace(/[^0-9.\-]/g, '')) || 0;
      const liveCloverStock = parseFloat(cols[4] || '0') || 0;
      const expectedStock = parseFloat(cols[5] || '0') || 0;
      const rawBottle = cols[6] !== undefined && cols[6] !== '' ? parseFloat(cols[6]) : null;
      const rawPour = cols[7] !== undefined && cols[7] !== '' ? parseFloat(cols[7]) : null;
      const recipeDeductions = parseFloat(cols[8] || '0') || 0;
      const rawActual = cols[9] !== undefined && cols[9] !== '' ? parseFloat(cols[9]) : null;
      const bottleSizeMl = rawBottle !== null && !Number.isNaN(rawBottle) ? rawBottle : null;
      const pourSizeMl = rawPour !== null && !Number.isNaN(rawPour) ? rawPour : null;
      const prev = existingMap.get(cloverId);
      const actualCount = rawActual !== null && !Number.isNaN(rawActual) ? rawActual : (prev ? prev.actualCount : null);
      const unitCost = prev ? prev.unitCost : estimateDefaultWholesaleCost(name, category, bottleSizeMl, price);
      parsed.push({
        cloverId, name, category, price, liveCloverStock, expectedStock,
        bottleSizeMl, pourSizeMl, recipeDeductions, actualCount, unitCost,
        costVerified: prev ? prev.costVerified : false
      });
    }
    return parsed;
  }

  // ===================== NAVIGATION & GLOBAL ACTIONS =====================
  function updateQuickModeLabel() {
    const label = document.getElementById('quick-mode-label');
    if (!label) return;
    label.textContent = state.simMode === 'owned'
      ? 'Switch to Promoter ($5 Clip)'
      : (state.simMode === 'promoter' ? 'Switch to Fixed Venue Hire' : 'Switch to Trough-Owned Model');
  }

  window.setActiveTab = function (tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.classList.toggle('hidden', p.id !== 'tab-' + tabId);
    });
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      const isActive = btn.dataset.tab === tabId;
      btn.className = 'nav-tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ' +
        (isActive ? 'text-black bg-trough-yellow font-semibold shadow-sm' : 'text-neutral-300 hover:text-white hover:bg-neutral-800');
    });
    const main = document.getElementById('main-viewport');
    if (main) {
      main.className = 'flex-grow w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ' +
        (tabId === 'programming' ? 'max-w-[1600px]' : 'max-w-7xl');
    }
    renderAll();
  };

  window.toggleSimModeQuick = function () {
    const next = state.simMode === 'owned' ? 'promoter' : (state.simMode === 'promoter' ? 'fixed_hire' : 'owned');
    window.setSimMode(next);
    window.setActiveTab('simulator');
  };

  window.refreshFromMysql = async function () {
    const data = await apiRequest('api/bootstrap.php', 'GET');
    if (!data || !data.connected) {
      state.eventsSavedNotice = 'Could not reach MySQL (api/bootstrap.php); using local data';
      renderEventsTab();
      return;
    }
    state.events = Array.isArray(data.events) ? data.events : state.events;
    state.roster = Array.isArray(data.roster) ? data.roster : state.roster;
    state.templates = Array.isArray(data.templates) ? data.templates : state.templates;
    state.inventory = Array.isArray(data.inventory) ? data.inventory : state.inventory;
    state.purchases = Array.isArray(data.purchases) ? data.purchases : state.purchases;
    if (data.settings) {
      if (data.settings.ownedOverheads) state.ownedOverheads = Object.assign({}, DEFAULT_OWNED_OVERHEADS, data.settings.ownedOverheads);
      if (data.settings.wagesIncludeSuper !== undefined) state.wagesIncludeSuper = Boolean(data.settings.wagesIncludeSuper);
      if (data.settings.fixedHireFee !== undefined) state.simFixedHireFee = Number(data.settings.fixedHireFee);
      if (data.settings.simCogsRate !== undefined) state.simCogsRate = Number(data.settings.simCogsRate);
      if (data.settings.openingStockValue !== undefined) state.inventoryOpeningValue = Number(data.settings.openingStockValue);
      if (data.settings.periodBarSales !== undefined) state.inventoryPeriodSales = Number(data.settings.periodBarSales);
    }
    state.eventsSavedNotice = 'Pulled latest state from MySQL (' + nowTimeLabel() + ')';
    state.simSaveNotice = 'Reloaded from MySQL (' + nowTimeLabel() + ')';
    saveOfflineCache();
    renderAll({ rebuildRoster: true, rebuildSimControls: true, rebuildDealInputs: true, rebuildInvTable: true });
  };

  // ===================== EVENT BUILDING & PERSISTENCE =====================
  function buildSimulatedPipelineEvent() {
    const sim = computeSimMetrics();
    const cleanDate = String(state.simEventDate || '').trim() || 'TBC';
    const cleanTitle = String(state.simEventTitle || '').trim() || 'Untitled Trough X Event';
    const cleanFormat = String(state.simEventFormat || '').trim() ||
      (state.simMode === 'fixed_hire' ? 'Fixed Venue Hire' : state.simMode === 'promoter' ? 'Promoter Hosted' : 'Owned Hero Night');

    if (state.simMode === 'fixed_hire') {
      return {
        date: cleanDate,
        title: cleanTitle,
        type: 'promoter',
        format: cleanFormat.toLowerCase().includes('fixed') ? cleanFormat : ('Fixed Venue Hire (' + cleanFormat + ')'),
        pax: state.simPax,
        barGross: 0,
        clip: Math.round(state.simFixedHireFee),
        ticketRev: 0,
        deposit: 0,
        wages: Math.round(sim.baseRosterWages),
        surplus: Math.round(sim.netSurplus)
      };
    }
    return {
      date: cleanDate,
      title: cleanTitle,
      type: state.simMode,
      format: cleanFormat,
      pax: state.simPax,
      barGross: Math.round(sim.barRevenue),
      clip: state.simMode === 'promoter' ? Math.round(sim.ticketRevenue) : 0,
      ticketRev: state.simMode === 'owned' ? Math.round(sim.ticketRevenue) : 0,
      deposit: state.simMode === 'promoter' ? Math.round(sim.depositRevenue) : 0,
      wages: Math.round(sim.baseRosterWages),
      surplus: Math.round(sim.netSurplus)
    };
  }

  window.selectEventForEdit = function (index, switchToSimTab) {
    const item = state.events[index];
    if (!item) return;
    state.editingEventIndex = index;
    state.simEventDate = item.date;
    state.simEventTitle = item.title;
    const isFixed = isFixedHireEventObj(item);
    state.simEventFormat = item.format || (isFixed ? 'Fixed Venue Hire' : (item.type === 'promoter' ? 'Promoter Hosted' : 'Owned Hero Night'));
    if (isFixed) {
      state.simMode = 'fixed_hire';
      state.simFixedHireFee = (Number(item.clip) || 0) + (Number(item.ticketRev) || 0) + (Number(item.deposit) || 0);
    } else {
      state.simMode = item.type === 'promoter' ? 'promoter' : 'owned';
    }
    state.simPax = Math.min(300, Math.max(50, Number(item.pax) || 200));
    const estBarSpend = item.pax > 0 && item.barGross > 0 ? Math.round((item.barGross / item.pax) * 2) / 2 : 22.5;
    state.simBarSpend = Math.min(45, Math.max(12, estBarSpend));
    if (!isFixed && item.type === 'owned' && item.pax > 0 && item.ticketRev > 0) {
      state.simTicketPrice = Math.min(60, Math.max(15, Math.round(item.ticketRev / item.pax)));
    }
    if (!isFixed && item.type === 'promoter' && item.pax > 0 && item.clip >= 0) {
      state.simTicketClip = Number((item.clip / item.pax).toFixed(2));
    }
    state.simPromoterDeposit = Number(item.deposit) > 0;
    state.simSaveNotice = null;
    const parsed = parseEventDateDMY(item.date);
    if (parsed) {
      state.viewMonth = parsed.month;
      state.viewYear = parsed.year;
    }
    if (switchToSimTab) {
      window.setActiveTab('simulator');
    } else {
      renderAll({ rebuildSimControls: true });
    }
  };

  window.startNewEventOnCalendarDate = function (dateStr) {
    state.editingEventIndex = null;
    state.simEventDate = dateStr || formatDMY(14, state.viewMonth, state.viewYear);
    state.simEventTitle = 'New Trough X Event';
    state.simEventFormat = state.simMode === 'fixed_hire' ? 'Fixed Venue Hire' : (state.simMode === 'promoter' ? 'Promoter Hosted' : 'Owned Hero Night');
    state.simSaveNotice = null;
    renderAll({ rebuildSimControls: true });
  };

  window.startNewEventInSimulator = function () {
    state.editingEventIndex = null;
    state.simEventDate = '20/03/2027';
    state.simEventTitle = 'New Trough X Event';
    state.simEventFormat = state.simMode === 'fixed_hire' ? 'Fixed Venue Hire' : (state.simMode === 'promoter' ? 'Promoter Hosted' : 'Owned Hero Night');
    state.simSaveNotice = null;
    window.setActiveTab('simulator');
    renderAll({ rebuildSimControls: true });
  };

  window.onSimSelectEvent = function (val) {
    if (val === 'new') {
      window.startNewEventInSimulator();
      return;
    }
    const idx = parseInt(val, 10);
    if (!Number.isNaN(idx)) window.selectEventForEdit(idx, false);
  };

  window.onSimFieldInput = function (field, val, fromSidebar) {
    if (field === 'date') {
      state.simEventDate = val;
      elVal(fromSidebar ? 'sim-input-date' : 'prog-input-date', val);
      elText('prog-sidebar-date-label', val);
      const parsed = parseEventDateDMY(val);
      if (parsed && (parsed.month !== state.viewMonth || parsed.year !== state.viewYear)) {
        state.viewMonth = parsed.month;
        state.viewYear = parsed.year;
        renderProgrammingGridAndRollup();
      }
      renderProgrammingSidebarActionButtons();
    } else if (field === 'title') {
      state.simEventTitle = val;
      elVal(fromSidebar ? 'sim-input-title' : 'prog-input-title', val);
    } else if (field === 'format') {
      state.simEventFormat = val;
      elVal(fromSidebar ? 'sim-input-format' : 'prog-input-format', val);
    }
  };

  window.setSimMode = function (mode) {
    state.simMode = mode;
    if (mode === 'fixed_hire' && (state.simEventFormat === 'Owned Hero Night' || state.simEventFormat === 'Promoter Hosted')) {
      state.simEventFormat = 'Fixed Venue Hire';
    } else if (mode === 'promoter' && (state.simEventFormat === 'Owned Hero Night' || state.simEventFormat === 'Fixed Venue Hire')) {
      state.simEventFormat = 'Promoter Hosted';
    } else if (mode === 'owned' && (state.simEventFormat === 'Promoter Hosted' || state.simEventFormat === 'Fixed Venue Hire')) {
      state.simEventFormat = 'Owned Hero Night';
    }
    renderAll({ rebuildSimControls: true });
  };

  window.toggleOverheadsDrawer = function () {
    state.showOverheadsDrawer = !state.showOverheadsDrawer;
    renderProgrammingSidebarDynamicParams();
  };

  window.onSidebarFixedFeeInput = function (val, isPreset) {
    const clean = Math.max(0, Number.isNaN(Number(val)) ? 0 : Number(val));
    state.simFixedHireFee = clean;
    saveOfflineCache();
    debounced('fixed_fee', () => apiRequest('api/settings.php', 'PUT', { fixedHireFee: clean }), 350);
    if (isPreset) {
      renderAll({ rebuildSimControls: true });
    } else {
      syncSimulatorDerivedOnly();
      renderDashboardTab();
      renderPromoterTab();
    }
  };

  window.onSidebarPaxInput = function (val) {
    state.simPax = Math.min(300, Math.max(50, parseInt(val, 10) || 200));
    syncSimulatorDerivedOnly();
  };

  window.onSidebarTicketPriceInput = function (val) {
    state.simTicketPrice = parseFloat(val) || 30;
    syncSimulatorDerivedOnly();
  };

  window.onSidebarTicketClipInput = function (val) {
    state.simTicketClip = Math.max(0, parseFloat(val) || 0);
    syncSimulatorDerivedOnly();
  };

  window.onSidebarBarSpendInput = function (val) {
    state.simBarSpend = parseFloat(val) || 22.5;
    syncSimulatorDerivedOnly();
  };

  window.onSidebarCloakInput = function (val) {
    state.simCloakRate = parseInt(val, 10) || 0;
    syncSimulatorDerivedOnly();
  };

  window.onSidebarCogsInput = function (val) {
    const clean = Number(Math.min(80, Math.max(5, Number.isNaN(Number(val)) ? 22.0 : Number(val))).toFixed(1));
    state.simCogsRate = clean;
    saveOfflineCache();
    debounced('cogs_rate', () => apiRequest('api/settings.php', 'PUT', { simCogsRate: clean }), 350);
    syncSimulatorDerivedOnly();
  };

  window.onSidebarDepositToggle = function (checked) {
    state.simPromoterDeposit = Boolean(checked);
    syncSimulatorDerivedOnly();
  };

  window.saveSimulatorToExistingEvent = async function () {
    if (state.editingEventIndex === null || !state.events[state.editingEventIndex]) return;
    const existing = state.events[state.editingEventIndex];
    const updated = buildSimulatedPipelineEvent();
    if (existing.id) updated.id = existing.id;
    state.events[state.editingEventIndex] = updated;
    state.simSaveNotice = 'Saved changes to "' + updated.title + '" (' + updated.date + ') in Forthcoming Events.';
    state.eventsSavedNotice = 'Updated "' + updated.title + '" (' + nowTimeLabel() + ')';
    if (updated.id) {
      const res = await apiRequest('api/events.php', 'PUT', updated);
      if (res && Array.isArray(res.events)) state.events = res.events;
    } else {
      const res = await apiRequest('api/events.php', 'POST', { action: 'replace_all', events: state.events });
      if (res && Array.isArray(res.events)) state.events = res.events;
    }
    saveOfflineCache();
    renderAll();
  };

  window.saveSimulatorAsNewEvent = async function () {
    const created = buildSimulatedPipelineEvent();
    const res = await apiRequest('api/events.php', 'POST', created);
    if (res && Array.isArray(res.events)) {
      state.events = res.events;
      state.editingEventIndex = state.events.length - 1;
    } else {
      state.events.push(created);
      state.editingEventIndex = state.events.length - 1;
    }
    state.simSaveNotice = 'Added "' + created.title + '" (' + created.date + ') to Forthcoming Events schedule.';
    state.eventsSavedNotice = 'Added "' + created.title + '" (' + nowTimeLabel() + ')';
    saveOfflineCache();
    renderAll();
  };

  window.deleteEventByIndex = async function (index) {
    const target = state.events[index];
    if (!target) return;
    state.events.splice(index, 1);
    if (state.editingEventIndex === index) state.editingEventIndex = null;
    else if (state.editingEventIndex !== null && state.editingEventIndex > index) state.editingEventIndex--;
    state.eventsSavedNotice = 'Removed "' + target.title + '" (' + nowTimeLabel() + ')';
    if (target.id) {
      const res = await apiRequest('api/events.php', 'DELETE', { id: target.id });
      if (res && Array.isArray(res.events)) state.events = res.events;
    } else {
      const res = await apiRequest('api/events.php', 'POST', { action: 'replace_all', events: state.events });
      if (res && Array.isArray(res.events)) state.events = res.events;
    }
    saveOfflineCache();
    renderAll();
  };

  window.moveEventDate = async function (index, newDateStr) {
    const target = state.events[index];
    if (!target || target.date === newDateStr) return;
    target.date = newDateStr;
    if (state.editingEventIndex === index) state.simEventDate = newDateStr;
    state.simSaveNotice = 'Moved "' + target.title + '" to ' + newDateStr + '.';
    state.eventsSavedNotice = 'Moved "' + target.title + '" (' + nowTimeLabel() + ')';
    if (target.id) {
      const res = await apiRequest('api/events.php', 'PATCH', { action: 'move_date', id: target.id, date: newDateStr });
      if (res && Array.isArray(res.events)) state.events = res.events;
    } else {
      const res = await apiRequest('api/events.php', 'POST', { action: 'replace_all', events: state.events });
      if (res && Array.isArray(res.events)) state.events = res.events;
    }
    saveOfflineCache();
    renderAll();
  };

  window.resetSimulatorDefaults = function () {
    state.editingEventIndex = null;
    state.simEventDate = '20/03/2027';
    state.simEventTitle = 'Trough X Custom Night';
    state.simEventFormat = 'Owned Hero Night';
    state.simPax = 200;
    state.simTicketPrice = 30;
    state.simTicketClip = 5.0;
    state.simBarSpend = 22.5;
    state.simCloakRate = 50;
    state.simCogsRate = 22.0;
    state.simPromoterDeposit = true;
    state.simFixedHireFee = 5000;
    state.simMode = 'owned';
    state.ownedOverheads = Object.assign({}, DEFAULT_OWNED_OVERHEADS);
    state.simSaveNotice = null;
    apiRequest('api/settings.php', 'PUT', {
      ownedOverheads: state.ownedOverheads,
      fixedHireFee: 5000,
      simCogsRate: 22.0
    });
    renderAll({ rebuildSimControls: true });
  };

  // ===================== OVERHEADS =====================
  window.updateOwnedOverhead = function (field, value) {
    const clean = Math.max(0, Number.isNaN(Number(value)) ? 0 : Number(value));
    state.ownedOverheads[field] = clean;
    saveOfflineCache();
    debounced('overheads', () => apiRequest('api/settings.php', 'PUT', { ownedOverheads: state.ownedOverheads }), 350);
    // Sync across Dashboard, Simulator, and Programming without clobbering active input
    elVal('dash-oh-talent', state.ownedOverheads.talentCost);
    elVal('dash-oh-production', state.ownedOverheads.productionCost);
    elVal('dash-oh-marketing', state.ownedOverheads.marketingCost);
    elVal('dash-oh-other', state.ownedOverheads.otherCost);
    elVal('dash-oh-fee', state.ownedOverheads.merchantFeePct);
    elVal('prog-oh-talent', state.ownedOverheads.talentCost);
    elVal('prog-oh-production', state.ownedOverheads.productionCost);
    elVal('prog-oh-marketing', state.ownedOverheads.marketingCost);
    elVal('prog-oh-other', state.ownedOverheads.otherCost);
    elVal('sim-oh-talent', state.ownedOverheads.talentCost);
    elVal('sim-oh-production', state.ownedOverheads.productionCost);
    elVal('sim-oh-marketing', state.ownedOverheads.marketingCost);
    elVal('sim-oh-other', state.ownedOverheads.otherCost);
    elVal('sim-oh-fee', state.ownedOverheads.merchantFeePct);

    renderDashboardDerived();
    syncSimulatorDerivedOnly();
  };

  window.resetOwnedOverheads = function () {
    state.ownedOverheads = Object.assign({}, DEFAULT_OWNED_OVERHEADS);
    saveOfflineCache();
    apiRequest('api/settings.php', 'PUT', { ownedOverheads: state.ownedOverheads });
    renderDashboardTab();
    renderAll({ rebuildSimControls: true });
  };

  // ===================== PROGRAMMING CALENDAR RENDER =====================
  window.progPrevMonth = function () {
    if (state.viewMonth === 0) { state.viewMonth = 11; state.viewYear--; }
    else state.viewMonth--;
    renderProgrammingTab();
  };
  window.progNextMonth = function () {
    if (state.viewMonth === 11) { state.viewMonth = 0; state.viewYear++; }
    else state.viewMonth++;
    renderProgrammingTab();
  };
  window.progSelectMonth = function (m, y) {
    state.viewMonth = m;
    state.viewYear = y;
    renderProgrammingTab();
  };
  window.progSetFilter = function (f) {
    state.calendarFilter = f;
    renderProgrammingTab();
  };
  window.toggleHighlightPrimeSlots = function () {
    state.highlightPrimeSlots = !state.highlightPrimeSlots;
    renderProgrammingTab();
  };
  window.progAddInCurrentMonth = function () {
    const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    let fallbackDate = formatDMY(14, state.viewMonth, state.viewYear);
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = (new Date(state.viewYear, state.viewMonth, d).getDay() + 6) % 7;
      if (dow === 4 || dow === 5) {
        const ds = formatDMY(d, state.viewMonth, state.viewYear);
        if (!state.events.some((ev) => ev.date === ds)) { fallbackDate = ds; break; }
      }
    }
    window.startNewEventOnCalendarDate(fallbackDate);
  };

  window.onCalEventDragStart = function (idx, e) {
    state.draggedEventIndex = idx;
    if (e && e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
    }
  };
  window.onCalCellDragOver = function (dateStr, e) {
    if (e) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    }
    if (state.dragOverDateStr !== dateStr) {
      document.querySelectorAll('.cal-cell-drop-active').forEach((el) => el.classList.remove('cal-cell-drop-active', 'ring-2', 'ring-inset', 'ring-trough-yellow', 'bg-trough-yellow/10'));
      state.dragOverDateStr = dateStr;
      const cell = document.querySelector('[data-cal-date="' + dateStr + '"]');
      if (cell) cell.classList.add('cal-cell-drop-active', 'ring-2', 'ring-inset', 'ring-trough-yellow', 'bg-trough-yellow/10');
    }
  };
  window.onCalCellDragLeave = function (dateStr) {
    if (state.dragOverDateStr === dateStr) {
      state.dragOverDateStr = null;
      const cell = document.querySelector('[data-cal-date="' + dateStr + '"]');
      if (cell) cell.classList.remove('cal-cell-drop-active', 'ring-2', 'ring-inset', 'ring-trough-yellow', 'bg-trough-yellow/10');
    }
  };
  window.onCalCellDrop = function (dateStr, e) {
    if (e) e.preventDefault();
    const rawIdx = e && e.dataTransfer ? e.dataTransfer.getData('text/plain') : '';
    const idx = rawIdx !== '' ? parseInt(rawIdx, 10) : state.draggedEventIndex;
    state.dragOverDateStr = null;
    state.draggedEventIndex = null;
    if (idx !== null && !Number.isNaN(idx)) window.moveEventDate(idx, dateStr);
  };

  function getSeasonMonths() {
    const base = [
      { month: 10, year: 2026 }, { month: 11, year: 2026 },
      { month: 0, year: 2027 }, { month: 1, year: 2027 },
      { month: 2, year: 2027 }, { month: 3, year: 2027 }
    ];
    const seen = new Set(base.map((m) => m.year + '-' + m.month));
    state.events.forEach((ev) => {
      const p = parseEventDateDMY(ev.date);
      if (p) {
        const k = p.year + '-' + p.month;
        if (!seen.has(k)) { seen.add(k); base.push({ month: p.month, year: p.year }); }
      }
    });
    base.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
    return base;
  }

  function renderProgrammingGridAndRollup() {
    const m = state.viewMonth, y = state.viewYear;
    elText('prog-month-title', MONTH_NAMES[m] + ' ' + y);
    elText('prog-runsheet-title', MONTH_NAMES[m] + ' ' + y + ' — Programmed Run-Sheet');

    const eventsMeta = state.events.map((item, idx) => ({
      item,
      originalIndex: idx,
      parsed: parseEventDateDMY(item.date),
      isFixedHire: isFixedHireEventObj(item)
    }));

    const filteredMeta = eventsMeta.filter((x) => {
      if (state.calendarFilter === 'owned') return !x.isFixedHire && x.item.type === 'owned';
      if (state.calendarFilter === 'promoter') return !x.isFixedHire && x.item.type === 'promoter';
      if (state.calendarFilter === 'fixed_hire') return x.isFixedHire;
      return true;
    });

    const eventsByDate = {};
    filteredMeta.forEach((x) => {
      if (!eventsByDate[x.item.date]) eventsByDate[x.item.date] = [];
      eventsByDate[x.item.date].push(x);
    });

    const monthEvents = filteredMeta
      .filter((x) => x.parsed && x.parsed.month === m && x.parsed.year === y)
      .sort((a, b) => (a.parsed?.day || 0) - (b.parsed?.day || 0));

    // Month summary
    let monthGross = 0, monthWages = 0, monthSurplus = 0, ownedCount = 0, promoterCount = 0, fixedCount = 0;
    monthEvents.forEach(({ item, isFixedHire }) => {
      monthGross += (Number(item.barGross) || 0) + (Number(item.clip) || 0) + (Number(item.ticketRev) || 0) + (Number(item.deposit) || 0);
      monthWages += Number(item.wages) || 0;
      monthSurplus += Number(item.surplus) || 0;
      if (isFixedHire) fixedCount++;
      else if (item.type === 'owned') ownedCount++;
      else promoterCount++;
    });

    // Calendar days
    const firstDayJs = new Date(y, m, 1).getDay();
    const startOffset = (firstDayJs + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const allByDate = new Set(state.events.map((ev) => ev.date));
    const openPrimeDates = [];
    const cells = [];

    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startOffset + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cells.push({ inMonth: false, dateStr: 'empty-' + i });
      } else {
        const dow = (new Date(y, m, dayNum).getDay() + 6) % 7;
        const dateStr = formatDMY(dayNum, m, y);
        const dayEvents = eventsByDate[dateStr] || [];
        const isPrime = dow === 4 || dow === 5;
        if (isPrime && !allByDate.has(dateStr)) {
          openPrimeDates.push({ dayNum, dateStr, weekday: dow === 4 ? 'Fri' : 'Sat' });
        }
        cells.push({ inMonth: true, dayNum, dateStr, dow, isPrime, dayEvents });
      }
    }

    elText('prog-month-subtitle', monthEvents.length + ' Booked · ' + openPrimeDates.length + ' Open Fri/Sat');

    // Season Pills
    const pillsEl = document.getElementById('prog-season-pills');
    if (pillsEl) {
      const counts = {};
      eventsMeta.forEach((x) => {
        if (x.parsed) {
          const k = x.parsed.year + '-' + x.parsed.month;
          counts[k] = (counts[k] || 0) + 1;
        }
      });
      pillsEl.innerHTML = getSeasonMonths().map((sm) => {
        const active = sm.month === m && sm.year === y;
        const c = counts[sm.year + '-' + sm.month] || 0;
        return '<button type="button" onclick="progSelectMonth(' + sm.month + ',' + sm.year + ')" class="px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ' +
          (active ? 'bg-trough-yellow text-black font-bold border-trough-yellow' : 'bg-[#191919] text-neutral-300 hover:text-white border-neutral-800') + '">' +
          '<span>' + SHORT_MONTH_NAMES[sm.month] + ' ' + String(sm.year).slice(-2) + '</span>' +
          (c > 0 ? '<span class="text-[10px] px-1 rounded ' + (active ? 'bg-black/20 text-black' : 'bg-neutral-800 text-trough-yellow') + '">' + c + '</span>' : '') +
          '</button>';
      }).join('');
    }

    // Filter Buttons
    const filterEl = document.getElementById('prog-filter-group');
    if (filterEl) {
      const fDefs = [
        { id: 'all', label: 'All' },
        { id: 'owned', label: 'Owned' },
        { id: 'promoter', label: 'Promoter' },
        { id: 'fixed_hire', label: 'Fixed Hire' }
      ];
      filterEl.innerHTML = fDefs.map((f) => {
        const act = state.calendarFilter === f.id;
        return '<button type="button" onclick="progSetFilter(\'' + f.id + '\')" class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ' +
          (act ? 'bg-trough-yellow text-black font-bold' : 'text-neutral-400 hover:text-white') + '">' + f.label + '</button>';
      }).join('');
    }

    // Prime Slots toggle styling
    const primeToggle = document.getElementById('prog-prime-toggle');
    if (primeToggle) {
      primeToggle.className = 'px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ' +
        (state.highlightPrimeSlots
          ? 'bg-trough-yellow/15 text-trough-yellow border-trough-yellow/40'
          : 'bg-[#191919] text-neutral-400 border-neutral-800 hover:text-white');
    }

    // Monthly Rollup
    const rollupEl = document.getElementById('prog-month-rollup');
    if (rollupEl) {
      rollupEl.innerHTML =
        '<div class="bg-[#191919] border border-neutral-800 rounded-xl p-2.5">' +
          '<span class="text-[10px] uppercase tracking-wider text-neutral-400 block">Month Bookings</span>' +
          '<span class="text-sm font-bold font-mono text-white">' + monthEvents.length + ' Events</span>' +
          '<span class="text-[10px] text-neutral-500 block font-mono">' + ownedCount + ' Own · ' + promoterCount + ' Prom · ' + fixedCount + ' Fixed</span>' +
        '</div>' +
        '<div class="bg-[#191919] border border-neutral-800 rounded-xl p-2.5">' +
          '<span class="text-[10px] uppercase tracking-wider text-neutral-400 block">Open Prime Slots</span>' +
          '<span class="text-sm font-bold font-mono ' + (openPrimeDates.length > 0 ? 'text-emerald-400' : 'text-neutral-300') + '">' + openPrimeDates.length + ' Fri/Sat Free</span>' +
          '<span class="text-[10px] text-neutral-500 block font-mono">Click date to program</span>' +
        '</div>' +
        '<div class="bg-[#191919] border border-neutral-800 rounded-xl p-2.5">' +
          '<span class="text-[10px] uppercase tracking-wider text-neutral-400 block">Month Venue Gross</span>' +
          '<span class="text-sm font-bold font-mono text-white tabular-nums">$' + formatInt(monthGross) + '</span>' +
          '<span class="text-[10px] text-neutral-500 block font-mono">Door + Bar + Hire</span>' +
        '</div>' +
        '<div class="bg-[#191919] border border-neutral-800 rounded-xl p-2.5">' +
          '<span class="text-[10px] uppercase tracking-wider text-neutral-400 block">Month IFA Wages</span>' +
          '<span class="text-sm font-bold font-mono text-rose-300 tabular-nums">($' + formatInt(monthWages) + ')</span>' +
          '<span class="text-[10px] text-neutral-500 block font-mono">Projected roster cost</span>' +
        '</div>' +
        '<div class="bg-gradient-to-r from-[#242010] to-[#191919] border border-trough-yellow/40 rounded-xl p-2.5 col-span-2 sm:col-span-1">' +
          '<span class="text-[10px] uppercase tracking-wider text-trough-yellow font-semibold block">Month Net Surplus</span>' +
          '<span class="text-sm font-extrabold font-mono text-trough-yellow tabular-nums">+$' + formatInt(monthSurplus) + '</span>' +
          '<span class="text-[10px] text-neutral-400 block font-mono">Venue operating profit</span>' +
        '</div>';
    }

    // Calendar 7-column Grid
    const gridEl = document.getElementById('prog-calendar-grid');
    if (gridEl) {
      gridEl.innerHTML = cells.map((cell) => {
        if (!cell.inMonth) {
          return '<div class="min-h-[112px] sm:min-h-[126px] bg-[#141414]/70 p-2"></div>';
        }
        const isSelectedDate = state.simEventDate === cell.dateStr;
        const isOpenPrime = cell.isPrime && cell.dayEvents.length === 0 && state.highlightPrimeSlots;
        let cls = 'min-h-[112px] sm:min-h-[126px] p-2 flex flex-col justify-between transition group relative cursor-pointer ';
        if (isSelectedDate) cls += 'bg-trough-yellow/5 ring-1 ring-inset ring-trough-yellow/60';
        else if (isOpenPrime) cls += 'bg-[#1D1B12] hover:bg-[#262315]';
        else cls += 'bg-[#181818] hover:bg-[#202020]';

        const cardsHtml = cell.dayEvents.map(({ item, originalIndex, isFixedHire }) => {
          const isEditingThis = state.editingEventIndex === originalIndex;
          const gross = (Number(item.barGross) || 0) + (Number(item.clip) || 0) + (Number(item.ticketRev) || 0) + (Number(item.deposit) || 0);
          let pillCls = 'w-full text-left rounded-lg p-1.5 border transition cursor-grab active:cursor-grabbing ';
          if (isEditingThis) pillCls += 'ring-2 ring-trough-yellow shadow-md ';
          if (isFixedHire) pillCls += 'bg-sky-500/15 border-sky-400/50 hover:bg-sky-500/25';
          else if (item.type === 'owned') pillCls += 'bg-trough-yellow/15 border-trough-yellow/50 hover:bg-trough-yellow/25';
          else pillCls += 'bg-[#262626] border-neutral-600 hover:border-neutral-400';

          const badgeCls = isFixedHire ? 'text-sky-300' : (item.type === 'owned' ? 'text-trough-yellow' : 'text-neutral-300');
          const badgeLbl = isFixedHire ? 'Fixed' : (item.type === 'owned' ? 'Owned' : 'Prom');

          return '<button type="button" draggable="true" ' +
            'ondragstart="event.stopPropagation(); onCalEventDragStart(' + originalIndex + ', event)" ' +
            'onclick="event.stopPropagation(); selectEventForEdit(' + originalIndex + ', false)" ' +
            'title="Click to edit or drag to another date" class="' + pillCls + '">' +
            '<div class="flex items-center justify-between gap-1">' +
              '<span class="text-[10px] font-bold uppercase tracking-wider ' + badgeCls + '">' + badgeLbl + '</span>' +
              '<span class="text-[10px] font-mono text-neutral-300 tabular-nums">' + (isFixedHire ? '$' + formatInt(item.clip) : item.pax + 'p') + '</span>' +
            '</div>' +
            '<div class="text-[11px] font-semibold text-white truncate leading-tight mt-0.5">' + escapeHtml(item.title) + '</div>' +
            '<div class="flex items-center justify-between text-[10px] font-mono mt-0.5 tabular-nums">' +
              '<span class="text-neutral-400">$' + formatInt(gross) + '</span>' +
              '<span class="' + (Number(item.surplus) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold') + '">' +
                (Number(item.surplus) >= 0 ? '+$' + formatInt(item.surplus) : '-$' + formatInt(Math.abs(item.surplus))) +
              '</span>' +
            '</div></button>';
        }).join('');

        const emptyHint = cell.dayEvents.length === 0
          ? '<div class="mt-auto pt-2 text-[10px] font-mono">' +
              (isOpenPrime
                ? '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300/90 border border-emerald-500/20 group-hover:border-trough-yellow/50 group-hover:text-trough-yellow transition">+ Book Prime</span>'
                : '<span class="text-neutral-600 opacity-0 group-hover:opacity-100 transition">+ Schedule</span>') +
            '</div>'
          : '';

        return '<div data-cal-date="' + cell.dateStr + '" ' +
          'onclick="startNewEventOnCalendarDate(\'' + cell.dateStr + '\')" ' +
          'ondragover="onCalCellDragOver(\'' + cell.dateStr + '\', event)" ' +
          'ondragleave="onCalCellDragLeave(\'' + cell.dateStr + '\')" ' +
          'ondrop="onCalCellDrop(\'' + cell.dateStr + '\', event)" ' +
          'class="' + cls + '">' +
          '<div class="flex items-center justify-between mb-1.5">' +
            '<span class="text-xs font-mono font-bold w-6 h-6 rounded-md flex items-center justify-center ' +
              (isSelectedDate ? 'bg-trough-yellow text-black' : (cell.isPrime ? 'text-trough-yellow' : 'text-neutral-400')) + '">' +
              cell.dayNum +
            '</span>' +
            '<span class="opacity-0 group-hover:opacity-100 transition text-[10px] px-1.5 py-0.5 rounded bg-trough-yellow text-black font-bold flex items-center gap-1" title="Program event on ' + cell.dateStr + '">+ Program</span>' +
          '</div>' +
          '<div class="space-y-1.5 flex-1">' + cardsHtml + '</div>' +
          emptyHint +
        '</div>';
      }).join('');
    }

    // Quick Prime Slots strip
    const quickPrimeEl = document.getElementById('prog-quick-prime-slots');
    if (quickPrimeEl) {
      if (openPrimeDates.length === 0) {
        quickPrimeEl.innerHTML = '';
      } else {
        const top4 = openPrimeDates.slice(0, 4).map((slot) =>
          '<button type="button" onclick="startNewEventOnCalendarDate(\'' + slot.dateStr + '\')" class="px-2 py-0.5 rounded bg-[#191919] hover:bg-trough-yellow hover:text-black text-emerald-300 border border-emerald-500/30 font-mono text-[11px] transition cursor-pointer">+ ' + slot.weekday + ' ' + slot.dayNum + ' ' + SHORT_MONTH_NAMES[m] + '</button>'
        ).join('');
        quickPrimeEl.innerHTML = '<span class="text-[11px] text-neutral-400 mr-1">Quick-book Open Fri/Sat:</span>' + top4;
      }
    }

    // Programmed Run-Sheet
    const addBtn = document.getElementById('prog-add-month-btn');
    if (addBtn) {
      addBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Add Event in ' + SHORT_MONTH_NAMES[m] + '</span>';
    }
    const rsBody = document.getElementById('prog-runsheet-body');
    if (rsBody) {
      if (monthEvents.length === 0) {
        const suggested = (openPrimeDates[0] && openPrimeDates[0].dateStr) || formatDMY(14, m, y);
        rsBody.innerHTML =
          '<div class="py-6 text-center space-y-2 border border-dashed border-neutral-800 rounded-xl bg-[#191919]/60">' +
            '<p class="text-xs text-neutral-400">No events programmed in ' + MONTH_NAMES[m] + ' ' + y + ' under the current filter.</p>' +
            '<button type="button" onclick="startNewEventOnCalendarDate(\'' + suggested + '\')" class="px-3.5 py-1.5 rounded-lg bg-trough-yellow text-black font-bold text-xs cursor-pointer">Program First Event in ' + MONTH_NAMES[m] + '</button>' +
          '</div>';
      } else {
        rsBody.innerHTML =
          '<div class="overflow-x-auto"><table class="w-full text-left text-xs">' +
          '<thead class="bg-[#191919] text-neutral-400 uppercase text-[10px] font-mono border-b border-neutral-800"><tr>' +
            '<th class="py-2.5 px-3">Date</th><th class="py-2.5 px-3">Event Title</th><th class="py-2.5 px-3">Model / Format</th>' +
            '<th class="py-2.5 px-3 text-right">Target Pax</th><th class="py-2.5 px-3 text-right">Venue Gross</th>' +
            '<th class="py-2.5 px-3 text-right">IFA Wages</th><th class="py-2.5 px-3 text-right text-trough-yellow">Net Surplus</th><th class="py-2.5 px-3 text-right">Action</th>' +
          '</tr></thead><tbody class="divide-y divide-neutral-800/80">' +
          monthEvents.map(({ item, originalIndex, isFixedHire }) => {
            const isEd = state.editingEventIndex === originalIndex;
            const gross = (Number(item.barGross) || 0) + (Number(item.clip) || 0) + (Number(item.ticketRev) || 0) + (Number(item.deposit) || 0);
            return '<tr onclick="selectEventForEdit(' + originalIndex + ', false)" class="transition cursor-pointer ' + (isEd ? 'bg-trough-yellow/15' : 'hover:bg-neutral-800/50') + '">' +
              '<td class="py-2.5 px-3 font-mono font-semibold text-white whitespace-nowrap">' + escapeHtml(item.date) + '</td>' +
              '<td class="py-2.5 px-3 font-semibold text-white">' + escapeHtml(item.title) + '</td>' +
              '<td class="py-2.5 px-3 text-neutral-300">' + escapeHtml(isFixedHire ? 'Fixed Venue Hire' : item.format) + '</td>' +
              '<td class="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-200">' + (isFixedHire ? 'Flat' : item.pax + ' Pax') + '</td>' +
              '<td class="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-200">$' + formatInt(gross) + '</td>' +
              '<td class="py-2.5 px-3 text-right font-mono tabular-nums text-rose-300">($' + formatInt(item.wages) + ')</td>' +
              '<td class="py-2.5 px-3 text-right font-mono font-bold tabular-nums ' + (Number(item.surplus) >= 0 ? 'text-trough-yellow' : 'text-rose-400') + '">' +
                (Number(item.surplus) >= 0 ? '+$' + formatInt(item.surplus) : '-$' + formatInt(Math.abs(item.surplus))) +
              '</td>' +
              '<td class="py-2.5 px-3 text-right whitespace-nowrap space-x-1.5">' +
                '<button type="button" onclick="event.stopPropagation(); selectEventForEdit(' + originalIndex + ', false)" class="px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ' + (isEd ? 'bg-trough-yellow text-black' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200') + '">' + (isEd ? 'Editing' : 'Edit') + '</button>' +
                '<button type="button" onclick="event.stopPropagation(); deleteEventByIndex(' + originalIndex + ')" class="px-2 py-1 rounded bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 text-[10px] cursor-pointer" title="Delete Event"><i class="fa-solid fa-trash-can"></i></button>' +
              '</td></tr>';
          }).join('') +
          '</tbody></table></div>';
      }
    }
  }

  function renderProgrammingSidebarDynamicParams() {
    const sim = computeSimMetrics();
    const el = document.getElementById('prog-dynamic-params');
    if (!el) return;

    if (state.simMode === 'fixed_hire') {
      const presets = [2500, 3500, 5000, 7500, 10000].map((preset) => {
        const act = state.simFixedHireFee === preset;
        return '<button type="button" onclick="onSidebarFixedFeeInput(' + preset + ', true)" class="px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ' +
          (act ? 'bg-trough-yellow text-black border-trough-yellow' : 'bg-[#222222] text-neutral-300 border-neutral-700 hover:text-white') + '">$' + preset.toLocaleString() + '</button>';
      }).join('');

      el.innerHTML =
        '<div class="p-3 rounded-xl bg-[#191919] border border-trough-yellow/40 space-y-2.5">' +
          '<div class="flex items-center justify-between gap-2">' +
            '<label class="text-xs font-bold text-trough-yellow">Flat Venue Hire Fee</label>' +
            '<div class="h-8 inline-flex items-center bg-[#222222] border border-trough-yellow/50 rounded-lg px-2">' +
              '<span class="text-trough-yellow font-mono text-xs font-bold mr-1">$</span>' +
              '<input type="number" id="prog-input-fixedfee" min="0" step="100" value="' + state.simFixedHireFee + '" oninput="onSidebarFixedFeeInput(this.value, false)" class="w-20 bg-transparent text-right font-mono font-bold text-white text-xs focus:outline-none tabular-nums" />' +
            '</div>' +
          '</div>' +
          '<input type="range" id="prog-slider-fixedfee" min="500" max="25000" step="250" value="' + Math.min(25000, Math.max(500, state.simFixedHireFee)) + '" oninput="onSidebarFixedFeeInput(this.value, false)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" />' +
          '<div class="flex flex-wrap gap-1 font-mono">' + presets + '</div>' +
          '<p class="text-[10px] text-neutral-400 leading-relaxed">Flat contracted hire fee only. Does not scale with attendance or include bar or door splits.</p>' +
        '</div>';
      return;
    }

    const ticketBlock = state.simMode === 'owned'
      ? '<div class="space-y-1">' +
          '<div class="flex justify-between items-center text-xs">' +
            '<span class="text-neutral-300 font-medium">Avg Door Ticket Price</span>' +
            '<span id="prog-lbl-price" class="font-mono font-bold text-white tabular-nums">$' + state.simTicketPrice.toFixed(2) + '</span>' +
          '</div>' +
          '<input type="range" id="prog-slider-price" min="15" max="60" step="1" value="' + state.simTicketPrice + '" oninput="onSidebarTicketPriceInput(this.value)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" />' +
        '</div>'
      : '<div class="space-y-1.5">' +
          '<div class="flex justify-between items-center text-xs">' +
            '<span class="text-trough-yellow font-semibold">Venue Ticket Clip / Head</span>' +
            '<div class="flex items-center bg-[#191919] border border-trough-yellow/50 rounded px-2 py-0.5">' +
              '<span class="text-trough-yellow font-mono text-xs mr-1">$</span>' +
              '<input type="number" id="prog-input-clip" min="0" max="30" step="0.5" value="' + state.simTicketClip + '" oninput="onSidebarTicketClipInput(this.value)" class="w-12 bg-transparent text-right font-mono font-bold text-white text-xs focus:outline-none tabular-nums" />' +
            '</div>' +
          '</div>' +
          '<input type="range" id="prog-slider-clip" min="0" max="20" step="0.5" value="' + Math.min(20, state.simTicketClip) + '" oninput="onSidebarTicketClipInput(this.value)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" />' +
        '</div>';

    const ohBlock = state.simMode === 'promoter'
      ? '<label class="flex items-center justify-between p-2.5 rounded-xl bg-[#191919] border border-neutral-800 cursor-pointer text-xs">' +
          '<span class="text-neutral-200 font-medium">Include $550 Venue Deposit</span>' +
          '<input type="checkbox" id="prog-input-deposit" ' + (state.simPromoterDeposit ? 'checked' : '') + ' onchange="onSidebarDepositToggle(this.checked)" class="accent-trough-yellow w-4 h-4 rounded cursor-pointer" />' +
        '</label>'
      : '<div class="bg-[#191919] border border-neutral-800 rounded-xl p-2.5 space-y-2">' +
          '<button type="button" onclick="toggleOverheadsDrawer()" class="w-full flex items-center justify-between text-xs font-semibold text-neutral-200 cursor-pointer">' +
            '<span id="prog-overheads-toggle-total">Direct Overheads ($' + formatInt(sim.fixedDirectOverheads) + ')</span>' +
            '<i class="fa-solid fa-chevron-' + (state.showOverheadsDrawer ? 'up' : 'down') + ' text-[10px] text-trough-yellow"></i>' +
          '</button>' +
          (state.showOverheadsDrawer
            ? '<div class="space-y-2 pt-2 border-t border-neutral-800 text-[11px]">' +
                '<div class="grid grid-cols-2 gap-2">' +
                  '<div><label class="text-neutral-400 block mb-0.5">DJs / Talent ($)</label><input type="number" id="prog-oh-talent" value="' + state.ownedOverheads.talentCost + '" oninput="updateOwnedOverhead(\'talentCost\', parseFloat(this.value) || 0)" class="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white" /></div>' +
                  '<div><label class="text-neutral-400 block mb-0.5">Production ($)</label><input type="number" id="prog-oh-production" value="' + state.ownedOverheads.productionCost + '" oninput="updateOwnedOverhead(\'productionCost\', parseFloat(this.value) || 0)" class="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white" /></div>' +
                  '<div><label class="text-neutral-400 block mb-0.5">Marketing ($)</label><input type="number" id="prog-oh-marketing" value="' + state.ownedOverheads.marketingCost + '" oninput="updateOwnedOverhead(\'marketingCost\', parseFloat(this.value) || 0)" class="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white" /></div>' +
                  '<div><label class="text-neutral-400 block mb-0.5">Other ($)</label><input type="number" id="prog-oh-other" value="' + state.ownedOverheads.otherCost + '" oninput="updateOwnedOverhead(\'otherCost\', parseFloat(this.value) || 0)" class="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white" /></div>' +
                '</div>' +
                '<button type="button" onclick="resetOwnedOverheads()" class="text-[10px] text-trough-yellow hover:underline cursor-pointer">Reset Default Overheads ($1,750)</button>' +
              '</div>'
            : '') +
        '</div>';

    el.innerHTML =
      '<div class="space-y-1">' +
        '<div class="flex justify-between items-center text-xs">' +
          '<span class="text-neutral-300 font-medium">Attendance (Pax)</span>' +
          '<span id="prog-lbl-pax" class="font-mono font-bold text-trough-yellow tabular-nums">' + state.simPax + ' Pax</span>' +
        '</div>' +
        '<input type="range" id="prog-slider-pax" min="50" max="300" step="10" value="' + state.simPax + '" oninput="onSidebarPaxInput(this.value)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" />' +
      '</div>' +
      ticketBlock +
      '<div class="space-y-1">' +
        '<div class="flex justify-between items-center text-xs">' +
          '<span class="text-neutral-300 font-medium">Bar Spend / Head</span>' +
          '<span id="prog-lbl-bar" class="font-mono font-bold text-white tabular-nums">$' + state.simBarSpend.toFixed(2) + '</span>' +
        '</div>' +
        '<input type="range" id="prog-slider-bar" min="12" max="45" step="0.5" value="' + state.simBarSpend + '" oninput="onSidebarBarSpendInput(this.value)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" />' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-2 pt-1">' +
        '<div class="bg-[#191919] border border-neutral-800 rounded-lg p-2">' +
          '<div class="flex justify-between text-[10px] text-neutral-400"><span>Cloak %</span><span id="prog-lbl-cloak" class="font-mono text-white font-bold">' + state.simCloakRate + '%</span></div>' +
          '<input type="range" id="prog-slider-cloak" min="0" max="100" step="5" value="' + state.simCloakRate + '" oninput="onSidebarCloakInput(this.value)" class="w-full h-1 bg-neutral-800 rounded-lg cursor-pointer mt-1 block" />' +
        '</div>' +
        '<div class="bg-[#191919] border border-neutral-800 rounded-lg p-2">' +
          '<div class="flex justify-between text-[10px] text-neutral-400"><span>Bev COGS</span><span id="prog-lbl-cogs" class="font-mono text-white font-bold">' + state.simCogsRate.toFixed(1) + '%</span></div>' +
          '<input type="range" id="prog-slider-cogs" min="10" max="45" step="0.1" value="' + state.simCogsRate + '" oninput="onSidebarCogsInput(this.value)" class="w-full h-1 bg-neutral-800 rounded-lg cursor-pointer mt-1 block" />' +
        '</div>' +
      '</div>' +
      ohBlock;
  }

  function renderProgrammingSidebarProformaAndChrome() {
    const sim = computeSimMetrics();
    const isEditing = state.editingEventIndex !== null && state.events[state.editingEventIndex];

    const badge = document.getElementById('prog-edit-badge');
    if (badge) {
      badge.className = 'text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ' +
        (isEditing ? 'bg-trough-yellow text-black' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30');
      badge.textContent = isEditing ? ('Editing Event #' + (state.editingEventIndex + 1)) : 'New Event Entry';
    }
    elText('prog-sidebar-date-label', state.simEventDate);
    const btnNew = document.getElementById('prog-btn-new');
    if (btnNew) btnNew.classList.toggle('hidden', !isEditing);

    const noticeEl = document.getElementById('prog-save-notice');
    if (noticeEl) {
      noticeEl.classList.toggle('hidden', !state.simSaveNotice);
      elText('prog-save-notice-text', state.simSaveNotice || '');
    }

    elVal('prog-input-date', state.simEventDate);
    elVal('prog-input-title', state.simEventTitle);
    elVal('prog-input-format', state.simEventFormat);

    // Mode buttons
    const modes = [['owned', 'prog-mode-owned'], ['promoter', 'prog-mode-promoter'], ['fixed_hire', 'prog-mode-fixed']];
    modes.forEach(([m, id]) => {
      const b = document.getElementById(id);
      if (b) {
        b.className = 'py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ' +
          (state.simMode === m ? 'bg-trough-yellow text-black font-bold' : 'text-neutral-300 hover:text-white');
      }
    });

    const proEl = document.getElementById('prog-proforma-card');
    if (proEl) {
      const revLines = state.simMode === 'fixed_hire'
        ? '<div class="flex justify-between text-[11px] text-neutral-400"><span>Flat Venue Hire Fee:</span><span>$' + formatMoney(sim.fixedHireRevenue) + '</span></div>'
        : '<div class="flex justify-between text-[11px] text-neutral-400"><span>' + (state.simMode === 'owned' ? 'Door Tickets:' : 'Venue Ticket Clip:') + '</span><span>$' + formatMoney(sim.ticketRevenue) + '</span></div>' +
          '<div class="flex justify-between text-[11px] text-neutral-400"><span>Bar Gross + Cloak:</span><span>$' + formatMoney(sim.barRevenue + sim.cloakRevenue) + '</span></div>';

      proEl.innerHTML =
        '<div class="flex justify-between items-center text-white font-bold border-b border-neutral-800 pb-1.5">' +
          '<span class="font-sans text-[11px] uppercase tracking-wider text-neutral-300">1. Gross Venue Revenue</span>' +
          '<span>$' + formatMoney(sim.grossTurnover) + '</span>' +
        '</div>' +
        revLines +
        '<div class="flex justify-between text-[11px] text-rose-300 pt-1 border-t border-neutral-800/70">' +
          '<span>2. COGS &amp; Overheads:</span>' +
          '<span>($' + formatMoney(sim.beverageCogs + sim.consumables + sim.totalOverheads) + ')</span>' +
        '</div>' +
        '<div class="flex justify-between text-[11px] text-rose-300">' +
          '<span>3. IFA Wages (' + sim.staffCount + ' Staff):</span>' +
          '<span>($' + formatMoney(sim.baseRosterWages) + ')</span>' +
        '</div>' +
        '<div class="pt-2 border-t border-neutral-700 flex items-baseline justify-between">' +
          '<div>' +
            '<span class="font-sans text-[11px] font-bold text-white block">Net Operating Surplus</span>' +
            '<span class="text-[10px] text-neutral-400">Margin: ' + sim.marginRatio.toFixed(1) + '% · Labour: ' + sim.wageRatio.toFixed(1) + '%</span>' +
          '</div>' +
          '<span class="text-lg font-extrabold ' + (sim.netSurplus >= 0 ? 'text-trough-yellow' : 'text-rose-400') + '">' +
            (sim.netSurplus >= 0 ? '+$' + formatInt(sim.netSurplus) : '-$' + formatInt(Math.abs(sim.netSurplus))) +
          '</span>' +
        '</div>';
    }

    renderProgrammingSidebarActionButtons();
  }

  function renderProgrammingSidebarActionButtons() {
    const actEl = document.getElementById('prog-action-buttons');
    if (!actEl) return;
    if (state.editingEventIndex !== null && state.events[state.editingEventIndex]) {
      actEl.innerHTML =
        '<button type="button" onclick="saveSimulatorToExistingEvent()" class="w-full py-2.5 px-4 rounded-xl bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"><i class="fa-solid fa-floppy-disk"></i><span>Update Event on Calendar</span></button>' +
        '<div class="grid grid-cols-2 gap-2">' +
          '<button type="button" onclick="saveSimulatorAsNewEvent()" class="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"><i class="fa-solid fa-copy"></i><span>Save as Copy</span></button>' +
          '<button type="button" onclick="deleteEventByIndex(' + state.editingEventIndex + ')" class="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"><i class="fa-solid fa-trash-can"></i><span>Delete Event</span></button>' +
        '</div>';
    } else {
      actEl.innerHTML =
        '<button type="button" onclick="saveSimulatorAsNewEvent()" class="w-full py-2.5 px-4 rounded-xl bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"><i class="fa-solid fa-calendar-plus"></i><span>Add Event to ' + escapeHtml(state.simEventDate) + '</span></button>';
    }
  }

  function renderProgrammingTab(rebuildControls) {
    renderProgrammingGridAndRollup();
    if (rebuildControls) renderProgrammingSidebarDynamicParams();
    renderProgrammingSidebarProformaAndChrome();
  }

  // ===================== EXECUTIVE DASHBOARD RENDER =====================
  function renderDashboardDerived() {
    const rosterSummary = computeRosterSummary();
    const matrix = computePerformanceMatrix(rosterSummary);

    elVal('dash-oh-talent', state.ownedOverheads.talentCost);
    elVal('dash-oh-production', state.ownedOverheads.productionCost);
    elVal('dash-oh-marketing', state.ownedOverheads.marketingCost);
    elVal('dash-oh-other', state.ownedOverheads.otherCost);
    elVal('dash-oh-fee', state.ownedOverheads.merchantFeePct);

    elText('dash-overheads-summary',
      'Fixed Direct Overheads: $' + formatMoney(matrix.ownedFixedOverheads) + '/night · Terminal Fees: ' + state.ownedOverheads.merchantFeePct.toFixed(1) + '%'
    );
    elText('dash-matrix-subtitle',
      'Dynamically recalculated using Wage Calculator ($' + formatMoney(rosterSummary.grossWages) + '/night) & Trough-Owned Direct Overheads ($' + formatMoney(matrix.ownedFixedOverheads) + ')'
    );

    // KPI Cards
    const kpiEl = document.getElementById('dash-kpis');
    if (kpiEl) {
      kpiEl.innerHTML =
        '<div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 hover:border-neutral-600 transition shadow-sm">' +
          '<div class="flex justify-between items-start"><span class="text-xs font-medium text-trough-muted uppercase tracking-wider">Target Gross (200 Pax)</span><span class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs"><i class="fa-solid fa-arrow-trend-up"></i></span></div>' +
          '<div class="mt-2 flex items-baseline gap-2"><span class="text-2xl sm:text-3xl font-bold tracking-tight text-white">$11,000</span><span class="text-[11px] text-emerald-400 font-medium">Owned Night</span></div>' +
          '<p class="mt-1 text-[11px] text-trough-muted">$6k Tickets + $4.5k Bar + $500 Cloak</p>' +
        '</div>' +
        '<div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 hover:border-trough-yellow/50 transition shadow-sm relative overflow-hidden">' +
          '<div class="flex justify-between items-start"><span class="text-xs font-medium text-trough-yellow uppercase tracking-wider">Target Net Surplus</span><span class="p-1.5 rounded-lg bg-trough-yellow/10 text-trough-yellow text-xs"><i class="fa-solid fa-sack-dollar"></i></span></div>' +
          '<div class="mt-2 flex items-baseline gap-2"><span class="text-2xl sm:text-3xl font-bold tracking-tight text-trough-yellow">$' + formatInt(matrix.targetOwned.surplus) + '</span><span class="text-[11px] text-trough-yellow font-medium">' + matrix.targetOwned.marginPct.toFixed(1) + '% Margin</span></div>' +
          '<p class="mt-1 text-[11px] text-trough-muted">Gross Margin less $' + formatMoney(matrix.targetOwned.wages) + ' Wages &amp; $' + formatMoney(matrix.targetOwned.overheads) + ' Overheads</p>' +
        '</div>' +
        '<div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 hover:border-neutral-600 transition shadow-sm">' +
          '<div class="flex justify-between items-start"><span class="text-xs font-medium text-trough-muted uppercase tracking-wider">Labour Cost Ratio</span><span class="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs"><i class="fa-solid fa-clock-rotate-left"></i></span></div>' +
          '<div class="mt-2 flex items-baseline gap-2"><span class="text-2xl sm:text-3xl font-bold tracking-tight text-white">' + matrix.targetOwned.labourPct.toFixed(1) + '%</span><span class="text-[11px] text-emerald-400 font-medium">&le; 30% Benchmark</span></div>' +
          '<p class="mt-1 text-[11px] text-trough-muted">$' + formatMoney(matrix.targetOwned.wages) + ' Total Direct Shift Wages</p>' +
        '</div>' +
        '<div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 hover:border-neutral-600 transition shadow-sm">' +
          '<div class="flex justify-between items-start"><span class="text-xs font-medium text-trough-muted uppercase tracking-wider">Promoter Breakeven</span><span class="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs"><i class="fa-solid fa-scale-balanced"></i></span></div>' +
          '<div class="mt-2 flex items-baseline gap-2"><span class="text-2xl sm:text-3xl font-bold tracking-tight text-white">' + matrix.promoterBreakevenNoDeposit + ' Pax</span><span class="text-[11px] text-amber-300 font-mono">' + matrix.promoterBreakevenWithDeposit + ' w/ Deposit</span></div>' +
          '<p class="mt-1 text-[11px] text-trough-muted">Based on $5 Clip + $22.50 bar spend</p>' +
        '</div>';
    }

    // Bar Chart
    const barEl = document.getElementById('dash-bar-chart');
    if (barEl) {
      const scenarios = [
        { label: 'Actual (11 Sept)', gross: Math.round(matrix.actuals.gross), wages: Math.round(matrix.actuals.wages), surplus: Math.round(matrix.actuals.surplus) },
        { label: 'Owned (120 Pax)', gross: Math.round(matrix.conservativeOwned.gross), wages: Math.round(matrix.conservativeOwned.wages), surplus: Math.round(matrix.conservativeOwned.surplus) },
        { label: 'Owned (200 Pax)', gross: Math.round(matrix.targetOwned.gross), wages: Math.round(matrix.targetOwned.wages), surplus: Math.round(matrix.targetOwned.surplus) },
        { label: 'Owned Peak (280)', gross: Math.round(matrix.peakOwned.gross), wages: Math.round(matrix.peakOwned.wages), surplus: Math.round(matrix.peakOwned.surplus) },
        { label: 'Promoter (200)', gross: Math.round(matrix.promoterTarget.gross), wages: Math.round(matrix.promoterTarget.wages), surplus: Math.round(matrix.promoterTarget.surplus) }
      ];
      const yMax = 20000;
      const yTicks = [20000, 15000, 10000, 5000, 0];
      barEl.innerHTML =
        '<div class="relative h-64 sm:h-72 w-full flex flex-col justify-between pt-2">' +
          '<div class="relative flex-1 flex">' +
            '<div class="flex flex-col justify-between pr-3 text-[10px] text-[#A3A3A3] font-mono select-none">' +
              yTicks.map((v) => '<span class="leading-none">$' + v.toLocaleString() + '</span>').join('') +
            '</div>' +
            '<div class="relative flex-1 border-l border-b border-white/5 flex items-end justify-around px-2">' +
              '<div class="absolute inset-0 flex flex-col justify-between pointer-events-none">' +
                yTicks.map(() => '<div class="w-full border-t border-white/5 h-0"></div>').join('') +
              '</div>' +
              scenarios.map((it) => {
                const gPct = Math.min(100, Math.max(0, (it.gross / yMax) * 100));
                const wPct = Math.min(100, Math.max(0, (it.wages / yMax) * 100));
                const sPct = Math.min(100, Math.max(0, (Math.max(0, it.surplus) / yMax) * 100));
                return '<div class="relative z-10 flex items-end justify-center gap-1.5 sm:gap-2 h-full w-1/5 px-1 group">' +
                  '<div style="height:' + gPct + '%" title="Gross Turnover: $' + it.gross.toLocaleString() + '" class="w-3 sm:w-5 bg-[#4D4D4D] hover:brightness-110 rounded-t-md transition-all"></div>' +
                  '<div style="height:' + wPct + '%" title="Wages Roster: $' + it.wages.toLocaleString() + '" class="w-3 sm:w-5 bg-[#F43F5E] hover:brightness-110 rounded-t-md transition-all"></div>' +
                  '<div style="height:' + sPct + '%" title="Net Surplus: $' + it.surplus.toLocaleString() + '" class="w-3 sm:w-5 bg-[#FFCC00] hover:brightness-110 rounded-t-md transition-all"></div>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div class="flex pl-12 pt-2.5 justify-around text-[10px] text-[#A3A3A3] text-center">' +
            scenarios.map((s) => '<div class="w-1/5 truncate px-0.5">' + escapeHtml(s.label) + '</div>').join('') +
          '</div>' +
        '</div>';
    }

    // Doughnut Chart
    const dChartEl = document.getElementById('dash-doughnut-chart');
    const dLegEl = document.getElementById('dash-doughnut-legend');
    if (dChartEl) {
      const segs = [
        { label: 'Net Surplus', value: Math.max(0, Math.round(matrix.targetOwned.surplus)), color: '#FFCC00' },
        { label: 'Direct Wages', value: Math.max(0, Math.round(matrix.targetOwned.wages)), color: '#F43F5E' },
        { label: 'Direct Overheads', value: Math.max(0, Math.round(matrix.targetOwned.overheads)), color: '#3B82F6' },
        { label: 'Beverage COGS & Bar', value: Math.max(0, Math.round(matrix.targetOwned.totalCogs)), color: '#10B981' }
      ];
      const total = Math.max(1, segs.reduce((a, s) => a + s.value, 0));
      const r = 72, circ = 2 * Math.PI * r;
      let cum = 0;
      const circles = segs.map((s) => {
        const frac = s.value / total;
        const da = (frac * circ) + ' ' + circ;
        const doff = -cum * circ;
        cum += frac;
        return '<circle cx="95" cy="95" r="' + r + '" fill="transparent" stroke="' + s.color + '" stroke-width="22" stroke-dasharray="' + da + '" stroke-dashoffset="' + doff + '" class="transition-all duration-300 hover:opacity-90"><title>' + s.label + ': $' + s.value.toLocaleString() + ' AUD</title></circle>';
      }).join('');
      const sPct = matrix.targetOwned.gross > 0 ? (matrix.targetOwned.surplus / matrix.targetOwned.gross) * 100 : 0;

      dChartEl.innerHTML =
        '<div class="relative flex items-center justify-center">' +
          '<svg width="190" height="190" viewBox="0 0 190 190" class="-rotate-90">' + circles + '</svg>' +
          '<div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">' +
            '<span class="text-[10px] uppercase tracking-wider text-trough-muted">Target Gross</span>' +
            '<span class="text-lg font-extrabold font-mono text-white">$' + formatInt(matrix.targetOwned.gross) + '</span>' +
            '<span class="text-[10px] text-trough-yellow font-semibold">' + sPct.toFixed(1) + '% Surplus</span>' +
          '</div>' +
        '</div>';
    }
    if (dLegEl) {
      dLegEl.innerHTML =
        '<div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-trough-yellow"></span><span>Net Surplus ($' + formatInt(matrix.targetOwned.surplus) + ')</span></div>' +
        '<div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span><span>Direct Wages ($' + formatInt(matrix.targetOwned.wages) + ')</span></div>' +
        '<div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span>Overheads ($' + formatInt(matrix.targetOwned.overheads) + ')</span></div>' +
        '<div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span>COGS ($' + formatInt(matrix.targetOwned.totalCogs) + ')</span></div>';
    }

    // Matrix Table
    const tbody = document.getElementById('dash-matrix-tbody');
    if (tbody) {
      tbody.innerHTML = matrix.rows.map((row) => {
        const isBase = row.id === 'target-owned';
        const lBadge = row.labourPct > 50 ? 'bg-red-500/20 text-red-400 font-bold'
          : row.labourPct > 30 ? 'bg-amber-500/10 text-amber-400'
          : isBase ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-emerald-500/10 text-emerald-400';
        const sCls = row.surplus >= 0 ? (isBase ? 'text-trough-yellow text-sm' : 'text-trough-yellow') : 'text-rose-400';
        return '<tr class="' + (isBase ? 'bg-trough-yellow/5 border-l-2 border-trough-yellow hover:bg-trough-yellow/10' : 'hover:bg-neutral-800/40') + '">' +
          '<td class="py-3 px-3.5 flex items-center gap-2 ' + (isBase ? 'font-semibold text-white' : 'font-medium') + '"><span class="w-2 h-2 rounded-full ' + row.dotClass + '"></span> ' + escapeHtml(row.name) + '</td>' +
          '<td class="py-3 px-3.5 font-mono ' + (isBase ? 'font-bold text-white' : '') + '">' + escapeHtml(row.paxLabel) + '</td>' +
          '<td class="py-3 px-3.5 font-mono ' + (isBase ? 'font-bold text-white' : '') + '">$' + formatMoney(row.gross) + '</td>' +
          '<td class="py-3 px-3.5 font-mono text-neutral-400">($' + formatMoney(row.totalCogs) + ')</td>' +
          '<td class="py-3 px-3.5 font-mono text-rose-300">($' + formatMoney(row.wages) + ')</td>' +
          '<td class="py-3 px-3.5 font-mono text-blue-300">($' + formatMoney(row.overheads) + ')</td>' +
          '<td class="py-3 px-3.5 font-mono"><span class="px-2 py-0.5 rounded ' + lBadge + '">' + row.labourPct.toFixed(1) + '%</span></td>' +
          '<td class="py-3 px-3.5 font-mono text-right font-bold ' + sCls + '">' +
            (row.surplus >= 0 ? '+$' + formatMoney(row.surplus) : '-$' + formatMoney(Math.abs(row.surplus))) +
          '</td></tr>';
      }).join('');
    }
  }

  function renderDashboardTab() {
    renderDashboardDerived();
  }

  // ===================== MAIN SIMULATOR TAB RENDER =====================
  function renderSimulatorControls() {
    const sim = computeSimMetrics();
    const ctrlEl = document.getElementById('sim-controls-dynamic');
    if (!ctrlEl) return;

    if (state.simMode === 'fixed_hire') {
      const presets = [2500, 3500, 5000, 7500, 10000].map((p) =>
        '<button type="button" onclick="onSidebarFixedFeeInput(' + p + ', true)" class="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition cursor-pointer ' +
        (state.simFixedHireFee === p ? 'bg-trough-yellow text-black border-trough-yellow font-bold' : 'bg-[#222222] text-neutral-300 border-neutral-700 hover:border-neutral-500') + '">$' + p.toLocaleString() + '</button>'
      ).join('');
      ctrlEl.innerHTML =
        '<div class="space-y-4 p-4 rounded-xl bg-[#191919] border border-trough-yellow/40">' +
          '<div class="flex flex-wrap items-center justify-between gap-2">' +
            '<div><span class="text-xs font-bold text-trough-yellow block">Flat Contracted Venue Hire Fee</span><span class="text-[11px] text-neutral-400">Stand-alone flat hire rate — does not scale by attendance or bar spend</span></div>' +
            '<div class="h-10 inline-flex items-center bg-[#222222] border border-trough-yellow/50 rounded-lg px-2.5"><span class="text-trough-yellow font-mono text-sm font-bold mr-1">$</span><input type="number" id="sim-input-fixedfee" min="0" step="100" value="' + state.simFixedHireFee + '" oninput="onSidebarFixedFeeInput(this.value, false)" class="w-24 bg-transparent text-right font-mono font-bold text-white text-sm focus:outline-none tabular-nums" /></div>' +
          '</div>' +
          '<input type="range" id="sim-slider-fixedfee" min="500" max="25000" step="250" value="' + Math.min(25000, Math.max(500, state.simFixedHireFee)) + '" oninput="onSidebarFixedFeeInput(this.value, false)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" />' +
          '<div class="flex flex-wrap gap-1.5 pt-1">' + presets + '</div>' +
          '<div class="p-3 rounded-lg bg-[#222222] border border-neutral-800 text-[11px] text-neutral-300 space-y-1"><div class="font-semibold text-white">Isolated Revenue Rules:</div><p>Net surplus equals the flat hire fee minus base IFA roster shift wages (<span id="sim-lbl-fixedwages" class="font-mono text-rose-300">$' + formatMoney(sim.baseRosterWages) + '</span>).</p></div>' +
        '</div>';
      return;
    }

    const secondControl = state.simMode === 'owned'
      ? '<div><div class="flex justify-between text-xs mb-1.5"><span class="text-neutral-300 font-medium">Average Door Ticket Yield (Net AUD)</span><span id="sim-lbl-price" class="font-mono font-bold text-white">$' + state.simTicketPrice.toFixed(2) + '</span></div>' +
        '<input type="range" id="sim-slider-price" min="15" max="60" step="1" value="' + state.simTicketPrice + '" oninput="onSidebarTicketPriceInput(this.value)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" /></div>'
      : '<div><div class="flex justify-between items-center text-xs mb-1.5"><span class="text-trough-yellow font-semibold">Venue Ticket Clip / Patron (AUD)</span><div class="flex items-center bg-[#191919] border border-trough-yellow/50 rounded-md px-2 py-0.5"><span class="text-trough-yellow font-mono text-xs mr-1">$</span><input type="number" id="sim-input-clip" min="0" max="30" step="0.5" value="' + state.simTicketClip + '" oninput="onSidebarTicketClipInput(this.value)" class="w-14 bg-transparent text-right font-mono font-bold text-white text-xs focus:outline-none tabular-nums" /></div></div>' +
        '<input type="range" id="sim-slider-clip" min="0" max="20" step="0.5" value="' + Math.min(20, state.simTicketClip) + '" oninput="onSidebarTicketClipInput(this.value)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" /></div>';

    const tailControl = state.simMode === 'promoter'
      ? '<label class="flex items-center justify-between p-3 rounded-xl bg-[#191919] border border-neutral-800 cursor-pointer text-xs"><span class="text-neutral-200 font-medium">Include $550 Non-Refundable Venue Deposit</span><input type="checkbox" id="sim-input-deposit" ' + (state.simPromoterDeposit ? 'checked' : '') + ' onchange="onSidebarDepositToggle(this.checked)" class="accent-trough-yellow w-4 h-4 rounded cursor-pointer" /></label>'
      : '<div class="bg-[#191919] border border-neutral-800 rounded-xl p-3 space-y-2">' +
          '<div class="flex items-center justify-between text-xs"><span class="font-semibold text-neutral-200">Trough-Owned Direct Overheads</span><span id="sim-oh-total-lbl" class="font-mono text-trough-yellow font-bold">$' + formatMoney(sim.fixedDirectOverheads) + '</span></div>' +
          '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">' +
            '<div><label class="text-neutral-400 block mb-0.5">DJ / Talent ($)</label><input type="number" id="sim-oh-talent" value="' + state.ownedOverheads.talentCost + '" oninput="updateOwnedOverhead(\'talentCost\', parseFloat(this.value) || 0)" class="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white" /></div>' +
            '<div><label class="text-neutral-400 block mb-0.5">Production ($)</label><input type="number" id="sim-oh-production" value="' + state.ownedOverheads.productionCost + '" oninput="updateOwnedOverhead(\'productionCost\', parseFloat(this.value) || 0)" class="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white" /></div>' +
            '<div><label class="text-neutral-400 block mb-0.5">Marketing ($)</label><input type="number" id="sim-oh-marketing" value="' + state.ownedOverheads.marketingCost + '" oninput="updateOwnedOverhead(\'marketingCost\', parseFloat(this.value) || 0)" class="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white" /></div>' +
            '<div><label class="text-neutral-400 block mb-0.5">Other ($)</label><input type="number" id="sim-oh-other" value="' + state.ownedOverheads.otherCost + '" oninput="updateOwnedOverhead(\'otherCost\', parseFloat(this.value) || 0)" class="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white" /></div>' +
            '<div><label class="text-neutral-400 block mb-0.5">Merchant (%)</label><input type="number" id="sim-oh-fee" step="0.1" value="' + state.ownedOverheads.merchantFeePct + '" oninput="updateOwnedOverhead(\'merchantFeePct\', parseFloat(this.value) || 0)" class="w-full bg-[#222222] border border-neutral-700 rounded px-2 py-1 font-mono text-white" /></div>' +
          '</div>' +
        '</div>';

    ctrlEl.innerHTML =
      '<div><div class="flex justify-between text-xs mb-1.5"><span class="text-neutral-300 font-medium">Expected Attendance (Patrons)</span><span id="sim-lbl-pax" class="font-mono font-bold text-trough-yellow">' + state.simPax + ' Pax</span></div>' +
      '<input type="range" id="sim-slider-pax" min="50" max="300" step="10" value="' + state.simPax + '" oninput="onSidebarPaxInput(this.value)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" />' +
      '<div class="flex justify-between text-[10px] text-trough-muted mt-1"><span>50</span><span>150</span><span>220</span><span>300 Max Cap</span></div></div>' +
      secondControl +
      '<div><div class="flex justify-between text-xs mb-1.5"><span class="text-neutral-300 font-medium">Average Bar Spend / Head</span><span id="sim-lbl-bar" class="font-mono font-bold text-white">$' + state.simBarSpend.toFixed(2) + '</span></div>' +
      '<input type="range" id="sim-slider-bar" min="12" max="45" step="0.5" value="' + state.simBarSpend + '" oninput="onSidebarBarSpendInput(this.value)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" /></div>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
        '<div><div class="flex justify-between text-xs mb-1.5"><span class="text-neutral-300 font-medium">Cloakroom Check-In</span><span id="sim-lbl-cloak" class="font-mono font-bold text-white">' + state.simCloakRate + '%</span></div>' +
        '<input type="range" id="sim-slider-cloak" min="0" max="100" step="5" value="' + state.simCloakRate + '" oninput="onSidebarCloakInput(this.value)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" /></div>' +
        '<div><div class="flex justify-between text-xs mb-1.5"><span class="text-neutral-300 font-medium">Beverage COGS Target</span><span id="sim-lbl-cogs" class="font-mono font-bold text-white">' + state.simCogsRate.toFixed(1) + '%</span></div>' +
        '<input type="range" id="sim-slider-cogs" min="10" max="45" step="0.1" value="' + state.simCogsRate + '" oninput="onSidebarCogsInput(this.value)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" /></div>' +
      '</div>' +
      tailControl +
      '<div id="sim-lbl-staff" class="p-3 rounded-xl bg-[#191919] border border-neutral-800 text-[11px] font-mono text-neutral-300 flex justify-between">' +
        '<span>Auto-Scaled Roster: <strong class="text-white">' + sim.staffCount + ' Staff</strong> (' + sim.guards + ' Sec / ' + sim.bartenders + ' Bar)</span>' +
        '<span class="text-rose-300 font-bold">$' + formatMoney(sim.baseRosterWages) + '</span>' +
      '</div>';
  }

  function renderSimulatorProformaAndChrome() {
    const sim = computeSimMetrics();
    const isEditing = state.editingEventIndex !== null && state.events[state.editingEventIndex];

    const pill = document.getElementById('sim-editing-pill');
    if (pill) {
      pill.className = 'text-[11px] px-2 py-0.5 rounded-full font-mono ' +
        (isEditing ? 'bg-trough-yellow/20 text-trough-yellow border border-trough-yellow/40' : 'bg-neutral-800 text-neutral-300 border border-neutral-700');
      pill.textContent = isEditing
        ? ('Editing Event #' + (state.editingEventIndex + 1) + ': ' + state.events[state.editingEventIndex].title)
        : 'New / Custom Event Mode';
    }

    const sel = document.getElementById('sim-event-select');
    if (sel) {
      const opts = ['<option value="new">+ Create New Forthcoming Event</option>'].concat(
        state.events.map((ev, idx) =>
          '<option value="' + idx + '"' + (state.editingEventIndex === idx ? ' selected' : '') + '>' +
            escapeHtml(ev.date + ' — ' + ev.title + ' (' + ev.pax + ' Pax)') +
          '</option>'
        )
      );
      sel.innerHTML = opts.join('');
    }

    elVal('sim-input-date', state.simEventDate);
    elVal('sim-input-title', state.simEventTitle);
    elVal('sim-input-format', state.simEventFormat);

    const saveBtns = document.getElementById('sim-save-buttons');
    if (saveBtns) {
      if (isEditing) {
        saveBtns.innerHTML =
          '<button type="button" onclick="saveSimulatorToExistingEvent()" class="flex-1 h-9 px-3 rounded-lg bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"><i class="fa-solid fa-floppy-disk"></i><span>Save Changes</span></button>' +
          '<button type="button" onclick="saveSimulatorAsNewEvent()" class="h-9 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap" title="Save as a separate new event"><i class="fa-solid fa-copy"></i><span>Copy</span></button>';
      } else {
        saveBtns.innerHTML =
          '<button type="button" onclick="saveSimulatorAsNewEvent()" class="w-full h-9 px-3 rounded-lg bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"><i class="fa-solid fa-calendar-plus"></i><span>Add to Forthcoming Events</span></button>';
      }
    }

    const notice = document.getElementById('sim-save-notice');
    if (notice) {
      notice.classList.toggle('hidden', !state.simSaveNotice);
      elText('sim-save-notice-text', state.simSaveNotice || '');
    }

    const modeBtns = [['owned', 'sim-mode-owned'], ['promoter', 'sim-mode-promoter'], ['fixed_hire', 'sim-mode-fixed']];
    modeBtns.forEach(([m, id]) => {
      const b = document.getElementById(id);
      if (b) {
        b.className = 'h-9 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ' +
          (state.simMode === m ? 'bg-trough-yellow text-black font-bold shadow-sm' : 'text-neutral-300 hover:text-white');
      }
    });

    const proPanel = document.getElementById('sim-proforma-panel');
    if (proPanel) {
      const revRows = state.simMode === 'fixed_hire'
        ? '<div class="flex justify-between text-neutral-300"><span>Flat Contracted Venue Hire Fee</span><span class="font-mono">$' + formatMoney(sim.fixedHireRevenue) + '</span></div>'
        : '<div class="flex justify-between text-neutral-300"><span>' + (state.simMode === 'owned' ? 'Door Ticket Sales' : 'Venue Ticket Clip (' + state.simPax + ' × $' + state.simTicketClip.toFixed(2) + ')') + '</span><span class="font-mono">$' + formatMoney(sim.ticketRevenue) + '</span></div>' +
          '<div class="flex justify-between text-neutral-300"><span>Bar &amp; Beverage POS Sales (' + state.simPax + ' × $' + state.simBarSpend.toFixed(2) + ')</span><span class="font-mono">$' + formatMoney(sim.barRevenue) + '</span></div>' +
          '<div class="flex justify-between text-neutral-300"><span>Cloakroom Operations (@ $5/item)</span><span class="font-mono">$' + formatMoney(sim.cloakRevenue) + '</span></div>' +
          (sim.depositRevenue > 0 ? '<div class="flex justify-between text-emerald-300"><span>Non-Refundable Booking Deposit</span><span class="font-mono">+$' + formatMoney(sim.depositRevenue) + '</span></div>' : '');

      const overheadRows = state.simMode === 'owned'
        ? '<div class="flex justify-between text-neutral-400"><span>DJ &amp; Talent / Production / Marketing / Other</span><span class="font-mono">($' + formatMoney(sim.fixedDirectOverheads) + ')</span></div>' +
          '<div class="flex justify-between text-neutral-400"><span>EFTPOS Merchant Terminal (' + state.ownedOverheads.merchantFeePct.toFixed(1) + '%)</span><span class="font-mono">($' + formatMoney(sim.terminalFees) + ')</span></div>'
        : state.simMode === 'promoter'
        ? '<div class="flex justify-between text-neutral-400"><span>Production &amp; Cleaning Flat Overhead</span><span class="font-mono">($150.00)</span></div>' +
          '<div class="flex justify-between text-neutral-400"><span>EFTPOS Terminal Fees (1.5%)</span><span class="font-mono">($' + formatMoney(sim.terminalFees) + ')</span></div>'
        : '<div class="flex justify-between text-neutral-500"><span>No variable event overheads under flat hire</span><span class="font-mono">$0.00</span></div>';

      proPanel.innerHTML =
        '<div class="space-y-4">' +
          '<div class="flex items-center justify-between border-b border-neutral-800 pb-3">' +
            '<div><h3 class="font-bold text-base text-white">Event Pro-Forma Financial Statement</h3><span class="text-xs text-trough-muted">' + escapeHtml(state.simEventTitle) + ' · ' + escapeHtml(state.simEventDate) + '</span></div>' +
            '<span class="px-2.5 py-1 rounded-full text-xs font-bold font-mono ' + (sim.netSurplus >= 0 ? 'bg-trough-yellow/20 text-trough-yellow border border-trough-yellow/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40') + '">' + sim.marginRatio.toFixed(1) + '% Net Margin</span>' +
          '</div>' +
          '<div class="space-y-2 text-xs">' +
            '<div class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">1. Revenue Streams</div>' +
            revRows +
            '<div class="flex justify-between font-bold text-white border-t border-neutral-800 pt-1.5"><span>Total Gross Venue Turnover</span><span class="font-mono">$' + formatMoney(sim.grossTurnover) + '</span></div>' +
          '</div>' +
          '<div class="space-y-2 text-xs pt-2 border-t border-neutral-800">' +
            '<div class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">2. Cost of Goods Sold (Bar &amp; Consumables)</div>' +
            '<div class="flex justify-between text-neutral-300"><span>Beverage Stock COGS (' + state.simCogsRate.toFixed(1) + '% Target)</span><span class="font-mono text-rose-300">($' + formatMoney(sim.beverageCogs) + ')</span></div>' +
            '<div class="flex justify-between text-neutral-300"><span>Bar Ice, Glassware &amp; Consumables</span><span class="font-mono text-rose-300">($' + formatMoney(sim.consumables) + ')</span></div>' +
            '<div class="flex justify-between font-semibold text-emerald-400 border-t border-neutral-800 pt-1.5"><span>Venue Gross Profit Margin</span><span class="font-mono">$' + formatMoney(sim.grossMargin) + '</span></div>' +
          '</div>' +
          '<div class="space-y-2 text-xs pt-2 border-t border-neutral-800">' +
            '<div class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">3. Operational Wages &amp; Direct Overheads</div>' +
            '<div class="flex justify-between text-rose-300"><span>Active IFA Roster Wages (' + sim.staffCount + ' Staff)</span><span class="font-mono">($' + formatMoney(sim.baseRosterWages) + ')</span></div>' +
            overheadRows +
          '</div>' +
        '</div>' +
        '<div class="mt-5 pt-4 border-t-2 border-trough-yellow/40 flex flex-wrap items-center justify-between gap-3 bg-[#191919] p-4 rounded-xl">' +
          '<div><span class="text-xs uppercase tracking-wider text-trough-muted block">Projected Operating Surplus (Profit)</span><span class="text-xs font-mono text-neutral-400">Labour Ratio: <strong class="text-white">' + sim.wageRatio.toFixed(1) + '%</strong> · Total Costs: $' + formatMoney(sim.beverageCogs + sim.consumables + sim.baseRosterWages + sim.totalOverheads) + '</span></div>' +
          '<div class="text-3xl font-extrabold font-mono ' + (sim.netSurplus >= 0 ? 'text-trough-yellow' : 'text-rose-400') + '">' +
            (sim.netSurplus >= 0 ? '+$' + formatMoney(sim.netSurplus) : '-$' + formatMoney(Math.abs(sim.netSurplus))) +
          '</div>' +
        '</div>';
    }
  }

  function syncSimulatorDerivedOnly() {
    const sim = computeSimMetrics();
    elText('prog-lbl-pax', state.simPax + ' Pax');
    elText('prog-lbl-price', '$' + state.simTicketPrice.toFixed(2));
    elText('prog-lbl-bar', '$' + state.simBarSpend.toFixed(2));
    elText('prog-lbl-cloak', state.simCloakRate + '%');
    elText('prog-lbl-cogs', state.simCogsRate.toFixed(1) + '%');
    elText('prog-overheads-toggle-total', 'Direct Overheads ($' + formatInt(sim.fixedDirectOverheads) + ')');
    elText('sim-lbl-pax', state.simPax + ' Pax');
    elText('sim-lbl-price', '$' + state.simTicketPrice.toFixed(2));
    elText('sim-lbl-bar', '$' + state.simBarSpend.toFixed(2));
    elText('sim-lbl-cloak', state.simCloakRate + '%');
    elText('sim-lbl-cogs', state.simCogsRate.toFixed(1) + '%');
    elText('sim-lbl-fixedwages', '$' + formatMoney(sim.baseRosterWages));
    elText('sim-oh-total-lbl', '$' + formatMoney(sim.fixedDirectOverheads));

    const staffEl = document.getElementById('sim-lbl-staff');
    if (staffEl) {
      staffEl.innerHTML = '<span>Auto-Scaled Roster: <strong class="text-white">' + sim.staffCount + ' Staff</strong> (' + sim.guards + ' Sec / ' + sim.bartenders + ' Bar)</span><span class="text-rose-300 font-bold">$' + formatMoney(sim.baseRosterWages) + '</span>';
    }

    elVal('prog-slider-pax', state.simPax);
    elVal('sim-slider-pax', state.simPax);
    elVal('prog-slider-price', state.simTicketPrice);
    elVal('sim-slider-price', state.simTicketPrice);
    elVal('prog-input-clip', state.simTicketClip);
    elVal('sim-input-clip', state.simTicketClip);
    elVal('prog-slider-clip', Math.min(20, state.simTicketClip));
    elVal('sim-slider-clip', Math.min(20, state.simTicketClip));
    elVal('prog-slider-bar', state.simBarSpend);
    elVal('sim-slider-bar', state.simBarSpend);
    elVal('prog-slider-cloak', state.simCloakRate);
    elVal('sim-slider-cloak', state.simCloakRate);
    elVal('prog-slider-cogs', state.simCogsRate);
    elVal('sim-slider-cogs', state.simCogsRate);
    elVal('prog-input-fixedfee', state.simFixedHireFee);
    elVal('sim-input-fixedfee', state.simFixedHireFee);
    elVal('prog-slider-fixedfee', Math.min(25000, Math.max(500, state.simFixedHireFee)));
    elVal('sim-slider-fixedfee', Math.min(25000, Math.max(500, state.simFixedHireFee)));

    renderProgrammingSidebarProformaAndChrome();
    renderSimulatorProformaAndChrome();
    updateQuickModeLabel();
  }

  // ===================== WAGES TAB RENDER & ACTIONS =====================
  window.toggleWagesIncludeSuper = function (checked) {
    state.wagesIncludeSuper = Boolean(checked);
    saveOfflineCache();
    apiRequest('api/settings.php', 'PUT', { wagesIncludeSuper: state.wagesIncludeSuper });
    updateWagesDerivedOnly();
  };

  window.saveCurrentRosterToMysql = async function (noticeMsg) {
    const res = await apiRequest('api/settings.php', 'PUT', {
      roster: state.roster,
      wagesIncludeSuper: state.wagesIncludeSuper
    });
    if (res && Array.isArray(res.roster)) state.roster = res.roster;
    state.wagesSavedNotice = (noticeMsg || 'Saved active wage entries') + ' (' + nowTimeLabel() + ')';
    saveOfflineCache();
    renderWagesTab(false);
  };

  window.updateRosterField = function (index, field, val) {
    if (!state.roster[index]) return;
    if (field === 'headcount' || field === 'hours' || field === 'rate') {
      state.roster[index][field] = Math.max(0, parseFloat(val) || 0);
    } else {
      state.roster[index][field] = String(val);
    }
    saveOfflineCache();
    debounced('roster_save', () => {
      apiRequest('api/settings.php', 'PUT', { roster: state.roster, wagesIncludeSuper: state.wagesIncludeSuper });
    }, 500);
    updateWagesDerivedOnly();
    renderDashboardDerived();
    syncSimulatorDerivedOnly();
    renderPromoterDerived();
  };

  window.toggleRosterHasSuper = function (index) {
    if (!state.roster[index]) return;
    state.roster[index].hasSuper = !state.roster[index].hasSuper;
    saveOfflineCache();
    apiRequest('api/settings.php', 'PUT', { roster: state.roster, wagesIncludeSuper: state.wagesIncludeSuper });
    renderAll({ rebuildRoster: true });
  };

  window.addRosterRole = function () {
    state.roster.push({
      role: 'Additional Operational Staff',
      headcount: 1,
      hours: 6.0,
      rate: 35.0,
      hasSuper: true,
      notes: 'Custom floor, barback, or production support shift'
    });
    saveOfflineCache();
    apiRequest('api/settings.php', 'PUT', { roster: state.roster, wagesIncludeSuper: state.wagesIncludeSuper });
    renderAll({ rebuildRoster: true });
  };

  window.removeRosterRole = function (index) {
    state.roster.splice(index, 1);
    saveOfflineCache();
    apiRequest('api/settings.php', 'PUT', { roster: state.roster, wagesIncludeSuper: state.wagesIncludeSuper });
    renderAll({ rebuildRoster: true });
  };

  window.resetRosterDefaults = async function () {
    const res = await apiRequest('api/settings.php', 'PUT', { action: 'reset_roster' });
    if (res && Array.isArray(res.roster)) state.roster = res.roster;
    else state.roster = clone(BASELINE_ROSTER);
    state.wagesIncludeSuper = true;
    state.wagesSavedNotice = 'Restored default IFA roster (' + nowTimeLabel() + ')';
    saveOfflineCache();
    renderAll({ rebuildRoster: true });
  };

  window.loadRosterTemplate = function (tplId) {
    const tpl = state.templates.find((t) => t.id === tplId);
    if (!tpl) return;
    state.roster = clone(tpl.items || []);
    state.wagesIncludeSuper = Boolean(tpl.includeSuper);
    state.wagesSavedNotice = 'Loaded "' + tpl.name + '"';
    saveOfflineCache();
    apiRequest('api/settings.php', 'PUT', { roster: state.roster, wagesIncludeSuper: state.wagesIncludeSuper });
    renderAll({ rebuildRoster: true });
  };

  window.saveNamedRosterTemplate = async function () {
    const inputEl = document.getElementById('wages-new-template-name');
    const summary = computeRosterSummary();
    const rawName = inputEl ? inputEl.value.trim() : '';
    const cleanName = rawName || ('Custom Roster (' + summary.totalHeadcount + ' Staff — $' + Math.round(summary.grandTotal) + ')');
    const tpl = {
      id: 'tpl-' + Date.now(),
      name: cleanName,
      updatedAt: new Date().toLocaleDateString('en-AU'),
      includeSuper: state.wagesIncludeSuper,
      isSystem: false,
      items: clone(state.roster)
    };
    state.templates.unshift(tpl);
    if (inputEl) inputEl.value = '';
    const res = await apiRequest('api/settings.php', 'PUT', Object.assign({ action: 'save_template' }, tpl));
    if (res && Array.isArray(res.templates)) state.templates = res.templates;
    state.wagesSavedNotice = 'Saved template "' + cleanName + '" (' + nowTimeLabel() + ')';
    saveOfflineCache();
    renderWagesTab(false);
  };

  window.deleteRosterTemplate = async function (tplId) {
    state.templates = state.templates.filter((t) => t.id !== tplId);
    const res = await apiRequest('api/settings.php', 'PUT', { action: 'delete_template', id: tplId });
    if (res && Array.isArray(res.templates)) state.templates = res.templates;
    saveOfflineCache();
    renderWagesTab(false);
  };

  function updateWagesDerivedOnly() {
    const summary = computeRosterSummary();
    summary.itemsWithTotals.forEach((it, idx) => {
      elText('wages-row-total-' + idx, '$' + formatMoney(it.itemTotal));
    });
    const kpiBar = document.getElementById('wages-kpi-bar');
    if (kpiBar) {
      kpiBar.innerHTML =
        '<div class="bg-[#1E1E1E] p-3 rounded-xl border border-neutral-800"><span class="text-[11px] text-trough-muted block">Total Headcount</span><span class="text-xl font-bold font-mono text-white">' + summary.totalHeadcount + ' Staff</span></div>' +
        '<div class="bg-[#1E1E1E] p-3 rounded-xl border border-neutral-800"><span class="text-[11px] text-trough-muted block">Total Rostered Hours</span><span class="text-xl font-bold font-mono text-white">' + summary.totalHours.toFixed(1) + ' Hrs</span></div>' +
        '<div class="bg-[#1E1E1E] p-3 rounded-xl border border-neutral-800"><span class="text-[11px] text-trough-muted block">Direct Gross Wages</span><span class="text-xl font-bold font-mono text-white">$' + formatMoney(summary.grossWages) + '</span></div>' +
        '<div class="bg-gradient-to-r from-trough-cardDark to-[#191919] p-3 rounded-xl border border-trough-yellow"><span class="text-[11px] text-trough-yellow font-medium block">Total Roster Commitment</span><span class="text-xl font-bold font-mono text-trough-yellow">$' + formatMoney(summary.grandTotal) + '</span></div>';
    }
  }

  function renderWagesTab(rebuildRows) {
    const cb = document.getElementById('wages-super-checkbox');
    if (cb) cb.checked = state.wagesIncludeSuper;

    const notice = document.getElementById('wages-saved-notice');
    if (notice) {
      notice.classList.toggle('hidden', !state.wagesSavedNotice);
      notice.textContent = state.wagesSavedNotice || '';
    }

    const tplList = document.getElementById('wages-templates-list');
    if (tplList) {
      tplList.innerHTML = state.templates.map((tpl) => {
        const isPreset = tpl.isSystem || String(tpl.id).startsWith('baseline-') || String(tpl.id).startsWith('peak-');
        return '<div class="inline-flex items-center bg-[#252525] border border-neutral-700 rounded-lg overflow-hidden text-xs">' +
          '<button type="button" onclick="loadRosterTemplate(\'' + escapeAttr(tpl.id) + '\')" class="px-2.5 py-1 hover:bg-neutral-700 text-neutral-200 hover:text-trough-yellow transition flex items-center gap-1.5 cursor-pointer">' +
            '<i class="fa-solid fa-folder-open text-trough-yellow text-[10px]"></i>' +
            '<span class="font-medium">' + escapeHtml(tpl.name) + '</span>' +
            '<span class="text-[10px] text-neutral-500 font-mono">(' + escapeHtml(tpl.updatedAt) + ')</span>' +
          '</button>' +
          (!isPreset ? '<button type="button" onclick="deleteRosterTemplate(\'' + escapeAttr(tpl.id) + '\')" class="px-2 py-1 text-neutral-500 hover:text-rose-400 border-l border-neutral-700 transition cursor-pointer" title="Delete saved template"><i class="fa-solid fa-xmark"></i></button>' : '') +
        '</div>';
      }).join('');
    }

    if (rebuildRows) {
      const summary = computeRosterSummary();
      const tbody = document.getElementById('wages-roster-tbody');
      if (tbody) {
        tbody.innerHTML = summary.itemsWithTotals.map((item, idx) =>
          '<tr class="hover:bg-neutral-800/40 transition">' +
            '<td class="py-2.5 px-3 space-y-1 min-w-[240px]">' +
              '<input type="text" value="' + escapeAttr(item.role) + '" oninput="updateRosterField(' + idx + ', \'role\', this.value)" class="w-full bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-trough-yellow focus:bg-[#1E1E1E] rounded px-1.5 py-0.5 font-medium text-white text-xs focus:outline-none" />' +
              '<input type="text" value="' + escapeAttr(item.notes) + '" oninput="updateRosterField(' + idx + ', \'notes\', this.value)" class="w-full bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-trough-yellow focus:bg-[#1E1E1E] rounded px-1.5 py-0.5 text-[11px] text-neutral-400 focus:outline-none" />' +
            '</td>' +
            '<td class="py-3 px-3 text-center"><input type="number" min="0" max="15" value="' + item.headcount + '" oninput="updateRosterField(' + idx + ', \'headcount\', this.value)" class="w-14 bg-[#1E1E1E] border border-neutral-700 rounded px-2 py-1 text-center font-mono text-white text-xs focus:border-trough-yellow focus:outline-none" /></td>' +
            '<td class="py-3 px-3 text-center"><input type="number" step="0.5" min="0" max="16" value="' + item.hours + '" oninput="updateRosterField(' + idx + ', \'hours\', this.value)" class="w-16 bg-[#1E1E1E] border border-neutral-700 rounded px-2 py-1 text-center font-mono text-white text-xs focus:border-trough-yellow focus:outline-none" /></td>' +
            '<td class="py-3 px-3 text-center"><div class="inline-flex items-center"><span class="text-neutral-500 mr-1">$</span><input type="number" step="1" min="20" max="150" value="' + item.rate + '" oninput="updateRosterField(' + idx + ', \'rate\', this.value)" class="w-16 bg-[#1E1E1E] border border-neutral-700 rounded px-2 py-1 text-center font-mono text-white text-xs focus:border-trough-yellow focus:outline-none" /></div></td>' +
            '<td class="py-3 px-3 text-center font-mono"><button type="button" onclick="toggleRosterHasSuper(' + idx + ')" class="px-2 py-0.5 rounded text-[10px] cursor-pointer transition ' + (item.hasSuper ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white') + '">' + (item.hasSuper ? '11.5% IFA' : 'Contracted 0%') + '</button></td>' +
            '<td id="wages-row-total-' + idx + '" class="py-3 px-3 text-right font-mono font-bold text-white">$' + formatMoney(item.itemTotal) + '</td>' +
            '<td class="py-3 px-2 text-center no-print"><button type="button" onclick="removeRosterRole(' + idx + ')" class="text-neutral-500 hover:text-rose-400 transition cursor-pointer p-1" title="Remove role"><i class="fa-solid fa-trash-can"></i></button></td>' +
          '</tr>'
        ).join('');
      }
    }
    updateWagesDerivedOnly();
  }

  // ===================== PROMOTER DEAL ANALYZER =====================
  window.setDealMode = function (mode) {
    state.dealMode = mode;
    renderPromoterTab(true);
  };

  window.onDealInput = function (field, val, isPreset) {
    if (field === 'pax') state.dealPax = parseInt(val, 10) || 220;
    else if (field === 'clip') state.dealClip = Math.max(0, parseFloat(val) || 0);
    else if (field === 'spend') state.dealSpend = parseFloat(val) || 24.0;
    else if (field === 'fixedHireFee') {
      state.simFixedHireFee = Math.max(0, parseFloat(val) || 0);
      saveOfflineCache();
      debounced('fixed_fee', () => apiRequest('api/settings.php', 'PUT', { fixedHireFee: state.simFixedHireFee }), 350);
    }
    if (isPreset) renderPromoterTab(true);
    else renderPromoterDerived();
  };

  function renderPromoterInputs() {
    const area = document.getElementById('deal-inputs-area');
    if (!area) return;
    if (state.dealMode === 'fixed_hire') {
      const presets = [2500, 3500, 5000, 7500, 10000].map((p) =>
        '<button type="button" onclick="onDealInput(\'fixedHireFee\', ' + p + ', true)" class="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition cursor-pointer ' +
        (state.simFixedHireFee === p ? 'bg-trough-yellow text-black border-trough-yellow font-bold' : 'bg-[#222222] text-neutral-300 border-neutral-700 hover:border-neutral-500') + '">$' + p.toLocaleString() + '</button>'
      ).join('');
      area.innerHTML =
        '<div class="space-y-3 bg-[#191919] p-4 rounded-xl border border-trough-yellow/40 mb-4">' +
          '<div class="flex flex-wrap items-center justify-between gap-2">' +
            '<div><label class="text-xs font-bold text-trough-yellow block">Flat Fixed Venue Hire Fee (AUD)</label><span class="text-[11px] text-neutral-400">Stand-alone contracted flat fee only — independent of door, bar spend, or attendance</span></div>' +
            '<div class="h-10 inline-flex items-center bg-[#222222] border border-trough-yellow/50 rounded-lg px-2.5"><span class="text-trough-yellow font-mono text-sm font-bold mr-1">$</span><input type="number" id="deal-input-fixedfee" min="0" step="100" value="' + state.simFixedHireFee + '" oninput="onDealInput(\'fixedHireFee\', this.value, false)" class="w-24 bg-transparent text-right font-mono font-bold text-white text-sm focus:outline-none tabular-nums" /></div>' +
          '</div>' +
          '<input type="range" id="deal-slider-fixedfee" min="500" max="25000" step="250" value="' + Math.min(25000, Math.max(500, state.simFixedHireFee)) + '" oninput="onDealInput(\'fixedHireFee\', this.value, false)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" />' +
          '<div class="flex flex-wrap gap-1.5">' + presets + '</div>' +
        '</div>';
    } else {
      area.innerHTML =
        '<div class="space-y-4">' +
          '<div><div class="flex justify-between text-xs mb-1"><span class="text-neutral-300 font-medium">Promoter Ticket Sales</span><span id="deal-lbl-pax" class="font-mono font-bold text-white">' + state.dealPax + ' Pax</span></div><input type="range" id="deal-slider-pax" min="50" max="300" step="10" value="' + state.dealPax + '" oninput="onDealInput(\'pax\', this.value, false)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" /></div>' +
          '<div><div class="flex justify-between items-center text-xs mb-1"><span class="text-trough-yellow font-semibold">Venue Ticket Clip / Patron (AUD)</span><div class="flex items-center bg-[#191919] border border-trough-yellow/50 rounded-md px-2 py-0.5"><span class="text-trough-yellow font-mono text-xs mr-1">$</span><input type="number" id="deal-input-clip" min="0" max="30" step="0.5" value="' + state.dealClip + '" oninput="onDealInput(\'clip\', this.value, false)" class="w-14 bg-transparent text-right font-mono font-bold text-white text-xs focus:outline-none tabular-nums" /></div></div><input type="range" id="deal-slider-clip" min="0" max="20" step="0.5" value="' + Math.min(20, state.dealClip) + '" oninput="onDealInput(\'clip\', this.value, false)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" /></div>' +
          '<div><div class="flex justify-between text-xs mb-1"><span class="text-neutral-300 font-medium">Patron Bar Spend</span><span id="deal-lbl-spend" class="font-mono font-bold text-white">$' + state.dealSpend.toFixed(2) + ' / Head</span></div><input type="range" id="deal-slider-spend" min="10" max="40" step="1" value="' + state.dealSpend + '" oninput="onDealInput(\'spend\', this.value, false)" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer block" /></div>' +
        '</div>';
    }
  }

  function renderPromoterDerived() {
    const rosterSummary = computeRosterSummary();
    const d = computeDealMetrics(rosterSummary);

    elText('deal-lbl-pax', state.dealPax + ' Pax');
    elText('deal-lbl-spend', '$' + state.dealSpend.toFixed(2) + ' / Head');
    elVal('deal-input-clip', state.dealClip);
    elVal('deal-slider-clip', Math.min(20, state.dealClip));
    elVal('deal-input-fixedfee', state.simFixedHireFee);
    elVal('deal-slider-fixedfee', Math.min(25000, Math.max(500, state.simFixedHireFee)));

    const cBtn = document.getElementById('deal-mode-clip');
    const fBtn = document.getElementById('deal-mode-fixed');
    if (cBtn) cBtn.className = 'h-9 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ' + (state.dealMode === 'clip_bar' ? 'bg-trough-yellow text-black' : 'text-neutral-300 hover:text-white');
    if (fBtn) fBtn.className = 'h-9 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ' + (state.dealMode === 'fixed_hire' ? 'bg-trough-yellow text-black' : 'text-neutral-300 hover:text-white');

    const vBadge = document.getElementById('deal-viability-badge');
    if (vBadge) {
      if (d.netSurplus >= 1000) {
        vBadge.textContent = 'HIGHLY PROFITABLE';
        vBadge.className = 'text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30';
      } else if (d.netSurplus >= 0) {
        vBadge.textContent = 'VIABLE / MARGINAL';
        vBadge.className = 'text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30';
      } else {
        vBadge.textContent = 'UNDER BREAKEVEN (LOSS)';
        vBadge.className = 'text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30';
      }
    }

    const beCard = document.getElementById('deal-breakeven-card');
    if (beCard) {
      beCard.innerHTML =
        '<h3 class="font-bold text-sm text-white flex items-center gap-2"><i class="fa-solid fa-calculator text-trough-yellow"></i> Promoter Breakeven Mathematics</h3>' +
        '<p class="text-xs text-trough-muted">Because venue fixed operational wages must be cleared before the house turns a dollar of surplus:</p>' +
        '<div class="bg-[#1C1C1C] p-4 rounded-xl border border-neutral-800 space-y-3 text-xs font-mono">' +
          '<div><span class="text-neutral-400 text-[11px] block">FIXED EVENT OPERATING OVERHEAD:</span><span class="text-sm font-bold text-white">$' + formatMoney(d.wages) + ' (Wages) + $300 (Consumables) = $' + formatMoney(d.fixedOverhead) + '</span></div>' +
          '<div class="border-t border-neutral-800 pt-2"><span class="text-neutral-400 text-[11px] block">NET VENUE MARGIN PER PATRON (ADJUSTED):</span><span class="text-sm font-bold text-trough-yellow">$' + d.clip.toFixed(2) + ' Clip + $' + d.barNetPerHead.toFixed(2) + ' Bar Net + $2.50 Cloak = $' + d.netMarginPerHead.toFixed(2) + ' / Head</span></div>' +
          '<div class="border-t border-neutral-800 pt-2 flex justify-between items-center text-white"><span>BREAKEVEN CAPACITY (NO DEPOSIT):</span><span class="text-base font-extrabold text-amber-400">' + d.breakevenNoDeposit + ' Patrons</span></div>' +
          '<div class="border-t border-neutral-800 pt-2 flex justify-between items-center text-emerald-400"><span>BREAKEVEN WITH $550 DEPOSIT:</span><span class="text-base font-extrabold">' + d.breakevenWithDeposit + ' Patrons</span></div>' +
        '</div>' +
        '<div class="text-[11px] text-neutral-400 leading-relaxed pt-1"><strong class="text-neutral-200">Strategic Rule:</strong> Never waive the $550 booking deposit for mid-week or unproven promotions.</div>';
    }

    const sumTbl = document.getElementById('deal-summary-table');
    if (sumTbl) {
      sumTbl.innerHTML = d.isFixedHire
        ? '<div class="flex justify-between"><span>Contracted Fixed Venue Hire Fee:</span><span class="text-trough-yellow font-bold">$' + formatMoney(d.fixedHireTotal) + '</span></div>' +
          '<div class="flex justify-between text-neutral-500"><span>Ticket Clip / Bar Sales / Cloak:</span><span>N/A (Flat Hire Only)</span></div>' +
          '<div class="flex justify-between text-white border-t border-neutral-700 pt-1 font-bold"><span>Total Gross Revenue:</span><span>$' + formatMoney(d.grossTurnover) + '</span></div>' +
          '<div class="flex justify-between text-rose-300"><span>Less Active Roster IFA Wages:</span><span>($' + formatMoney(d.wages) + ')</span></div>'
        : '<div class="flex justify-between"><span>Venue Ticket Clip Revenue (' + state.dealPax + ' × $' + d.clip.toFixed(2) + '):</span><span class="text-white">$' + formatMoney(d.clipTotal) + '</span></div>' +
          '<div class="flex justify-between"><span>Bar POS Turnover (' + state.dealPax + ' × $' + state.dealSpend.toFixed(2) + '):</span><span class="text-white">$' + formatMoney(d.barTotal) + '</span></div>' +
          '<div class="flex justify-between"><span>Cloakroom (50% check-in):</span><span class="text-white">$' + formatMoney(d.cloakTotal) + '</span></div>' +
          '<div class="flex justify-between text-white border-t border-neutral-700 pt-1 font-bold"><span>Total House Turnover:</span><span>$' + formatMoney(d.grossTurnover) + '</span></div>' +
          '<div class="flex justify-between text-rose-300"><span>Less COGS, Overheads &amp; Wages:</span><span>($' + formatMoney(d.cogs + d.wages + d.overheads) + ')</span></div>';
    }

    const botEl = document.getElementById('deal-bottom-result');
    if (botEl) {
      botEl.innerHTML =
        '<span class="text-xs font-medium text-neutral-300">Estimated Trough Net Surplus:</span>' +
        '<span class="text-2xl font-extrabold font-mono ' + (d.netSurplus >= 0 ? 'text-trough-yellow' : 'text-rose-400') + '">' +
          (d.netSurplus >= 0 ? '+$' + formatMoney(d.netSurplus) : '-$' + formatMoney(Math.abs(d.netSurplus))) +
        '</span>';
    }
  }

  function renderPromoterTab(rebuildInputs) {
    if (rebuildInputs) renderPromoterInputs();
    renderPromoterDerived();
  }

  // ===================== ALCOHOL INVENTORY & COGS TAB =====================
  window.onInventoryOpeningInput = function (val) {
    state.inventoryOpeningValue = Math.max(0, parseFloat(val) || 0);
    saveOfflineCache();
    debounced('inv_recon', () => apiRequest('api/inventory.php', 'PUT', {
      action: 'update_reconciliation',
      openingStockValue: state.inventoryOpeningValue
    }), 350);
    renderInventorySummaryOnly();
  };

  window.onInventoryPeriodSalesInput = function (val) {
    state.inventoryPeriodSales = Math.max(0, parseFloat(val) || 0);
    saveOfflineCache();
    debounced('inv_recon_sales', () => apiRequest('api/inventory.php', 'PUT', {
      action: 'update_reconciliation',
      periodBarSales: state.inventoryPeriodSales
    }), 350);
    renderInventorySummaryOnly();
  };

  window.setOpeningFromCloverExpected = function () {
    const sum = computeInventorySummary();
    state.inventoryOpeningValue = Number(sum.expectedStockValue.toFixed(2));
    elVal('inv-opening-input', state.inventoryOpeningValue);
    saveOfflineCache();
    apiRequest('api/inventory.php', 'PUT', {
      action: 'update_reconciliation',
      openingStockValue: state.inventoryOpeningValue
    });
    renderInventorySummaryOnly();
  };

  window.applyCogsToSimulator = function (pct, sourceLabel) {
    const clamped = Number(Math.min(45, Math.max(10, Number(pct) || 22)).toFixed(1));
    state.simCogsRate = clamped;
    state.invStatusNotice = 'Applied ' + clamped.toFixed(1) + '% Beverage COGS (' + sourceLabel + ') to Budget Simulator & Programming Calendar.';
    state.simSaveNotice = state.invStatusNotice;
    saveOfflineCache();
    apiRequest('api/settings.php', 'PUT', { simCogsRate: clamped });
    renderInventorySummaryOnly();
    syncSimulatorDerivedOnly();
  };

  window.handleAddPurchase = async function (e) {
    if (e) e.preventDefault();
    const amtEl = document.getElementById('pur-amount');
    const amountNum = parseFloat(amtEl ? amtEl.value : '0');
    if (Number.isNaN(amountNum) || amountNum <= 0) return;
    const entry = {
      id: 'pur-' + Date.now(),
      date: (document.getElementById('pur-date')?.value || '').trim() || new Date().toLocaleDateString('en-AU'),
      supplier: (document.getElementById('pur-supplier')?.value || '').trim() || 'Liquor Wholesaler',
      invoiceRef: (document.getElementById('pur-invoice')?.value || '').trim() || 'INV',
      amount: amountNum,
      notes: (document.getElementById('pur-notes')?.value || '').trim()
    };
    state.purchases.unshift(entry);
    if (document.getElementById('pur-invoice')) document.getElementById('pur-invoice').value = '';
    if (amtEl) amtEl.value = '';
    if (document.getElementById('pur-notes')) document.getElementById('pur-notes').value = '';
    state.invStatusNotice = 'Logged $' + formatMoney(amountNum) + ' stock purchase from ' + entry.supplier + '.';
    const res = await apiRequest('api/inventory.php', 'POST', entry);
    if (res && Array.isArray(res.purchases)) state.purchases = res.purchases;
    saveOfflineCache();
    renderInventoryTab(false);
  };

  window.deletePurchaseEntry = async function (id) {
    state.purchases = state.purchases.filter((p) => p.id !== id);
    const res = await apiRequest('api/inventory.php', 'DELETE', { id });
    if (res && Array.isArray(res.purchases)) state.purchases = res.purchases;
    saveOfflineCache();
    renderInventoryTab(false);
  };

  window.handleInventoryCsvUpload = function (e) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function () {
      const parsed = parseCloverCsvText(reader.result);
      if (parsed.length === 0) {
        state.invStatusNotice = 'Could not parse any rows from uploaded CSV.';
        renderInventorySummaryOnly();
        return;
      }
      state.inventory = parsed;
      state.invStatusNotice = 'Imported ' + parsed.length + ' Clover inventory SKUs from "' + file.name + '" while preserving wholesale unit costs.';
      const res = await apiRequest('api/inventory.php', 'POST', { action: 'bulk_items', items: parsed });
      if (res && Array.isArray(res.inventory)) state.inventory = res.inventory;
      saveOfflineCache();
      renderInventoryTab(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  window.exportInventoryCsv = function () {
    const header = [
      'Clover Item ID', 'Item Name', 'Category', 'Price',
      'Live Clover Stock (Pours/Cans)', 'Expected Stock (Bottles/Cans)',
      'Bottle Size (ml)', 'Pour Size (ml)', 'Recipe Deductions (Bottles)',
      'Actual Count (Bottles/Cans)', 'Wholesale Unit Cost ($)',
      'Cost Per Pour ($)', 'COGS %', 'Stock Value ($)'
    ];
    const csvRows = [header.join(',')];
    state.inventory.forEach((it) => {
      const m = calculateItemMetrics(it);
      const qCat = it.category.includes(',') ? ('"' + it.category + '"') : it.category;
      const qName = it.name.includes(',') ? ('"' + it.name + '"') : it.name;
      csvRows.push([
        it.cloverId, qName, qCat, '$' + it.price.toFixed(2),
        it.liveCloverStock, it.expectedStock,
        it.bottleSizeMl !== null ? it.bottleSizeMl : '',
        it.pourSizeMl !== null ? it.pourSizeMl : '',
        it.recipeDeductions,
        it.actualCount !== null && it.actualCount !== undefined ? it.actualCount : '',
        it.unitCost.toFixed(2), m.costPerPour.toFixed(2), m.cogsPct.toFixed(1) + '%', m.stockValue.toFixed(2)
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Trough_Inventory_COGS_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  window.autofillExpectedToActual = async function () {
    state.inventory = state.inventory.map((it) => {
      if (!isBarBeverageCategory(it.category)) return it;
      if (it.actualCount !== null && it.actualCount !== undefined) return it;
      return Object.assign({}, it, { actualCount: Number(Math.max(0, it.expectedStock).toFixed(2)) });
    });
    state.invStatusNotice = 'Prefilled blank Actual Count cells from Clover Expected Stock.';
    const res = await apiRequest('api/inventory.php', 'PUT', { action: 'bulk_items', items: state.inventory });
    if (res && Array.isArray(res.inventory)) state.inventory = res.inventory;
    saveOfflineCache();
    renderInventoryTab(true);
  };

  window.clearActualCounts = async function () {
    state.inventory = state.inventory.map((it) => Object.assign({}, it, { actualCount: null }));
    state.invStatusNotice = 'Cleared all Actual Count entries for a fresh stocktake.';
    const res = await apiRequest('api/inventory.php', 'PUT', { action: 'bulk_items', items: state.inventory });
    if (res && Array.isArray(res.inventory)) state.inventory = res.inventory;
    saveOfflineCache();
    renderInventoryTab(true);
  };

  window.resetInventoryDefaults = async function () {
    const res = await apiRequest('api/inventory.php', 'POST', { action: 'reset_inventory' });
    if (res && Array.isArray(res.inventory)) state.inventory = res.inventory;
    else state.inventory = clone(BASELINE_INVENTORY);
    state.invStatusNotice = 'Restored baseline 97-SKU Clover inventory.';
    saveOfflineCache();
    renderInventoryTab(true);
  };

  window.hideInventoryNotice = function () {
    state.invStatusNotice = null;
    const el = document.getElementById('inv-status-notice');
    if (el) el.classList.add('hidden');
  };

  window.onInventorySearchInput = function (val) {
    state.invSearchQuery = val;
    const clr = document.getElementById('inv-search-clear');
    if (clr) clr.classList.toggle('hidden', !val);
    renderInventoryTableOnly();
  };

  window.clearInventorySearch = function () {
    state.invSearchQuery = '';
    elVal('inv-search-input', '');
    const clr = document.getElementById('inv-search-clear');
    if (clr) clr.classList.add('hidden');
    renderInventoryTableOnly();
  };

  window.setInventoryCategory = function (catId) {
    state.invCategoryFilter = catId;
    renderInventorySummaryOnly();
    renderInventoryTableOnly();
  };

  window.toggleOnlyNegativeOrRecipe = function () {
    state.invOnlyNegativeOrRecipe = !state.invOnlyNegativeOrRecipe;
    renderInventorySummaryOnly();
    renderInventoryTableOnly();
  };

  window.updateInventoryField = function (idx, field, val) {
    const it = state.inventory[idx];
    if (!it) return;
    if (field === 'unitCost') {
      it.unitCost = Math.max(0, parseFloat(val) || 0);
      it.costVerified = true;
    } else if (field === 'actualCount') {
      it.actualCount = val === '' ? null : (Number.isNaN(parseFloat(val)) ? null : parseFloat(val));
    } else if (field === 'bottleSizeMl') {
      it.bottleSizeMl = val === '' ? null : Math.max(0, parseFloat(val) || 0);
    } else if (field === 'pourSizeMl') {
      it.pourSizeMl = val === '' ? null : Math.max(0, parseFloat(val) || 0);
    }
    saveOfflineCache();
    debounced('inv_item_' + it.cloverId, () => {
      apiRequest('api/inventory.php', 'PUT', {
        cloverId: it.cloverId,
        bottleSizeMl: it.bottleSizeMl,
        pourSizeMl: it.pourSizeMl,
        actualCount: it.actualCount,
        unitCost: it.unitCost,
        costVerified: it.costVerified
      });
    }, 350);

    // Update row cells in-place to keep focus
    const m = calculateItemMetrics(it);
    elText('inv-row-pours-' + idx, !m.isPosRecipeOnly && !m.isPackagedCanOrSingle ? (m.poursPerUnit.toFixed(1) + ' pours/unit') : (m.isPosRecipeOnly ? 'Recipe only' : 'Single unit'));
    elText('inv-row-pourcost-' + idx, '$' + m.costPerPour.toFixed(2) + '/pour');
    const cBadge = document.getElementById('inv-row-cogspct-' + idx);
    if (cBadge) {
      cBadge.className = 'inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ' +
        (m.cogsPct <= 0 ? 'bg-neutral-800 text-neutral-500 border-neutral-700'
          : m.cogsPct <= 20 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : m.cogsPct <= 28 ? 'bg-trough-yellow/15 text-trough-yellow border-trough-yellow/30'
          : 'bg-rose-500/15 text-rose-300 border-rose-500/30');
      cBadge.textContent = m.cogsPct > 0 ? (m.cogsPct.toFixed(1) + '% COGS') : 'N/A';
    }
    const valCell = document.getElementById('inv-row-val-' + idx);
    if (valCell) {
      valCell.innerHTML =
        '<div class="font-mono font-bold text-white">$' + formatMoney(m.stockValue) + '</div>' +
        (m.varianceUnits !== null
          ? '<div class="text-[10px] font-mono mt-0.5 ' + (m.varianceUnits < 0 ? 'text-rose-400' : m.varianceUnits > 0 ? 'text-emerald-400' : 'text-neutral-400') + '">' +
              (m.varianceUnits >= 0 ? '+' : '') + m.varianceUnits.toFixed(2) + ' u (' + (m.varianceCost >= 0 ? '+' : '-') + '$' + formatMoney(Math.abs(m.varianceCost || 0)) + ')</div>'
          : '<div class="text-[10px] text-neutral-500 font-mono">Est. Clover val</div>');
    }
    renderInventorySummaryOnly();
  };

  window.toggleInventoryVerified = function (idx) {
    const it = state.inventory[idx];
    if (!it) return;
    it.costVerified = !it.costVerified;
    saveOfflineCache();
    apiRequest('api/inventory.php', 'PUT', { cloverId: it.cloverId, costVerified: it.costVerified });
    renderInventoryTableOnly();
    renderInventorySummaryOnly();
  };

  function renderInventorySummaryOnly() {
    const s = computeInventorySummary();
    elVal('inv-opening-input', state.inventoryOpeningValue);
    elVal('inv-sales-input', state.inventoryPeriodSales);
    elText('inv-set-expected-btn', 'Set from Clover Expected Value ($' + formatMoney(s.expectedStockValue) + ')');
    elText('inv-purchases-total', 'Total: $' + formatMoney(s.totalPurchases));
    elText('inv-table-title', 'Clover Alcohol & Bar Inventory Stocktake (' + s.barSkuCount + ' Bar SKUs / ' + state.inventory.length + ' Total Clover Items)');

    const notice = document.getElementById('inv-status-notice');
    if (notice) {
      notice.classList.toggle('hidden', !state.invStatusNotice);
      elText('inv-status-notice-text', state.invStatusNotice || '');
    }

    // Top 4 KPIs
    const kpiEl = document.getElementById('inv-kpis');
    if (kpiEl) {
      kpiEl.innerHTML =
        '<div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4">' +
          '<div class="flex justify-between items-start"><span class="text-xs font-medium text-trough-muted uppercase tracking-wider">Closing Stock On Hand</span><span class="p-1.5 rounded-lg bg-trough-yellow/10 text-trough-yellow text-xs"><i class="fa-solid fa-boxes-stacked"></i></span></div>' +
          '<div class="mt-2 flex items-baseline gap-2"><span class="text-2xl font-bold font-mono text-white">$' + formatMoney(s.currentOnHandValue) + '</span></div>' +
          '<p class="mt-1 text-[11px] text-trough-muted font-mono">' + s.totalCountedSkus + '/' + s.physicalBarSkuCount + ' SKUs physically counted</p>' +
        '</div>' +
        '<div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4">' +
          '<div class="flex justify-between items-start"><span class="text-xs font-medium text-trough-muted uppercase tracking-wider">Period Running COGS %</span><span class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs"><i class="fa-solid fa-percent"></i></span></div>' +
          '<div class="mt-2 flex items-baseline gap-2"><span class="text-2xl font-bold font-mono ' + (s.periodRunningCogsPct > 30 ? 'text-rose-400' : 'text-emerald-400') + '">' + s.periodRunningCogsPct.toFixed(1) + '%</span><span class="text-[11px] text-neutral-400 font-mono">($' + formatMoney(s.consumedCogsDollar) + ' used)</span></div>' +
          '<p class="mt-1 text-[11px] text-trough-muted font-mono">Opening + Purchases − Closing</p>' +
        '</div>' +
        '<div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4">' +
          '<div class="flex justify-between items-start"><span class="text-xs font-medium text-trough-muted uppercase tracking-wider">Theoretical Pour COGS</span><span class="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 text-xs"><i class="fa-solid fa-champagne-glasses"></i></span></div>' +
          '<div class="mt-2 flex items-baseline gap-2"><span class="text-2xl font-bold font-mono text-trough-yellow">' + s.theoreticalWeightedCogsPct.toFixed(1) + '%</span><span class="text-[11px] text-neutral-400 font-mono">Avg SKU: ' + s.simpleAvgCogsPct.toFixed(1) + '%</span></div>' +
          '<p class="mt-1 text-[11px] text-trough-muted font-mono">' + s.verifiedCostCount + ' verified wholesale unit costs</p>' +
        '</div>' +
        '<div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4">' +
          '<div class="flex justify-between items-start"><span class="text-xs font-medium text-trough-muted uppercase tracking-wider">Clover Alerts &amp; Variance</span><span class="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs"><i class="fa-solid fa-triangle-exclamation"></i></span></div>' +
          '<div class="mt-2 flex items-baseline gap-2"><span class="text-2xl font-bold font-mono text-rose-400">' + s.negativeSkuCount + ' SKUs</span><span class="text-[11px] font-mono ' + (s.totalVarianceCost < 0 ? 'text-rose-300' : 'text-emerald-300') + '">' + (s.totalVarianceCost >= 0 ? '+' : '-') + '$' + formatMoney(Math.abs(s.totalVarianceCost)) + '</span></div>' +
          '<p class="mt-1 text-[11px] text-trough-muted font-mono">Negative Clover stock or unmapped recipes</p>' +
        '</div>';
    }

    const recEl = document.getElementById('inv-reconcile-breakdown');
    if (recEl) {
      recEl.innerHTML =
        '<div class="flex justify-between text-neutral-300"><span>1. Opening Stock Valuation:</span><span>$' + formatMoney(state.inventoryOpeningValue) + '</span></div>' +
        '<div class="flex justify-between text-emerald-300"><span>2. + Period Wholesale Purchases (' + state.purchases.length + ' Invoices):</span><span>+$' + formatMoney(s.totalPurchases) + '</span></div>' +
        '<div class="flex justify-between text-neutral-300"><span>3. − Closing Stock On Hand:</span><span class="text-rose-300">(−$' + formatMoney(s.currentOnHandValue) + ')</span></div>' +
        '<div class="flex justify-between border-t border-neutral-800 pt-2 text-white font-bold"><span>= Consumed Cost of Goods (COGS $):</span><span>$' + formatMoney(s.consumedCogsDollar) + '</span></div>' +
        '<div class="flex justify-between items-baseline pt-1"><span class="text-trough-yellow font-bold">Running Period COGS %:</span><span class="text-lg font-extrabold text-trough-yellow">' + s.periodRunningCogsPct.toFixed(1) + '%</span></div>';
    }

    const appBar = document.getElementById('inv-apply-bar');
    if (appBar) {
      appBar.innerHTML =
        '<span class="text-neutral-400">Active Simulator Rate: <strong class="text-trough-yellow font-mono">' + state.simCogsRate.toFixed(1) + '%</strong></span>' +
        '<div class="flex flex-wrap gap-2">' +
          '<button type="button" onclick="applyCogsToSimulator(' + s.theoreticalWeightedCogsPct.toFixed(2) + ', \'Theoretical Pour COGS\')" class="px-3 py-1.5 rounded-lg bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 font-semibold cursor-pointer">Use Theoretical (' + s.theoreticalWeightedCogsPct.toFixed(1) + '%)</button>' +
          '<button type="button" onclick="applyCogsToSimulator(' + s.periodRunningCogsPct.toFixed(2) + ', \'Period Running COGS\')" class="px-3 py-1.5 rounded-lg bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold cursor-pointer">Apply Period COGS (' + s.periodRunningCogsPct.toFixed(1) + '%)</button>' +
        '</div>';
    }

    const catEl = document.getElementById('inv-category-strip');
    if (catEl) {
      catEl.innerHTML = s.categoryStats.map((c) => {
        const act = state.invCategoryFilter === c.id;
        return '<button type="button" onclick="setInventoryCategory(\'' + c.id + '\')" class="text-left p-3 rounded-xl border transition cursor-pointer ' +
          (act ? 'bg-trough-yellow/10 border-trough-yellow' : 'bg-trough-cardDark border-trough-cardBorder hover:border-neutral-600') + '">' +
          '<div class="flex items-center justify-between text-[11px] font-semibold text-neutral-300"><span class="truncate">' + escapeHtml(c.label) + '</span><span class="font-mono text-trough-yellow">' + c.skuCount + '</span></div>' +
          '<div class="mt-1.5 flex items-baseline justify-between font-mono"><span class="text-sm font-bold text-white">$' + formatMoney(c.stockVal) + '</span><span class="text-[10px] text-emerald-400">' + c.avgCogs.toFixed(1) + '% COGS</span></div>' +
          (c.negCount > 0 ? '<span class="text-[10px] text-rose-400 font-mono block mt-0.5">' + c.negCount + ' negative in Clover</span>' : '') +
        '</button>';
      }).join('');
    }

    const filterPills = document.getElementById('inv-filter-pills');
    if (filterPills) {
      const fDefs = [
        { id: 'bar', label: 'All Bar Drinks' },
        { id: 'beer', label: 'Beer' },
        { id: 'premix', label: 'Pre-mix' },
        { id: 'spirits', label: 'Spirits' },
        { id: 'nonalcohol', label: 'Non-Alc / Mixers' },
        { id: 'cocktails', label: 'Cocktail Recipes' },
        { id: 'nonbar', label: 'Entries & Hardware' },
        { id: 'all', label: 'All ' + state.inventory.length }
      ];
      filterPills.innerHTML = fDefs.map((f) =>
        '<button type="button" onclick="setInventoryCategory(\'' + f.id + '\')" class="px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ' +
          (state.invCategoryFilter === f.id ? 'bg-trough-yellow text-black font-bold' : 'bg-[#191919] text-neutral-400 hover:text-white border border-neutral-800') + '">' + escapeHtml(f.label) + '</button>'
      ).join('') +
      '<button type="button" onclick="toggleOnlyNegativeOrRecipe()" class="px-2.5 py-1.5 rounded-lg font-medium border transition cursor-pointer flex items-center gap-1.5 ' +
        (state.invOnlyNegativeOrRecipe ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-[#191919] text-neutral-400 border-neutral-800 hover:text-white') + '">' +
        '<i class="fa-solid fa-triangle-exclamation text-[10px]"></i><span>Negatives / Recipes</span>' +
      '</button>';
    }

    const pList = document.getElementById('inv-purchases-list');
    if (pList) {
      if (state.purchases.length === 0) {
        pList.innerHTML = '<div class="p-4 text-center text-xs text-neutral-500">No supplier invoices logged yet for this stocktake period.</div>';
      } else {
        pList.innerHTML = state.purchases.map((p) =>
          '<div class="p-2.5 flex items-center justify-between gap-2 text-xs hover:bg-neutral-800/40">' +
            '<div><div class="font-semibold text-white">' + escapeHtml(p.supplier) + ' <span class="text-[10px] font-mono text-neutral-400">(' + escapeHtml(p.invoiceRef) + ')</span></div>' +
            '<div class="text-[11px] text-neutral-400 font-mono">' + escapeHtml(p.date) + (p.notes ? ' · ' + escapeHtml(p.notes) : '') + '</div></div>' +
            '<div class="flex items-center gap-2.5"><span class="font-mono font-bold text-trough-yellow">$' + formatMoney(p.amount) + '</span>' +
            '<button type="button" onclick="deletePurchaseEntry(\'' + escapeAttr(p.id) + '\')" class="text-neutral-500 hover:text-rose-400 cursor-pointer"><i class="fa-solid fa-trash-can"></i></button></div>' +
          '</div>'
        ).join('');
      }
    }
  }

  function renderInventoryTableOnly() {
    const s = computeInventorySummary();
    const q = state.invSearchQuery.trim().toLowerCase();
    const rows = s.enriched.filter(({ item }) => {
      const cat = String(item.category || '').toLowerCase();
      if (state.invCategoryFilter === 'bar' && !isBarBeverageCategory(item.category)) return false;
      if (state.invCategoryFilter === 'beer' && !cat.includes('beer')) return false;
      if (state.invCategoryFilter === 'premix' && !cat.includes('pre-mix')) return false;
      if (state.invCategoryFilter === 'spirits' && !cat.includes('spirit')) return false;
      if (state.invCategoryFilter === 'cocktails' && !cat.includes('cocktail')) return false;
      if (state.invCategoryFilter === 'nonalcohol' && !cat.includes('non-alcohol')) return false;
      if (state.invCategoryFilter === 'nonbar' && isBarBeverageCategory(item.category)) return false;
      if (state.invOnlyNegativeOrRecipe) {
        if (!(item.expectedStock < 0 || item.liveCloverStock < 0 || item.recipeDeductions !== 0)) return false;
      }
      if (q) {
        const hit = item.name.toLowerCase().includes(q) || item.cloverId.toLowerCase().includes(q) || cat.includes(q);
        if (!hit) return false;
      }
      return true;
    });

    const tbody = document.getElementById('inv-table-tbody');
    if (!tbody) return;
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-neutral-500 text-xs">No Clover SKUs match the active filter.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(({ item, idx, metrics }) => {
      const cBadgeCls = metrics.cogsPct <= 0 ? 'bg-neutral-800 text-neutral-500 border-neutral-700'
        : metrics.cogsPct <= 20 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        : metrics.cogsPct <= 28 ? 'bg-trough-yellow/15 text-trough-yellow border-trough-yellow/30'
        : 'bg-rose-500/15 text-rose-300 border-rose-500/30';

      return '<tr class="hover:bg-neutral-800/40 transition">' +
        '<td class="py-2.5 px-3">' +
          '<div class="font-semibold text-white flex items-center gap-1.5">' +
            '<span>' + escapeHtml(item.name) + '</span>' +
            (metrics.isPosRecipeOnly ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">POS Recipe</span>' : '') +
            '<button type="button" onclick="toggleInventoryVerified(' + idx + ')" title="Toggle Invoice Cost Verified" class="text-[10px] cursor-pointer ' + (item.costVerified ? 'text-emerald-400' : 'text-neutral-600 hover:text-neutral-400') + '"><i class="fa-solid fa-circle-check"></i></button>' +
          '</div>' +
          '<div class="text-[10px] text-neutral-400 font-mono">' + escapeHtml(item.category) + ' · <span class="text-neutral-500">' + escapeHtml(item.cloverId) + '</span></div>' +
        '</td>' +
        '<td class="py-2.5 px-2 text-right font-mono text-white">$' + item.price.toFixed(2) + '</td>' +
        '<td class="py-2.5 px-2 text-right font-mono tabular-nums ' + (item.expectedStock < 0 ? 'text-rose-400 font-bold' : 'text-neutral-200') + '">' +
          '<div>' + item.expectedStock + ' u</div>' +
          '<div class="text-[10px] text-neutral-500">' + item.liveCloverStock + ' pours</div>' +
        '</td>' +
        '<td class="py-2.5 px-2 text-center">' +
          '<div class="inline-flex items-center gap-1">' +
            '<input type="number" min="0" step="50" value="' + (item.bottleSizeMl !== null ? item.bottleSizeMl : '') + '" oninput="updateInventoryField(' + idx + ', \'bottleSizeMl\', this.value)" placeholder="ml" class="w-16 bg-[#222222] border border-neutral-700 rounded px-1.5 py-1 text-center font-mono text-[11px] text-white" />' +
            '<span class="text-neutral-500">/</span>' +
            '<input type="number" min="0" step="5" value="' + (item.pourSizeMl !== null ? item.pourSizeMl : '') + '" oninput="updateInventoryField(' + idx + ', \'pourSizeMl\', this.value)" placeholder="ml" class="w-14 bg-[#222222] border border-neutral-700 rounded px-1.5 py-1 text-center font-mono text-[11px] text-white" />' +
          '</div>' +
          '<div id="inv-row-pours-' + idx + '" class="text-[10px] text-neutral-500 font-mono mt-0.5">' +
            (!metrics.isPosRecipeOnly && !metrics.isPackagedCanOrSingle ? (metrics.poursPerUnit.toFixed(1) + ' pours/unit') : (metrics.isPosRecipeOnly ? 'Recipe only' : 'Single unit')) +
          '</div>' +
        '</td>' +
        '<td class="py-2.5 px-2 text-right">' +
          '<div class="inline-flex items-center bg-[#222222] border border-neutral-700 rounded px-1.5 py-0.5 focus-within:border-trough-yellow">' +
            '<span class="text-neutral-400 font-mono text-[11px] mr-0.5">$</span>' +
            '<input type="number" min="0" step="0.05" value="' + item.unitCost + '" oninput="updateInventoryField(' + idx + ', \'unitCost\', this.value)" class="w-16 bg-transparent text-right font-mono text-xs text-white focus:outline-none tabular-nums" />' +
          '</div>' +
        '</td>' +
        '<td class="py-2.5 px-2 text-right">' +
          '<div id="inv-row-pourcost-' + idx + '" class="font-mono text-neutral-200 text-xs">$' + metrics.costPerPour.toFixed(2) + '/pour</div>' +
          '<span id="inv-row-cogspct-' + idx + '" class="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ' + cBadgeCls + '">' + (metrics.cogsPct > 0 ? metrics.cogsPct.toFixed(1) + '% COGS' : 'N/A') + '</span>' +
        '</td>' +
        '<td class="py-2.5 px-2 text-center">' +
          '<input type="number" step="0.1" value="' + (item.actualCount !== null && item.actualCount !== undefined ? item.actualCount : '') + '" oninput="updateInventoryField(' + idx + ', \'actualCount\', this.value)" placeholder="' + item.expectedStock + '" class="w-20 bg-[#222222] border border-neutral-700 focus:border-trough-yellow rounded px-2 py-1 text-center font-mono text-xs text-white tabular-nums" />' +
        '</td>' +
        '<td id="inv-row-val-' + idx + '" class="py-2.5 px-3 text-right">' +
          '<div class="font-mono font-bold text-white">$' + formatMoney(metrics.stockValue) + '</div>' +
          (metrics.varianceUnits !== null
            ? '<div class="text-[10px] font-mono mt-0.5 ' + (metrics.varianceUnits < 0 ? 'text-rose-400' : metrics.varianceUnits > 0 ? 'text-emerald-400' : 'text-neutral-400') + '">' +
                (metrics.varianceUnits >= 0 ? '+' : '') + metrics.varianceUnits.toFixed(2) + ' u (' + (metrics.varianceCost >= 0 ? '+' : '-') + '$' + formatMoney(Math.abs(metrics.varianceCost || 0)) + ')</div>'
            : '<div class="text-[10px] text-neutral-500 font-mono">Est. Clover val</div>') +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function renderInventoryTab(rebuildTable) {
    const purDate = document.getElementById('pur-date');
    if (purDate && !purDate.value) purDate.value = new Date().toLocaleDateString('en-AU');
    renderInventorySummaryOnly();
    if (rebuildTable) renderInventoryTableOnly();
  }

  // ===================== FORTHCOMING EVENTS & SYNC TAB =====================
  window.pushAllEventsToMysql = async function () {
    const res = await apiRequest('api/events.php', 'POST', { action: 'replace_all', events: state.events });
    if (res && Array.isArray(res.events)) state.events = res.events;
    state.eventsSavedNotice = 'Pushed ' + state.events.length + ' events to MySQL (' + nowTimeLabel() + ')';
    saveOfflineCache();
    renderEventsTab();
  };

  window.exportEventsCsv = function () {
    const hdr = ['Date', 'Event Title & Promoter', 'Type', 'Format', 'Cap Target (Pax)', 'Bar Gross (AUD)', 'Ticket Clip (AUD)', 'Ticket Rev (AUD)', 'Deposit (AUD)', 'Venue Gross (AUD)', 'Venue Wages (AUD)', 'Net Operating Surplus (AUD)'];
    const lines = [hdr.join(',')];
    state.events.forEach((ev) => {
      const gross = (Number(ev.barGross) || 0) + (Number(ev.clip) || 0) + (Number(ev.ticketRev) || 0) + (Number(ev.deposit) || 0);
      const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      lines.push([q(ev.date), q(ev.title), q(ev.type), q(ev.format), ev.pax, ev.barGross, ev.clip, ev.ticketRev, ev.deposit, gross, ev.wages, ev.surplus].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TroughX_Forthcoming_Events_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  window.exportFullBackupJson = function () {
    const payload = {
      exportedAt: new Date().toISOString(),
      venue: 'Trough X Sydney - 273 Crown St',
      events: state.events,
      roster: state.roster,
      templates: state.templates,
      ownedOverheads: state.ownedOverheads,
      wagesIncludeSuper: state.wagesIncludeSuper,
      fixedHireFee: state.simFixedHireFee,
      simCogsRate: state.simCogsRate,
      inventory: state.inventory,
      purchases: state.purchases,
      openingStockValue: state.inventoryOpeningValue,
      periodBarSales: state.inventoryPeriodSales
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TroughX_Full_Backup_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  window.handleImportFullJson = function (e) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const p = JSON.parse(String(reader.result || '{}'));
        if (Array.isArray(p.events)) {
          state.events = p.events;
          await apiRequest('api/events.php', 'POST', { action: 'replace_all', events: state.events });
        }
        if (Array.isArray(p.roster)) state.roster = p.roster;
        if (p.ownedOverheads) state.ownedOverheads = Object.assign({}, DEFAULT_OWNED_OVERHEADS, p.ownedOverheads);
        if (typeof p.wagesIncludeSuper === 'boolean') state.wagesIncludeSuper = p.wagesIncludeSuper;
        if (typeof p.fixedHireFee === 'number') state.simFixedHireFee = p.fixedHireFee;
        if (typeof p.simCogsRate === 'number') state.simCogsRate = p.simCogsRate;
        await apiRequest('api/settings.php', 'PUT', {
          roster: state.roster,
          ownedOverheads: state.ownedOverheads,
          wagesIncludeSuper: state.wagesIncludeSuper,
          fixedHireFee: state.simFixedHireFee,
          simCogsRate: state.simCogsRate
        });
        if (Array.isArray(p.inventory)) {
          state.inventory = p.inventory;
          await apiRequest('api/inventory.php', 'PUT', { action: 'bulk_items', items: state.inventory });
        }
        state.eventsSavedNotice = 'Imported JSON backup "' + file.name + '" (' + nowTimeLabel() + ')';
        saveOfflineCache();
        renderAll({ rebuildRoster: true, rebuildSimControls: true, rebuildInvTable: true });
      } catch (err) {
        state.eventsSavedNotice = 'Invalid JSON backup file';
        renderEventsTab();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  window.restoreBaselineEvents = async function () {
    const res = await apiRequest('api/events.php', 'POST', { action: 'reset' });
    if (res && Array.isArray(res.events)) state.events = res.events;
    else state.events = clone(BASELINE_EVENTS);
    state.editingEventIndex = null;
    state.eventsSavedNotice = 'Restored baseline 12 events (' + nowTimeLabel() + ')';
    saveOfflineCache();
    renderAll();
  };

  window.onEventSearchInput = function (val) {
    state.eventSearchQuery = val;
    const clr = document.getElementById('cal-search-clear');
    if (clr) clr.classList.toggle('hidden', !val);
    renderEventsTab();
  };

  window.clearEventSearch = function () {
    state.eventSearchQuery = '';
    elVal('cal-search-input', '');
    const clr = document.getElementById('cal-search-clear');
    if (clr) clr.classList.add('hidden');
    renderEventsTab();
  };

  window.setEventFilter = function (f) {
    state.eventFilter = f;
    renderEventsTab();
  };

  window.editEventInMainSimulator = function (idx) {
    window.selectEventForEdit(idx, true);
  };

  window.startInlineEditEvent = function (idx) {
    if (!state.events[idx]) return;
    state.inlineEditIndex = idx;
    state.inlineEditDraft = Object.assign({}, state.events[idx]);
    renderEventsTab();
  };

  window.updateInlineDraft = function (field, val) {
    if (!state.inlineEditDraft) return;
    if (field === 'type') {
      state.inlineEditDraft.type = val === 'promoter' ? 'promoter' : 'owned';
      state.inlineEditDraft.format = state.inlineEditDraft.type === 'promoter' ? 'Promoter Hosted' : 'Owned Hero Night';
    } else if (field === 'pax') {
      state.inlineEditDraft.pax = Math.min(300, parseInt(val, 10) || 0);
    } else if (field === 'barGross' || field === 'wages' || field === 'surplus') {
      state.inlineEditDraft[field] = parseFloat(val) || 0;
    } else {
      state.inlineEditDraft[field] = val;
    }
  };

  window.cancelInlineEdit = function () {
    state.inlineEditIndex = null;
    state.inlineEditDraft = null;
    renderEventsTab();
  };

  window.saveInlineEdit = async function () {
    if (state.inlineEditIndex === null || !state.inlineEditDraft) return;
    const draft = Object.assign({}, state.inlineEditDraft);
    state.events[state.inlineEditIndex] = draft;
    state.eventsSavedNotice = 'Saved "' + draft.title + '" (' + nowTimeLabel() + ')';
    state.inlineEditIndex = null;
    state.inlineEditDraft = null;
    if (draft.id) {
      const res = await apiRequest('api/events.php', 'PUT', draft);
      if (res && Array.isArray(res.events)) state.events = res.events;
    } else {
      const res = await apiRequest('api/events.php', 'POST', { action: 'replace_all', events: state.events });
      if (res && Array.isArray(res.events)) state.events = res.events;
    }
    saveOfflineCache();
    renderAll();
  };

  function renderEventsTab() {
    const notice = document.getElementById('cal-saved-notice');
    if (notice) {
      notice.classList.toggle('hidden', !state.eventsSavedNotice);
      notice.textContent = state.eventsSavedNotice || '';
    }

    const fb = document.getElementById('cal-filter-buttons');
    if (fb) {
      fb.innerHTML = [
        { id: 'all', label: 'All Events' },
        { id: 'owned', label: 'Trough Owned' },
        { id: 'promoter', label: 'Promoter Hire' }
      ].map((f) =>
        '<button type="button" onclick="setEventFilter(\'' + f.id + '\')" class="px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ' +
          (state.eventFilter === f.id ? 'bg-trough-yellow text-black font-semibold' : 'bg-[#1E1E1E] text-neutral-300 hover:bg-neutral-800') + '">' + f.label + '</button>'
      ).join('');
    }

    const q = state.eventSearchQuery.trim().toLowerCase();
    const filtered = state.events
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        if (state.eventFilter === 'owned' && item.type !== 'owned') return false;
        if (state.eventFilter === 'promoter' && item.type !== 'promoter') return false;
        if (q && !String(item.title || '').toLowerCase().includes(q)) return false;
        return true;
      });

    let totalGross = 0, totalWages = 0, totalSurplus = 0;
    const tbody = document.getElementById('cal-table-tbody');
    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="8" class="py-8 px-4 text-center text-neutral-400"><div class="space-y-2"><p class="text-xs">No forthcoming events match ' +
          (q ? '<span class="text-white font-semibold">&ldquo;' + escapeHtml(state.eventSearchQuery.trim()) + '&rdquo;</span>' : 'the active filter') + '.</p>' +
          '<button type="button" onclick="clearEventSearch(); setEventFilter(\'all\')" class="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-trough-yellow text-xs font-medium border border-neutral-700 cursor-pointer">Reset Search &amp; Filters</button></div></td></tr>';
      } else {
        tbody.innerHTML = filtered.map(({ item, originalIndex }) => {
          const gross = (Number(item.barGross) || 0) + (Number(item.clip) || 0) + (Number(item.ticketRev) || 0) + (Number(item.deposit) || 0);
          totalGross += gross;
          totalWages += Number(item.wages) || 0;
          totalSurplus += Number(item.surplus) || 0;

          if (state.inlineEditIndex === originalIndex && state.inlineEditDraft) {
            const d = state.inlineEditDraft;
            return '<tr class="bg-trough-yellow/10 border-l-2 border-trough-yellow">' +
              '<td class="py-2 px-2"><input type="text" value="' + escapeAttr(d.date) + '" oninput="updateInlineDraft(\'date\', this.value)" class="w-24 bg-[#1E1E1E] border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white" /></td>' +
              '<td class="py-2 px-2"><input type="text" value="' + escapeAttr(d.title) + '" oninput="updateInlineDraft(\'title\', this.value)" class="w-full min-w-[160px] bg-[#1E1E1E] border border-neutral-700 rounded px-2 py-1 text-xs text-white" /></td>' +
              '<td class="py-2 px-2"><select onchange="updateInlineDraft(\'type\', this.value)" class="bg-[#1E1E1E] border border-neutral-700 rounded px-2 py-1 text-xs text-white"><option value="owned"' + (d.type === 'owned' ? ' selected' : '') + '>Owned Hero Night</option><option value="promoter"' + (d.type === 'promoter' ? ' selected' : '') + '>Promoter Hosted</option></select></td>' +
              '<td class="py-2 px-2 text-center"><input type="number" min="50" max="300" value="' + d.pax + '" oninput="updateInlineDraft(\'pax\', this.value)" class="w-16 bg-[#1E1E1E] border border-neutral-700 rounded px-2 py-1 text-center font-mono text-xs text-white" /></td>' +
              '<td class="py-2 px-2 text-right"><input type="number" value="' + d.barGross + '" oninput="updateInlineDraft(\'barGross\', this.value)" class="w-24 bg-[#1E1E1E] border border-neutral-700 rounded px-2 py-1 text-right font-mono text-xs text-white" /></td>' +
              '<td class="py-2 px-2 text-right"><input type="number" value="' + d.wages + '" oninput="updateInlineDraft(\'wages\', this.value)" class="w-20 bg-[#1E1E1E] border border-neutral-700 rounded px-2 py-1 text-right font-mono text-xs text-rose-300" /></td>' +
              '<td class="py-2 px-2 text-right"><input type="number" value="' + d.surplus + '" oninput="updateInlineDraft(\'surplus\', this.value)" class="w-24 bg-[#1E1E1E] border border-neutral-700 rounded px-2 py-1 text-right font-mono text-xs text-trough-yellow font-bold" /></td>' +
              '<td class="py-2 px-3 text-right whitespace-nowrap space-x-1.5">' +
                '<button type="button" onclick="saveInlineEdit()" class="px-2.5 py-1 rounded bg-trough-yellow text-black font-bold text-[10px] cursor-pointer">Save</button>' +
                '<button type="button" onclick="cancelInlineEdit()" class="px-2 py-1 rounded bg-neutral-800 text-neutral-300 text-[10px] cursor-pointer">Cancel</button>' +
              '</td></tr>';
          }

          return '<tr class="hover:bg-neutral-800/40 transition">' +
            '<td class="py-3 px-3 font-mono font-medium text-neutral-300 whitespace-nowrap">' + escapeHtml(item.date) + '</td>' +
            '<td class="py-3 px-3"><span class="font-semibold text-white block">' + escapeHtml(item.title) + '</span><span class="text-[11px] text-neutral-400">' + (item.type === 'promoter' ? '$5 Ticket Clip Agreement' : 'Full In-House Trough Production') + '</span></td>' +
            '<td class="py-3 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-medium ' + (item.type === 'owned' ? 'bg-trough-yellow/15 text-trough-yellow border border-trough-yellow/30' : 'bg-neutral-800 text-neutral-300 border border-neutral-700') + '">' + escapeHtml(item.format) + '</span></td>' +
            '<td class="py-3 px-3 text-center font-mono font-semibold text-neutral-200">' + item.pax + ' Pax</td>' +
            '<td class="py-3 px-3 text-right font-mono text-neutral-200">$' + formatInt(gross) + '</td>' +
            '<td class="py-3 px-3 text-right font-mono text-rose-300">($' + formatInt(item.wages) + ')</td>' +
            '<td class="py-3 px-3 text-right font-mono font-bold text-trough-yellow">+$' + formatInt(item.surplus) + '</td>' +
            '<td class="py-3 px-3 text-right no-print whitespace-nowrap space-x-1.5">' +
              '<button type="button" onclick="editEventInMainSimulator(' + originalIndex + ')" class="px-2.5 py-1 rounded bg-trough-yellow/15 hover:bg-trough-yellow text-trough-yellow hover:text-black border border-trough-yellow/30 text-[10px] font-semibold transition cursor-pointer"><i class="fa-solid fa-sliders mr-1"></i>Edit in Simulator</button>' +
              '<button type="button" onclick="startInlineEditEvent(' + originalIndex + ')" class="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-[10px] font-medium transition cursor-pointer" title="Quick inline edit"><i class="fa-solid fa-pen"></i></button>' +
              '<button type="button" onclick="deleteEventByIndex(' + originalIndex + ')" class="px-2 py-1 rounded bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-700 text-[10px] transition cursor-pointer" title="Delete event"><i class="fa-solid fa-trash-can"></i></button>' +
            '</td></tr>';
        }).join('');
      }
    }

    const totEl = document.getElementById('cal-totals');
    if (totEl) {
      totEl.innerHTML =
        '<div class="bg-[#1E1E1E] p-3 rounded-xl border border-neutral-800"><span class="text-[11px] text-trough-muted block">Total Pipeline Venue Turnover</span><span class="text-xl font-bold font-mono text-white">$' + formatMoney(totalGross) + '</span></div>' +
        '<div class="bg-[#1E1E1E] p-3 rounded-xl border border-neutral-800"><span class="text-[11px] text-trough-muted block">Committed Operational Wages</span><span class="text-xl font-bold font-mono text-rose-300">($' + formatMoney(totalWages) + ')</span></div>' +
        '<div class="bg-gradient-to-r from-trough-cardDark to-[#191919] p-3 rounded-xl border border-trough-yellow"><span class="text-[11px] text-trough-yellow font-medium block">Total Forecast Season Net Surplus</span><span class="text-xl font-bold font-mono text-trough-yellow">+$' + formatMoney(totalSurplus) + '</span></div>';
    }
  }

  // ===================== MASTER RENDER =====================
  function renderAll(opts) {
    const o = opts || {};
    updateQuickModeLabel();
    setDbStatus(state.dbConnected);
    renderProgrammingTab(Boolean(o.rebuildSimControls));
    renderDashboardTab();
    if (o.rebuildSimControls) renderSimulatorControls();
    renderSimulatorProformaAndChrome();
    renderWagesTab(Boolean(o.rebuildRoster));
    renderPromoterTab(Boolean(o.rebuildDealInputs));
    renderInventoryTab(Boolean(o.rebuildInvTable));
    renderEventsTab();
  }

  // Initial Boot
  renderAll({
    rebuildSimControls: true,
    rebuildRoster: true,
    rebuildDealInputs: true,
    rebuildInvTable: true
  });
})();
</script>
