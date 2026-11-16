<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

/**
 * REST API for Nocturn Ledger Forthcoming & Programmed Events
 * GET    /api/events.php       -> List all events
 * POST   /api/events.php       -> Create event (or reset baseline if action === 'reset')
 * PUT    /api/events.php       -> Update full event by id
 * PATCH  /api/events.php       -> Update event_date (drag-and-drop move) by id
 * DELETE /api/events.php?id=1  -> Delete event by id
 */

function mapEventRow(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'date' => (string) $row['event_date'],
        'title' => (string) $row['title'],
        'type' => (string) $row['type'],
        'format' => (string) $row['format'],
        'pax' => (int) $row['pax'],
        'barGross' => (float) $row['bar_gross'],
        'clip' => (float) $row['clip'],
        'ticketRev' => (float) $row['ticket_rev'],
        'deposit' => (float) $row['deposit'],
        'wages' => (float) $row['wages'],
        'surplus' => (float) $row['surplus'],
    ];
}

function validateEventPayload(array $body): array
{
    $date = trim((string) ($body['date'] ?? ''));
    $title = trim((string) ($body['title'] ?? ''));
    $type = ($body['type'] ?? 'owned') === 'promoter' ? 'promoter' : 'owned';
    $format = trim((string) ($body['format'] ?? 'In-House Hero Night'));
    $pax = max(0, (int) ($body['pax'] ?? 0));
    $barGross = (float) ($body['barGross'] ?? 0);
    $clip = (float) ($body['clip'] ?? 0);
    $ticketRev = (float) ($body['ticketRev'] ?? 0);
    $deposit = (float) ($body['deposit'] ?? 0);
    $wages = (float) ($body['wages'] ?? 0);
    $surplus = (float) ($body['surplus'] ?? 0);

    if ($date === '' || $title === '') {
        sendJson(['error' => 'Both event date and title are required.'], 422);
    }

    return [
        'event_date' => mb_substr($date, 0, 10),
        'title' => mb_substr($title, 0, 180),
        'type' => $type,
        'format' => mb_substr($format !== '' ? $format : 'In-House Hero Night', 0, 120),
        'pax' => $pax,
        'bar_gross' => round($barGross, 2),
        'clip' => round($clip, 2),
        'ticket_rev' => round($ticketRev, 2),
        'deposit' => round($deposit, 2),
        'wages' => round($wages, 2),
        'surplus' => round($surplus, 2),
    ];
}

