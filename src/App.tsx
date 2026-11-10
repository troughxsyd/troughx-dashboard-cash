/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, signIn, signOut } from './services/googleWorkspace';
import {
  WorkspaceSyncPanel,
  GoogleSignInButton,
} from './components/WorkspaceSyncPanel';

export interface RosterItem {
  role: string;
  headcount: number;
  hours: number;
  rate: number;
  hasSuper: boolean;
  notes: string;
}

export interface PipelineEvent {
  date: string;
  title: string;
  type: 'promoter' | 'owned';
  format: string;
  pax: number;
  barGross: number;
  clip: number;
  ticketRev: number;
  deposit: number;
  wages: number;
  surplus: number;
}

export interface SavedRosterTemplate {
  id: string;
  name: string;
  updatedAt: string;
  includeSuper: boolean;
  items: RosterItem[];
}

const STORAGE_KEYS = {
  EVENTS: 'trough_x_saved_events_v3',
  ROSTER: 'trough_x_saved_roster_v4',
  ROSTER_SUPER: 'trough_x_saved_roster_super_v4',
  ROSTER_TEMPLATES: 'trough_x_roster_templates_v4',
};

const DEFAULT_ROSTER: RosterItem[] = [
  {
    role: 'Venue Duty Manager',
    headcount: 1,
    hours: 6.0,
    rate: 55.0,
    hasSuper: true,
    notes: 'Incident management, licensing compliance, cash reconciliation',
  },
  {
    role: 'Senior Bartender',
    headcount: 2,
    hours: 6.0,
    rate: 45.0,
    hasSuper: true,
    notes: 'Main bar and basement dispensary service',
  },
  {
    role: 'Licensed Crowd Control',
    headcount: 1,
    hours: 6.0,
    rate: 55.0,
    hasSuper: false,
    notes: 'Licensed crowd control & street line management (Contracted Agency)',
  },
  {
    role: 'Door / Ticket Scanner & Cloak',
    headcount: 1,
    hours: 6.0,
    rate: 35.0,
    hasSuper: true,
    notes: 'ID verification, wristbanding, ticket clip & cloakroom accounting',
  },
  {
    role: 'Cleaning Crew',
    headcount: 1,
    hours: 6.0,
    rate: 60.0,
    hasSuper: true,
    notes: 'Bio-wash, floor sanitisation, commercial waste disposal',
  },
];

const EVENTS_DATA: PipelineEvent[] = [
  {
    date: '14/11/2026',
    title: 'ACTION by Thick N Juicy',
    type: 'promoter',
    format: 'Promoter Hosted',
    pax: 300,
    barGross: 10000,
    clip: 1500,
    ticketRev: 0,
    deposit: 0,
    wages: 4060,
    surplus: 4185,
  },
  {
    date: '21/11/2026',
    title: 'THROBB by brute.club',
    type: 'promoter',
    format: 'Promoter Hosted',
    pax: 280,
    barGross: 8000,
    clip: 1400,
    ticketRev: 0,
    deposit: 0,
    wages: 3860,
    surplus: 3125,
  },
  {
    date: '28/11/2026',
    title: 'Red Rave by POOF DOOF',
    type: 'promoter',
    format: 'Promoter Hosted',
    pax: 300,
    barGross: 10000,
    clip: 1500,
    ticketRev: 0,
    deposit: 0,
    wages: 4060,
    surplus: 4185,
  },
  {
    date: '04/12/2026',
    title: 'BUSH (2nd Edition)',
    type: 'promoter',
    format: 'Promoter Hosted',
    pax: 250,
    barGross: 7000,
    clip: 1250,
    ticketRev: 0,
    deposit: 550,
    wages: 3560,
    surplus: 2950,
  },
  {
    date: '12/12/2026',
    title: 'THROBB Festive Edition',
    type: 'promoter',
    format: 'Promoter Hosted',
    pax: 280,
    barGross: 8000,
    clip: 1400,
    ticketRev: 0,
    deposit: 0,
    wages: 3860,
    surplus: 3125,
  },
  {
    date: '19/12/2026',
    title: 'Trough Noir: Summer Edition',
    type: 'owned',
    format: 'Owned Hero Night',
    pax: 240,
    barGross: 6500,
    clip: 0,
    ticketRev: 7200,
    deposit: 0,
    wages: 3500,
    surplus: 6150,
  },
  {
    date: '31/12/2026',
    title: 'NYE Lock-In 2026/27',
    type: 'owned',
    format: 'Owned Hero Night',
    pax: 300,
    barGross: 12500,
    clip: 0,
    ticketRev: 12000,
    deposit: 0,
    wages: 4200,
    surplus: 12850,
  },
  {
    date: '16/01/2027',
    title: 'Bareback Cabaret Launch',
    type: 'owned',
    format: 'Owned Daytime',
    pax: 160,
    barGross: 4800,
    clip: 0,
    ticketRev: 3200,
    deposit: 0,
    wages: 2800,
    surplus: 2950,
  },
  {
    date: '30/01/2027',
    title: 'LNQD (Late Night Queer Dance)',
    type: 'promoter',
    format: 'Promoter Hosted',
    pax: 250,
    barGross: 7000,
    clip: 1250,
    ticketRev: 0,
    deposit: 0,
    wages: 3560,
    surplus: 2400,
  },
  {
    date: '13/02/2027',
    title: 'Mardi Gras Warmup: Sniffies Cruise',
    type: 'owned',
    format: 'Owned Hero Night',
    pax: 300,
    barGross: 11000,
    clip: 0,
    ticketRev: 9000,
    deposit: 0,
    wages: 4100,
    surplus: 9400,
  },
  {
    date: '27/02/2027',
    title: 'TROUGH Mardi Gras Festival Main',
    type: 'owned',
    format: 'Owned Festival',
    pax: 300,
    barGross: 15000,
    clip: 0,
    ticketRev: 15000,
    deposit: 0,
    wages: 4400,
    surplus: 15650,
  },
  {
    date: '06/03/2027',
    title: 'FK CLUB Recovery',
    type: 'owned',
    format: 'Owned Recovery',
    pax: 180,
    barGross: 5500,
    clip: 0,
    ticketRev: 4500,
    deposit: 0,
    wages: 2800,
    surplus: 4125,
  },
];

type TabId = 'dashboard' | 'simulator' | 'wages' | 'promoter' | 'calendar';

