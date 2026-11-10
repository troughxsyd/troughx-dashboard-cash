import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { PipelineEvent, RosterItem } from '../App';
import {
  DEFAULT_CALENDAR_ID,
  DEFAULT_CALENDAR_URL,
  extractCalendarId,
  fetchAccessibleCalendars,
  fetchConfirmedCalendarEvents,
  fetchSpreadsheetMetadata,
  readEventsFromSheetTab,
  writeRowsToSheetTab,
  createTroughMasterSpreadsheet,
  buildEventsSheetRows,
  buildRosterSheetRows,
  buildSimulatorSheetRows,
  type AccessibleCalendarInfo,
  type InspectedEventLabelInfo,
  type SheetMetadata,
} from '../services/googleWorkspace';

export function GoogleSignInButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="gsi-material-button"
    >
      <div className="gsi-material-button-state"></div>
      <div className="gsi-material-button-content-wrapper">
        <div className="gsi-material-button-icon">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: 'block' }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            ></path>
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            ></path>
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            ></path>
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            ></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
        </div>
        <span className="gsi-material-button-contents">Sign in with Google</span>
        <span style={{ display: 'none' }}>Sign in with Google</span>
      </div>
    </button>
  );
}

interface PendingWriteAction {
  type: 'write_tab' | 'create_master';
  dataset: 'events' | 'roster' | 'simulator' | 'all_three';
  title: string;
  description: string;
  targetSheetTitle?: string;
  targetTabName?: string;
  rowCount: number;
}

interface WorkspaceSyncPanelProps {
  user: User | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  events: PipelineEvent[];
  onUpdateEvents: (newEvents: PipelineEvent[], mode: 'replace' | 'merge') => void;
  onResetDefaultEvents: () => void;
  roster: RosterItem[];
  wagesIncludeSuper: boolean;
  simulatorSnapshot: Record<string, string | number>;
}

