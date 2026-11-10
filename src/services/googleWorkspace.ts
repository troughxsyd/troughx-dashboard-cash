import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { PipelineEvent, RosterItem } from '../App';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Scopes approved via set_up_oauth (Sheets + Calendar + Google Drive)
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

export const DEFAULT_CALENDAR_URL =
  'https://calendar.google.com/calendar/u/0?cid=YnJlbnRAdHJvdWdoeHN5ZG5leS5jb20';
export const DEFAULT_CALENDAR_ID = 'brent@troughxsydney.com';

// Standard Google Calendar Event Color IDs (1–11)
export const GOOGLE_CALENDAR_COLORS: Record<
  string,
  { name: string; hex: string; defaultMeaning: string }
> = {
  '1': { name: 'Lavender', hex: '#7986cb', defaultMeaning: 'Color Label #1' },
  '2': { name: 'Sage (Light Green)', hex: '#33b679', defaultMeaning: 'Color Label #2' },
  '3': { name: 'Grape (Purple)', hex: '#8e24aa', defaultMeaning: 'Color Label #3' },
  '4': { name: 'Flamingo (Pink)', hex: '#e67c73', defaultMeaning: 'Color Label #4' },
  '5': { name: 'Banana (Yellow)', hex: '#f6bf26', defaultMeaning: 'Color Label #5' },
  '6': { name: 'Tangerine (Orange)', hex: '#f4511e', defaultMeaning: 'Color Label #6' },
  '7': { name: 'Peacock (Cyan)', hex: '#039be5', defaultMeaning: 'Color Label #7' },
  '8': { name: 'Graphite (Grey)', hex: '#616161', defaultMeaning: 'Color Label #8' },
  '9': { name: 'Blueberry (Blue)', hex: '#3f51b5', defaultMeaning: 'Color Label #9' },
  '10': { name: 'Basil (Dark Green)', hex: '#0b8043', defaultMeaning: 'Color Label #10' },
  '11': { name: 'Tomato (Red)', hex: '#d50000', defaultMeaning: 'Color Label #11' },
};

// In-memory token cache — never persist Google OAuth access tokens in localStorage
let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function signIn(): Promise<string | null> {
  const provider = new GoogleAuthProvider();
  SCOPES.forEach((s) => provider.addScope(s));
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  cachedToken = credential?.accessToken ?? null;
  tokenExpiry = Date.now() + 50 * 60 * 1000; // ~50 min buffer for 1-hr token
  return cachedToken;
}

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  if (auth.currentUser) {
    const provider = new GoogleAuthProvider();
    SCOPES.forEach((s) => provider.addScope(s));
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedToken = credential?.accessToken ?? null;
    tokenExpiry = Date.now() + 50 * 60 * 1000;
    if (cachedToken) return cachedToken;
  }
  const token = await signIn();
  if (!token) throw new Error('Unable to obtain Google Workspace access token.');
  return token;
}

export async function signOut(): Promise<void> {
  cachedToken = null;
  tokenExpiry = 0;
  await fbSignOut(auth);
}

/**
 * Decodes a Google Calendar URL (?cid=...) or returns the raw calendar ID.
 */
export function extractCalendarId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_CALENDAR_ID;

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const cid = url.searchParams.get('cid') || url.searchParams.get('src');
      if (cid) {
        if (cid.includes('@')) return cid;
        try {
          const normalized = cid.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = atob(normalized);
          if (decoded && decoded.trim()) {
            return decoded.trim();
          }
        } catch {
          return cid;
        }
      }
    }
  } catch {
    // Fall through to raw input
  }
  return trimmed;
}

/**
 * Extracts a Google Spreadsheet ID from either a full docs.google.com/spreadsheets/d/... URL or a raw ID.
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export interface AccessibleCalendarInfo {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  accessRole?: string;
}

/**
 * Lists all calendars in the signed-in user's Google Calendar list so we can see primary + secondary calendars.
 */
export async function fetchAccessibleCalendars(): Promise<AccessibleCalendarInfo[]> {
  const token = await getAccessToken();
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map((c: any) => ({
    id: c.id,
    summary: c.summaryOverride || c.summary || c.id,
    primary: Boolean(c.primary),
    backgroundColor: c.backgroundColor,
    accessRole: c.accessRole,
  }));
}

export interface GoogleCalendarRawEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  colorId?: string;
  eventType?: string;
  transparency?: string;
  visibility?: string;
  categories?: string[];
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  organizer?: { email?: string; displayName?: string };
}