function formatMoney(val: number): string {
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Simulator State
  const [simMode, setSimMode] = useState<'owned' | 'promoter'>('owned');
  const [simPax, setSimPax] = useState<number>(200);
  const [simTicketPrice, setSimTicketPrice] = useState<number>(30);
  const [simTicketClip, setSimTicketClip] = useState<number>(5.0);
  const [simBarSpend, setSimBarSpend] = useState<number>(22.5);
  const [simCloakRate, setSimCloakRate] = useState<number>(50);
  const [simCogsRate, setSimCogsRate] = useState<number>(22.0);
  const [simPromoterDeposit, setSimPromoterDeposit] = useState<boolean>(true);

  // Simulator Linked Forthcoming Event Editor State
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [simEventDate, setSimEventDate] = useState<string>('20/03/2027');
  const [simEventTitle, setSimEventTitle] = useState<string>('Trough X Custom Night');
  const [simEventFormat, setSimEventFormat] = useState<string>('Owned Hero Night');
  const [simSaveNotice, setSimSaveNotice] = useState<string | null>(null);

  // Roster State (Loaded from localStorage if saved)
  const [roster, setRoster] = useState<RosterItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROSTER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_ROSTER.map((r) => ({ ...r }));
  });

  const [wagesIncludeSuper, setWagesIncludeSuper] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROSTER_SUPER);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return true;
  });

  const [rosterSavedNotice, setRosterSavedNotice] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [savedRosterTemplates, setSavedRosterTemplates] = useState<
    SavedRosterTemplate[]
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROSTER_TEMPLATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return [
      {
        id: 'baseline-200',
        name: 'Baseline 200 Pax Roster (Default)',
        updatedAt: 'Default',
        includeSuper: true,
        items: DEFAULT_ROSTER.map((r) => ({ ...r })),
      },
      {
        id: 'peak-300',
        name: 'Peak 300 Pax Sell-Out Roster (2 Guards, 3 Bar)',
        updatedAt: 'Preset',
        includeSuper: true,
        items: DEFAULT_ROSTER.map((r) => {
          if (r.role.includes('Crowd Control') || r.role.includes('Security')) {
            return { ...r, headcount: 2 };
          }
          if (r.role.includes('Bartender')) return { ...r, headcount: 3 };
          return { ...r };
        }),
      },
    ];
  });

  // Promoter Deal Viability Tester State
  const [dealPax, setDealPax] = useState<number>(220);
  const [dealClip, setDealClip] = useState<number>(5.0);
  const [dealSpend, setDealSpend] = useState<number>(24.0);

  // Calendar Filter & Dynamic Events State (Loaded from localStorage if saved)
  const [eventFilter, setEventFilter] = useState<'all' | 'owned' | 'promoter'>('all');
  const [events, setEvents] = useState<PipelineEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return EVENTS_DATA.map((e) => ({ ...e }));
  });
  const [eventsSavedNotice, setEventsSavedNotice] = useState<string | null>(null);
  const [inlineEditIndex, setInlineEditIndex] = useState<number | null>(null);
  const [inlineEditDraft, setInlineEditDraft] = useState<PipelineEvent | null>(null);

  // Persist helper for Events
  const persistEventsToStorage = (
    nextEvents: PipelineEvent[],
    noticeMsg = 'Schedule saved'
  ) => {
    setEvents(nextEvents);
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(nextEvents));
      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setEventsSavedNotice(`${noticeMsg} (${timeStr})`);
    } catch {
      // Ignore storage quota errors
    }
  };

  // Persist helper for Wage Calculator Roster
  const saveCurrentRosterToStorage = (noticeMsg = 'Wage roster saved') => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(roster));
      localStorage.setItem(
        STORAGE_KEYS.ROSTER_SUPER,
        JSON.stringify(wagesIncludeSuper)
      );
      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setRosterSavedNotice(`${noticeMsg} (${timeStr})`);
    } catch {
      // Ignore storage errors
    }
  };

  const handleSaveNamedRosterTemplate = () => {
    const cleanName =
      newTemplateName.trim() ||
      `Custom Roster (${rosterSummary.totalHeadcount} Staff — $${Math.round(
        rosterSummary.grandTotal
      )})`;
    const newTpl: SavedRosterTemplate = {
      id: `tpl-${Date.now()}`,
      name: cleanName,
      updatedAt: new Date().toLocaleDateString('en-AU'),
      includeSuper: wagesIncludeSuper,
      items: roster.map((r) => ({ ...r })),
    };
    const nextTemplates = [newTpl, ...savedRosterTemplates];
    setSavedRosterTemplates(nextTemplates);
    setNewTemplateName('');
    try {
      localStorage.setItem(
        STORAGE_KEYS.ROSTER_TEMPLATES,
        JSON.stringify(nextTemplates)
      );
    } catch {
      // Ignore
    }
    saveCurrentRosterToStorage(`Saved template "${cleanName}"`);
  };

  const handleLoadRosterTemplate = (tpl: SavedRosterTemplate) => {
    const cloned = tpl.items.map((r) => ({ ...r }));
    setRoster(cloned);
    setWagesIncludeSuper(tpl.includeSuper);
    try {
      localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(cloned));
      localStorage.setItem(
        STORAGE_KEYS.ROSTER_SUPER,
        JSON.stringify(tpl.includeSuper)
      );
      setRosterSavedNotice(`Loaded "${tpl.name}"`);
    } catch {
      // Ignore
    }
  };

  const handleDeleteRosterTemplate = (id: string) => {
    const next = savedRosterTemplates.filter((t) => t.id !== id);
    setSavedRosterTemplates(next);
    try {
      localStorage.setItem(STORAGE_KEYS.ROSTER_TEMPLATES, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  // Google Workspace User State
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (err) {
      console.error('Google Sign-In error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Google Sign-Out error:', err);
    }
  };

  const handleUpdateEvents = (
    newEvents: PipelineEvent[],
    mode: 'replace' | 'merge'
  ) => {
    if (mode === 'replace') {
      persistEventsToStorage(newEvents, 'Synced & saved events');
    } else {
      const existingKeys = new Set(events.map((e) => `${e.date}::${e.title}`));
      const deduped = newEvents.filter(
        (e) => !existingKeys.has(`${e.date}::${e.title}`)
      );
      persistEventsToStorage([...events, ...deduped], 'Merged & saved events');
    }
  };

  const handleResetDefaultEvents = () => {
    const defaults = EVENTS_DATA.map((e) => ({ ...e }));
    persistEventsToStorage(defaults, 'Restored baseline schedule');
    setEditingEventIndex(null);
  };

  // Load a Forthcoming Event into the Budget Simulator for editing & saving
  const loadEventIntoSimulator = (item: PipelineEvent, indexInEvents: number) => {
    setEditingEventIndex(indexInEvents);
    setSimEventDate(item.date);
    setSimEventTitle(item.title);
    setSimEventFormat(
      item.format || (item.type === 'promoter' ? 'Promoter Hosted' : 'Owned Hero Night')
    );
    setSimMode(item.type);
    setSimPax(Math.min(300, Math.max(50, item.pax)));
    const estBarSpend =
      item.pax > 0 ? Math.round((item.barGross / item.pax) * 2) / 2 : 22.5;
    setSimBarSpend(Math.min(45, Math.max(12, estBarSpend)));
    if (item.type === 'owned' && item.pax > 0 && item.ticketRev > 0) {
      setSimTicketPrice(
        Math.min(60, Math.max(15, Math.round(item.ticketRev / item.pax)))
      );
    }
    if (item.type === 'promoter' && item.pax > 0 && item.clip >= 0) {
      setSimTicketClip(Number((item.clip / item.pax).toFixed(2)));
    }
    setSimPromoterDeposit(item.deposit > 0);
    setSimSaveNotice(null);
    setActiveTab('simulator');
  };

  const startNewEventInSimulator = () => {
    setEditingEventIndex(null);
    setSimEventDate('20/03/2027');
    setSimEventTitle('New Trough X Event');
    setSimEventFormat(simMode === 'promoter' ? 'Promoter Hosted' : 'Owned Hero Night');
    setSimSaveNotice(null);
    setActiveTab('simulator');
  };

  // Quick toggle button in header
  const toggleSimModeQuick = () => {
    setSimMode((prev) => {
      const next = prev === 'owned' ? 'promoter' : 'owned';
      setSimEventFormat(next === 'promoter' ? 'Promoter Hosted' : 'Owned Hero Night');
      return next;
    });
    setActiveTab('simulator');
  };

  const resetSimulatorDefaults = () => {
    setEditingEventIndex(null);
    setSimEventDate('20/03/2027');
    setSimEventTitle('Trough X Custom Night');
    setSimEventFormat('Owned Hero Night');
    setSimPax(200);
    setSimTicketPrice(30);
    setSimTicketClip(5.0);
    setSimBarSpend(22.5);
    setSimCloakRate(50);
    setSimCogsRate(22.0);
    setSimPromoterDeposit(true);
    setSimMode('owned');
    setSimSaveNotice(null);
  };

  // Simulator Calculations
  const simMetrics = useMemo(() => {
    const cloakFraction = simCloakRate / 100;
    const cogsFraction = simCogsRate / 100;

    let ticketRevenue = 0;
    let depositRevenue = 0;

    if (simMode === 'owned') {
      ticketRevenue = simPax * simTicketPrice;
    } else {
      ticketRevenue = simPax * simTicketClip;
      depositRevenue = simPromoterDeposit ? 550.0 : 0.0;
    }

    const barRevenue = simPax * simBarSpend;
    const cloakItems = Math.round(simPax * cloakFraction);
    const cloakRevenue = cloakItems * 5.0;
    const grossTurnover = ticketRevenue + barRevenue + cloakRevenue + depositRevenue;

    const beverageCogs = barRevenue * cogsFraction;
    const consumables = simPax > 220 ? 200.0 : simPax > 150 ? 150.0 : 100.0;
    const grossMargin = grossTurnover - beverageCogs - consumables;

    let baseRosterWages = 0;
    let staffCount = 0;
    let guards = 0;
    let bartenders = 0;

    roster.forEach((item) => {
      let count = item.headcount;
      if (item.role.includes('Crowd Control') || item.role.includes('Security')) {
        if (simPax > 240) count = count + 1;
        guards += count;
      } else if (item.role.includes('Bartender')) {
        if (simPax > 220) count = count + 1;
        bartenders += count;
      }
      staffCount += count;
      baseRosterWages += count * item.hours * item.rate;
    });

    const talentCost =
      simMode === 'owned' ? (simPax > 240 ? 1200 : simPax > 150 ? 900 : 600) : 0;
    const productionCost =
      simMode === 'owned' ? (simPax > 240 ? 600 : 450) : 150;
    const terminalFees = grossTurnover * 0.015;
    const marketingCost = simMode === 'owned' ? 400 : 0;
    const totalOverheads = talentCost + productionCost + terminalFees + marketingCost;

    const netSurplus = grossMargin - baseRosterWages - totalOverheads;
    const wageRatio = grossTurnover > 0 ? (baseRosterWages / grossTurnover) * 100 : 0;
    const marginRatio = grossTurnover > 0 ? (netSurplus / grossTurnover) * 100 : 0;

    return {
      ticketRevenue,
      depositRevenue,
      barRevenue,
      cloakRevenue,
      grossTurnover,
      beverageCogs,
      consumables,
      grossMargin,
      guards,
      bartenders,
      staffCount,
      baseRosterWages,
      talentCost,
      productionCost,
      terminalFees,
      marketingCost,
      netSurplus,
      wageRatio,
      marginRatio,
    };
  }, [
    simPax,
    simTicketPrice,
    simTicketClip,
    simBarSpend,
    simCloakRate,
    simCogsRate,
    simPromoterDeposit,
    simMode,
    roster,
  ]);

  // Roster Calculations
  const rosterSummary = useMemo(() => {
    let totalHeadcount = 0;
    let totalHours = 0;
    let grossWages = 0;
    let grandTotal = 0;

    const itemsWithTotals = roster.map((item) => {
      const itemHours = item.headcount * item.hours;
      const baseCost = itemHours * item.rate;
      const superCost = wagesIncludeSuper && item.hasSuper ? baseCost * 0.115 : 0;
      const itemTotal = baseCost + superCost;

      totalHeadcount += item.headcount;
      totalHours += itemHours;
      grossWages += baseCost;
      grandTotal += itemTotal;

      return {
        ...item,
        itemTotal,
      };
    });

    return {
      itemsWithTotals,
      totalHeadcount,
      totalHours,
      grossWages,
      grandTotal,
    };
  }, [roster, wagesIncludeSuper]);

  const updateRosterItem = (
    index: number,
    field: keyof RosterItem,
    value: number | string | boolean
  ) => {
    setRoster((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addRosterRole = () => {
    setRoster((prev) => [
      ...prev,
      {
        role: 'Additional Operational Staff',
        headcount: 1,
        hours: 6.0,
        rate: 35.0,
        hasSuper: true,
        notes: 'Custom floor, barback, or production support shift',
      },
    ]);
  };

  const removeRosterRole = (index: number) => {
    setRoster((prev) => prev.filter((_, i) => i !== index));
  };

  const resetRosterDefaults = () => {
    const defaults = DEFAULT_ROSTER.map((r) => ({ ...r }));
    setRoster(defaults);
    setWagesIncludeSuper(true);
    try {
      localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(defaults));
      localStorage.setItem(STORAGE_KEYS.ROSTER_SUPER, JSON.stringify(true));
      setRosterSavedNotice('Restored default IFA roster');
    } catch {
      // Ignore
    }
  };

  // Build a PipelineEvent object from current Budget Simulator state
  const buildPipelineEventFromSimulator = (): PipelineEvent => {
    const cleanDate = simEventDate.trim() || 'TBC';
    const cleanTitle = simEventTitle.trim() || 'Untitled Trough X Event';
    const cleanFormat =
      simEventFormat.trim() ||
      (simMode === 'promoter' ? 'Promoter Hosted' : 'Owned Hero Night');

    return {
      date: cleanDate,
      title: cleanTitle,
      type: simMode,
      format: cleanFormat,
      pax: simPax,
      barGross: Math.round(simMetrics.barRevenue),
      clip: simMode === 'promoter' ? Math.round(simMetrics.ticketRevenue) : 0,
      ticketRev: simMode === 'owned' ? Math.round(simMetrics.ticketRevenue) : 0,
      deposit: simMode === 'promoter' ? Math.round(simMetrics.depositRevenue) : 0,
      wages: Math.round(simMetrics.baseRosterWages),
      surplus: Math.round(simMetrics.netSurplus),
    };
  };

  const handleSaveSimulatorToExistingEvent = () => {
    if (editingEventIndex === null || editingEventIndex < 0 || editingEventIndex >= events.length) {
      return;
    }
    const updatedEvent = buildPipelineEventFromSimulator();
    const next = events.map((ev, idx) =>
      idx === editingEventIndex ? updatedEvent : ev
    );
    persistEventsToStorage(next, `Updated "${updatedEvent.title}"`);
    setSimSaveNotice(
      `Saved changes to "${updatedEvent.title}" (${updatedEvent.date}) in Forthcoming Events.`
    );
  };

  const handleSaveSimulatorAsNewEvent = () => {
    const newEvent = buildPipelineEventFromSimulator();
    const next = [...events, newEvent];
    persistEventsToStorage(next, `Added "${newEvent.title}"`);
    setEditingEventIndex(next.length - 1);
    setSimSaveNotice(
      `Added "${newEvent.title}" (${newEvent.date}) to Forthcoming Events schedule.`
    );
  };

  const handleDeleteEvent = (indexInEvents: number) => {
    const target = events[indexInEvents];
    const next = events.filter((_, idx) => idx !== indexInEvents);
    persistEventsToStorage(
      next,
      target ? `Removed "${target.title}"` : 'Removed event'
    );
    if (editingEventIndex === indexInEvents) {
      setEditingEventIndex(null);
    }
  };

  const startInlineEditEvent = (item: PipelineEvent, indexInEvents: number) => {
    setInlineEditIndex(indexInEvents);
    setInlineEditDraft({ ...item });
  };

  const saveInlineEditEvent = () => {
    if (inlineEditIndex === null || !inlineEditDraft) return;
    const next = events.map((ev, idx) =>
      idx === inlineEditIndex ? { ...inlineEditDraft } : ev
    );
    persistEventsToStorage(next, `Saved "${inlineEditDraft.title}"`);
    setInlineEditIndex(null);
    setInlineEditDraft(null);
  };

  // Promoter Deal Tester Calculations
  const dealMetrics = useMemo(() => {
    const pax = dealPax || 0;
    const clip = dealClip >= 0 ? dealClip : 0;
    const spend = dealSpend || 0;

    const clipTotal = pax * clip;
    const barTotal = pax * spend;
    const cloakTotal = pax * 0.5 * 5.0;
    const grossTurnover = clipTotal + barTotal + cloakTotal;

    const cogs = barTotal * 0.22 + 150.0;
    const wages = rosterSummary.grossWages;
    const overheads = grossTurnover * 0.015 + 150.0;
    const netSurplus = grossTurnover - cogs - wages - overheads;

    // Dynamic Breakeven Mathematics per Patron
    const barNetPerHead = spend * (1 - 0.22);
    const cloakPerHead = 2.5;
    const netMarginPerHead = clip + barNetPerHead + cloakPerHead;
    const fixedOverhead = wages + 300.0;
    const breakevenNoDeposit =
      netMarginPerHead > 0 ? Math.ceil(fixedOverhead / netMarginPerHead) : 300;
    const breakevenWithDeposit =
      netMarginPerHead > 0
        ? Math.ceil(Math.max(0, fixedOverhead - 550.0) / netMarginPerHead)
        : 300;

    return {
      clip,
      clipTotal,
      barTotal,
      cloakTotal,
      cogs,
      wages,
      fixedOverhead,
      overheads,
      netSurplus,
      barNetPerHead,
      netMarginPerHead,
      breakevenNoDeposit,
      breakevenWithDeposit,
    };
  }, [dealPax, dealClip, dealSpend, rosterSummary.grossWages]);

  // Filtered Pipeline Events preserving original index in `events`
  const filteredEventsWithIndex = useMemo(() => {
    return events
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        if (eventFilter === 'owned') return item.type === 'owned';
        if (eventFilter === 'promoter') return item.type === 'promoter';
        return true;
      });
  }, [eventFilter, events]);

  const calendarTotals = useMemo(() => {
    let totalGross = 0;
    let totalWages = 0;
    let totalSurplus = 0;
    filteredEventsWithIndex.forEach(({ item }) => {
      const gross = item.barGross + item.clip + item.ticketRev + item.deposit;
      totalGross += gross;
      totalWages += item.wages;
      totalSurplus += item.surplus;
    });
    return { totalGross, totalWages, totalSurplus };
  }, [filteredEventsWithIndex]);

  const simulatorSnapshot = useMemo(
    () => ({
      'Production Mode':
        simMode === 'owned'
          ? 'Trough-Owned Party (100% Retention)'
          : `Promoter Hosted ($${simTicketClip.toFixed(2)} Ticket Clip)`,
      'Expected Attendance (Pax)': simPax,
      'Average Ticket Yield / Clip (AUD)':
        simMode === 'owned' ? simTicketPrice : simTicketClip,
      'Average Bar Spend / Head (AUD)': simBarSpend,
      'Cloakroom Check-In Rate (%)': simCloakRate,
      'Beverage COGS Target (%)': simCogsRate,
      'Ticket / Clip Revenue (AUD)': Number(simMetrics.ticketRevenue.toFixed(2)),
      'Bar POS Turnover (AUD)': Number(simMetrics.barRevenue.toFixed(2)),
      'Cloakroom Revenue (AUD)': Number(simMetrics.cloakRevenue.toFixed(2)),
      'Promoter Deposit (AUD)': Number(simMetrics.depositRevenue.toFixed(2)),
      'Total Gross Venue Turnover (AUD)': Number(simMetrics.grossTurnover.toFixed(2)),
      'Beverage Stock COGS (AUD)': Number(simMetrics.beverageCogs.toFixed(2)),
      'Direct IFA Venue Wages (AUD)': Number(simMetrics.baseRosterWages.toFixed(2)),
      'Wage Cost Ratio (%)': Number(simMetrics.wageRatio.toFixed(1)),
      'Net Contribution Operating Surplus (AUD)': Number(simMetrics.netSurplus.toFixed(2)),
      'Contribution Margin (%)': Number(simMetrics.marginRatio.toFixed(1)),
    }),
    [
      simMode,
      simPax,
      simTicketPrice,
      simTicketClip,
      simBarSpend,
      simCloakRate,
      simCogsRate,
      simMetrics,
    ]
  );

  return (
    <div className="min-h-screen flex flex-col bg-trough-bgDark text-slate-100 antialiased selection:bg-trough-yellow selection:text-black">
      {/* TOP HEADER / NAV */}
      <header className="no-print border-b border-trough-cardBorder bg-[#181924]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Location */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-trough-yellow flex items-center justify-center font-extrabold text-black text-xl shadow-[0_0_15px_rgba(255,204,0,0.35)]">
              TX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white">
                  TROUGH X{' '}
                  <span className="text-trough-yellow text-xs px-2 py-0.5 rounded-full bg-trough-yellow/10 border border-trough-yellow/30 font-medium">
                    SYDNEY
                  </span>
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono hidden sm:inline-block">
                  LIVE MODEL v3.2
                </span>
              </div>
              <p className="text-xs text-trough-muted flex items-center gap-1.5">
                <i className="fa-solid fa-location-dot text-trough-yellow"></i> 273 Crown St,
                Surry Hills &bull; Cap: 300 Max (Basement 60)
              </p>
            </div>
          </div>

          {/* Action Buttons & Mode Pill */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {!user ? (
              <GoogleSignInButton onClick={handleSignIn} />
            ) : (
              <button
                onClick={() => setActiveTab('calendar')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer"
                title={`Signed in as ${user.email}`}
              >
                <i className="fa-solid fa-cloud-bolt text-trough-yellow"></i>
                <span>Workspace Sync ({user.email?.split('@')[0]})</span>
              </button>
            )}

            <button
              onClick={toggleSimModeQuick}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-trough-steelGrey hover:bg-trough-steelSlate transition border border-slate-600 flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-arrows-rotate text-trough-yellow"></i>
              <span>
                {simMode === 'owned'
                  ? 'Switch to Promoter Model ($5 Clip)'
                  : 'Switch to Trough-Owned Model'}
              </span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-print"></i>
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="border-t border-trough-cardBorder bg-[#14151F]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-3 overflow-x-auto py-1.5 text-xs font-medium scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'text-black bg-trough-yellow font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-chart-pie"></i> Executive Dashboard
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'text-black bg-trough-yellow font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-sliders"></i> Budget Simulator
            </button>
            <button
              onClick={() => setActiveTab('wages')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'wages'
                  ? 'text-black bg-trough-yellow font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-users-gear"></i> Wage Calculator (IFA)
            </button>
            <button
              onClick={() => setActiveTab('promoter')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'promoter'
                  ? 'text-black bg-trough-yellow font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-handshake-simple"></i> Promoter Deal Analyzer
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'text-black bg-trough-yellow font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-calendar-days"></i> Forthcoming Events
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ================= TAB 1: EXECUTIVE DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <section className="space-y-6">
            {/* Operational Notice Bar */}
            <div className="bg-gradient-to-r from-trough-cardDark to-[#242738] border-l-4 border-trough-yellow p-4 rounded-xl shadow flex flex-col md:flex-row md:items-center justify-between gap-3 border border-trough-cardBorder">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-trough-yellow/10 rounded-lg text-trough-yellow text-lg">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">
                    273 Crown Street Surry Hills Compliance Framework
                  </h4>
                  <p className="text-xs text-trough-muted">
                    Maximum capacity capped at 300 patrons total (Basement strict limit: 60 patrons).
                    Wages governed by flat-rate IFA BOOT standards.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  1:100 Security Ratio
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-trough-yellow font-mono">
                  Medic Mandatory
                </span>
              </div>
            </div>

            {/* KPI Executive Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Target Gross */}
              <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 hover:border-slate-600 transition shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-trough-muted uppercase tracking-wider">
                    Target Gross (200 Pax)
                  </span>
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">
                    <i className="fa-solid fa-arrow-trend-up"></i>
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    $11,000
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Owned Night
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-trough-muted">
                  $6k Tickets + $4.5k Bar + $500 Cloak
                </p>
              </div>

              {/* Target Net Surplus */}
              <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 hover:border-trough-yellow/50 transition shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-trough-yellow/5 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-trough-yellow uppercase tracking-wider">
                    Target Net Surplus
                  </span>
                  <span className="p-1.5 rounded-lg bg-trough-yellow/10 text-trough-yellow text-xs">
                    <i className="fa-solid fa-sack-dollar"></i>
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-trough-yellow">
                    $4,475
                  </span>
                  <span className="text-[11px] text-trough-yellow font-medium">
                    40.7% Margin
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-trough-muted">
                  Gross Margin less Wages &amp; Overheads
                </p>
              </div>

              {/* Wage Bill Ratio */}
              <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 hover:border-slate-600 transition shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-trough-muted uppercase tracking-wider">
                    Labour Cost Ratio
                  </span>
                  <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    29.4%
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    &le; 30% Benchmark
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-trough-muted">
                  $3,235.00 Total Direct Shift Wages
                </p>
              </div>

              {/* Promoter Breakeven */}
              <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 hover:border-slate-600 transition shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-trough-muted uppercase tracking-wider">
                    Promoter Breakeven
                  </span>
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
                    <i className="fa-solid fa-scale-balanced"></i>
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    144 Pax
                  </span>
                  <span className="text-[11px] text-amber-300 font-mono">
                    121 w/ Deposit
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-trough-muted">
                  Based on $5 Clip + $22.50 bar spend
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Comparative Performance Chart (2 cols) */}
              <div className="lg:col-span-2 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <i className="fa-solid fa-chart-column text-trough-yellow"></i> Operating
                      Scenario Comparison
                    </h3>
                    <p className="text-xs text-trough-muted">
                      Actual Historical (Sept 11) vs Owned Target vs Owned Peak vs Promoter Model
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4A5568]"></span> Gross
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Wages
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-trough-yellow"></span> Surplus
                    </span>
                  </div>
                </div>

                {/* SVG Bar Chart replicating Chart.js Scenario Comparison */}
                <ScenarioBarChart />
              </div>

              {/* Cost Allocation Doughnut Chart (1 col) */}
              <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <i className="fa-solid fa-chart-pie text-trough-yellow"></i> Target Cost &amp;
                    Margin Split
                  </h3>
                  <p className="text-xs text-trough-muted">
                    Allocation of $11,000 Target Turnover
                  </p>
                </div>

                <div className="relative h-56 w-full my-auto flex items-center justify-center">
                  <CostAllocationDoughnut />
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] grid grid-cols-2 gap-2 text-trough-muted">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-trough-yellow"></span> Net Surplus: 40.7%
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-rose-500"></span> Direct Wages: 29.4%
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-blue-500"></span> Production: 19.5%
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-emerald-500"></span> Bar COGS: 10.4%
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Actuals vs Benchmark Table */}
            <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <i className="fa-solid fa-scale-unbalanced-flip text-trough-yellow"></i>{' '}
                    Operating Models Performance Matrix
                  </h3>
                  <p className="text-xs text-trough-muted">
                    Cross-reconciliation across attendance levels and licensing limits
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#171822] text-slate-300 uppercase tracking-wider text-[10px] border-b border-trough-cardBorder">
                    <tr>
                      <th className="py-3 px-3.5">Model Scenario</th>
                      <th className="py-3 px-3.5">Patron Count</th>
                      <th className="py-3 px-3.5">Gross Revenue</th>
                      <th className="py-3 px-3.5">Beverage COGS</th>
                      <th className="py-3 px-3.5">Total Direct Wages</th>
                      <th className="py-3 px-3.5">Labour %</th>
                      <th className="py-3 px-3.5 text-right font-bold text-trough-yellow">
                        Net Operating Surplus
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-200">
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-3 px-3.5 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span> Actuals (11 Sept
                        Historical)
                      </td>
                      <td className="py-3 px-3.5 font-mono">150 Pax</td>
                      <td className="py-3 px-3.5 font-mono">$4,881.00</td>
                      <td className="py-3 px-3.5 font-mono text-slate-400">($857.00)</td>
                      <td className="py-3 px-3.5 font-mono text-rose-300">($1,290.00)</td>
                      <td className="py-3 px-3.5 font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                          26.4%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-right font-bold text-trough-yellow">
                        +$2,644.00
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-3 px-3.5 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span> Conservative Owned
                        Party
                      </td>
                      <td className="py-3 px-3.5 font-mono">120 Pax</td>
                      <td className="py-3 px-3.5 font-mono">$6,060.00</td>
                      <td className="py-3 px-3.5 font-mono text-slate-400">($528.00)</td>
                      <td className="py-3 px-3.5 font-mono text-rose-300">($2,560.00)</td>
                      <td className="py-3 px-3.5 font-mono">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                          42.2%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-right font-bold text-trough-yellow">
                        +$1,472.00
                      </td>
                    </tr>
                    <tr className="bg-trough-yellow/5 border-l-2 border-trough-yellow hover:bg-trough-yellow/10">
                      <td className="py-3 px-3.5 font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-trough-yellow"></span> Target Owned
                        Party (Baseline)
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-white">200 Pax</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-white">$11,000.00</td>
                      <td className="py-3 px-3.5 font-mono text-slate-400">($990.00)</td>
                      <td className="py-3 px-3.5 font-mono text-rose-300">($3,235.00)</td>
                      <td className="py-3 px-3.5 font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          29.4%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-right font-bold text-trough-yellow text-sm">
                        +$4,475.00
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-3 px-3.5 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span> Peak Sell-Out
                        Owned Party
                      </td>
                      <td className="py-3 px-3.5 font-mono">280 Pax</td>
                      <td className="py-3 px-3.5 font-mono">$18,440.00</td>
                      <td className="py-3 px-3.5 font-mono text-slate-400">($1,725.00)</td>
                      <td className="py-3 px-3.5 font-mono text-rose-300">($3,980.00)</td>
                      <td className="py-3 px-3.5 font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                          21.6%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-right font-bold text-trough-yellow">
                        +$9,535.00
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-3 px-3.5 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Promoter Hosted
                        Target ($5 Clip)
                      </td>
                      <td className="py-3 px-3.5 font-mono">200 Pax</td>
                      <td className="py-3 px-3.5 font-mono">$6,000.00</td>
                      <td className="py-3 px-3.5 font-mono text-slate-400">($990.00)</td>
                      <td className="py-3 px-3.5 font-mono text-rose-300">($3,235.00)</td>
                      <td className="py-3 px-3.5 font-mono">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300">
                          53.9%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-right font-bold text-trough-yellow">
                        +$1,385.00
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-3 px-3.5 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span> Promoter Hosted
                        Under-Breakeven
                      </td>
                      <td className="py-3 px-3.5 font-mono">120 Pax</td>
                      <td className="py-3 px-3.5 font-mono">$3,300.00</td>
                      <td className="py-3 px-3.5 font-mono text-slate-400">($528.00)</td>
                      <td className="py-3 px-3.5 font-mono text-rose-300">($3,110.00)</td>
                      <td className="py-3 px-3.5 font-mono">
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                          94.2%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-right font-bold text-rose-400">
                        -$637.50
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 2: INTERACTIVE BUDGET SIMULATOR ================= */}
        {activeTab === 'simulator' && (
          <section className="space-y-6">
            {/* FORTHCOMING EVENT LINK & SAVE BAR */}
            <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-trough-yellow/15 border border-trough-yellow/30 flex items-center justify-center text-trough-yellow">
                    <i className="fa-solid fa-calendar-pen"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-white">
                        Forthcoming Event Builder &amp; Schedule Editor
                      </h3>
                      {editingEventIndex !== null && events[editingEventIndex] ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-trough-yellow/20 text-trough-yellow border border-trough-yellow/40 font-mono">
                          Editing Event #{editingEventIndex + 1}: {events[editingEventIndex].title}
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          New / Custom Event Mode
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-trough-muted">
                      Load any forthcoming event below, adjust parameters with the sliders, and save
                      directly back to the Forthcoming Events schedule.
                    </p>
                  </div>
                </div>

                {/* Dropdown to pick an existing Forthcoming Event to edit */}
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-xs text-slate-400">Load Event:</label>
                  <select
                    value={editingEventIndex !== null ? String(editingEventIndex) : 'new'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'new') {
                        startNewEventInSimulator();
                      } else {
                        const idx = parseInt(val, 10);
                        if (!Number.isNaN(idx) && events[idx]) {
                          loadEventIntoSimulator(events[idx], idx);
                        }
                      }
                    }}
                    className="bg-[#151621] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-trough-yellow focus:outline-none max-w-xs"
                  >
                    <option value="new">+ Create New Forthcoming Event</option>
                    {events.map((ev, idx) => (
                      <option key={`${ev.date}-${ev.title}-${idx}`} value={String(idx)}>
                        {ev.date} — {ev.title} ({ev.pax} Pax)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Event Metadata Inputs (Date, Title, Format) + Save Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-[11px] text-slate-400 font-medium">
                    Event Date (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    value={simEventDate}
                    onChange={(e) => setSimEventDate(e.target.value)}
                    placeholder="14/11/2026"
                    className="w-full bg-[#151621] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-trough-yellow focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-[11px] text-slate-400 font-medium">
                    Event Title &amp; Promoter
                  </label>
                  <input
                    type="text"
                    value={simEventTitle}
                    onChange={(e) => setSimEventTitle(e.target.value)}
                    placeholder="e.g. ACTION by Thick N Juicy"
                    className="w-full bg-[#151621] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-trough-yellow focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] text-slate-400 font-medium">
                    Format Label
                  </label>
                  <input
                    type="text"
                    value={simEventFormat}
                    onChange={(e) => setSimEventFormat(e.target.value)}
                    placeholder="Owned Hero Night"
                    className="w-full bg-[#151621] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-trough-yellow focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-2">
                  {editingEventIndex !== null && (
                    <button
                      type="button"
                      onClick={handleSaveSimulatorToExistingEvent}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-trough-yellow hover:bg-trough-yellowHover text-black transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <i className="fa-solid fa-floppy-disk"></i>
                      <span>Update Event</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveSimulatorAsNewEvent}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      editingEventIndex === null
                        ? 'flex-1 bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <i className="fa-solid fa-calendar-plus"></i>
                    <span>{editingEventIndex === null ? 'Save as Forthcoming Event' : '+ Save New'}</span>
                  </button>
                </div>
              </div>

              {simSaveNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-circle-check text-emerald-400"></i>
                    <span>{simSaveNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('calendar')}
                    className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-semibold text-[11px] cursor-pointer whitespace-nowrap"
                  >
                    View in Forthcoming Events &rarr;
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Controls Column (5 cols) */}
              <div className="lg:col-span-5 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <i className="fa-solid fa-sliders text-trough-yellow"></i> Simulation
                    Parameters
                  </h3>
                  <button
                    onClick={resetSimulatorDefaults}
                    className="text-xs text-trough-yellow hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <i className="fa-solid fa-rotate-left"></i> Reset Defaults
                  </button>
                </div>

                {/* Operating Mode Radio Switch */}
                <div>
                  <label className="block text-xs font-semibold text-trough-muted uppercase tracking-wider mb-2">
                    Event Production Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[#12131C] p-1.5 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setSimMode('owned')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        simMode === 'owned'
                          ? 'bg-trough-yellow text-black'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-crown"></i> Trough-Owned Party
                    </button>
                    <button
                      onClick={() => setSimMode('promoter')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        simMode === 'promoter'
                          ? 'bg-trough-yellow text-black'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-handshake"></i> Promoter (${simTicketClip.toFixed(2)} Clip)
                    </button>
                  </div>
                </div>

                {/* Attendance Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300">Expected Attendance</span>
                    <span className="font-mono font-bold text-trough-yellow bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {simPax} Pax
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="5"
                    value={simPax}
                    onChange={(e) => setSimPax(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50 Min</span>
                    <span className="text-amber-400">144 (Breakeven)</span>
                    <span>200 Base</span>
                    <span className="text-rose-400 font-bold">300 (Max Cap)</span>
                  </div>
                </div>

                {/* Ticket Yield Input (Visible in Owned Mode) */}
                {simMode === 'owned' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-300">Average Ticket Price</span>
                      <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        ${simTicketPrice.toFixed(2)} AUD
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="1"
                      value={simTicketPrice}
                      onChange={(e) => setSimTicketPrice(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">
                      Net price retained per paid attendee after platform fees.
                    </p>
                  </div>
                )}

                {/* Editable Promoter Ticket Clip Banner (Visible in Promoter Mode) */}
                {simMode === 'promoter' && (
                  <div className="p-3.5 rounded-xl bg-trough-yellow/10 border border-trough-yellow/30 text-xs space-y-2.5">
                    <div className="flex justify-between items-center font-bold text-trough-yellow">
                      <span>
                        <i className="fa-solid fa-ticket"></i> Venue Ticket Clip (Editable)
                      </span>
                      <div className="inline-flex items-center bg-[#151621] border border-trough-yellow/50 rounded-lg px-2 py-0.5">
                        <span className="text-trough-yellow font-mono mr-1">$</span>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.5"
                          value={simTicketClip}
                          onChange={(e) =>
                            setSimTicketClip(Math.max(0, parseFloat(e.target.value) || 0))
                          }
                          className="w-16 bg-transparent text-right font-mono font-bold text-white text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 ml-1">/ Ticket</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="0.5"
                      value={Math.min(25, simTicketClip)}
                      onChange={(e) => setSimTicketClip(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>$0 Clip</span>
                      <span className="text-trough-yellow">$5.00 Standard</span>
                      <span>$10.00+ High Clip</span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-tight">
                      Venue collects and retains ${simTicketClip.toFixed(2)} per paid ticket.
                      Promoter retains balance. Venue retains 100% of Bar &amp; Cloak.
                    </p>
                    <div className="pt-1 border-t border-trough-yellow/20 flex items-center justify-between">
                      <label className="text-[11px] text-slate-200 cursor-pointer flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={simPromoterDeposit}
                          onChange={(e) => setSimPromoterDeposit(e.target.checked)}
                          className="rounded border-slate-700 text-trough-yellow focus:ring-0"
                        />
                        Include $550 Non-Refundable Booking Deposit
                      </label>
                    </div>
                  </div>
                )}

                {/* Average Bar Spend */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300">Average Bar Spend Per Head</span>
                    <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      ${simBarSpend.toFixed(2)} AUD
                    </span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="45"
                    step="0.5"
                    value={simBarSpend}
                    onChange={(e) => setSimBarSpend(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>$12 Low</span>
                    <span>$22.50 Baseline</span>
                    <span>$35+ High Trade</span>
                  </div>
                </div>

                {/* Cloakroom Check-in % */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300">Cloakroom Check-in Rate</span>
                    <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {simCloakRate}% ($5.00 / item)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="85"
                    step="5"
                    value={simCloakRate}
                    onChange={(e) => setSimCloakRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Beverage COGS Target */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300">Beverage Stock COGS %</span>
                    <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {simCogsRate.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="30"
                    step="0.5"
                    value={simCogsRate}
                    onChange={(e) => setSimCogsRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">
                    Strict Trough X KPI cap is 22.0% maximum.
                  </p>
                </div>
              </div>

              {/* Live Financial Output Statement (7 cols) */}
              <div className="lg:col-span-7 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <i className="fa-solid fa-file-invoice-dollar text-trough-yellow"></i> Live
                        Pro-Forma Statement
                      </h3>
                      <span className="text-xs text-trough-muted">
                        {simMode === 'owned'
                          ? 'Trough-Owned Event Baseline Model (100% Ticket Revenue Retained)'
                          : `Promoter Hosted Model ($${simTicketClip.toFixed(
                              2
                            )} Ticket Clip + 100% Bar/Cloak Retained)`}
                      </span>
                    </div>
                    {simMetrics.netSurplus >= 0 ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-check"></i> HIGH SURPLUS
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 flex items-center gap-1.5">
                        <i className="fa-solid fa-triangle-exclamation"></i> OPERATING DEFICIT
                      </span>
                    )}
                  </div>

                  {/* Financial Table */}
                  <div className="space-y-2.5 text-xs font-mono">
                    {/* REVENUE BLOCK */}
                    <div className="bg-[#151621] p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-slate-400 font-sans text-[11px] font-semibold tracking-wider">
                        <span>1. GROSS VENUE REVENUE</span>
                        <span>AUSTRALIAN DOLLARS</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>
                          {simMode === 'owned'
                            ? `Ticket Sales (${simPax} @ $${simTicketPrice.toFixed(2)}):`
                            : `Venue Ticket Clip (${simPax} @ $${simTicketClip.toFixed(2)}):`}
                        </span>
                        <span className="font-bold text-white">
                          ${formatMoney(simMetrics.ticketRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Bar / POS Turnover:</span>
                        <span className="font-bold text-white">
                          ${formatMoney(simMetrics.barRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Cloakroom Takings:</span>
                        <span className="font-bold text-white">
                          ${formatMoney(simMetrics.cloakRevenue)}
                        </span>
                      </div>
                      {simMode === 'promoter' && (
                        <div className="flex justify-between text-amber-300">
                          <span>Promoter Booking Deposit:</span>
                          <span className="font-bold">
                            ${simMetrics.depositRevenue.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-sm text-white font-sans">
                        <span>Total Gross Turnover:</span>
                        <span className="font-mono text-trough-yellow">
                          ${formatMoney(simMetrics.grossTurnover)}
                        </span>
                      </div>
                    </div>

                    {/* COGS BLOCK */}
                    <div className="bg-[#151621] p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-slate-400 font-sans text-[11px] font-semibold tracking-wider">
                        <span>2. COST OF GOODS SOLD (COGS)</span>
                        <span>TARGET: &le; 22%</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Beverage Stock Burn ({simCogsRate.toFixed(1)}%):</span>
                        <span className="text-rose-400">
                          (${formatMoney(simMetrics.beverageCogs)})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Bar Consumables &amp; Glassware:</span>
                        <span className="text-rose-400">
                          (${simMetrics.consumables.toFixed(2)})
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-white font-sans">
                        <span>Gross Operating Margin:</span>
                        <span className="font-mono text-emerald-400">
                          ${formatMoney(simMetrics.grossMargin)}
                        </span>
                      </div>
                    </div>

                    {/* LABOUR & OVERHEADS */}
                    <div className="bg-[#151621] p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-slate-400 font-sans text-[11px] font-semibold tracking-wider">
                        <span>3. WAGES &amp; DIRECT OVERHEADS</span>
                        <span>IFA FLAT RATES</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="flex items-center gap-1.5">
                          Direct Venue Wages:
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-sans">
                            {simMetrics.staffCount} Staff ({simMetrics.guards}{' '}
                            {simMetrics.guards === 1 ? 'Guard' : 'Guards'})
                          </span>
                        </span>
                        <span className="text-rose-400">
                          (${formatMoney(simMetrics.baseRosterWages)})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>DJ &amp; Entertainment Talent:</span>
                        <span className="text-rose-400">
                          {simMetrics.talentCost > 0
                            ? `($${simMetrics.talentCost.toFixed(2)})`
                            : '$0.00 (Promoter Covered)'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Sound/Lighting Tech &amp; Decor:</span>
                        <span className="text-rose-400">
                          (${simMetrics.productionCost.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Marketing, Street Posters &amp; EFTPOS (1.5%):</span>
                        <span className="text-rose-400">
                          ($
                          {(simMetrics.marketingCost + simMetrics.terminalFees).toFixed(2)}
                          )
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom-Line Result Box */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="bg-gradient-to-br from-[#242738] to-[#1E202C] p-4 rounded-xl border-2 border-trough-yellow flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                        Net Contribution Operating Surplus
                      </span>
                      <span
                        className={`text-3xl font-extrabold font-mono tracking-tight ${
                          simMetrics.netSurplus >= 0
                            ? 'text-trough-yellow'
                            : 'text-rose-400'
                        }`}
                      >
                        {simMetrics.netSurplus >= 0
                          ? `+$${formatMoney(simMetrics.netSurplus)}`
                          : `-$${formatMoney(Math.abs(simMetrics.netSurplus))}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="block text-slate-400 text-[10px]">WAGES % OF REV</span>
                        <span
                          className={`font-bold ${
                            simMetrics.wageRatio > 35
                              ? 'text-rose-400'
                              : simMetrics.wageRatio > 30
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {simMetrics.wageRatio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="border-l border-slate-700 pl-4">
                        <span className="block text-slate-400 text-[10px]">CONTRIB MARGIN</span>
                        <span className="font-bold text-emerald-400">
                          {simMetrics.marginRatio.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 3: WAGES CALCULATOR & ROSTER ================= */}
        {activeTab === 'wages' && (
          <section className="space-y-6">
            <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <i className="fa-solid fa-users-gear text-trough-yellow"></i> Staffing Roster
                      &amp; Individual Flexibility Agreement (IFA) Matrix
                    </h3>
                    {rosterSavedNotice && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        <i className="fa-solid fa-check mr-1"></i>
                        {rosterSavedNotice}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-trough-muted">
                    Edit role titles, headcount, shift hours, IFA hourly rates, and superannuation.
                    Save entries to persist across sessions and drive the Budget Simulator.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer bg-[#151621] px-3 py-1.5 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={wagesIncludeSuper}
                      onChange={(e) => setWagesIncludeSuper(e.target.checked)}
                      className="rounded border-slate-700 text-trough-yellow focus:ring-0"
                    />
                    <span>Apply Statutory Super (11.5%)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => saveCurrentRosterToStorage('Saved active wage entries')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-trough-yellow hover:bg-trough-yellowHover text-black transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Save Wage Entries</span>
                  </button>

                  <button
                    type="button"
                    onClick={addRosterRole}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Add Role</span>
                  </button>

                  <button
                    onClick={resetRosterDefaults}
                    className="text-xs text-slate-400 hover:text-trough-yellow flex items-center gap-1 cursor-pointer px-2 py-1"
                  >
                    <i className="fa-solid fa-arrow-rotate-right"></i> Reset Defaults
                  </button>
                </div>
              </div>

              {/* Saved Roster Templates Bar */}
              <div className="bg-[#151621] p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Saved Wage Calculator Templates (Click to Load):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {savedRosterTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="inline-flex items-center rounded-lg bg-[#1E202C] border border-slate-700 overflow-hidden text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => handleLoadRosterTemplate(tpl)}
                          className="px-2.5 py-1 text-slate-200 hover:text-trough-yellow font-medium transition cursor-pointer flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-folder-open text-trough-yellow text-[10px]"></i>
                          <span>{tpl.name}</span>
                        </button>
                        {!tpl.id.startsWith('baseline-') && !tpl.id.startsWith('peak-') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRosterTemplate(tpl.id)}
                            className="px-2 py-1 text-slate-500 hover:text-rose-400 border-l border-slate-700 transition cursor-pointer"
                            title="Delete saved template"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-end">
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="New template name (e.g. Mardi Gras Roster)"
                    className="bg-[#10111A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-trough-yellow focus:outline-none w-56"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNamedRosterTemplate}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-trough-steelGrey hover:bg-trough-steelSlate text-white border border-slate-600 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-bookmark text-trough-yellow"></i>
                    <span>Save as Template</span>
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#171822] text-slate-300 uppercase tracking-wider text-[10px] border-b border-trough-cardBorder">
                    <tr>
                      <th className="py-3 px-3">Role &amp; Operational Scope (Editable)</th>
                      <th className="py-3 px-3 text-center">Headcount</th>
                      <th className="py-3 px-3 text-center">Hours / Shift</th>
                      <th className="py-3 px-3 text-center">Hourly Rate (AUD)</th>
                      <th className="py-3 px-3 text-center">Superannuation</th>
                      <th className="py-3 px-3 text-right">Total Shift Cost</th>
                      <th className="py-3 px-2 text-center no-print">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {rosterSummary.itemsWithTotals.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 space-y-1 min-w-[240px]">
                          <input
                            type="text"
                            value={item.role}
                            onChange={(e) =>
                              updateRosterItem(index, 'role', e.target.value)
                            }
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-trough-yellow focus:bg-[#151621] rounded px-1.5 py-0.5 font-medium text-white text-xs focus:outline-none"
                          />
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) =>
                              updateRosterItem(index, 'notes', e.target.value)
                            }
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-trough-yellow focus:bg-[#151621] rounded px-1.5 py-0.5 text-[11px] text-slate-400 focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="15"
                            value={item.headcount}
                            onChange={(e) =>
                              updateRosterItem(
                                index,
                                'headcount',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-14 bg-[#151621] border border-slate-700 rounded px-2 py-1 text-center font-mono text-white text-xs focus:border-trough-yellow focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="16"
                            value={item.hours}
                            onChange={(e) =>
                              updateRosterItem(index, 'hours', parseFloat(e.target.value) || 0)
                            }
                            className="w-16 bg-[#151621] border border-slate-700 rounded px-2 py-1 text-center font-mono text-white text-xs focus:border-trough-yellow focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center">
                            <span className="text-slate-500 mr-1">$</span>
                            <input
                              type="number"
                              step="1"
                              min="20"
                              max="150"
                              value={item.rate}
                              onChange={(e) =>
                                updateRosterItem(index, 'rate', parseFloat(e.target.value) || 0)
                              }
                              className="w-16 bg-[#151621] border border-slate-700 rounded px-2 py-1 text-center font-mono text-white text-xs focus:border-trough-yellow focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <button
                            type="button"
                            onClick={() =>
                              updateRosterItem(index, 'hasSuper', !item.hasSuper)
                            }
                            title="Click to toggle Superannuation eligibility"
                            className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition ${
                              item.hasSuper
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                            }`}
                          >
                            {item.hasSuper ? '11.5% IFA' : 'Contracted 0%'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          ${formatMoney(item.itemTotal)}
                        </td>
                        <td className="py-3 px-2 text-center no-print">
                          <button
                            type="button"
                            onClick={() => removeRosterRole(index)}
                            className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-1"
                            title="Remove role from roster"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Roster Summary KPI Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
                <div className="bg-[#151621] p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-trough-muted block">Total Headcount</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {rosterSummary.totalHeadcount} Staff
                  </span>
                </div>
                <div className="bg-[#151621] p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-trough-muted block">Total Rostered Hours</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {rosterSummary.totalHours.toFixed(1)} Hrs
                  </span>
                </div>
                <div className="bg-[#151621] p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-trough-muted block">Direct Gross Wages</span>
                  <span className="text-xl font-bold font-mono text-white">
                    ${formatMoney(rosterSummary.grossWages)}
                  </span>
                </div>
                <div className="bg-gradient-to-r from-trough-cardDark to-[#242738] p-3 rounded-xl border border-trough-yellow">
                  <span className="text-[11px] text-trough-yellow font-medium block">
                    Total Roster Commitment
                  </span>
                  <span className="text-xl font-bold font-mono text-trough-yellow">
                    ${formatMoney(rosterSummary.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Award & IFA Compliance Note */}
              <div className="bg-[#151621] p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <i className="fa-solid fa-circle-info text-trough-yellow"></i> Individual
                  Flexibility Agreement (IFA) &amp; BOOT Testing
                </h4>
                <p>
                  Under Trough X’s standard IFA framework, supervisory and floor rates are loaded to
                  absorb weekend penalty rates, late-night allowances (post-midnight), and overtime,
                  ensuring that each rostered worker is Better Off Overall than the base HIGA award.
                </p>
                <div className="flex flex-wrap gap-4 text-[11px] pt-1 text-slate-300">
                  <span>&bull; Venue Duty Manager / Crowd Control: $55.00/hr (6.0 hrs)</span>
                  <span>&bull; Senior Bartender (x2): $45.00/hr (6.0 hrs)</span>
                  <span>&bull; Door / Ticket Scanner &amp; Cloak: $35.00/hr (6.0 hrs)</span>
                  <span>&bull; Cleaning Crew: $60.00/hr (6.0 hrs)</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 4: PROMOTER DEAL ANALYZER ================= */}
        {activeTab === 'promoter' && (
          <section className="space-y-6">
            {/* Contractual Structure Banner */}
            <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs px-2.5 py-0.5 rounded bg-trough-yellow/10 text-trough-yellow font-semibold border border-trough-yellow/30 uppercase tracking-wider">
                  Commercial Framework
                </span>
                <h3 className="font-bold text-lg text-white mt-1">
                  Standard Trough X Promoter Agreement ($5.00 Ticket Clip)
                </h3>
                <p className="text-xs text-trough-muted">
                  Standard venue hire structure executed with external promoters (e.g., BUSH,
                  THROBB, POOF DOOF).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#151621] p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-semibold text-sm text-emerald-400 flex items-center gap-2">
                    <i className="fa-solid fa-circle-check"></i> What Venue (Trough X) Captures
                    &amp; Retains
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>
                      <strong className="text-white">$5.00 flat clip</strong> per paid ticket sold
                      (deducted from promoter settlement).
                    </li>
                    <li>
                      <strong className="text-white">100% of Beverage POS sales</strong> across all
                      venue bars.
                    </li>
                    <li>
                      <strong className="text-white">100% of Cloakroom revenue</strong> ($5.00 per
                      garment/bag).
                    </li>
                    <li>
                      <strong className="text-white">$550.00 non-refundable booking deposit</strong>{' '}
                      paid upon date confirmation.
                    </li>
                  </ul>
                </div>

                <div className="bg-[#151621] p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-semibold text-sm text-blue-400 flex items-center gap-2">
                    <i className="fa-solid fa-users"></i> What Venue (Trough X) Provides &amp;
                    Absorbs
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>
                      Full operational staffing roster (Duty Manager, Floor Supervisor, Bar Staff).
                    </li>
                    <li>
                      Contracted crowd control security (1:100 ratio) &amp; door scanner personnel.
                    </li>
                    <li>
                      Mandatory dedicated harm-minimisation medic &amp; medical supplies.
                    </li>
                    <li>Full post-event bio-wash and cleaning team.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Breakeven Math Card & Live Deal Viability Tester */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Breakeven Formula Breakdown (5 cols) */}
              <div className="lg:col-span-5 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <i className="fa-solid fa-calculator text-trough-yellow"></i> Promoter Breakeven
                  Mathematics
                </h3>
                <p className="text-xs text-trough-muted">
                  Because venue fixed operational wages must be cleared before the house turns a
                  dollar of surplus:
                </p>

                <div className="bg-[#14151F] p-4 rounded-xl border border-slate-800 space-y-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[11px] block">
                      FIXED EVENT OPERATING OVERHEAD:
                    </span>
                    <span className="text-sm font-bold text-white">
                      ${formatMoney(dealMetrics.wages)} (Wages) + $300 (Consumables) ={' '}
                      <span className="text-rose-400">
                        ${formatMoney(dealMetrics.fixedOverhead)}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">
                      NET MARGIN HARVEST PER PATRON:
                    </span>
                    <span className="text-sm font-bold text-white">
                      ${dealMetrics.clip.toFixed(2)} (Clip) + $
                      {dealMetrics.barNetPerHead.toFixed(2)} (Bar Net) + $2.50 (Cloak) ={' '}
                      <span className="text-emerald-400">
                        ${dealMetrics.netMarginPerHead.toFixed(2)} / Head
                      </span>
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 text-[11px] block">
                      MATHEMATICAL BREAKEVEN ATTENDANCE:
                    </span>
                    <div className="text-lg font-bold text-trough-yellow">
                      {dealMetrics.breakevenNoDeposit} Paid Patrons
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      Below {dealMetrics.breakevenNoDeposit} patrons, venue operating wages exceed
                      retained gross margin.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-triangle-exclamation"></i> Deposit Insulation Rule
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Collecting the $550.00 non-refundable booking deposit lowers venue breakeven
                    from {dealMetrics.breakevenNoDeposit} down to{' '}
                    <strong>{dealMetrics.breakevenWithDeposit} paid patrons</strong>.
                  </p>
                </div>
              </div>

              {/* Deal Viability Simulator (7 cols) */}
              <div className="lg:col-span-7 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <i className="fa-solid fa-vial-circle-check text-trough-yellow"></i> Live
                        Promoter Night Viability Tester
                      </h3>
                      <p className="text-xs text-trough-muted">
                        Test any external promoter proposal &amp; ticket clip against our real cost
                        structures
                      </p>
                    </div>
                    {dealMetrics.netSurplus >= 0 ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        PROFITABLE
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                        DEFICIT RISK
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">
                        Anticipated Attendance
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={dealPax}
                          min="50"
                          max="300"
                          onChange={(e) => setDealPax(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-[#151621] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-trough-yellow focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-500">PAX</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-trough-yellow font-semibold">
                        Venue Ticket Clip / Head
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-trough-yellow">$</span>
                        <input
                          type="number"
                          value={dealClip}
                          min="0"
                          max="50"
                          step="0.5"
                          onChange={(e) =>
                            setDealClip(Math.max(0, parseFloat(e.target.value) || 0))
                          }
                          className="w-full bg-[#151621] border border-trough-yellow/50 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:border-trough-yellow focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-500">AUD</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">
                        Anticipated Bar Spend / Head
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                        <input
                          type="number"
                          value={dealSpend}
                          min="10"
                          max="50"
                          step="0.5"
                          onChange={(e) => setDealSpend(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#151621] border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:border-trough-yellow focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-500">AUD</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary Table */}
                  <div className="mt-4 bg-[#151621] p-3 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>
                        Retained Ticket Clip (${dealMetrics.clip.toFixed(2)} &times; {dealPax}):
                      </span>
                      <span className="font-bold text-white">
                        ${formatMoney(dealMetrics.clipTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Retained Bar Sales:</span>
                      <span className="font-bold text-white">
                        ${formatMoney(dealMetrics.barTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Retained Cloakroom (50% check-in @ $5):</span>
                      <span className="font-bold text-white">
                        ${formatMoney(dealMetrics.cloakTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Less Beverage COGS (22%) &amp; Consumables:</span>
                      <span className="text-rose-400">(${formatMoney(dealMetrics.cogs)})</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Less Mandatory Venue Wages (IFA Roster):</span>
                      <span className="text-rose-400">(${dealMetrics.wages.toFixed(2)})</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Less Merchant &amp; Waste Incidentals:</span>
                      <span className="text-rose-400">(${dealMetrics.overheads.toFixed(2)})</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Projected Venue Net Surplus
                    </span>
                    <span
                      className={`text-2xl font-bold font-mono ${
                        dealMetrics.netSurplus >= 0 ? 'text-trough-yellow' : 'text-rose-400'
                      }`}
                    >
                      {dealMetrics.netSurplus >= 0
                        ? `+$${formatMoney(dealMetrics.netSurplus)}`
                        : `-$${formatMoney(Math.abs(dealMetrics.netSurplus))}`}
                    </span>
                  </div>
                  {dealMetrics.netSurplus >= 0 ? (
                    <div className="text-right">
                      <span className="text-xs font-semibold text-emerald-400 block">
                        <i className="fa-solid fa-thumbs-up"></i> APPROVE BOOKING
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Yield clears venue fixed wage base
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs font-semibold text-rose-400 block">
                        <i className="fa-solid fa-hand"></i> REQUIRE LABOUR GUARANTEE
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Demand $1,000 venue deposit/guarantee
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 5: FORTHCOMING EVENTS CALENDAR ================= */}
        {activeTab === 'calendar' && (
          <section className="space-y-6">
            {/* Google Calendar & Google Sheets Live Sync Panel */}
            <WorkspaceSyncPanel
              user={user}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
              events={events}
              onUpdateEvents={handleUpdateEvents}
              onResetDefaultEvents={handleResetDefaultEvents}
              roster={roster}
              wagesIncludeSuper={wagesIncludeSuper}
              simulatorSnapshot={simulatorSnapshot}
            />

            <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <i className="fa-solid fa-calendar-days text-trough-yellow"></i> Trough X
                      Confirmed &amp; Pipeline Events Schedule
                    </h3>
                    {eventsSavedNotice && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        <i className="fa-solid fa-check mr-1"></i>
                        {eventsSavedNotice}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-trough-muted">
                    Click <strong className="text-trough-yellow">Edit in Simulator</strong> on any
                    event to model and save changes via the Budget Simulator, or use{' '}
                    <strong className="text-slate-200">Quick Edit</strong> to modify cells inline.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={startNewEventInSimulator}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-trough-yellow hover:bg-trough-yellowHover text-black transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>New Event in Simulator</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      persistEventsToStorage(events, 'Saved Forthcoming Events schedule')
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Save Schedule</span>
                  </button>

                  <span className="text-xs text-slate-500 pl-1">Filter:</span>
                  <button
                    onClick={() => setEventFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                      eventFilter === 'all'
                        ? 'font-semibold bg-trough-yellow text-black'
                        : 'font-medium bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    All ({events.length})
                  </button>
                  <button
                    onClick={() => setEventFilter('owned')}
                    className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                      eventFilter === 'owned'
                        ? 'font-semibold bg-trough-yellow text-black'
                        : 'font-medium bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Owned ({events.filter((e) => e.type === 'owned').length})
                  </button>
                  <button
                    onClick={() => setEventFilter('promoter')}
                    className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                      eventFilter === 'promoter'
                        ? 'font-semibold bg-trough-yellow text-black'
                        : 'font-medium bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Promoter ({events.filter((e) => e.type === 'promoter').length})
                  </button>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#171822] text-slate-300 uppercase tracking-wider text-[10px] border-b border-trough-cardBorder">
                    <tr>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Event Title &amp; Promoter</th>
                      <th className="py-3 px-3">Format</th>
                      <th className="py-3 px-3 text-center">Cap Target</th>
                      <th className="py-3 px-3 text-right">Venue Gross</th>
                      <th className="py-3 px-3 text-right">Venue Wages</th>
                      <th className="py-3 px-3 text-right text-trough-yellow font-bold">
                        Net Operating Surplus
                      </th>
                      <th className="py-3 px-3 text-right no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-200">
                    {filteredEventsWithIndex.map(({ item, originalIndex }) => {
                      const isInlineEditing =
                        inlineEditIndex === originalIndex && inlineEditDraft !== null;
                      const gross =
                        item.barGross + item.clip + item.ticketRev + item.deposit;

                      if (isInlineEditing && inlineEditDraft) {
                        return (
                          <tr
                            key={`edit-${originalIndex}`}
                            className="bg-trough-yellow/5 border-l-2 border-trough-yellow"
                          >
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={inlineEditDraft.date}
                                onChange={(e) =>
                                  setInlineEditDraft({
                                    ...inlineEditDraft,
                                    date: e.target.value,
                                  })
                                }
                                className="w-24 bg-[#151621] border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={inlineEditDraft.title}
                                onChange={(e) =>
                                  setInlineEditDraft({
                                    ...inlineEditDraft,
                                    title: e.target.value,
                                  })
                                }
                                className="w-full min-w-[160px] bg-[#151621] border border-slate-700 rounded px-2 py-1 text-xs text-white"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={inlineEditDraft.type}
                                onChange={(e) => {
                                  const nextType = e.target.value as 'owned' | 'promoter';
                                  setInlineEditDraft({
                                    ...inlineEditDraft,
                                    type: nextType,
                                    format:
                                      nextType === 'promoter'
                                        ? 'Promoter Hosted'
                                        : 'Owned Hero Night',
                                  });
                                }}
                                className="bg-[#151621] border border-slate-700 rounded px-2 py-1 text-xs text-white"
                              >
                                <option value="owned">Owned Hero Night</option>
                                <option value="promoter">Promoter Hosted</option>
                              </select>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="50"
                                max="300"
                                value={inlineEditDraft.pax}
                                onChange={(e) =>
                                  setInlineEditDraft({
                                    ...inlineEditDraft,
                                    pax: Math.min(300, parseInt(e.target.value, 10) || 0),
                                  })
                                }
                                className="w-16 bg-[#151621] border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={inlineEditDraft.barGross}
                                onChange={(e) =>
                                  setInlineEditDraft({
                                    ...inlineEditDraft,
                                    barGross: parseFloat(e.target.value) || 0,
                                  })
                                }
                                title="Bar Gross ($)"
                                className="w-24 bg-[#151621] border border-slate-700 rounded px-2 py-1 text-right font-mono text-xs text-white"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={inlineEditDraft.wages}
                                onChange={(e) =>
                                  setInlineEditDraft({
                                    ...inlineEditDraft,
                                    wages: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-20 bg-[#151621] border border-slate-700 rounded px-2 py-1 text-right font-mono text-xs text-rose-300"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={inlineEditDraft.surplus}
                                onChange={(e) =>
                                  setInlineEditDraft({
                                    ...inlineEditDraft,
                                    surplus: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-24 bg-[#151621] border border-slate-700 rounded px-2 py-1 text-right font-mono text-xs text-trough-yellow font-bold"
                              />
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap space-x-1.5">
                              <button
                                type="button"
                                onClick={saveInlineEditEvent}
                                className="px-2.5 py-1 rounded bg-trough-yellow text-black font-bold text-[10px] cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineEditIndex(null);
                                  setInlineEditDraft(null);
                                }}
                                className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={`${item.date}-${item.title}-${originalIndex}`}
                          className="hover:bg-slate-800/40 transition"
                        >
                          <td className="py-3 px-3 font-mono font-medium text-slate-300 whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-white block">{item.title}</span>
                            <span className="text-[11px] text-slate-400">
                              {item.type === 'promoter'
                                ? '$5 Ticket Clip Agreement'
                                : 'Full In-House Trough Production'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                item.type === 'owned'
                                  ? 'bg-trough-yellow/15 text-trough-yellow border border-trough-yellow/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {item.format}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold text-slate-200">
                            {item.pax} Pax
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-200">
                            ${gross.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-rose-300">
                            (${item.wages.toLocaleString()})
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-trough-yellow">
                            +${item.surplus.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right no-print whitespace-nowrap space-x-1.5">
                            <button
                              type="button"
                              onClick={() => loadEventIntoSimulator(item, originalIndex)}
                              className="px-2.5 py-1 rounded bg-trough-yellow/15 hover:bg-trough-yellow text-trough-yellow hover:text-black border border-trough-yellow/30 text-[10px] font-semibold transition cursor-pointer"
                              title="Edit and save this event via the Budget Simulator"
                            >
                              <i className="fa-solid fa-sliders mr-1"></i>
                              Edit in Simulator
                            </button>
                            <button
                              type="button"
                              onClick={() => startInlineEditEvent(item, originalIndex)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-medium transition cursor-pointer"
                              title="Quick inline edit"
                            >
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(originalIndex)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 text-[10px] transition cursor-pointer"
                              title="Delete event"
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

              {/* Pipeline Aggregates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                <div className="bg-[#151621] p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-trough-muted block">
                    Total Pipeline Venue Turnover
                  </span>
                  <span className="text-xl font-bold font-mono text-white">
                    ${formatMoney(calendarTotals.totalGross)}
                  </span>
                </div>
                <div className="bg-[#151621] p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-trough-muted block">
                    Committed Operational Wages
                  </span>
                  <span className="text-xl font-bold font-mono text-rose-300">
                    (${formatMoney(calendarTotals.totalWages)})
                  </span>
                </div>
                <div className="bg-gradient-to-r from-trough-cardDark to-[#242738] p-3 rounded-xl border border-trough-yellow">
                  <span className="text-[11px] text-trough-yellow font-medium block">
                    Total Forecast Season Net Surplus
                  </span>
                  <span className="text-xl font-bold font-mono text-trough-yellow">
                    +${formatMoney(calendarTotals.totalSurplus)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="no-print border-t border-trough-cardBorder bg-[#14151F] py-4 text-center text-xs text-trough-muted mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Trough X Operating System &bull; 273 Crown St, Surry Hills NSW 2010</span>
          </div>
          <div>
            <span>
              Flat-Rate IFA Roster Model &bull; BOOT Compliant &bull; Internal Management
              Confidential
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =====================================================================
   CHART COMPONENTS (Matching Chart.js Visuals from Reference File)
   ===================================================================== */

function ScenarioBarChart() {
  const scenarios = [
    { label: 'Actual (11 Sept)', gross: 4881, wages: 1290, surplus: 2644 },
    { label: 'Owned (120 Pax)', gross: 6060, wages: 2560, surplus: 1472 },
    { label: 'Owned (200 Pax)', gross: 11000, wages: 3235, surplus: 4475 },
    { label: 'Owned Peak (280)', gross: 18440, wages: 3980, surplus: 9535 },
    { label: 'Promoter (200)', gross: 6000, wages: 3235, surplus: 1385 },
  ];

  const yMax = 20000;
  const yTicks = [20000, 15000, 10000, 5000, 0];

  return (
    <div className="relative h-64 sm:h-72 w-full flex flex-col justify-between pt-2">
      <div className="relative flex-1 flex">
        {/* Y-Axis Labels & Gridlines */}
        <div className="flex flex-col justify-between pr-3 text-[10px] text-[#94A3B8] font-mono select-none">
          {yTicks.map((val) => (
            <span key={val} className="leading-none">
              ${val.toLocaleString()}
            </span>
          ))}
        </div>

        {/* Plot Area */}
        <div className="relative flex-1 border-l border-b border-white/5 flex items-end justify-around px-2">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {yTicks.map((val) => (
              <div key={val} className="w-full border-t border-white/5 h-0" />
            ))}
          </div>

          {scenarios.map((item) => {
            const grossPct = (item.gross / yMax) * 100;
            const wagesPct = (item.wages / yMax) * 100;
            const surplusPct = (item.surplus / yMax) * 100;

            return (
              <div
                key={item.label}
                className="relative z-10 flex items-end justify-center gap-1.5 sm:gap-2 h-full w-1/5 px-1 group"
              >
                {/* Gross Turnover Bar (#4A5568) */}
                <div
                  style={{ height: `${grossPct}%` }}
                  title={`Gross Turnover: $${item.gross.toLocaleString()}`}
                  className="w-3 sm:w-5 bg-[#4A5568] hover:brightness-110 rounded-t-md transition-all"
                />
                {/* Wages Roster Bar (#F43F5E) */}
                <div
                  style={{ height: `${wagesPct}%` }}
                  title={`Wages Roster: $${item.wages.toLocaleString()}`}
                  className="w-3 sm:w-5 bg-[#F43F5E] hover:brightness-110 rounded-t-md transition-all"
                />
                {/* Net Surplus Bar (#FFCC00) */}
                <div
                  style={{ height: `${surplusPct}%` }}
                  title={`Net Surplus: $${item.surplus.toLocaleString()}`}
                  className="w-3 sm:w-5 bg-[#FFCC00] hover:brightness-110 rounded-t-md transition-all"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-Axis Labels */}
      <div className="flex pl-12 pt-2.5 justify-around text-[10px] text-[#94A3B8] text-center">
        {scenarios.map((s) => (
          <div key={s.label} className="w-1/5 truncate px-0.5">
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function CostAllocationDoughnut() {
  // Data: Net Surplus 4475 (40.7%), Direct Wages 3235 (29.4%), Production & AV 2150 (19.5%), Beverage COGS & Bar 1140 (10.4%)
  const segments = [
    { label: 'Net Surplus', value: 4475, color: '#FFCC00' },
    { label: 'Direct Wages', value: 3235, color: '#F43F5E' },
    { label: 'Production & AV', value: 2150, color: '#3B82F6' },
    { label: 'Beverage COGS & Bar', value: 1140, color: '#10B981' },
  ];

  const total = 11000;
  const radius = 72;
  const circumference = 2 * Math.PI * radius;

  let cumulativeFraction = 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="190" height="190" viewBox="0 0 190 190" className="-rotate-90">
        {segments.map((seg) => {
          const fraction = seg.value / total;
          const dashArray = `${fraction * circumference} ${circumference}`;
          const dashOffset = -cumulativeFraction * circumference;
          cumulativeFraction += fraction;

          return (
            <circle
              key={seg.label}
              cx="95"
              cy="95"
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth="22"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className="transition-all duration-300 hover:opacity-90"
            >
              <title>{`${seg.label}: $${seg.value.toLocaleString()} AUD`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-wider text-trough-muted">Target Gross</span>
        <span className="text-lg font-extrabold font-mono text-white">$11,000</span>
        <span className="text-[10px] text-trough-yellow font-semibold">40.7% Surplus</span>
      </div>
    </div>
  );
}
