<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../seed_data.php';

try {
    $pdo = getDbConnection();
} catch (Throwable $e) {
    sendJson(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
}

function fetchSettingsPayload(PDO $pdo): array
{
    $rosterRows = $pdo->query(
        'SELECT `id`, `role`, `headcount`, `hours`, `rate`, `has_super` AS `hasSuper`, `notes`
         FROM `roster_items` ORDER BY `sort_order` ASC, `id` ASC'
    )->fetchAll();

    $roster = array_map(static fn(array $r): array => [
        'id' => (int)$r['id'],
        'role' => (string)$r['role'],
        'headcount' => (int)$r['headcount'],
        'hours' => (float)$r['hours'],
        'rate' => (float)$r['rate'],
        'hasSuper' => (bool)$r['hasSuper'],
        'notes' => (string)$r['notes'],
    ], $rosterRows);

    $tplRows = $pdo->query(
        'SELECT `template_key` AS `id`, `name`, `updated_label` AS `updatedAt`,
                `include_super` AS `includeSuper`, `is_system` AS `isSystem`, `items_json`
         FROM `roster_templates` ORDER BY `is_system` DESC, `id` DESC'
    )->fetchAll();

    $templates = array_map(static function (array $r): array {
        $items = json_decode((string)$r['items_json'], true);
        return [
            'id' => (string)$r['id'],
            'name' => (string)$r['name'],
            'updatedAt' => (string)$r['updatedAt'],
            'includeSuper' => (bool)$r['includeSuper'],
            'isSystem' => (bool)$r['isSystem'],
            'items' => is_array($items) ? $items : [],
        ];
    }, $tplRows);

    $rawSettings = $pdo->query('SELECT `setting_key`, `setting_value` FROM `venue_settings`')->fetchAll();
    $defaults = getDefaultSettings();
    $map = $defaults;
    foreach ($rawSettings as $row) {
        $decoded = json_decode((string)$row['setting_value'], true);
        if (is_array($decoded)) {
            $map[$row['setting_key']] = $decoded;
        }
    }

    return [
        'roster' => $roster,
        'templates' => $templates,
        'ownedOverheads' => $map['owned_overheads'],
        'wagesIncludeSuper' => (bool)($map['wages_include_super']['enabled'] ?? true),
        'fixedHireFee' => (float)($map['fixed_hire_fee']['amount'] ?? 5000.0),
        'simCogsRate' => (float)($map['sim_cogs_rate']['rate'] ?? 22.0),
    ];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    sendJson(fetchSettingsPayload($pdo));
}

if ($method === 'PUT' || $method === 'POST') {
    $body = readJsonBody();
    $action = (string)($body['action'] ?? '');

    if ($action === 'reset_roster') {
        $pdo->beginTransaction();
        try {
            $pdo->exec('DELETE FROM `roster_items`');
            $stmt = $pdo->prepare(
                'INSERT INTO `roster_items` (`sort_order`, `role`, `headcount`, `hours`, `rate`, `has_super`, `notes`)
                 VALUES (:sortOrder, :role, :headcount, :hours, :rate, :hasSuper, :notes)'
            );
            foreach (getSeedRoster() as $i => $item) {
                $stmt->execute([
                    ':sortOrder' => $i + 1,
                    ':role' => $item['role'],
                    ':headcount' => (int)$item['headcount'],
                    ':hours' => (float)$item['hours'],
                    ':rate' => (float)$item['rate'],
                    ':hasSuper' => $item['hasSuper'] ? 1 : 0,
                    ':notes' => $item['notes'],
                ]);
            }
            upsertVenueSetting($pdo, 'wages_include_super', ['enabled' => true]);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            sendJson(['error' => 'Failed to reset roster: ' . $e->getMessage()], 500);
        }
        sendJson(fetchSettingsPayload($pdo));
    }

    if ($action === 'save_template') {
        $tplKey = substr(trim((string)($body['id'] ?? ('tpl-' . round(microtime(true) * 1000)))), 0, 80);
        $name = substr(trim((string)($body['name'] ?? 'Custom Roster Template')), 0, 180);
        $updatedLabel = substr(trim((string)($body['updatedAt'] ?? date('d/m/Y'))), 0, 40);
        $includeSuper = !empty($body['includeSuper']) ? 1 : 0;
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];

        $stmt = $pdo->prepare(
            'INSERT INTO `roster_templates` (`template_key`, `name`, `updated_label`, `include_super`, `is_system`, `items_json`)
             VALUES (:key, :name, :updated, :super, 0, :items)
             ON DUPLICATE KEY UPDATE
               `name` = VALUES(`name`),
               `updated_label` = VALUES(`updated_label`),
               `include_super` = VALUES(`include_super`),
               `items_json` = VALUES(`items_json`)'
        );
        $stmt->execute([
            ':key' => $tplKey,
            ':name' => $name,
            ':updated' => $updatedLabel,
            ':super' => $includeSuper,
            ':items' => json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
        sendJson(fetchSettingsPayload($pdo));
    }

    if ($action === 'delete_template') {
        $tplKey = trim((string)($body['id'] ?? ''));
        if ($tplKey !== '' && !str_starts_with($tplKey, 'baseline-') && !str_starts_with($tplKey, 'peak-')) {
            $stmt = $pdo->prepare('DELETE FROM `roster_templates` WHERE `template_key` = :key AND `is_system` = 0');
            $stmt->execute([':key' => $tplKey]);
        }
        sendJson(fetchSettingsPayload($pdo));
    }

    // Standard settings / roster update
    if (isset($body['roster']) && is_array($body['roster'])) {
        $pdo->beginTransaction();
        try {
            $pdo->exec('DELETE FROM `roster_items`');
            $stmt = $pdo->prepare(
                'INSERT INTO `roster_items` (`sort_order`, `role`, `headcount`, `hours`, `rate`, `has_super`, `notes`)
                 VALUES (:sortOrder, :role, :headcount, :hours, :rate, :hasSuper, :notes)'
            );
            foreach (array_values($body['roster']) as $idx => $item) {
                if (!is_array($item)) {
                    continue;
                }
                $stmt->execute([
                    ':sortOrder' => $idx + 1,
                    ':role' => substr(trim((string)($item['role'] ?? 'Operational Staff')), 0, 120),
                    ':headcount' => max(0, (int)($item['headcount'] ?? 1)),
                    ':hours' => max(0.0, (float)($item['hours'] ?? 6.0)),
                    ':rate' => max(0.0, (float)($item['rate'] ?? 35.0)),
                    ':hasSuper' => !empty($item['hasSuper']) ? 1 : 0,
                    ':notes' => substr(trim((string)($item['notes'] ?? '')), 0, 255),
                ]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            sendJson(['error' => 'Failed to update roster: ' . $e->getMessage()], 500);
        }
    }

    if (isset($body['ownedOverheads']) && is_array($body['ownedOverheads'])) {
        $o = $body['ownedOverheads'];
        upsertVenueSetting($pdo, 'owned_overheads', [
            'talentCost' => max(0.0, (float)($o['talentCost'] ?? 900)),
            'productionCost' => max(0.0, (float)($o['productionCost'] ?? 450)),
            'marketingCost' => max(0.0, (float)($o['marketingCost'] ?? 400)),
            'otherCost' => max(0.0, (float)($o['otherCost'] ?? 0)),
            'merchantFeePct' => max(0.0, (float)($o['merchantFeePct'] ?? 1.5)),
        ]);
    }

    if (array_key_exists('wagesIncludeSuper', $body)) {
        upsertVenueSetting($pdo, 'wages_include_super', ['enabled' => (bool)$body['wagesIncludeSuper']]);
    }

    if (array_key_exists('fixedHireFee', $body)) {
        upsertVenueSetting($pdo, 'fixed_hire_fee', ['amount' => max(0.0, (float)$body['fixedHireFee'])]);
    }

    if (array_key_exists('simCogsRate', $body)) {
        $rate = round(min(80.0, max(5.0, (float)$body['simCogsRate'])), 1);
        upsertVenueSetting($pdo, 'sim_cogs_rate', ['rate' => $rate]);
    }

    sendJson(fetchSettingsPayload($pdo));
}

sendJson(['error' => 'Method not allowed'], 405);
