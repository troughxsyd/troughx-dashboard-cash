<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../seed_data.php';

try {
    $pdo = getDbConnection();
} catch (Throwable $e) {
    sendJson(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function fetchAllEventsList(PDO $pdo): array
{
    $rows = $pdo->query(
        'SELECT `id`, `event_date` AS `date`, `title`, `type`, `format`, `pax`,
                `bar_gross` AS `barGross`, `clip`, `ticket_rev` AS `ticketRev`,
                `deposit`, `wages`, `surplus`
         FROM `events` ORDER BY `id` ASC'
    )->fetchAll();

    return array_map(static fn(array $r): array => [
        'id' => (int)$r['id'],
        'date' => (string)$r['date'],
        'title' => (string)$r['title'],
        'type' => $r['type'] === 'promoter' ? 'promoter' : 'owned',
        'format' => (string)$r['format'],
        'pax' => (int)$r['pax'],
        'barGross' => (float)$r['barGross'],
        'clip' => (float)$r['clip'],
        'ticketRev' => (float)$r['ticketRev'],
        'deposit' => (float)$r['deposit'],
        'wages' => (float)$r['wages'],
        'surplus' => (float)$r['surplus'],
    ], $rows);
}

function insertEventRows(PDO $pdo, array $eventsList): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO `events`
         (`event_date`, `title`, `type`, `format`, `pax`, `bar_gross`, `clip`, `ticket_rev`, `deposit`, `wages`, `surplus`)
         VALUES (:date, :title, :type, :format, :pax, :barGross, :clip, :ticketRev, :deposit, :wages, :surplus)'
    );
    foreach ($eventsList as $ev) {
        if (!is_array($ev)) {
            continue;
        }
        $type = ($ev['type'] ?? 'owned') === 'promoter' ? 'promoter' : 'owned';
        $stmt->execute([
            ':date' => substr(trim((string)($ev['date'] ?? 'TBC')), 0, 10),
            ':title' => substr(trim((string)($ev['title'] ?? 'Untitled Trough X Event')), 0, 180),
            ':type' => $type,
            ':format' => substr(trim((string)($ev['format'] ?? 'Owned Hero Night')), 0, 120),
            ':pax' => max(0, (int)($ev['pax'] ?? 200)),
            ':barGross' => (float)($ev['barGross'] ?? 0),
            ':clip' => (float)($ev['clip'] ?? 0),
            ':ticketRev' => (float)($ev['ticketRev'] ?? 0),
            ':deposit' => (float)($ev['deposit'] ?? 0),
            ':wages' => (float)($ev['wages'] ?? 0),
            ':surplus' => (float)($ev['surplus'] ?? 0),
        ]);
    }
}

if ($method === 'GET') {
    sendJson(['events' => fetchAllEventsList($pdo)]);
}

