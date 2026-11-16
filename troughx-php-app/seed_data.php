<?php
declare(strict_types=1);

/**
 * Shared Seed Data matching React Baseline (12 Events, 5 IFA Roles, 2 Templates, 97 Clover Inventory SKUs)
 */

function getSeedEvents(): array
{
    return [
        [
            'date' => '14/11/2026',
            'title' => 'ACTION by Thick N Juicy',
            'type' => 'promoter',
            'format' => 'Promoter Hosted',
            'pax' => 300,
            'barGross' => 10000.0,
            'clip' => 1500.0,
            'ticketRev' => 0.0,
            'deposit' => 0.0,
            'wages' => 4060.0,
            'surplus' => 4185.0,
        ],
        [
            'date' => '21/11/2026',
            'title' => 'THROBB by brute.club',
            'type' => 'promoter',
            'format' => 'Promoter Hosted',
            'pax' => 280,
            'barGross' => 8000.0,
            'clip' => 1400.0,
            'ticketRev' => 0.0,
            'deposit' => 0.0,
            'wages' => 3860.0,
            'surplus' => 3125.0,
        ],
        [
            'date' => '28/11/2026',
            'title' => 'Red Rave by POOF DOOF',
            'type' => 'promoter',
            'format' => 'Promoter Hosted',
            'pax' => 300,
            'barGross' => 10000.0,
            'clip' => 1500.0,
            'ticketRev' => 0.0,
            'deposit' => 0.0,
            'wages' => 4060.0,
            'surplus' => 4185.0,
        ],
        [
            'date' => '04/12/2026',
            'title' => 'BUSH (2nd Edition)',
            'type' => 'promoter',
            'format' => 'Promoter Hosted',
            'pax' => 250,
            'barGross' => 7000.0,
            'clip' => 1250.0,
            'ticketRev' => 0.0,
            'deposit' => 550.0,
            'wages' => 3560.0,
            'surplus' => 2950.0,
        ],
        [
            'date' => '12/12/2026',
            'title' => 'THROBB Festive Edition',
            'type' => 'promoter',
            'format' => 'Promoter Hosted',
            'pax' => 280,
            'barGross' => 8000.0,
            'clip' => 1400.0,
            'ticketRev' => 0.0,
            'deposit' => 0.0,
            'wages' => 3860.0,
            'surplus' => 3125.0,
        ],
        [
            'date' => '19/12/2026',
            'title' => 'Trough Noir: Summer Edition',
            'type' => 'owned',
            'format' => 'Owned Hero Night',
            'pax' => 240,
            'barGross' => 6500.0,
            'clip' => 0.0,
            'ticketRev' => 7200.0,
            'deposit' => 0.0,
            'wages' => 3500.0,
            'surplus' => 6150.0,
        ],
        [
            'date' => '31/12/2026',
            'title' => 'NYE Lock-In 2026/27',
            'type' => 'owned',
            'format' => 'Owned Hero Night',
            'pax' => 300,
            'barGross' => 12500.0,
            'clip' => 0.0,
            'ticketRev' => 12000.0,
            'deposit' => 0.0,
            'wages' => 4200.0,
            'surplus' => 12850.0,
        ],
        [
            'date' => '16/01/2027',
            'title' => 'Bareback Cabaret Launch',
            'type' => 'owned',
            'format' => 'Owned Daytime',
            'pax' => 160,
            'barGross' => 4800.0,
            'clip' => 0.0,
            'ticketRev' => 3200.0,
            'deposit' => 0.0,
            'wages' => 2800.0,
            'surplus' => 2950.0,
        ],
        [
            'date' => '30/01/2027',
            'title' => 'LNQD (Late Night Queer Dance)',
            'type' => 'promoter',
            'format' => 'Promoter Hosted',
            'pax' => 250,
            'barGross' => 7000.0,
            'clip' => 1250.0,
            'ticketRev' => 0.0,
            'deposit' => 0.0,
            'wages' => 3560.0,
            'surplus' => 2400.0,
        ],
        [
            'date' => '13/02/2027',
            'title' => 'Mardi Gras Warmup: Sniffies Cruise',
            'type' => 'owned',
            'format' => 'Owned Hero Night',
            'pax' => 300,
            'barGross' => 11000.0,
            'clip' => 0.0,
            'ticketRev' => 9000.0,
            'deposit' => 0.0,
            'wages' => 4100.0,
            'surplus' => 9400.0,
        ],
        [
            'date' => '27/02/2027',
            'title' => 'TROUGH Mardi Gras Festival Main',
            'type' => 'owned',
            'format' => 'Owned Festival',
            'pax' => 300,
            'barGross' => 15000.0,
            'clip' => 0.0,
            'ticketRev' => 15000.0,
            'deposit' => 0.0,
            'wages' => 4400.0,
            'surplus' => 15650.0,
        ],
        [
            'date' => '06/03/2027',
            'title' => 'FK CLUB Recovery',
            'type' => 'owned',
            'format' => 'Owned Recovery',
            'pax' => 180,
            'barGross' => 5500.0,
            'clip' => 0.0,
            'ticketRev' => 4500.0,
            'deposit' => 0.0,
            'wages' => 2800.0,
            'surplus' => 4125.0,
        ],
    ];
}

