<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../seed_data.php';

try {
    $pdo = getDbConnection();
} catch (Throwable $e) {
    sendJson(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
}

function fetchInventoryPayload(PDO $pdo): array
{
    $invRows = $pdo->query(
        'SELECT `clover_id` AS `cloverId`, `name`, `category`, `price`,
                `live_clover_stock` AS `liveCloverStock`, `expected_stock` AS `expectedStock`,
                `bottle_size_ml` AS `bottleSizeMl`, `pour_size_ml` AS `pourSizeMl`,
                `recipe_deductions` AS `recipeDeductions`, `actual_count` AS `actualCount`,
                `unit_cost` AS `unitCost`, `cost_verified` AS `costVerified`
         FROM `clover_inventory` ORDER BY `sort_order` ASC, `clover_id` ASC'
    )->fetchAll();

    $inventory = array_map(static fn(array $r): array => [
        'cloverId' => (string)$r['cloverId'],
        'name' => (string)$r['name'],
        'category' => (string)$r['category'],
        'price' => (float)$r['price'],
        'liveCloverStock' => (float)$r['liveCloverStock'],
        'expectedStock' => (float)$r['expectedStock'],
        'bottleSizeMl' => $r['bottleSizeMl'] !== null ? (float)$r['bottleSizeMl'] : null,
        'pourSizeMl' => $r['pourSizeMl'] !== null ? (float)$r['pourSizeMl'] : null,
        'recipeDeductions' => (float)$r['recipeDeductions'],
        'actualCount' => $r['actualCount'] !== null ? (float)$r['actualCount'] : null,
        'unitCost' => (float)$r['unitCost'],
        'costVerified' => (bool)$r['costVerified'],
    ], $invRows);

    $purRows = $pdo->query(
        'SELECT `purchase_key` AS `id`, `purchase_date` AS `date`, `supplier`,
                `invoice_ref` AS `invoiceRef`, `amount`, `notes`
         FROM `inventory_purchases` ORDER BY `id` DESC'
    )->fetchAll();

    $purchases = array_map(static fn(array $r): array => [
        'id' => (string)$r['id'],
        'date' => (string)$r['date'],
        'supplier' => (string)$r['supplier'],
        'invoiceRef' => (string)$r['invoiceRef'],
        'amount' => (float)$r['amount'],
        'notes' => (string)$r['notes'],
    ], $purRows);

    $rawSettings = $pdo->query(
        "SELECT `setting_key`, `setting_value` FROM `venue_settings`
         WHERE `setting_key` IN ('inventory_opening_value', 'inventory_period_sales', 'sim_cogs_rate')"
    )->fetchAll();
    $openingStockValue = 3850.0;
    $periodBarSales = 10000.0;
    $simCogsRate = 22.0;

    foreach ($rawSettings as $row) {
        $val = json_decode((string)$row['setting_value'], true);
        if (!is_array($val)) {
            continue;
        }
        if ($row['setting_key'] === 'inventory_opening_value') {
            $openingStockValue = (float)($val['amount'] ?? 3850.0);
        } elseif ($row['setting_key'] === 'inventory_period_sales') {
            $periodBarSales = (float)($val['amount'] ?? 10000.0);
        } elseif ($row['setting_key'] === 'sim_cogs_rate') {
            $simCogsRate = (float)($val['rate'] ?? 22.0);
        }
    }

    return [
        'inventory' => $inventory,
        'purchases' => $purchases,
        'openingStockValue' => $openingStockValue,
        'periodBarSales' => $periodBarSales,
        'simCogsRate' => $simCogsRate,
    ];
}

function replaceInventoryItems(PDO $pdo, array $items): void
{
    $pdo->beginTransaction();
    try {
        $pdo->exec('DELETE FROM `clover_inventory`');
        $stmt = $pdo->prepare(
            'INSERT INTO `clover_inventory`
             (`clover_id`, `sort_order`, `name`, `category`, `price`, `live_clover_stock`,
              `expected_stock`, `bottle_size_ml`, `pour_size_ml`, `recipe_deductions`,
              `actual_count`, `unit_cost`, `cost_verified`)
             VALUES (:cloverId, :sortOrder, :name, :category, :price, :liveStock,
                     :expectedStock, :bottleMl, :pourMl, :recipeDed, :actualCount, :unitCost, :verified)'
        );
        foreach (array_values($items) as $idx => $it) {
            if (!is_array($it)) {
                continue;
            }
            $stmt->execute([
                ':cloverId' => substr(trim((string)($it['cloverId'] ?? ('SKU-' . ($idx + 1)))), 0, 32),
                ':sortOrder' => $idx + 1,
                ':name' => substr(trim((string)($it['name'] ?? 'Unnamed Item')), 0, 180),
                ':category' => substr(trim((string)($it['category'] ?? 'Unassigned')), 0, 120),
                ':price' => (float)($it['price'] ?? 0),
                ':liveStock' => (float)($it['liveCloverStock'] ?? 0),
                ':expectedStock' => (float)($it['expectedStock'] ?? 0),
                ':bottleMl' => isset($it['bottleSizeMl']) && $it['bottleSizeMl'] !== '' && $it['bottleSizeMl'] !== null ? (float)$it['bottleSizeMl'] : null,
                ':pourMl' => isset($it['pourSizeMl']) && $it['pourSizeMl'] !== '' && $it['pourSizeMl'] !== null ? (float)$it['pourSizeMl'] : null,
                ':recipeDed' => (float)($it['recipeDeductions'] ?? 0),
                ':actualCount' => isset($it['actualCount']) && $it['actualCount'] !== '' && $it['actualCount'] !== null ? (float)$it['actualCount'] : null,
                ':unitCost' => max(0.0, (float)($it['unitCost'] ?? 0)),
                ':verified' => !empty($it['costVerified']) ? 1 : 0,
            ]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    sendJson(fetchInventoryPayload($pdo));
}

if ($method === 'POST') {
    $body = readJsonBody();
    $action = (string)($body['action'] ?? 'add_purchase');

    if ($action === 'reset_inventory') {
        try {
            replaceInventoryItems($pdo, getSeedInventoryItems());
        } catch (Throwable $e) {
            sendJson(['error' => 'Failed to reset inventory: ' . $e->getMessage()], 500);
        }
        sendJson(fetchInventoryPayload($pdo));
    }

    if ($action === 'bulk_items' && isset($body['items']) && is_array($body['items'])) {
        try {
            replaceInventoryItems($pdo, $body['items']);
        } catch (Throwable $e) {
            sendJson(['error' => 'Failed to save inventory list: ' . $e->getMessage()], 500);
        }
        sendJson(fetchInventoryPayload($pdo));
    }

    // Add wholesale liquor invoice purchase
    $amount = (float)($body['amount'] ?? 0);
    if ($amount <= 0) {
        sendJson(['error' => 'Purchase amount must be greater than 0'], 400);
    }
    $purchaseKey = substr(trim((string)($body['id'] ?? ('pur-' . round(microtime(true) * 1000)))), 0, 64);
    $stmt = $pdo->prepare(
        'INSERT INTO `inventory_purchases` (`purchase_key`, `purchase_date`, `supplier`, `invoice_ref`, `amount`, `notes`)
         VALUES (:key, :date, :supplier, :inv, :amount, :notes)'
    );
    $stmt->execute([
        ':key' => $purchaseKey,
        ':date' => substr(trim((string)($body['date'] ?? date('d/m/Y'))), 0, 20),
        ':supplier' => substr(trim((string)($body['supplier'] ?? 'Liquor Wholesaler')), 0, 160),
        ':inv' => substr(trim((string)($body['invoiceRef'] ?? 'INV')), 0, 80),
        ':amount' => $amount,
        ':notes' => substr(trim((string)($body['notes'] ?? '')), 0, 255),
    ]);
    sendJson(fetchInventoryPayload($pdo), 201);
}

if ($method === 'PUT') {
    $body = readJsonBody();
    $action = (string)($body['action'] ?? 'update_item');

    if ($action === 'update_reconciliation') {
        if (array_key_exists('openingStockValue', $body)) {
            upsertVenueSetting($pdo, 'inventory_opening_value', ['amount' => max(0.0, (float)$body['openingStockValue'])]);
        }
        if (array_key_exists('periodBarSales', $body)) {
            upsertVenueSetting($pdo, 'inventory_period_sales', ['amount' => max(0.0, (float)$body['periodBarSales'])]);
        }
        if (array_key_exists('simCogsRate', $body)) {
            $rate = round(min(80.0, max(5.0, (float)$body['simCogsRate'])), 1);
            upsertVenueSetting($pdo, 'sim_cogs_rate', ['rate' => $rate]);
        }
        sendJson(fetchInventoryPayload($pdo));
    }

    if ($action === 'bulk_items' && isset($body['items']) && is_array($body['items'])) {
        try {
            replaceInventoryItems($pdo, $body['items']);
        } catch (Throwable $e) {
            sendJson(['error' => 'Failed to save inventory items: ' . $e->getMessage()], 500);
        }
        sendJson(fetchInventoryPayload($pdo));
    }

    if ($action === 'reset_inventory') {
        try {
            replaceInventoryItems($pdo, getSeedInventoryItems());
        } catch (Throwable $e) {
            sendJson(['error' => 'Failed to reset inventory: ' . $e->getMessage()], 500);
        }
        sendJson(fetchInventoryPayload($pdo));
    }

    // Single item field update
    $cloverId = trim((string)($body['cloverId'] ?? ''));
    if ($cloverId === '') {
        sendJson(['error' => 'Missing cloverId'], 400);
    }

    $fields = [];
    $params = [':cloverId' => $cloverId];

    if (array_key_exists('bottleSizeMl', $body)) {
        $fields[] = '`bottle_size_ml` = :bottleSizeMl';
        $params[':bottleSizeMl'] = ($body['bottleSizeMl'] === null || $body['bottleSizeMl'] === '')
            ? null
            : max(0.0, (float)$body['bottleSizeMl']);
    }
    if (array_key_exists('pourSizeMl', $body)) {
        $fields[] = '`pour_size_ml` = :pourSizeMl';
        $params[':pourSizeMl'] = ($body['pourSizeMl'] === null || $body['pourSizeMl'] === '')
            ? null
            : max(0.0, (float)$body['pourSizeMl']);
    }
    if (array_key_exists('actualCount', $body)) {
        $fields[] = '`actual_count` = :actualCount';
        $params[':actualCount'] = ($body['actualCount'] === null || $body['actualCount'] === '')
            ? null
            : (float)$body['actualCount'];
    }
    if (array_key_exists('unitCost', $body)) {
        $fields[] = '`unit_cost` = :unitCost';
        $params[':unitCost'] = max(0.0, (float)$body['unitCost']);
    }
    if (array_key_exists('costVerified', $body)) {
        $fields[] = '`cost_verified` = :costVerified';
        $params[':costVerified'] = !empty($body['costVerified']) ? 1 : 0;
    }

    if (count($fields) > 0) {
        $sql = 'UPDATE `clover_inventory` SET ' . implode(', ', $fields) . ' WHERE `clover_id` = :cloverId';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    sendJson(fetchInventoryPayload($pdo));
}

if ($method === 'DELETE') {
    $body = readJsonBody();
    $purchaseKey = trim((string)($body['id'] ?? $_GET['id'] ?? ''));
    if ($purchaseKey === '') {
        sendJson(['error' => 'Missing purchase id'], 400);
    }
    $stmt = $pdo->prepare('DELETE FROM `inventory_purchases` WHERE `purchase_key` = :key');
    $stmt->execute([':key' => $purchaseKey]);
    sendJson(fetchInventoryPayload($pdo));
}

sendJson(['error' => 'Method not allowed'], 405);