export interface InspectedEventLabelInfo {
  raw: GoogleCalendarRawEvent;
  pipelineEvent: PipelineEvent;
  dateFormatted: string;
  rawSummary: string;
  rawDescriptionSnippet: string;
  nativeStatus: string; // e.g. 'confirmed' | 'tentative' | 'cancelled'
  colorId: string | null;
  colorName: string | null;
  colorHex: string | null;
  extractedLabels: string[]; // All detected tags/labels from title, description, extendedProperties, etc.
  hasExplicitConfirmedLabel: boolean;
  isTentativeOrHold: boolean;
}

export interface SyncedCalendarEventResult {
  events: PipelineEvent[];
  inspectedEvents: InspectedEventLabelInfo[];
  discoveredLabels: Array<{ label: string; count: number; category: 'text' | 'color' | 'status' | 'property' }>;
  matchedByLabelCount: number;
  matchedByStatusCount: number;
  calendarIdUsed: string;
  calendarSummary?: string;
  totalUpcomingScanned: number;
}

function formatDateDDMMYYYY(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Extracts all human-readable labels/tags from a Google Calendar event:
 * - Bracketed tags: [Confirmed], [HOLD], [TBC], (Confirmed), etc.
 * - Prefix tags: "CONFIRMED - ...", "HOLD: ...", "PENCILLED - ..."
 * - Hashtags or key-value labels in description: #confirmed, Label: Confirmed, Status: Confirmed
 * - Keyword status tags: Confirmed, Tentative, Hold, Pencil, TBC, Cancelled
 * - Extended properties (private / shared)
 */
export function extractEventLabels(ev: GoogleCalendarRawEvent): {
  labels: string[];
  hasExplicitConfirmedLabel: boolean;
  isTentativeOrHold: boolean;
} {
  const rawTitle = (ev.summary || '').trim();
  const rawDesc = (ev.description || '').trim();
  const rawLoc = (ev.location || '').trim();
  const combined = `${rawTitle}\n${rawDesc}\n${rawLoc}`;
  const combinedLower = combined.toLowerCase();

  const labelSet = new Set<string>();

  // 1. Bracketed or parenthesized labels in summary or description, e.g. [Confirmed], (Confirmed), [HOLD]
  const bracketMatches = combined.matchAll(/[\[\(]([a-zA-Z0-9_\-\s]{2,25})[\]\)]/g);
  for (const m of bracketMatches) {
    const val = m[1].trim();
    if (val) labelSet.add(val);
  }

  // 2. Prefix before colon or dash at start of summary, e.g. "CONFIRMED: Action" or "HOLD - Action"
  const prefixMatch = rawTitle.match(/^([A-Za-z0-9_\s]{2,18})\s*[:\-–—]\s+/);
  if (prefixMatch) {
    const prefix = prefixMatch[1].trim();
    if (
      /confirmed|confirm|hold|pencil|tentative|tbc|booked|locked|private|promoter|owned/i.test(
        prefix
      )
    ) {
      labelSet.add(prefix);
    }
  }

  // 3. Key-value labels in description: e.g., "Label: Confirmed", "Status: Confirmed", "Tag: Confirmed"
  const kvMatches = rawDesc.matchAll(
    /(?:label|status|tag|booking|state|category)\s*[:=]\s*([^\n,;]+)/gi
  );
  for (const m of kvMatches) {
    const val = m[1].trim();
    if (val && val.length <= 30) labelSet.add(val);
  }

  // 4. Hashtags (#confirmed, #hold, #promoter, etc.)
  const hashMatches = combined.matchAll(/#([a-zA-Z0-9_-]{2,25})/g);
  for (const m of hashMatches) {
    labelSet.add(`#${m[1]}`);
  }

  // 5. Well-known booking status keywords anywhere in summary or description
  const statusKeywords = [
    { regex: /\bconfirmed\b/i, label: 'confirmed' },
    { regex: /\btentative\b/i, label: 'tentative' },
    { regex: /\bpencil(?:led)?\b/i, label: 'pencilled' },
    { regex: /\bhold\b/i, label: 'hold' },
    { regex: /\btbc\b/i, label: 'tbc' },
    { regex: /\blocked\b/i, label: 'locked' },
  ];
  for (const kw of statusKeywords) {
    if (kw.regex.test(combined)) {
      labelSet.add(kw.label);
    }
  }

  // 6. Extended properties (shared or private)
  const extPrivate = ev.extendedProperties?.private || {};
  const extShared = ev.extendedProperties?.shared || {};
  for (const [k, v] of Object.entries({ ...extPrivate, ...extShared })) {
    if (v) {
      labelSet.add(`${k}:${v}`);
    }
  }

  const labels = Array.from(labelSet);
  const hasExplicitConfirmedLabel =
    combinedLower.includes('confirmed') ||
    labels.some((l) => l.toLowerCase().includes('confirmed'));

  const isTentativeOrHold =
    ev.status === 'tentative' ||
    /\b(hold|pencil|pencilled|tentative|tbc|unconfirmed)\b/i.test(rawTitle);

  return {
    labels,
    hasExplicitConfirmedLabel,
    isTentativeOrHold,
  };
}

/**
 * Converts a Google Calendar event into a Trough X PipelineEvent + detailed label inspection metadata.
 */
export function inspectAndMapCalendarEvent(
  ev: GoogleCalendarRawEvent
): InspectedEventLabelInfo {
  const rawTitle = (ev.summary || 'Untitled Trough X Event').trim();
  const rawDesc = (ev.description || '').trim();
  const combinedText = `${rawTitle} ${rawDesc} ${ev.location || ''}`.toLowerCase();

  const { labels, hasExplicitConfirmedLabel, isTentativeOrHold } = extractEventLabels(ev);

  // Clean "[CONFIRMED]" or "(Confirmed)" prefix/suffix from display title while keeping it readable
  const cleanTitle =
    rawTitle
      .replace(/\[confirmed\]/gi, '')
      .replace(/\(confirmed\)/gi, '')
      .replace(/^confirmed\s*[-:–—]\s*/gi, '')
      .trim() || rawTitle;

  const isPromoter =
    combinedText.includes('promoter') ||
    combinedText.includes('hosted') ||
    combinedText.includes('clip') ||
    /\bby\s+[a-z0-9]/i.test(cleanTitle);

  const type: 'promoter' | 'owned' =
    combinedText.includes('owned') ||
    combinedText.includes('trough noir') ||
    combinedText.includes('in-house')
      ? 'owned'
      : isPromoter
      ? 'promoter'
      : 'owned';

  const paxMatch = combinedText.match(
    /(?:pax|cap|capacity|attendance)\s*[:=]?\s*(\d{2,3})/i
  );
  const parsedPax = paxMatch
    ? Math.min(300, Math.max(50, parseInt(paxMatch[1], 10)))
    : type === 'promoter'
    ? 260
    : 240;

  const barGrossMatch = combinedText.match(/bar\s*gross\s*[:=]?\s*\$?(\d{3,5})/i);
  const barGross = barGrossMatch
    ? parseInt(barGrossMatch[1], 10)
    : Math.round(parsedPax * (type === 'owned' ? 28 : 26));

  const clip = type === 'promoter' ? parsedPax * 5 : 0;
  const ticketRev = type === 'owned' ? parsedPax * 30 : 0;
  const deposit =
    type === 'promoter' && (combinedText.includes('deposit') || parsedPax < 260)
      ? 550
      : 0;

  const wages =
    parsedPax >= 280
      ? 4060
      : parsedPax >= 250
      ? 3860
      : parsedPax >= 200
      ? 3500
      : 3110;

  const cloakRev = Math.round(parsedPax * 0.5) * 5;
  const grossTurnover = barGross + clip + ticketRev + deposit + cloakRev;
  const bevCogs = barGross * 0.22;
  const consumables = parsedPax > 220 ? 200 : 150;
  const overheads =
    type === 'owned'
      ? 1200 + 450 + 400 + grossTurnover * 0.015
      : 150 + grossTurnover * 0.015;

  const surplus = Math.round(
    grossTurnover - bevCogs - consumables - wages - overheads
  );

  const startIso =
    ev.start?.dateTime || ev.start?.date || new Date().toISOString();
  const formattedDate = formatDateDDMMYYYY(startIso);

  const formatLabel =
    type === 'promoter'
      ? 'Promoter Hosted'
      : cleanTitle.toLowerCase().includes('festival') ||
        cleanTitle.toLowerCase().includes('mardi gras')
      ? 'Owned Festival'
      : cleanTitle.toLowerCase().includes('day') ||
        cleanTitle.toLowerCase().includes('cabaret')
      ? 'Owned Daytime'
      : 'Owned Hero Night';

  const colorInfo = ev.colorId ? GOOGLE_CALENDAR_COLORS[ev.colorId] : undefined;

  return {
    raw: ev,
    dateFormatted: formattedDate,
    rawSummary: rawTitle,
    rawDescriptionSnippet: rawDesc ? rawDesc.slice(0, 140) : '',
    nativeStatus: ev.status || 'confirmed',
    colorId: ev.colorId || null,
    colorName: colorInfo ? colorInfo.name : ev.colorId ? `Color #${ev.colorId}` : null,
    colorHex: colorInfo ? colorInfo.hex : null,
    extractedLabels: labels,
    hasExplicitConfirmedLabel,
    isTentativeOrHold,
    pipelineEvent: {
      date: formattedDate,
      title: cleanTitle,
      type,
      format: formatLabel,
      pax: parsedPax,
      barGross,
      clip,
      ticketRev,
      deposit,
      wages,
      surplus,
    },
  };
}

/**
 * Fetches forthcoming events from the specified Google Calendar and returns both:
 * 1) Full label inspection telemetry (`inspectedEvents` and `discoveredLabels`) so the user can check all calendar event labels.
 * 2) Filtered `events` matching the user's chosen label / confirmation filter.
 */
export async function fetchConfirmedCalendarEvents(
  calendarInput: string,
  filterMode: 'strict_label' | 'confirmed_not_hold' | 'all_status_confirmed' | string,
  lookbackDays = 0
): Promise<SyncedCalendarEventResult> {
  const token = await getAccessToken();
  const targetCalendarId = extractCalendarId(calendarInput);

  // Use real current date minus optional lookbackDays; also guard against simulated future clock in preview
  const nowMs = Date.now();
  const realWorldFloor = new Date('2025-01-01T00:00:00Z').getTime();
  // If environment clock is in late 2026, look back to start of 2025/2026 if lookbackDays > 0 so real 2025/2026 events are never missed
  const effectiveMinTime =
    lookbackDays > 0
      ? new Date(nowMs - lookbackDays * 86400000).toISOString()
      : new Date(Math.min(nowMs, Date.now()) - 86400000).toISOString();

  const buildUrl = (calId: string, timeMinIso: string) =>
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calId
    )}/events?timeMin=${encodeURIComponent(
      timeMinIso
    )}&singleEvents=true&orderBy=startTime&maxResults=150`;

  let calendarIdUsed = targetCalendarId;
  let res = await fetch(buildUrl(targetCalendarId, effectiveMinTime), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404 && targetCalendarId !== 'primary') {
    calendarIdUsed = 'primary';
    res = await fetch(buildUrl('primary', effectiveMinTime), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message ||
        `Google Calendar API returned ${res.status} when reading ${calendarIdUsed}`
    );
  }

  const data = await res.json();
  let items: GoogleCalendarRawEvent[] = Array.isArray(data.items) ? data.items : [];

  // If 0 upcoming events were found using effectiveMinTime, automatically check from 2025-01-01 in case clock offset hid events
  if (items.length === 0 && lookbackDays === 0) {
    const fallbackRes = await fetch(
      buildUrl(calendarIdUsed, new Date(realWorldFloor).toISOString()),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      if (Array.isArray(fallbackData.items) && fallbackData.items.length > 0) {
        items = fallbackData.items;
      }
    }
  }

  const inspectedEvents = items
    .filter((ev) => ev.status !== 'cancelled')
    .map((ev) => inspectAndMapCalendarEvent(ev));

  // Aggregate all discovered labels across the calendar's events
  const labelCounts = new Map<
    string,
    { count: number; category: 'text' | 'color' | 'status' | 'property' }
  >();

  for (const item of inspectedEvents) {
    // Native status
    const statusKey = `status:${item.nativeStatus}`;
    const prevStatus = labelCounts.get(statusKey);
    labelCounts.set(statusKey, {
      count: (prevStatus?.count || 0) + 1,
      category: 'status',
    });

    // Color label
    if (item.colorId && item.colorName) {
      const colorKey = `color:${item.colorId} (${item.colorName})`;
      const prevColor = labelCounts.get(colorKey);
      labelCounts.set(colorKey, {
        count: (prevColor?.count || 0) + 1,
        category: 'color',
      });
    }

    // Text / Extended property labels
    for (const lbl of item.extractedLabels) {
      const norm = lbl.toLowerCase().trim();
      const cat = norm.includes(':') ? 'property' : 'text';
      const prev = labelCounts.get(norm);
      labelCounts.set(norm, {
        count: (prev?.count || 0) + 1,
        category: cat,
      });
    }
  }

  const discoveredLabels = Array.from(labelCounts.entries()).map(([label, info]) => ({
    label,
    count: info.count,
    category: info.category,
  }));

  const labelMatched = inspectedEvents.filter((m) => m.hasExplicitConfirmedLabel);
  const statusMatched = inspectedEvents.filter((m) => m.nativeStatus === 'confirmed');

  let selected: InspectedEventLabelInfo[] = [];
  if (filterMode === 'strict_label') {
    selected = labelMatched;
  } else if (filterMode === 'confirmed_not_hold') {
    selected = inspectedEvents.filter(
      (m) =>
        m.hasExplicitConfirmedLabel ||
        (m.nativeStatus === 'confirmed' && !m.isTentativeOrHold)
    );
  } else if (filterMode === 'all_status_confirmed') {
    selected = statusMatched;
  } else if (filterMode.startsWith('color:')) {
    const cid = filterMode.split(':')[1]?.split(' ')[0];
    selected = inspectedEvents.filter((m) => m.colorId === cid);
  } else {
    // Match custom discovered label string
    const targetLower = filterMode.toLowerCase();
    selected = inspectedEvents.filter(
      (m) =>
        m.extractedLabels.some((l) => l.toLowerCase() === targetLower) ||
        m.rawSummary.toLowerCase().includes(targetLower) ||
        m.rawDescriptionSnippet.toLowerCase().includes(targetLower)
    );
  }

  return {
    events: selected.map((m) => m.pipelineEvent),
    inspectedEvents,
    discoveredLabels,
    matchedByLabelCount: labelMatched.length,
    matchedByStatusCount: statusMatched.length,
    calendarIdUsed,
    calendarSummary: data.summary || calendarIdUsed,
    totalUpcomingScanned: items.length,
  };
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }>;
}

/**
 * Fetches Google Spreadsheet metadata including actual sheet tab names (never hardcodes "Sheet1").
 */
export async function fetchSpreadsheetMetadata(
  spreadsheetInput: string
): Promise<SheetMetadata> {
  const token = await getAccessToken();
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  if (!spreadsheetId) {
    throw new Error('Please enter a valid Google Sheet URL or Spreadsheet ID.');
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message ||
        `Could not open Google Sheet (${res.status}). Check that you have access to this sheet.`
    );
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId ?? 0,
    title: s.properties?.title ?? 'Untitled Tab',
    rowCount: s.properties?.gridProperties?.rowCount,
    columnCount: s.properties?.gridProperties?.columnCount,
  }));

  return {
    spreadsheetId: data.spreadsheetId || spreadsheetId,
    title: data.properties?.title || 'Trough X Google Sheet',
    spreadsheetUrl:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheets,
  };
}

/**
 * Reads PipelineEvent rows from a selected tab in the user's Google Sheet (Read-Only).
 */
export async function readEventsFromSheetTab(
  spreadsheetId: string,
  sheetTitle: string
): Promise<PipelineEvent[]> {
  const token = await getAccessToken();
  const range = `'${sheetTitle.replace(/'/g, "''")}'!A1:K100`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Failed to read range from tab "${sheetTitle}".`
    );
  }

  const data = await res.json();
  const rows: string[][] = Array.isArray(data.values) ? data.values : [];
  if (rows.length <= 1) return [];

  const parsedEvents: PipelineEvent[] = [];
  const parseNum = (val: string | undefined, fallback = 0) => {
    if (!val) return fallback;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return Number.isNaN(num) ? fallback : num;
  };

  const startIdx =
    String(rows[0][0] || '')
      .toLowerCase()
      .includes('date') ||
    String(rows[0][1] || '')
      .toLowerCase()
      .includes('event') ||
    String(rows[0][1] || '')
      .toLowerCase()
      .includes('title')
      ? 1
      : 0;

  for (let i = startIdx; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 2 || (!r[0] && !r[1])) continue;
    const date = String(r[0] || '').trim();
    const title = String(r[1] || '').trim();
    if (!title) continue;

    const rawType = String(r[2] || '').toLowerCase();
    const type: 'promoter' | 'owned' =
      rawType.includes('promoter') || rawType.includes('clip') ? 'promoter' : 'owned';
    const format = String(
      r[3] || (type === 'promoter' ? 'Promoter Hosted' : 'Owned Hero Night')
    ).trim();
    const pax = Math.min(300, Math.max(0, Math.round(parseNum(r[4], 200))));
    const barGross = parseNum(r[5], pax * 25);
    const clip = parseNum(r[6], type === 'promoter' ? pax * 5 : 0);
    const ticketRev = parseNum(r[7], type === 'owned' ? pax * 30 : 0);
    const deposit = parseNum(r[8], 0);
    const wages = parseNum(r[9], 3500);
    const surplus = parseNum(
      r[10],
      barGross + clip + ticketRev + deposit - wages - barGross * 0.22
    );

    parsedEvents.push({
      date,
      title,
      type,
      format,
      pax,
      barGross,
      clip,
      ticketRev,
      deposit,
      wages,
      surplus,
    });
  }

  return parsedEvents;
}

