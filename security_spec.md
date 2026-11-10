# Security Specification — Trough X Sydney Operating Budget & Workspace

## 1. Data Invariants
1. **Authentication & Email Verification Invariant**: Every read and write operation across `/workspaceConfigs/{configId}`, `/pipelineEvents/{eventId}`, and `/rosterItems/{rosterItemId}` requires an authenticated user (`request.auth != null`) with a verified email (`request.auth.token.email_verified == true`).
2. **Ownership Invariant**: Every document in `/workspaceConfigs`, `/pipelineEvents`, and `/rosterItems` must have `ownerId == request.auth.uid`. Furthermore, for `/workspaceConfigs/{configId}`, `configId` must equal `request.auth.uid`.
3. **Immutability Invariant**: On updates, `ownerId` and `createdAt` must remain strictly unchanged (`incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt`).
4. **Temporal Integrity Invariant**: On creation, `createdAt == request.time && updatedAt == request.time`. On update, `updatedAt == request.time`.
5. **Schema & Volumetric Invariant**: Every document write is validated by a dedicated `isValid[Entity](incoming())` helper enforcing `keys().hasAll(...)` and `keys().hasOnly(...)`, explicit type checks, string `.size()` bounds, regex pattern matching (`^[a-zA-Z0-9_\-]+$`), and numeric range limits.
6. **Zero PII Exposure**: No PII fields (`email`, `phone`, `address`) are stored in any Firestore document.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Identity Spoofing on Create)**: Creating a `pipelineEvents` document with `ownerId: "victim-uid-999"` while signed in as `"attacker-uid-111"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Write)**: Creating a `workspaceConfigs` document where `request.auth.token.email_verified == false`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow / Ghost Field Injection on Create)**: Creating a `rosterItems` document with an extra undeclared field `isAdmin: true`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow / Ghost Field Injection on Update)**: Updating a `pipelineEvents` document with an undeclared field `hacked: "yes"`. -> `PERMISSION_DENIED`
5. **Payload 5 (Owner Takeover on Update)**: Updating `ownerId` on an existing `workspaceConfigs` document to another UID. -> `PERMISSION_DENIED`
6. **Payload 6 (Immutable `createdAt` Tampering)**: Updating `createdAt` on an existing `pipelineEvents` document. -> `PERMISSION_DENIED`
7. **Payload 7 (Client Timestamp Spoofing)**: Creating or updating a `rosterItems` document with a forged `updatedAt` timestamp not equal to `request.time`. -> `PERMISSION_DENIED`
8. **Payload 8 (ID Poisoning Attack)**: Creating `/pipelineEvents/{eventId}` with a 500-character or special-character document ID (`"../../etc/passwd"`). -> `PERMISSION_DENIED`
9. **Payload 9 (Denial-of-Wallet String Overflow)**: Updating `title` in `pipelineEvents` with a 10,000-character string (exceeding `maxLength: 160`). -> `PERMISSION_DENIED`
10. **Payload 10 (Value Poisoning / Type Confusion)**: Updating `pax` in `pipelineEvents` with a string `"300"` or negative number `-50`. -> `PERMISSION_DENIED`
11. **Payload 11 (Cross-Tenant Read / Get)**: Reading `/workspaceConfigs/other-user-uid` when authenticated as `attacker-uid`. -> `PERMISSION_DENIED`
12. **Payload 12 (Unscoped List Query Scraping)**: Executing an unconstrained `list` query on `/pipelineEvents` without filtering `where('ownerId', '==', request.auth.uid)`. -> `PERMISSION_DENIED`
