<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

/**
 * REST API for IFA Staffing Roster & Venue Operating Settings
 * GET /api/settings.php -> Fetch roster_items + venue_settings
 * PUT /api/settings.php -> Replace roster_items and/or update venue_settings
 */

try {
    $pdo = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $rosterStmt = $pdo->query(
            'SELECT id, sort_order, role, headcount, hours, rate, has_super, notes
             FROM roster_items
             ORDER BY sort_order ASC, id ASC'
        );
        $roster = array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'role' => (string) $row['role'],
                'headcount' => (int) $row['headcount'],
                'hours' => (float) $row['hours'],
                'rate' => (float) $row['rate'],
                'hasSuper' => (bool) $row['has_super'],
                'notes' => (string) $row['notes'],
            ];
        }, $rosterStmt->fetchAll());

        $settingsStmt = $pdo->query('SELECT setting_key, setting_value FROM venue_settings');
        $settings = [];
        foreach ($settingsStmt->fetchAll() as $sRow) {
            $settings[$sRow['setting_key']] = json_decode((string) $sRow['setting_value'], true);
        }

        sendJson([
            'roster' => $roster,
            'ownedOverheads' => $settings['owned_overheads'] ?? [
                'talentCost' => 900,
                'productionCost' => 450,
                'marketingCost' => 400,
                'otherCost' => 0,
                'merchantFeePct' => 1.5,
            ],
            'wagesIncludeSuper' => (bool) ($settings['wages_include_super']['enabled'] ?? true),
            'fixedHireFee' => (float) ($settings['fixed_hire_fee']['amount'] ?? 5000),
        ]);
    }

    if ($method === 'PUT' || $method === 'POST') {
        $body = readJsonBody();
        $pdo->beginTransaction();

        if (isset($body['roster']) && is_array($body['roster'])) {
            $pdo->exec('DELETE FROM roster_items');
            $ins = $pdo->prepare(
                'INSERT INTO roster_items (sort_order, role, headcount, hours, rate, has_super, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            foreach (array_values($body['roster']) as $idx => $item) {
                $ins->execute([
                    $idx + 1,
                    mb_substr((string) ($item['role'] ?? 'Staff'), 0, 120),
                    max(0, (int) ($item['headcount'] ?? 1)),
                    max(0, (float) ($item['hours'] ?? 6.0)),
                    max(0, (float) ($item['rate'] ?? 35.0)),
                    !empty($item['hasSuper']) ? 1 : 0,
                    mb_substr((string) ($item['notes'] ?? ''), 0, 255),
                ]);
            }
        }

        $upsert = $pdo->prepare(
            'INSERT INTO venue_settings (setting_key, setting_value) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
        );

        if (isset($body['ownedOverheads']) && is_array($body['ownedOverheads'])) {
            $upsert->execute([
                'owned_overheads',
                json_encode([
                    'talentCost' => max(0, (float) ($body['ownedOverheads']['talentCost'] ?? 900)),
                    'productionCost' => max(0, (float) ($body['ownedOverheads']['productionCost'] ?? 450)),
                    'marketingCost' => max(0, (float) ($body['ownedOverheads']['marketingCost'] ?? 400)),
                    'otherCost' => max(0, (float) ($body['ownedOverheads']['otherCost'] ?? 0)),
                    'merchantFeePct' => max(0, (float) ($body['ownedOverheads']['merchantFeePct'] ?? 1.5)),
                ]),
            ]);
        }

        if (array_key_exists('wagesIncludeSuper', $body)) {
            $upsert->execute([
                'wages_include_super',
                json_encode(['enabled' => (bool) $body['wagesIncludeSuper']]),
            ]);
        }

        if (array_key_exists('fixedHireFee', $body)) {
            $upsert->execute([
                'fixed_hire_fee',
                json_encode(['amount' => max(0, (float) $body['fixedHireFee'])]),
            ]);
        }

        $pdo->commit();
        sendJson(['ok' => true]);
    }

    sendJson(['error' => 'Method not allowed'], 405);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJson(['error' => $e->getMessage()], 500);
}