export function buildEventsSheetRows(events: PipelineEvent[]): (string | number)[][] {
  const header = [
    'Date',
    'Event Title',
    'Model Type',
    'Format',
    'Cap Target (Pax)',
    'Bar Gross ($)',
    'Ticket Clip ($)',
    'Ticket Revenue ($)',
    'Deposit ($)',
    'IFA Venue Wages ($)',
    'Net Operating Surplus ($)',
  ];
  const rows = events.map((e) => [
    e.date,
    e.title,
    e.type,
    e.format,
    e.pax,
    e.barGross,
    e.clip,
    e.ticketRev,
    e.deposit,
    e.wages,
    e.surplus,
  ]);
  return [header, ...rows];
}

export function buildRosterSheetRows(
  roster: RosterItem[],
  includeSuper: boolean
): (string | number)[][] {
  const header = [
    'Role & Operational Scope',
    'Headcount',
    'Hours / Shift',
    'IFA Hourly Rate (AUD)',
    'Superannuation (11.5%)',
    'Total Shift Cost (AUD)',
    'Compliance Notes',
  ];
  const rows = roster.map((r) => {
    const base = r.headcount * r.hours * r.rate;
    const superAmt = includeSuper && r.hasSuper ? base * 0.115 : 0;
    return [
      r.role,
      r.headcount,
      r.hours,
      r.rate,
      r.hasSuper ? '11.5% IFA' : 'Contracted 0%',
      Number((base + superAmt).toFixed(2)),
      r.notes,
    ];
  });
  return [header, ...rows];
}