if ($method === 'POST') {
    $body = readJsonBody();
    $action = (string)($body['action'] ?? 'create');

    if ($action === 'reset') {
        $pdo->beginTransaction();
        try {
            $pdo->exec('DELETE FROM `events`');
            insertEventRows($pdo, getSeedEvents());
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            sendJson(['error' => 'Failed to reset events: ' . $e->getMessage()], 500);
        }
        sendJson(['events' => fetchAllEventsList($pdo), 'message' => 'Restored 12 baseline events']);
    }

    if ($action === 'replace_all') {
        $incoming = is_array($body['events'] ?? null) ? $body['events'] : [];
        $pdo->beginTransaction();
        try {
            $pdo->exec('DELETE FROM `events`');
            insertEventRows($pdo, $incoming);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            sendJson(['error' => 'Failed to replace events: ' . $e->getMessage()], 500);
        }
        sendJson(['events' => fetchAllEventsList($pdo), 'message' => 'Schedule replaced in MySQL']);
    }

    if ($action === 'merge') {
        $incoming = is_array($body['events'] ?? null) ? $body['events'] : [];
        $existing = fetchAllEventsList($pdo);
        $seen = [];
        foreach ($existing as $ex) {
            $seen[$ex['date'] . '::' . $ex['title']] = true;
        }
        $toInsert = [];
        foreach ($incoming as $ev) {
            if (!is_array($ev)) {
                continue;
            }
            $k = trim((string)($ev['date'] ?? 'TBC')) . '::' . trim((string)($ev['title'] ?? ''));
            if (!isset($seen[$k])) {
                $seen[$k] = true;
                $toInsert[] = $ev;
            }
        }
        if (count($toInsert) > 0) {
            insertEventRows($pdo, $toInsert);
        }
        sendJson([
            'events' => fetchAllEventsList($pdo),
            'addedCount' => count($toInsert),
            'message' => 'Merged ' . count($toInsert) . ' event(s) into MySQL',
        ]);
    }

    // Create single event
    insertEventRows($pdo, [$body]);
    $createdId = (int)$pdo->lastInsertId();
    sendJson([
        'id' => $createdId,
        'events' => fetchAllEventsList($pdo),
        'message' => 'Event created',
    ], 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = readJsonBody();
    $id = (int)($body['id'] ?? $_GET['id'] ?? 0);
    if ($id <= 0) {
        sendJson(['error' => 'Missing valid event id'], 400);
    }

    if ($method === 'PATCH' || ($body['action'] ?? '') === 'move_date') {
        $newDate = substr(trim((string)($body['date'] ?? '')), 0, 10);
        if ($newDate === '') {
            sendJson(['error' => 'Missing new date'], 400);
        }
        $stmt = $pdo->prepare('UPDATE `events` SET `event_date` = :date WHERE `id` = :id');
        $stmt->execute([':date' => $newDate, ':id' => $id]);
        sendJson(['events' => fetchAllEventsList($pdo), 'message' => 'Event date updated']);
    }

    $type = ($body['type'] ?? 'owned') === 'promoter' ? 'promoter' : 'owned';
    $stmt = $pdo->prepare(
        'UPDATE `events`
         SET `event_date` = :date,
             `title` = :title,
             `type` = :type,
             `format` = :format,
             `pax` = :pax,
             `bar_gross` = :barGross,
             `clip` = :clip,
             `ticket_rev` = :ticketRev,
             `deposit` = :deposit,
             `wages` = :wages,
             `surplus` = :surplus
         WHERE `id` = :id'
    );
    $stmt->execute([
        ':id' => $id,
        ':date' => substr(trim((string)($body['date'] ?? 'TBC')), 0, 10),
        ':title' => substr(trim((string)($body['title'] ?? 'Untitled Trough X Event')), 0, 180),
        ':type' => $type,
        ':format' => substr(trim((string)($body['format'] ?? 'Owned Hero Night')), 0, 120),
        ':pax' => max(0, (int)($body['pax'] ?? 200)),
        ':barGross' => (float)($body['barGross'] ?? 0),
        ':clip' => (float)($body['clip'] ?? 0),
        ':ticketRev' => (float)($body['ticketRev'] ?? 0),
        ':deposit' => (float)($body['deposit'] ?? 0),
        ':wages' => (float)($body['wages'] ?? 0),
        ':surplus' => (float)($body['surplus'] ?? 0),
    ]);

    sendJson(['events' => fetchAllEventsList($pdo), 'message' => 'Event updated']);
}

if ($method === 'DELETE') {
    $body = readJsonBody();
    $id = (int)($body['id'] ?? $_GET['id'] ?? 0);
    if ($id <= 0) {
        sendJson(['error' => 'Missing valid event id'], 400);
    }
    $stmt = $pdo->prepare('DELETE FROM `events` WHERE `id` = :id');
    $stmt->execute([':id' => $id]);
    sendJson(['events' => fetchAllEventsList($pdo), 'message' => 'Event deleted']);
}

sendJson(['error' => 'Method not allowed'], 405);