function getSeedRoster(): array
{
    return [
        [
            'role' => 'Venue Duty Manager',
            'headcount' => 1,
            'hours' => 6.0,
            'rate' => 55.0,
            'hasSuper' => true,
            'notes' => 'Incident management, licensing compliance, cash reconciliation',
        ],
        [
            'role' => 'Senior Bartender',
            'headcount' => 2,
            'hours' => 6.0,
            'rate' => 45.0,
            'hasSuper' => true,
            'notes' => 'Main bar and basement dispensary service',
        ],
        [
            'role' => 'Licensed Crowd Control',
            'headcount' => 1,
            'hours' => 6.0,
            'rate' => 55.0,
            'hasSuper' => false,
            'notes' => 'Licensed crowd control & street line management (Contracted Agency)',
        ],
        [
            'role' => 'Door / Ticket Scanner & Cloak',
            'headcount' => 1,
            'hours' => 6.0,
            'rate' => 35.0,
            'hasSuper' => true,
            'notes' => 'ID verification, wristbanding, ticket clip & cloakroom accounting',
        ],
        [
            'role' => 'Cleaning Crew',
            'headcount' => 1,
            'hours' => 6.0,
            'rate' => 60.0,
            'hasSuper' => true,
            'notes' => 'Bio-wash, floor sanitisation, commercial waste disposal',
        ],
    ];
}

function getSeedRosterTemplates(): array
{
    $default = getSeedRoster();
    $peak = array_map(static function (array $r): array {
        if (str_contains($r['role'], 'Crowd Control') || str_contains($r['role'], 'Security')) {
            $r['headcount'] = 2;
        } elseif (str_contains($r['role'], 'Bartender')) {
            $r['headcount'] = 3;
        }
        return $r;
    }, $default);

    return [
        [
            'id' => 'baseline-200',
            'name' => 'Baseline 200 Pax Roster (Default)',
            'updatedAt' => 'Default',
            'includeSuper' => true,
            'isSystem' => true,
            'items' => $default,
        ],
        [
            'id' => 'peak-300',
            'name' => 'Peak 300 Pax Sell-Out Roster (2 Guards, 3 Bar)',
            'updatedAt' => 'Preset',
            'includeSuper' => true,
            'isSystem' => true,
            'items' => $peak,
        ],
    ];
}

function getDefaultSettings(): array
{
    return [
        'owned_overheads' => [
            'talentCost' => 900.0,
            'productionCost' => 450.0,
            'marketingCost' => 400.0,
            'otherCost' => 0.0,
            'merchantFeePct' => 1.5,
        ],
        'wages_include_super' => ['enabled' => true],
        'fixed_hire_fee' => ['amount' => 5000.0],
        'sim_cogs_rate' => ['rate' => 22.0],
        'inventory_opening_value' => ['amount' => 3850.0],
        'inventory_period_sales' => ['amount' => 10000.0],
    ];
}

function isBarBeverageCategoryPhp(string $category): bool
{
    $lower = strtolower($category);
    if (
        str_contains($lower, 'entries') ||
        str_contains($lower, 'hardware') ||
        str_contains($lower, 'unassigned')
    ) {
        return false;
    }
    return (
        str_contains($lower, 'beer') ||
        str_contains($lower, 'pre-mix') ||
        str_contains($lower, 'spirit') ||
        str_contains($lower, 'cocktail') ||
        str_contains($lower, 'non-alcohol') ||
        str_contains($lower, 'happy hour')
    );
}