export function buildSimulatorSheetRows(
  simData: Record<string, string | number>
): (string | number)[][] {
  return [
    ['Trough X Sydney (273 Crown St) — Pro-Forma Budget Snapshot', 'Value (AUD / Metric)'],
    ...Object.entries(simData).map(([k, v]) => [k, v]),
  ];
}

/**
 * Writes data to a specific tab in an existing Google Sheet.
 * MUST only be called after explicit user confirmation in the UI modal.
 */
export async function writeRowsToSheetTab(
  spreadsheetId: string,
  sheetTitle: string,
  rows: (string | number)[][]
): Promise<{ updatedCells: number; updatedRange: string }> {
  const token = await getAccessToken();
  const safeTab = `'${sheetTitle.replace(/'/g, "''")}'!A1`;

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(safeTab)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Failed to update Google Sheet tab "${sheetTitle}".`
    );
  }

  const data = await res.json();
  return {
    updatedCells: data.updatedCells ?? rows.length * (rows[0]?.length || 1),
    updatedRange: data.updatedRange ?? safeTab,
  };
}

/**
 * Creates a brand-new Trough X Sydney Master Google Sheet with 3 tabs and populates it.
 * MUST only be called after explicit user confirmation in the UI modal.
 */
export async function createTroughMasterSpreadsheet(
  title: string,
  events: PipelineEvent[],
  roster: RosterItem[],
  includeSuper: boolean,
  simData: Record<string, string | number>
): Promise<SheetMetadata> {
  const token = await getAccessToken();

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: 'Confirmed Events' } },
        { properties: { title: 'IFA Wage Roster' } },
        { properties: { title: 'Budget Simulator' } },
      ],
    }),
  });

  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Failed to create Google Sheet (${createRes.status}).`
    );
  }

  const created = await createRes.json();
  const spreadsheetId: string = created.spreadsheetId;

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `'Confirmed Events'!A1`,
            values: buildEventsSheetRows(events),
          },
          {
            range: `'IFA Wage Roster'!A1`,
            values: buildRosterSheetRows(roster, includeSuper),
          },
          {
            range: `'Budget Simulator'!A1`,
            values: buildSimulatorSheetRows(simData),
          },
        ],
      }),
    }
  );

  if (!batchRes.ok) {
    const errBody = await batchRes.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || 'Spreadsheet created, but initial data population failed.'
    );
  }

  return fetchSpreadsheetMetadata(spreadsheetId);
}

