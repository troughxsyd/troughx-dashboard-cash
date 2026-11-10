/**
 * Firestore Security Rules Test Specification
 * Verifies that all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'create' | 'update' | 'get' | 'list';
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Create',
    collection: 'pipelineEvents',
    docId: 'evt_1',
    operation: 'create',
    auth: { uid: 'attacker_1', email_verified: true },
    payload: {
      ownerId: 'victim_99',
      date: '14/11/2026',
      title: 'Spoofed Event',
      type: 'promoter',
      format: 'Promoter Hosted',
      pax: 200,
      barGross: 5000,
      clip: 1000,
      ticketRev: 0,
      deposit: 550,
      wages: 1770,
      surplus: 3000,
      sortOrder: 0,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    collection: 'workspaceConfigs',
    docId: 'user_unverified',
    operation: 'create',
    auth: { uid: 'user_unverified', email_verified: false },
    payload: {
      ownerId: 'user_unverified',
      workspaceTitle: 'Trough X',
      linkedSheetUrl: '',
      linkedCalendarId: 'brent@troughxsydney.com',
      linkedDriveFolderId: '',
      wagesIncludeSuper: true,
      simTicketClip: 5,
      dealClip: 5,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Ghost Field Injection on Create',
    collection: 'rosterItems',
    docId: 'role_1',
    operation: 'create',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      ownerId: 'user_1',
      templateId: 'active',
      templateName: 'Active Roster',
      role: 'Venue Duty Manager',
      headcount: 1,
      hours: 6,
      rate: 55,
      hasSuper: true,
      notes: 'Standard shift',
      sortOrder: 0,
      isAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Ghost Field Injection on Update',
    collection: 'pipelineEvents',
    docId: 'evt_1',
    operation: 'update',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      pax: 250,
      ghostField: 'injected',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Owner Takeover on Update',
    collection: 'workspaceConfigs',
    docId: 'user_1',
    operation: 'update',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      ownerId: 'attacker_2',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Immutable createdAt Tampering',
    collection: 'pipelineEvents',
    docId: 'evt_1',
    operation: 'update',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Client Timestamp Spoofing',
    collection: 'rosterItems',
    docId: 'role_1',
    operation: 'update',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      rate: 60,
      updatedAt: '2099-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'ID Poisoning Attack',
    collection: 'pipelineEvents',
    docId: 'invalid/id$with*special!chars',
    operation: 'create',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      ownerId: 'user_1',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Denial-of-Wallet String Overflow',
    collection: 'pipelineEvents',
    docId: 'evt_1',
    operation: 'update',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      title: 'X'.repeat(5000),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Value Poisoning / Negative Attendance',
    collection: 'pipelineEvents',
    docId: 'evt_1',
    operation: 'update',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      pax: -50,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Cross-Tenant Get Request',
    collection: 'workspaceConfigs',
    docId: 'victim_uid',
    operation: 'get',
    auth: { uid: 'attacker_uid', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unscoped List Query Scraping',
    collection: 'pipelineEvents',
    docId: '*',
    operation: 'list',
    auth: { uid: 'attacker_uid', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