function estimateDefaultWholesaleCostPhp(
    string $name,
    string $category,
    ?float $bottleSizeMl,
    float $price
): float {
    $lowerName = strtolower($name);
    $lowerCat = strtolower($category);

    if (!isBarBeverageCategoryPhp($category)) {
        if (str_contains($lowerCat, 'hardware')) {
            return round($price * 0.35, 2);
        }
        return 0.0;
    }

    if ($bottleSizeMl !== null && $bottleSizeMl >= 45000) {
        return str_contains($lowerName, 'stone') ? 365.0 : 335.0;
    }

    if (str_contains($lowerCat, 'beer')) {
        return str_contains($lowerName, 'guin') ? 3.6 : 2.95;
    }

    if (str_contains($lowerCat, 'pre-mix')) {
        if (str_contains($lowerName, 'suntory') || str_contains($lowerName, 'smirnoff')) {
            return 3.85;
        }
        if (str_contains($lowerName, 'whiteclaw') || str_contains($lowerName, 'brookvale')) {
            return 3.35;
        }
        return 3.45;
    }

    if (
        str_contains($lowerCat, 'cocktail') &&
        !str_contains($lowerCat, 'spirit') &&
        $bottleSizeMl === 250.0
    ) {
        if (str_contains($lowerName, 'long island')) {
            return 4.95;
        }
        if (
            str_contains($lowerName, 'margarita') ||
            str_contains($lowerName, 'mojito') ||
            str_contains($lowerName, 'cosmo')
        ) {
            return 3.85;
        }
        if (str_contains($lowerName, 'redbull')) {
            return 3.45;
        }
        return 2.75;
    }

    if (str_contains($lowerCat, 'spirit') || str_contains($lowerCat, 'happy hour')) {
        if (str_contains($lowerName, 'laphoraig') || str_contains($lowerName, 'laphroaig')) {
            return 96.0;
        }
        if (str_contains($lowerName, 'hendrix') || str_contains($lowerName, 'hendrick')) {
            return 78.0;
        }
        if (str_contains($lowerName, '1800')) {
            return 72.0;
        }
        if (str_contains($lowerName, 'green fairy')) {
            return 82.0;
        }
        if (str_contains($lowerName, 'tanqueray') || str_contains($lowerName, 'cointreau')) {
            return 56.0;
        }
        if (
            str_contains($lowerName, 'makers') ||
            str_contains($lowerName, 'altos') ||
            str_contains($lowerName, 'mount gay')
        ) {
            return 54.0;
        }
        if (str_contains($lowerName, 'aperol')) {
            return 34.0;
        }
        if (str_contains($lowerName, 'wet bussy')) {
            return 2.1;
        }
        if ($bottleSizeMl !== null && $bottleSizeMl >= 1100) {
            return 54.0;
        }
        if ($bottleSizeMl !== null && $bottleSizeMl >= 950) {
            return 48.0;
        }
        return 44.0;
    }

    if (str_contains($lowerCat, 'non-alcohol')) {
        if (str_contains($lowerName, 'redbull')) {
            return 1.85;
        }
        if (str_contains($lowerName, 'gatorade')) {
            return 1.95;
        }
        if (str_contains($lowerName, 'water')) {
            return 0.75;
        }
        if (
            str_contains($lowerName, 'mixer - coke') ||
            str_contains($lowerName, 'soda') ||
            str_contains($lowerName, 'tonic')
        ) {
            return 2.45;
        }
        if (str_contains($lowerName, 'juice')) {
            return 3.8;
        }
        return 1.35;
    }

    return 0.0;
}