// ============================================================================
// GOOGLE DRIVE API INTEGRATION
// ============================================================================

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

export async function listDriveFiles(
  filterType: 'all' | 'spreadsheets' | 'folders' | 'trough' = 'all',
  searchQuery = ''
): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  const clauses: string[] = ['trashed = false'];

  if (filterType === 'spreadsheets') {
    clauses.push("mimeType = 'application/vnd.google-apps.spreadsheet'");
  } else if (filterType === 'folders') {
    clauses.push("mimeType = 'application/vnd.google-apps.folder'");
  } else if (filterType === 'trough') {
    clauses.push("name contains 'Trough'");
  }

  if (searchQuery.trim()) {
    const safeSearch = searchQuery.trim().replace(/'/g, "\\'");
    clauses.push(`name contains '${safeSearch}'`);
  }

  const params = new URLSearchParams({
    pageSize: '25',
    orderBy: 'modifiedTime desc',
    fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)',
    q: clauses.join(' and '),
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Failed to list Google Drive files (${res.status}).`
    );
  }

  const data = await res.json();
  return (data.files || []) as DriveFileItem[];
}

/**
 * Exports a Trough X report or CSV/JSON snapshot to Google Drive.
 * MUST only be called after explicit user confirmation in the UI modal.
 */
export async function exportFileToDrive(
  fileName: string,
  content: string,
  mimeType: string,
  folderId?: string
): Promise<DriveFileItem> {
  const token = await getAccessToken();

  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType,
  };
  if (folderId && folderId.trim()) {
    metadata.parents = [folderId.trim()];
  }

  const boundary = 'trough_x_drive_multipart_boundary';
  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Failed to upload file to Google Drive (${res.status}).`
    );
  }

  return (await res.json()) as DriveFileItem;
}