export function WorkspaceSyncPanel({
  user,
  onSignIn,
  onSignOut,
  events,
  onUpdateEvents,
  onResetDefaultEvents,
  roster,
  wagesIncludeSuper,
  simulatorSnapshot,
}: WorkspaceSyncPanelProps) {
  // Google Calendar State
  const [calendarInput, setCalendarInput] = useState<string>(DEFAULT_CALENDAR_URL);
  const [accessibleCalendars, setAccessibleCalendars] = useState<AccessibleCalendarInfo[]>([]);
  const [filterMode, setFilterMode] = useState<string>('strict_label');
  const [lookbackDays, setLookbackDays] = useState<number>(365);
  const [calendarMergeMode, setCalendarMergeMode] = useState<'replace' | 'merge'>('replace');
  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);
  const [calendarStatusMsg, setCalendarStatusMsg] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Calendar Event Label Inspector State
  const [showLabelInspector, setShowLabelInspector] = useState<boolean>(false);
  const [inspectedEvents, setInspectedEvents] = useState<InspectedEventLabelInfo[]>([]);
  const [discoveredLabels, setDiscoveredLabels] = useState<
    Array<{ label: string; count: number; category: 'text' | 'color' | 'status' | 'property' }>
  >([]);

  // Google Sheets State
  const [sheetInput, setSheetInput] = useState<string>('');
  const [connectedSheet, setConnectedSheet] = useState<SheetMetadata | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [newSheetTitle, setNewSheetTitle] = useState<string>(
    'Trough X Sydney — Master Operating Budget & Confirmed Events'
  );
  const [isSheetBusy, setIsSheetBusy] = useState<boolean>(false);
  const [sheetStatusMsg, setSheetStatusMsg] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Confirmation Modal State (Required before mutating/creating Google Sheets data)
  const [pendingWrite, setPendingWrite] = useState<PendingWriteAction | null>(null);

  const decodedCalendarId = extractCalendarId(calendarInput);

  // Load user's accessible calendars when signed in
  useEffect(() => {
    if (!user) {
      setAccessibleCalendars([]);
      return;
    }
    fetchAccessibleCalendars()
      .then((list) => setAccessibleCalendars(list))
      .catch(() => {});
  }, [user]);

  const handlePullCalendarEvents = async (
    overrideFilterMode?: string,
    openInspectorAfter = false
  ) => {
    setIsSyncingCalendar(true);
    setCalendarStatusMsg(null);
    const activeFilter =
      overrideFilterMode !== undefined ? overrideFilterMode : filterMode;

    try {
      const result = await fetchConfirmedCalendarEvents(
        calendarInput,
        activeFilter,
        lookbackDays
      );

      setInspectedEvents(result.inspectedEvents);
      setDiscoveredLabels(result.discoveredLabels);
      if (openInspectorAfter) {
        setShowLabelInspector(true);
      }

      // Also refresh accessible calendars list if empty
      if (accessibleCalendars.length === 0) {
        fetchAccessibleCalendars()
          .then((list) => setAccessibleCalendars(list))
          .catch(() => {});
      }

      if (result.events.length === 0) {
        setShowLabelInspector(true);
        if (activeFilter === 'strict_label' && result.matchedByStatusCount > 0) {
          setCalendarStatusMsg({
            type: 'info',
            text: `Scanned ${result.totalUpcomingScanned} event(s) on "${result.calendarIdUsed}". Found 0 events with the text word "confirmed" in the title/notes, but found ${result.matchedByStatusCount} event(s) with Google Calendar Status = Confirmed. Inspect all event labels below or click a discovered label pill to import.`,
          });
        } else {
          setCalendarStatusMsg({
            type: 'info',
            text: `Scanned ${result.totalUpcomingScanned} event(s) on calendar "${result.calendarIdUsed}". No events matched filter "${activeFilter}". Check the Event Labels Inspector below to see all labels found on your calendar.`,
          });
        }
      } else {
        onUpdateEvents(result.events, calendarMergeMode);
        setCalendarStatusMsg({
          type: 'success',
          text: `Synced ${result.events.length} confirmed event(s) from "${result.calendarIdUsed}" (Scanned ${result.totalUpcomingScanned} total events • ${result.discoveredLabels.length} distinct labels detected).`,
        });
      }
    } catch (err: any) {
      setCalendarStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to fetch events from Google Calendar.',
      });
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleConnectSheet = async () => {
    if (!sheetInput.trim()) {
      setSheetStatusMsg({
        type: 'error',
        text: 'Paste a Google Sheet URL or Spreadsheet ID to connect.',
      });
      return;
    }

    setIsSheetBusy(true);
    setSheetStatusMsg(null);
    try {
      const meta = await fetchSpreadsheetMetadata(sheetInput);
      setConnectedSheet(meta);
      if (meta.sheets.length > 0) {
        setSelectedTab(meta.sheets[0].title);
      }
      setSheetStatusMsg({
        type: 'success',
        text: `Connected to "${meta.title}" (${meta.sheets.length} tab${
          meta.sheets.length === 1 ? '' : 's'
        } detected).`,
      });
    } catch (err: any) {
      setSheetStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to connect to Google Sheet.',
      });
    } finally {
      setIsSheetBusy(false);
    }
  };

  const handleReadEventsFromSheet = async () => {
    if (!connectedSheet || !selectedTab) return;
    setIsSheetBusy(true);
    setSheetStatusMsg(null);
    try {
      const imported = await readEventsFromSheetTab(
        connectedSheet.spreadsheetId,
        selectedTab
      );
      if (imported.length === 0) {
        setSheetStatusMsg({
          type: 'info',
          text: `No event rows found in tab "${selectedTab}".`,
        });
      } else {
        onUpdateEvents(imported, 'replace');
        setSheetStatusMsg({
          type: 'success',
          text: `Imported ${imported.length} event(s) from "${connectedSheet.title}" → [${selectedTab}].`,
        });
      }
    } catch (err: any) {
      setSheetStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to read events from Google Sheet.',
      });
    } finally {
      setIsSheetBusy(false);
    }
  };

  const requestWriteToTab = (dataset: 'events' | 'roster' | 'simulator') => {
    if (!connectedSheet || !selectedTab) {
      setSheetStatusMsg({
        type: 'error',
        text: 'Connect a Google Sheet and select a target tab first.',
      });
      return;
    }

    const rowCount =
      dataset === 'events'
        ? events.length + 1
        : dataset === 'roster'
        ? roster.length + 1
        : Object.keys(simulatorSnapshot).length + 1;

    const datasetLabel =
      dataset === 'events'
        ? `Confirmed Events Schedule (${events.length} events)`
        : dataset === 'roster'
        ? `IFA Staffing Roster (${roster.length} roles)`
        : 'Live Pro-Forma Budget Simulation';

    setPendingWrite({
      type: 'write_tab',
      dataset,
      title: 'Confirm Google Sheets Update',
      description: `You are about to write ${datasetLabel} to your Google Sheet.`,
      targetSheetTitle: connectedSheet.title,
      targetTabName: selectedTab,
      rowCount,
    });
  };

  const requestCreateMasterSheet = () => {
    const cleanTitle =
      newSheetTitle.trim() ||
      'Trough X Sydney — Master Operating Budget & Confirmed Events';
    setPendingWrite({
      type: 'create_master',
      dataset: 'all_three',
      title: 'Confirm New Google Sheet Creation',
      description:
        'You are about to create a new Google Spreadsheet in your Google account and populate 3 tabs (Confirmed Events, IFA Wage Roster, Budget Simulator).',
      targetSheetTitle: cleanTitle,
      targetTabName: 'Confirmed Events, IFA Wage Roster, Budget Simulator',
      rowCount: events.length + roster.length + Object.keys(simulatorSnapshot).length + 3,
    });
  };

  const executeConfirmedWrite = async () => {
    if (!pendingWrite) return;
    const action = pendingWrite;
    setPendingWrite(null);
    setIsSheetBusy(true);
    setSheetStatusMsg(null);

    try {
      if (action.type === 'create_master') {
        const meta = await createTroughMasterSpreadsheet(
          action.targetSheetTitle || 'Trough X Sydney Master Budget',
          events,
          roster,
          wagesIncludeSuper,
          simulatorSnapshot
        );
        setConnectedSheet(meta);
        setSheetInput(meta.spreadsheetUrl);
        if (meta.sheets.length > 0) {
          setSelectedTab(meta.sheets[0].title);
        }
        setSheetStatusMsg({
          type: 'success',
          text: `Created and populated "${meta.title}" with Confirmed Events, IFA Roster, and Simulator tabs.`,
        });
      } else if (action.type === 'write_tab' && connectedSheet && action.targetTabName) {
        const rows =
          action.dataset === 'events'
            ? buildEventsSheetRows(events)
            : action.dataset === 'roster'
            ? buildRosterSheetRows(roster, wagesIncludeSuper)
            : buildSimulatorSheetRows(simulatorSnapshot);

        const res = await writeRowsToSheetTab(
          connectedSheet.spreadsheetId,
          action.targetTabName,
          rows
        );
        setSheetStatusMsg({
          type: 'success',
          text: `Successfully updated ${res.updatedCells} cells in "${connectedSheet.title}" (${res.updatedRange}).`,
        });
      }
    } catch (err: any) {
      setSheetStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to write data to Google Sheets.',
      });
    } finally {
      setIsSheetBusy(false);
    }
  };

  return (
    <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm space-y-5">
      {/* Top Bar: Workspace Connection Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-trough-yellow/10 border border-trough-yellow/30 text-trough-yellow text-lg">
            <i className="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-white">
                Google Workspace Live Integration (Calendar &amp; Sheets)
              </h3>
              {user ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Connected: {user.email}
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Sign-In Required for Live Sync
                </span>
              )}
            </div>
            <p className="text-xs text-trough-muted mt-0.5">
              Inspect calendar event labels on{' '}
              <span className="text-slate-300 font-mono">{DEFAULT_CALENDAR_ID}</span>, pull{' '}
              <code className="text-trough-yellow">confirmed</code> events, and sync with Google
              Sheets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => handlePullCalendarEvents(filterMode, true)}
            disabled={isSyncingCalendar}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-trough-yellow/15 hover:bg-trough-yellow/25 text-trough-yellow border border-trough-yellow/40 transition cursor-pointer flex items-center gap-1.5"
          >
            <i className="fa-solid fa-tags"></i>
            <span>Check Calendar Event Labels</span>
          </button>

          {!user ? (
            <GoogleSignInButton onClick={onSignIn} />
          ) : (
            <button
              onClick={onSignOut}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-right-from-bracket text-rose-400"></i>
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Two-Column Integration Workspace: Left = Google Calendar, Right = Google Sheets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. GOOGLE CALENDAR SYNC CARD */}
        <div className="bg-[#151621] border border-slate-800 rounded-xl p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <i className="fa-regular fa-calendar-check text-trough-yellow"></i>
                1. Google Calendar Confirmed Events &amp; Label Scanner
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-trough-yellow border border-slate-700">
                ID: {decodedCalendarId}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] text-slate-400">
                  Target Google Calendar URL or Calendar ID
                </label>
                {accessibleCalendars.length > 0 && (
                  <select
                    value={decodedCalendarId}
                    onChange={(e) => setCalendarInput(e.target.value)}
                    className="bg-[#10111A] border border-slate-700 rounded px-2 py-0.5 text-[11px] text-trough-yellow font-mono focus:outline-none"
                    title="Switch between calendars in your Google account"
                  >
                    {accessibleCalendars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.summary} ({c.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <input
                type="text"
                value={calendarInput}
                onChange={(e) => setCalendarInput(e.target.value)}
                placeholder="https://calendar.google.com/calendar/u/0?cid=YnJlbnRAdHJvdWdoeHN5ZG5leS5jb20"
                className="w-full bg-[#10111A] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-trough-yellow focus:outline-none"
              />
            </div>

            {/* Label Filter Mode & Lookback Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="bg-[#10111A] p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Event Label Match Rule
                </span>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="w-full bg-[#151621] border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-trough-yellow focus:outline-none"
                >
                  <option value="strict_label">
                    Label &ldquo;confirmed&rdquo; (Title / Notes / Tag)
                  </option>
                  <option value="confirmed_not_hold">
                    Confirmed (Exclude Hold / Pencil / TBC)
                  </option>
                  <option value="all_status_confirmed">
                    All Google Calendar Status = Confirmed
                  </option>
                  {discoveredLabels.map((dl) => (
                    <option key={dl.label} value={dl.label}>
                      Label: {dl.label} ({dl.count})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Checks event titles, descriptions, color labels &amp; status tags.
                </p>
              </div>

              <div className="bg-[#10111A] p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Import Mode &amp; Window
                  </span>
                  <select
                    value={lookbackDays}
                    onChange={(e) => setLookbackDays(Number(e.target.value))}
                    className="bg-[#151621] border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-300 font-mono"
                    title="Date scan window"
                  >
                    <option value={0}>Upcoming Only</option>
                    <option value={90}>Last 90d + Upcoming</option>
                    <option value={365}>Full Year + Upcoming</option>
                    <option value={730}>All 2025–2027 Events</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="calMergeMode"
                      checked={calendarMergeMode === 'replace'}
                      onChange={() => setCalendarMergeMode('replace')}
                      className="text-trough-yellow focus:ring-0"
                    />
                    <span>Replace Table</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="calMergeMode"
                      checked={calendarMergeMode === 'merge'}
                      onChange={() => setCalendarMergeMode('merge')}
                      className="text-trough-yellow focus:ring-0"
                    />
                    <span>Append / Merge</span>
                  </label>
                </div>
              </div>
            </div>

            {calendarStatusMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs border ${
                  calendarStatusMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : calendarStatusMsg.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <i
                    className={`fa-solid mt-0.5 ${
                      calendarStatusMsg.type === 'success'
                        ? 'fa-circle-check text-emerald-400'
                        : calendarStatusMsg.type === 'error'
                        ? 'fa-triangle-exclamation text-rose-400'
                        : 'fa-circle-info text-blue-400'
                    }`}
                  ></i>
                  <div className="space-y-1.5 flex-1">
                    <p className="leading-relaxed">{calendarStatusMsg.text}</p>
                    {calendarStatusMsg.type === 'info' && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterMode('confirmed_not_hold');
                            handlePullCalendarEvents('confirmed_not_hold', true);
                          }}
                          className="px-2.5 py-1 rounded bg-trough-yellow text-black font-semibold text-[11px] transition cursor-pointer"
                        >
                          Pull Confirmed (Exclude Hold/TBC)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFilterMode('all_status_confirmed');
                            handlePullCalendarEvents('all_status_confirmed', true);
                          }}
                          className="px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 font-semibold text-[11px] transition cursor-pointer"
                        >
                          Pull All Status=Confirmed Events
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handlePullCalendarEvents()}
                disabled={isSyncingCalendar}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-trough-yellow hover:bg-trough-yellowHover text-black transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <i
                  className={`fa-solid ${
                    isSyncingCalendar ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-down'
                  }`}
                ></i>
                <span>
                  {isSyncingCalendar
                    ? 'Scanning Calendar Labels...'
                    : 'Pull Confirmed Events'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (inspectedEvents.length === 0) {
                    handlePullCalendarEvents(filterMode, true);
                  } else {
                    setShowLabelInspector((prev) => !prev);
                  }
                }}
                disabled={isSyncingCalendar}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-trough-yellow border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <i className="fa-solid fa-magnifying-glass-chart"></i>
                <span>
                  {showLabelInspector
                    ? 'Hide Label Inspector'
                    : `Inspect Event Labels (${inspectedEvents.length})`}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onResetDefaultEvents}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              Restore Baseline
            </button>
          </div>
        </div>

        {/* 2. GOOGLE SHEETS CONNECTION CARD */}
        <div className="bg-[#151621] border border-slate-800 rounded-xl p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-table text-emerald-400"></i>
                2. Google Sheets Live Budget &amp; Schedule Sync
              </span>
              {connectedSheet && (
                <a
                  href={connectedSheet.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-trough-yellow hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open Sheet</span>
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </a>
              )}
            </div>

            {/* Connect Existing Sheet Input */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Connect Existing Google Sheet (Paste Sheet URL or Spreadsheet ID)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  className="flex-1 bg-[#10111A] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-trough-yellow focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleConnectSheet}
                  disabled={isSheetBusy}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-trough-steelGrey hover:bg-trough-steelSlate text-white border border-slate-600 transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  Connect Sheet
                </button>
              </div>
            </div>

            {/* Connected Sheet Tab Selector & Sync Controls */}
            {connectedSheet ? (
              <div className="bg-[#10111A] p-3 rounded-lg border border-emerald-500/30 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                      Linked Spreadsheet
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {connectedSheet.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400">Target Tab:</label>
                    <select
                      value={selectedTab}
                      onChange={(e) => setSelectedTab(e.target.value)}
                      className="bg-[#151621] border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-trough-yellow focus:outline-none"
                    >
                      {connectedSheet.sheets.map((s) => (
                        <option key={s.sheetId} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleReadEventsFromSheet}
                    disabled={isSheetBusy}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-download text-blue-400"></i>
                    <span>Pull Events from Tab</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => requestWriteToTab('events')}
                    disabled={isSheetBusy}
                    className="px-2.5 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-upload"></i>
                    <span>Push Events ({events.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => requestWriteToTab('roster')}
                    disabled={isSheetBusy}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-users-gear text-trough-yellow"></i>
                    <span>Push IFA Roster</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => requestWriteToTab('simulator')}
                    disabled={isSheetBusy}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-sliders text-trough-yellow"></i>
                    <span>Push Pro-Forma</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Create New Master Sheet Option */
              <div className="bg-[#10111A] p-2.5 rounded-lg border border-slate-800/80 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Or Generate a New Trough X Master Budget Google Sheet
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    className="flex-1 bg-[#151621] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-trough-yellow focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={requestCreateMasterSheet}
                    disabled={isSheetBusy}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Create &amp; Sync Master Sheet</span>
                  </button>
                </div>
              </div>
            )}

            {sheetStatusMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs border ${
                  sheetStatusMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : sheetStatusMsg.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <i
                    className={`fa-solid mt-0.5 ${
                      sheetStatusMsg.type === 'success'
                        ? 'fa-circle-check text-emerald-400'
                        : sheetStatusMsg.type === 'error'
                        ? 'fa-triangle-exclamation text-rose-400'
                        : 'fa-circle-info text-blue-400'
                    }`}
                  ></i>
                  <p className="leading-relaxed">{sheetStatusMsg.text}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Exports include Venue Gross, 22% COGS, IFA Wages &amp; Surplus</span>
            {connectedSheet && (
              <button
                type="button"
                onClick={requestCreateMasterSheet}
                className="text-trough-yellow hover:underline cursor-pointer"
              >
                + New Master Sheet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          CALENDAR EVENT LABELS INSPECTOR DRAWER
          Displays all discovered labels, color tags, statuses, and raw events
         ===================================================================== */}
      {showLabelInspector && (
        <div className="bg-[#14151F] border border-trough-yellow/40 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-tags text-trough-yellow"></i>
                Google Calendar Event Labels Audit ({decodedCalendarId})
              </h4>
              <p className="text-[11px] text-trough-muted">
                Showing all detected text labels, bracket tags, color labels, and native statuses
                across {inspectedEvents.length} scanned event(s). Click any label pill to filter
                and import matching events.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateEvents(
                    inspectedEvents.map((i) => i.pipelineEvent),
                    calendarMergeMode
                  )
                }
                disabled={inspectedEvents.length === 0}
                className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold cursor-pointer disabled:opacity-40"
              >
                Import All {inspectedEvents.length} Scanned Events
              </button>
              <button
                type="button"
                onClick={() => setShowLabelInspector(false)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {/* Discovered Label Pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Discovered Labels &amp; Status Tags (Click to Filter &amp; Pull):
            </span>
            {discoveredLabels.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono">
                No upcoming events or labels scanned yet. Sign in and click &ldquo;Check Calendar
                Event Labels&rdquo;.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {discoveredLabels.map((dl) => {
                  const isActive = filterMode === dl.label;
                  return (
                    <button
                      key={dl.label}
                      type="button"
                      onClick={() => {
                        setFilterMode(dl.label);
                        handlePullCalendarEvents(dl.label, true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition cursor-pointer ${
                        isActive
                          ? 'bg-trough-yellow text-black border-trough-yellow font-bold'
                          : dl.label.includes('confirmed')
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                          : dl.category === 'color'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      <i
                        className={`fa-solid text-[10px] ${
                          dl.category === 'color'
                            ? 'fa-palette'
                            : dl.category === 'status'
                            ? 'fa-circle-check'
                            : 'fa-tag'
                        }`}
                      ></i>
                      <span>{dl.label}</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
                        {dl.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Event-by-Event Label Inspection Table */}
          {inspectedEvents.length > 0 && (
            <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#10111A] text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Calendar Event Summary</th>
                    <th className="py-2 px-3">Title / Notes Labels</th>
                    <th className="py-2 px-3">Color Label</th>
                    <th className="py-2 px-3">GCal Status</th>
                    <th className="py-2 px-3 text-right">Import</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {inspectedEvents.map((item) => (
                    <tr key={item.raw.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono whitespace-nowrap text-slate-300">
                        {item.dateFormatted}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-white">{item.rawSummary}</div>
                        {item.rawDescriptionSnippet && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {item.rawDescriptionSnippet}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {item.extractedLabels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.extractedLabels.map((lbl) => (
                              <span
                                key={lbl}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                  lbl.toLowerCase().includes('confirmed')
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                                    : 'bg-slate-800 text-trough-yellow border border-slate-700'
                                }`}
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">
                            No text label in title/notes
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {item.colorName ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-200">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: item.colorHex || '#33b679' }}
                            ></span>
                            {item.colorName}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Default Calendar Color
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            item.nativeStatus === 'confirmed'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {item.nativeStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onUpdateEvents([item.pipelineEvent], 'merge')}
                          className="px-2 py-1 rounded bg-trough-yellow/15 hover:bg-trough-yellow text-trough-yellow hover:text-black text-[10px] font-semibold transition cursor-pointer"
                        >
                          + Add to Schedule
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EXPLICIT USER CONFIRMATION MODAL FOR GOOGLE SHEETS MUTATIONS */}
      {pendingWrite && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-trough-cardDark border-2 border-trough-yellow rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-trough-yellow/15 border border-trough-yellow/40 flex items-center justify-center text-trough-yellow">
                  <i className="fa-solid fa-file-shield"></i>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{pendingWrite.title}</h4>
                  <span className="text-[11px] text-trough-muted">
                    Explicit permission required before modifying Google Sheets
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {pendingWrite.description}
            </p>

            <div className="bg-[#151621] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Spreadsheet:</span>
                <span className="text-white font-semibold truncate max-w-[220px]">
                  {pendingWrite.targetSheetTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Tab(s):</span>
                <span className="text-trough-yellow">{pendingWrite.targetTabName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rows to Write:</span>
                <span className="text-emerald-400">{pendingWrite.rowCount} rows</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingWrite(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedWrite}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-trough-yellow hover:bg-trough-yellowHover text-black transition cursor-pointer flex items-center gap-1.5"
              >
                <i className="fa-solid fa-check"></i>
                <span>Confirm &amp; Write to Google Sheets</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