try {
    $pdo = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $stmt = $pdo->query(
            'SELECT id, event_date, title, type, format, pax, bar_gross, clip, ticket_rev, deposit, wages, surplus
             FROM events
             ORDER BY STR_TO_DATE(event_date, "%d/%m/%Y") ASC, id ASC'
        );
        $rows = array_map('mapEventRow', $stmt->fetchAll());
        sendJson(['events' => $rows]);
    }

    if ($method === 'POST') {
        $body = readJsonBody();

        if (($body['action'] ?? '') === 'reset') {
            $defaults = [
                ['14/11/2026', 'ACTION by Thick N Juicy', 'promoter', 'Promoter Hosted', 300, 10000, 1500, 0, 0, 4060, 4185],
                ['21/11/2026', 'THROBB by brute.club', 'promoter', 'Promoter Hosted', 280, 8000, 1400, 0, 0, 3860, 3125],
                ['28/11/2026', 'Red Rave by POOF DOOF', 'promoter', 'Promoter Hosted', 300, 10000, 1500, 0, 0, 4060, 4185],
                ['04/12/2026', 'BUSH (2nd Edition)', 'promoter', 'Promoter Hosted', 250, 7000, 1250, 0, 550, 3560, 2950],
                ['12/12/2026', 'THROBB Festive Edition', 'promoter', 'Promoter Hosted', 280, 8000, 1400, 0, 0, 3860, 3125],
                ['19/12/2026', 'Nocturn Noir: Summer Edition', 'owned', 'In-House Hero Night', 240, 6500, 0, 7200, 0, 3500, 6150],
                ['31/12/2026', 'NYE Lock-In 2026/27', 'owned', 'In-House Hero Night', 300, 12500, 0, 12000, 0, 4200, 12850],
                ['16/01/2027', 'Bareback Cabaret Launch', 'owned', 'In-House Daytime', 160, 4800, 0, 3200, 0, 2800, 2950],
                ['30/01/2027', 'LNQD (Late Night Queer Dance)', 'promoter', 'Promoter Hosted', 250, 7000, 1250, 0, 0, 3560, 2400],
                ['13/02/2027', 'Mardi Gras Warmup: Harbor Cruise', 'owned', 'In-House Hero Night', 300, 11000, 0, 9000, 0, 4100, 9400],
                ['27/02/2027', 'Crown St Mardi Gras Festival Main', 'owned', 'In-House Festival', 300, 15000, 0, 15000, 0, 4400, 15650],
                ['06/03/2027', 'FK CLUB Recovery', 'owned', 'In-House Recovery', 180, 5500, 0, 4500, 0, 2800, 4125],
            ];
            $pdo->beginTransaction();
            $pdo->exec('DELETE FROM events');
            $ins = $pdo->prepare(
                'INSERT INTO events (event_date, title, type, format, pax, bar_gross, clip, ticket_rev, deposit, wages, surplus)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            foreach ($defaults as $row) {
                $ins->execute($row);
            }
            $pdo->commit();
            sendJson(['ok' => true, 'message' => 'Restored baseline schedule']);
        }

        $data = validateEventPayload($body);
        $stmt = $pdo->prepare(
            'INSERT INTO events (event_date, title, type, format, pax, bar_gross, clip, ticket_rev, deposit, wages, surplus)
             VALUES (:event_date, :title, :type, :format, :pax, :bar_gross, :clip, :ticket_rev, :deposit, :wages, :surplus)'
        );
        $stmt->execute($data);
        $newId = (int) $pdo->lastInsertId();

        $fetch = $pdo->prepare('SELECT * FROM events WHERE id = ?');
        $fetch->execute([$newId]);
        sendJson(['event' => mapEventRow($fetch->fetch())], 201);
    }

    if ($method === 'PUT') {
        $body = readJsonBody();
        $id = (int) ($body['id'] ?? 0);
        if ($id <= 0) {
            sendJson(['error' => 'Valid event id is required.'], 422);
        }

        $data = validateEventPayload($body);
        $data['id'] = $id;
        $stmt = $pdo->prepare(
            'UPDATE events
             SET event_date = :event_date,
                 title = :title,
                 type = :type,
                 format = :format,
                 pax = :pax,
                 bar_gross = :bar_gross,
                 clip = :clip,
                 ticket_rev = :ticket_rev,
                 deposit = :deposit,
                 wages = :wages,
                 surplus = :surplus
             WHERE id = :id'
        );
        $stmt->execute($data);

        $fetch = $pdo->prepare('SELECT * FROM events WHERE id = ?');
        $fetch->execute([$id]);
        $row = $fetch->fetch();
        if (!$row) {
            sendJson(['error' => 'Event not found.'], 404);
        }
        sendJson(['event' => mapEventRow($row)]);
    }

    if ($method === 'PATCH') {
        $body = readJsonBody();
        $id = (int) ($body['id'] ?? 0);
        $newDate = trim((string) ($body['date'] ?? ''));
        if ($id <= 0 || $newDate === '') {
            sendJson(['error' => 'Valid id and date are required.'], 422);
        }
        $stmt = $pdo->prepare('UPDATE events SET event_date = ? WHERE id = ?');
        $stmt->execute([mb_substr($newDate, 0, 10), $id]);
        sendJson(['ok' => true, 'id' => $id, 'date' => $newDate]);
    }

    if ($method === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            $body = readJsonBody();
            $id = (int) ($body['id'] ?? 0);
        }
        if ($id <= 0) {
            sendJson(['error' => 'Valid event id is required.'], 422);
        }
        $stmt = $pdo->prepare('DELETE FROM events WHERE id = ?');
        $stmt->execute([$id]);
        sendJson(['ok' => true, 'deletedId' => $id]);
    }

    sendJson(['error' => 'Method not allowed'], 405);
} catch (Throwable $e) {
    sendJson(['error' => $e->getMessage()], 500);
}