/**
 * Deletes a file from Google Drive.
 * MUST only be called after explicit user confirmation in the UI modal.
 */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok && res.status !== 204) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Failed to delete file from Google Drive (${res.status}).`
    );
  }
}

export function buildDriveCsvFromRows(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');
}

// ============================================================================
// FIREBASE FIRESTORE CLOUD PERSISTENCE
// ============================================================================

const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

function sanitizeValidId(raw: string, fallbackPrefix: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  if (!cleaned || !ID_REGEX.test(cleaned)) {
    return `${fallbackPrefix}_${Date.now()}`;
  }
  return cleaned;
}

export interface CloudWorkspaceSnapshot {
  workspaceTitle: string;
  linkedSheetUrl: string;
  linkedCalendarId: string;
  linkedDriveFolderId: string;
  wagesIncludeSuper: boolean;
  simTicketClip: number;
  dealClip: number;
  events: PipelineEvent[];
  roster: RosterItem[];
}

export async function saveWorkspaceToFirestore(
  snapshot: CloudWorkspaceSnapshot
): Promise<{ eventsSaved: number; rosterSaved: number }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sign in with Google first to save your workspace to Firebase Cloud.');
  }

  const uid = sanitizeValidId(user.uid, 'user');
  const configPath = `workspaceConfigs/${uid}`;

  // 1. Save or update WorkspaceConfig document
  try {
    const configRef = doc(db, 'workspaceConfigs', uid);
    const existingSnap = await getDoc(configRef);
    const cleanTitle = (snapshot.workspaceTitle || 'Trough X Sydney Operating Model').slice(
      0,
      120
    );
    const cleanSheetUrl = (snapshot.linkedSheetUrl || '').slice(0, 500);
    const cleanCalendarId = (snapshot.linkedCalendarId || DEFAULT_CALENDAR_ID).slice(0, 200);
    const cleanFolderId = (snapshot.linkedDriveFolderId || '').slice(0, 128);
    const cleanSimClip = Math.min(500, Math.max(0, Number(snapshot.simTicketClip) || 0));
    const cleanDealClip = Math.min(500, Math.max(0, Number(snapshot.dealClip) || 0));

    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      await setDoc(configRef, {
        ownerId: user.uid,
        workspaceTitle: cleanTitle,
        linkedSheetUrl: cleanSheetUrl,
        linkedCalendarId: cleanCalendarId,
        linkedDriveFolderId: cleanFolderId,
        wagesIncludeSuper: Boolean(snapshot.wagesIncludeSuper),
        simTicketClip: cleanSimClip,
        dealClip: cleanDealClip,
        createdAt: existingData.createdAt,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(configRef, {
        ownerId: user.uid,
        workspaceTitle: cleanTitle,
        linkedSheetUrl: cleanSheetUrl,
        linkedCalendarId: cleanCalendarId,
        linkedDriveFolderId: cleanFolderId,
        wagesIncludeSuper: Boolean(snapshot.wagesIncludeSuper),
        simTicketClip: cleanSimClip,
        dealClip: cleanDealClip,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, configPath);
  }

  // 2. Sync pipelineEvents for this user
  const eventsCollectionPath = 'pipelineEvents';
  try {
    const existingEventsQuery = query(
      collection(db, 'pipelineEvents'),
      where('ownerId', '==', user.uid)
    );
    const existingEventsSnap = await getDocs(existingEventsQuery);
    for (const docSnap of existingEventsSnap.docs) {
      await deleteDoc(doc(db, 'pipelineEvents', docSnap.id));
    }

    for (let i = 0; i < snapshot.events.length; i++) {
      const ev = snapshot.events[i];
      const eventDocId = sanitizeValidId(`${uid}_evt_${i}`, 'evt');
      await setDoc(doc(db, 'pipelineEvents', eventDocId), {
        ownerId: user.uid,
        date: (ev.date || 'TBC').slice(0, 32),
        title: (ev.title || 'Untitled Trough X Event').slice(0, 160),
        type: ev.type === 'owned' ? 'owned' : 'promoter',
        format: (ev.format || 'Promoter Hosted').slice(0, 80),
        pax: Math.min(1000, Math.max(0, Math.round(Number(ev.pax) || 0))),
        barGross: Math.min(500000, Math.max(0, Number(ev.barGross) || 0)),
        clip: Math.min(100000, Math.max(0, Number(ev.clip) || 0)),
        ticketRev: Math.min(500000, Math.max(0, Number(ev.ticketRev) || 0)),
        deposit: Math.min(50000, Math.max(0, Number(ev.deposit) || 0)),
        wages: Math.min(100000, Math.max(0, Number(ev.wages) || 0)),
        surplus: Math.min(500000, Math.max(-100000, Number(ev.surplus) || 0)),
        sortOrder: i,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, eventsCollectionPath);
  }

  // 3. Sync active rosterItems for this user
  const rosterCollectionPath = 'rosterItems';
  try {
    const existingRosterQuery = query(
      collection(db, 'rosterItems'),
      where('ownerId', '==', user.uid)
    );
    const existingRosterSnap = await getDocs(existingRosterQuery);
    for (const docSnap of existingRosterSnap.docs) {
      await deleteDoc(doc(db, 'rosterItems', docSnap.id));
    }

    for (let i = 0; i < snapshot.roster.length; i++) {
      const r = snapshot.roster[i];
      const rosterDocId = sanitizeValidId(`${uid}_role_${i}`, 'role');
      await setDoc(doc(db, 'rosterItems', rosterDocId), {
        ownerId: user.uid,
        templateId: 'active',
        templateName: 'Baseline 200 Pax Roster (Active)',
        role: (r.role || 'Operational Staff').slice(0, 120),
        headcount: Math.min(50, Math.max(0, Number(r.headcount) || 0)),
        hours: Math.min(24, Math.max(0, Number(r.hours) || 0)),
        rate: Math.min(500, Math.max(0, Number(r.rate) || 0)),
        hasSuper: Boolean(r.hasSuper),
        notes: (r.notes || '').slice(0, 300),
        sortOrder: i,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, rosterCollectionPath);
  }

  return {
    eventsSaved: snapshot.events.length,
    rosterSaved: snapshot.roster.length,
  };
}

export async function loadWorkspaceFromFirestore(): Promise<Partial<CloudWorkspaceSnapshot> | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const uid = sanitizeValidId(user.uid, 'user');
  const result: Partial<CloudWorkspaceSnapshot> = {};

  try {
    const configSnap = await getDoc(doc(db, 'workspaceConfigs', uid));
    if (configSnap.exists()) {
      const data = configSnap.data();
      result.workspaceTitle = data.workspaceTitle;
      result.linkedSheetUrl = data.linkedSheetUrl;
      result.linkedCalendarId = data.linkedCalendarId;
      result.linkedDriveFolderId = data.linkedDriveFolderId;
      result.wagesIncludeSuper = data.wagesIncludeSuper;
      result.simTicketClip = data.simTicketClip;
      result.dealClip = data.dealClip;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `workspaceConfigs/${uid}`);
  }

  try {
    const eventsQuery = query(
      collection(db, 'pipelineEvents'),
      where('ownerId', '==', user.uid)
    );
    const eventsSnap = await getDocs(eventsQuery);
    if (!eventsSnap.empty) {
      const loadedEvents = eventsSnap.docs
        .map((d) => d.data())
        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
        .map((d) => ({
          date: String(d.date || 'TBC'),
          title: String(d.title || 'Event'),
          type: (d.type === 'owned' ? 'owned' : 'promoter') as 'owned' | 'promoter',
          format: String(d.format || 'Promoter Hosted'),
          pax: Number(d.pax) || 0,
          barGross: Number(d.barGross) || 0,
          clip: Number(d.clip) || 0,
          ticketRev: Number(d.ticketRev) || 0,
          deposit: Number(d.deposit) || 0,
          wages: Number(d.wages) || 0,
          surplus: Number(d.surplus) || 0,
        }));
      result.events = loadedEvents;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'pipelineEvents');
  }

  try {
    const rosterQuery = query(
      collection(db, 'rosterItems'),
      where('ownerId', '==', user.uid)
    );
    const rosterSnap = await getDocs(rosterQuery);
    if (!rosterSnap.empty) {
      const loadedRoster = rosterSnap.docs
        .map((d) => d.data())
        .filter((d) => !d.templateId || d.templateId === 'active')
        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
        .map((d) => ({
          role: String(d.role || 'Staff'),
          headcount: Number(d.headcount) || 0,
          hours: Number(d.hours) || 0,
          rate: Number(d.rate) || 0,
          hasSuper: Boolean(d.hasSuper),
          notes: String(d.notes || ''),
        }));
      if (loadedRoster.length > 0) {
        result.roster = loadedRoster;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'rosterItems');
  }

  if (
    result.workspaceTitle === undefined &&
    !result.events?.length &&
    !result.roster?.length
  ) {
    return null;
  }

  return result;
}