function getRawCloverCsv(): string
{
    return <<<'CSV'
Clover Item ID,Item Name,Category,Price,Live Clover Stock (Pours/Cans),Expected Stock (Bottles/Cans),Bottle Size (ml),Pour Size (ml),Recipe Deductions (Bottles),Actual Count (Bottles/Cans)
H550FNQSMHVEE,Stone & Wood,Beer,$12.00,3,-0.09,50000,375,0,
9QB49WFJQ6EZG,Tiger Lager,Beer,$14.00,70.33,0.53,50000,375,0,
R6KCA2EEJ5N1Y,Newtowner,Beer,$14.00,112.33,0.84,50000,375,0,
6TCDA8EAHPWS4,Carlton Daught,Beer,$14.00,65.33,0.49,50000,375,0,
BPGAZQE4Y529P,Bourbon + Coke,"Cocktails, HAPPY HOUR",$15.00,0,0,250,250,0,
EGTSYJFD3MNTA,Tequila + Soda + Lime,"Cocktails, HAPPY HOUR",$14.00,-15,-15,250,250,0,
K0C3PFCB2EJ4A,Vodka + Soda + Lime,Cocktails,$14.00,-66,-66,250,250,0,
SB07QE1VXR39R,Vodka + Redbull,"Cocktails, Spirits",$17.50,-105,-105,250,250,0,
BTDFDD509PRVC,Gin & Tonic,"Cocktails, HAPPY HOUR",$15.00,-8,-8,250,250,0,
QFBG2AGS4YVMP,Long Island Iced Tea,Cocktails,$24.00,-12,-12,250,250,0,
76GCPGEK1FJKE,Ruby Red,Cocktails,$14.00,-2,-2,250,250,0,
7YM5F89Z13X6E,Mojito,Cocktails,$20.00,0,0,250,250,0,
966MYE7FW3D0W,Spicy Margarita,Cocktails,$21.00,0,0,250,250,0,
40ZFJA18V3JP2,Margarita,Cocktails,$20.00,0,0,250,250,0,
37B2FRVKNPWP0,Cosmopolitan,Cocktails,$20.00,0,0,250,250,0,
JGTEGS18E49PA,Japanese Highball,Cocktails,$18.00,0,0,250,250,0,
70Z6AVXYDQEDC,Shandy,Cocktails,$18.00,0,0,250,250,0,
KWRND78CEZN6G,Suntory 196,Pre-mix cans,$16.00,-6,-6,330,330,0,
RXGGPWAD1GADG,Hard Rated,Pre-mix cans,$15.00,54,54,375,375,0,
KRXNGZKHHCCYW,Smirnoff DOUBLE BLACK RASP,Pre-mix cans,$16.00,27,27,375,375,0,
F5PK1VST0T1C8,Smirnoff DOUBLE BLACK,Pre-mix cans,$16.00,16,16,375,375,0,
22NS155D0F25M,Smirnoff RED CAN,Pre-mix cans,$16.00,9,9,375,375,0,
4K2BEKAD4FA6M,Whiteclaw WATERMELON,Pre-mix cans,$15.00,14,14,330,330,0,
PK9KF8TNDX1D2,Whiteclaw RASPBERRY,Pre-mix cans,$15.00,8,8,375,375,0,
W45C85H7BWQJ8,Whiteclaw MANGO,Pre-mix cans,$15.00,20,20,330,330,0,
SG5VSR0VRXB9W,Jim Beam & Cola,Pre-mix cans,$14.00,23,23,330,330,0,
M6E9Y1Q7JRYSG,Canadian Club - Dry,Pre-mix cans,$14.00,10,10,375,375,0,
RER0J6VZ60CB8,Brookvale Ginger Beer,Pre-mix cans,$15.00,20,20,330,330,0,
ZRY5CGKQC4MAA,Newtowner - Can,Beer,$14.00,16,16,375,375,0,
96ACZ68SFQ9C0,Hanh Superdry Can,Beer,$14.00,42,42,375,375,0,
6AP8DFD1VQMYM,Somersby Apple Cider,Pre-mix cans,$14.00,30,30,375,375,0,
NJSD0JSXV2Y9Y,Guiness,"Beer, Pre-mix cans",$13.00,12,12,440,440,0,
EGZRV4MP1V6P8,Basic,"Pre-mix cans, Spirits",$13.00,0,0,1000,30,0,
B8QKAJKS2VZ4J,Vodka - Smirnoff,Spirits,$13.00,-130.5,-8.04,1125,30,-4.56,
7JQMASEQVMPAR,Gin - Gordon's,Spirits,$13.00,285.5,7.61,1125,30,0,
853T60DB7W0S0,Rum - Bacardi White,Spirits,$13.00,62,2.66,700,30,0,
ZJ3PNGYGJG6ET,Tequila - Sierra Blanco,Spirits,$13.00,0,0,1000,30,0,
VQ2XHPSPD63AY,Whisky - Ballantines,Spirits,$13.00,53.67,1.61,1000,30,0,
E8Z6GE8SAN9H2,Tequila - Altos,Spirits,$15.00,0,0,700,30,0,
6N5DG7MDXT9A0,Tequila - Jose Cuervo,Spirits,$14.00,168.33,5.05,1000,30,0,
9M73HHQMSDVM4,Tequila - 1800 Coconut,Spirits,$16.00,37.67,1.61,700,30,0,
AF4SD9GXETSQ4,Rum - Mount Gay,Spirits,$15.00,4.33,0.19,700,30,0,
6AK0JDMBR4Y38,Gin - Tanqueray,Spirits,$15.00,39.33,1.69,700,30,0,
6M8HQ50XZVB2T,Bourbon - Makers Mark,Spirits,$14.00,45.67,1.37,1000,30,0,
V4HR3VGZXTB3E,Bourbon - Black Widow Honey,"Cocktails, HAPPY HOUR, Spirits",$14.00,-3,-0.13,700,30,0,
EW5NB7TZ509FG,Whisky - Laphoraig,Spirits,$18.00,37,0.93,1200,30,0,
K0R7M1JT8KFVY,Fireball,"HAPPY HOUR, Spirits",$13.00,142,4.26,1000,30,0,
A4Y09JR3BE2TT,Spirit  - Other - Alize,Spirits,$13.00,46.67,2,700,30,0,
3MT37HC6SR652,Spirit  - Other - Aperol,Cocktails,$13.00,299,8.97,1000,30,0,
NB9A1J3SVDY4Y,Other - Cointreau,Spirits,$13.00,70,3,700,30,0,
RFZ1SNXX2KJSR,Other - Wet Bussy,Spirits,$13.00,-4,-4,1,0,0,
Z6ZD3PYYVSS90,Redbull Tropical,Non-alcohol,$6.00,47,47,330,330,0,
30FSDHYKAQ5H4,Redbull WMelon,Non-alcohol,$6.00,34,34,330,330,0,
NKA93FHHYJ7K2,Redbull,Non-alcohol,$6.00,182,112,330,330,-70,
V40BK6S3MANKJ,Redbull Sugar Free,Non-alcohol,$6.00,175,175,330,330,0,
0252K9FXE2AE2,Gatorade - Clear/Watermelon,Non-alcohol,$6.00,70,70,600,600,0,
JNJ046KVK5DBY,Gatorade - Purple,Non-alcohol,$6.00,72,72,600,600,0,
9G369GZQTVHV6,Gatorade - Orange,Non-alcohol,$6.00,53,53,600,600,0,
F0NVF265YREST,Gatorade - RED Topical,Non-alcohol,$6.00,59,59,600,600,0,
PG06H7J22E41G,Gatorade - Yellow Lemon,Non-alcohol,$6.00,88,88,600,600,0,
XEGVDDJNBC8PP,Gatorade - Blue Bolt,Non-alcohol,$6.00,124,124,600,600,0,
TV13HR90DZSDP,Soft Drink - Solo,Non-alcohol,$4.50,36,36,375,375,0,
2DB70PCFNGZMW,Soft Drink - Sprite,Non-alcohol,$4.50,135,135,375,375,0,
GCMW9J49Z3X4R,Soft Drink - Coke Zero,Non-alcohol,$4.50,79,79,375,375,0,
C9FE322NSKENM,Soft Drink - Coke,Non-alcohol,$4.50,127,127,375,375,0,
V1A9AC1G62N2Y,Soft Drink - Sunkist,Non-alcohol,$4.50,89,89,375,375,0,
38NBHC1QHKKEA,Mixer - Coke,Non-alcohol,$1.50,-6,-2.04,1250,425,0,
GGDKB09VT0SKY,Mixer - Soda Water,Non-alcohol,$1.50,285,45.6,1250,200,0,
X8QDJEK97YVPY,Mixer - Cranberry Juice,Non-alcohol,$2.00,20,2,2000,200,0,
55FDQHD8SC080,Mixer - Tonic,Non-alcohol,$2.00,112.75,18.04,1250,200,0,
5ZN2XP4EH5BJA,Mixer - Orange Juice,Non-alcohol,$2.00,48,4.8,2000,200,0,
YEXCHDBYSSEAA,Mixer - Pineapple Juice,Non-alcohol,$2.00,58,5.8,2000,200,0,
3GANMJVZNF6FT,Bottle Water,Non-alcohol,$4.75,-77,-77,,200,0,
VFSYQZZB2E66E,Towel Service,Entries,$5.00,-7,-7,,,0,
G5W3ATHM2XHSP,Cloak $10,Entries,$10.00,-463,-463,,,0,
6X6GDDFAN8FF6,Cloak $5,Entries,$5.00,-44,-44,,,0,
J1JF0KHPZ9VAE,Towel + Locker,Entries,$10.00,0,0,,,0,
J5XDWSNYRMDFT,Ear Plugs,Entries,$5.00,4,4,,,0,
AFF4T8XEWZWM4,Late Trough Entry,Entries,$20.00,-2,-2,,,0,
NDZDGV7HZ54D6,FK CLUB Entry,Entries,$25.00,0,0,,,0,
F8Y38R6CGV7TG,SATURDAY ENTRY,Entries,$35.00,-9,-9,,,0,
13EQ681Z51GEC,FRIDAY ENTRY,Entries,$25.00,0,0,,,0,
6B1Q4HJFB2400,Douch Room Charge,Entries,$5.00,-6,-6,,,0,
6G2XH6JGDM23J,Hardware-JJBL30,Hardware,$60.00,12,12,,,0,
TSRSMZXKKQFMY,Hardware-JJBL15,Hardware,$40.00,17,17,,,0,
ZJKCB9SJD0XRG,Hardware-ry30,Hardware,$60.00,11,11,,,0,
NTB9EJA3MDBV0,Hardware-ry15,Hardware,$40.00,36,36,,,0,
SKN6QGWCXNYAR,Bourbon + Coke,"Cocktails, HAPPY HOUR",$10.00,-8,-8,,,0,
9YPCWQ433ADEM,WET BUSSY,HAPPY HOUR,$10.00,-27,-27,,,0,
5A108V8M5M402,Gatorade,Non-alcohol,$8.00,-25,-25,,,0,
1P0WVEJ8D28H8,Galliano BLACK Sambuca,Spirits,$12.00,-1,-1,,,0,
DABFBHYXV85VJ,Galliano White Sambuca,Spirits,$12.00,-2,-2,,,0,
46FZM0QTB3X70,GREEN FAIRY,Spirits,$18.00,-1,-1,,,0,
2MJWAG4XCZ1QR,Ball,Unassigned,$3.50,-1,-1,,,0,
W1WPHSN1F822A,Delivery Fee,Unassigned,$0.00,0,0,,,0,
G6MZECGYQH38T,COCK XXX PALE ALE,Beer,$13.50,70,70,,,0,
QHQ3Q81ZKZ3KC,Hendrix GIN,Spirits,$16.00,-4,-4,,,0,
CSV;
}

function getSeedInventoryItems(): array
{
    $csv = getRawCloverCsv();
    $lines = preg_split('/\r?\n/', trim($csv)) ?: [];
    $items = [];
    for ($i = 1; $i < count($lines); $i++) {
        $line = trim($lines[$i]);
        if ($line === '') {
            continue;
        }
        $cols = str_getcsv($line);
        if (count($cols) < 4) {
            continue;
        }
        $cloverId = trim((string)($cols[0] ?? "ROW-{$i}"));
        $name = trim((string)($cols[1] ?? 'Unnamed Item'));
        $category = trim((string)($cols[2] ?? 'Unassigned'));
        $price = (float)(preg_replace('/[^0-9.\-]/', '', (string)($cols[3] ?? '0')) ?: '0');
        $liveCloverStock = (float)($cols[4] ?? 0);
        $expectedStock = (float)($cols[5] ?? 0);
        $bottleSizeMl = (isset($cols[6]) && trim((string)$cols[6]) !== '') ? (float)$cols[6] : null;
        $pourSizeMl = (isset($cols[7]) && trim((string)$cols[7]) !== '') ? (float)$cols[7] : null;
        $recipeDeductions = (float)($cols[8] ?? 0);
        $actualCount = (isset($cols[9]) && trim((string)$cols[9]) !== '') ? (float)$cols[9] : null;

        $unitCost = estimateDefaultWholesaleCostPhp($name, $category, $bottleSizeMl, $price);

        $items[] = [
            'cloverId' => $cloverId,
            'name' => $name,
            'category' => $category,
            'price' => $price,
            'liveCloverStock' => $liveCloverStock,
            'expectedStock' => $expectedStock,
            'bottleSizeMl' => $bottleSizeMl,
            'pourSizeMl' => $pourSizeMl,
            'recipeDeductions' => $recipeDeductions,
            'actualCount' => $actualCount,
            'unitCost' => $unitCost,
            'costVerified' => false,
        ];
    }
    return $items;
}
