export interface InventoryItem {
  cloverId: string;
  name: string;
  category: string;
  price: number;
  liveCloverStock: number;
  expectedStock: number;
  bottleSizeMl: number | null;
  pourSizeMl: number | null;
  recipeDeductions: number;
  actualCount: number | null;
  unitCost: number;
  costVerified: boolean;
}

export interface StockPurchaseEntry {
  id: string;
  date: string;
  supplier: string;
  invoiceRef: string;
  amount: number;
  notes: string;
}

export const RAW_CLOVER_INVENTORY_CSV = `Clover Item ID,Item Name,Category,Price,Live Clover Stock (Pours/Cans),Expected Stock (Bottles/Cans),Bottle Size (ml),Pour Size (ml),Recipe Deductions (Bottles),Actual Count (Bottles/Cans)
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
QHQ3Q81ZKZ3KC,Hendrix GIN,Spirits,$16.00,-4,-4,,,0,`;

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function isBarBeverageCategory(category: string): boolean {
  const lower = category.toLowerCase();
  if (
    lower.includes('entries') ||
    lower.includes('hardware') ||
    lower.includes('unassigned')
  ) {
    return false;
  }
  return (
    lower.includes('beer') ||
    lower.includes('pre-mix') ||
    lower.includes('spirit') ||
    lower.includes('cocktail') ||
    lower.includes('non-alcohol') ||
    lower.includes('happy hour')
  );
}

/**
 * Estimates realistic Australian wholesale ex-GST unit cost per bottle/keg/can
 * so accurate COGS baselines exist immediately and can be overwritten with exact invoice costs.
 */
export function estimateDefaultWholesaleCost(
  name: string,
  category: string,
  bottleSizeMl: number | null,
  price: number
): number {
  const lowerName = name.toLowerCase();
  const lowerCat = category.toLowerCase();

  if (!isBarBeverageCategory(category)) {
    if (lowerCat.includes('hardware')) return Number((price * 0.35).toFixed(2));
    return 0;
  }

  // 50L Beer Kegs
  if (bottleSizeMl && bottleSizeMl >= 45000) {
    if (lowerName.includes('stone')) return 365.0;
    return 335.0;
  }

  // Packaged Beer Cans
  if (lowerCat.includes('beer')) {
    if (lowerName.includes('guin')) return 3.6;
    return 2.95;
  }

  // Pre-mix RTD Cans
  if (lowerCat.includes('pre-mix')) {
    if (lowerName.includes('suntory') || lowerName.includes('smirnoff')) return 3.85;
    if (lowerName.includes('whiteclaw') || lowerName.includes('brookvale')) return 3.35;
    return 3.45;
  }

  // Cocktails (POS Recipe Buttons)
  if (lowerCat.includes('cocktail') && !lowerCat.includes('spirit') && bottleSizeMl === 250) {
    if (lowerName.includes('long island')) return 4.95;
    if (lowerName.includes('margarita') || lowerName.includes('mojito') || lowerName.includes('cosmo')) return 3.85;
    if (lowerName.includes('redbull')) return 3.45;
    return 2.75;
  }

  // Spirits (bottles 700ml - 1200ml)
  if (lowerCat.includes('spirit') || lowerCat.includes('happy hour')) {
    if (lowerName.includes('laphoraig') || lowerName.includes('laphroaig')) return 96.0;
    if (lowerName.includes('hendrix') || lowerName.includes('hendrick')) return 78.0;
    if (lowerName.includes('1800')) return 72.0;
    if (lowerName.includes('green fairy')) return 82.0;
    if (lowerName.includes('tanqueray') || lowerName.includes('cointreau')) return 56.0;
    if (lowerName.includes('makers') || lowerName.includes('altos') || lowerName.includes('mount gay')) return 54.0;
    if (lowerName.includes('aperol')) return 34.0;
    if (lowerName.includes('wet bussy')) return 2.1;
    if (bottleSizeMl && bottleSizeMl >= 1100) return 54.0; // 1125ml Smirnoff / Gordons
    if (bottleSizeMl && bottleSizeMl >= 950) return 48.0; // 1000ml house spirits
    return 44.0; // 700ml spirits
  }

  // Non-alcohol RTDs & Mixers
  if (lowerCat.includes('non-alcohol')) {
    if (lowerName.includes('redbull')) return 1.85;
    if (lowerName.includes('gatorade')) return 1.95;
    if (lowerName.includes('water')) return 0.75;
    if (lowerName.includes('mixer - coke') || lowerName.includes('soda') || lowerName.includes('tonic')) return 2.45;
    if (lowerName.includes('juice')) return 3.8;
    return 1.35; // 375ml soft drinks
  }

  return 0;
}

export function parseCloverInventoryCsv(
  csvText: string,
  existingItemsMap?: Map<string, InventoryItem>
): InventoryItem[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const items: InventoryItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]);
    if (cols.length < 4) continue;

    const cloverId = cols[0] || `ROW-${i}`;
    const name = cols[1] || 'Unnamed Item';
    const category = cols[2] || 'Unassigned';
    const price = parseFloat((cols[3] || '0').replace(/[^0-9.\-]/g, '')) || 0;
    const liveCloverStock = parseFloat(cols[4] || '0') || 0;
    const expectedStock = parseFloat(cols[5] || '0') || 0;
    const rawBottle = cols[6] !== undefined && cols[6] !== '' ? parseFloat(cols[6]) : null;
    const rawPour = cols[7] !== undefined && cols[7] !== '' ? parseFloat(cols[7]) : null;
    const recipeDeductions = parseFloat(cols[8] || '0') || 0;
    const rawActual = cols[9] !== undefined && cols[9] !== '' ? parseFloat(cols[9]) : null;

    const bottleSizeMl = rawBottle !== null && !Number.isNaN(rawBottle) ? rawBottle : null;
    const pourSizeMl = rawPour !== null && !Number.isNaN(rawPour) ? rawPour : null;
    const prev = existingItemsMap?.get(cloverId);

    const actualCount =
      rawActual !== null && !Number.isNaN(rawActual)
        ? rawActual
        : prev?.actualCount ?? null;

    const unitCost =
      prev !== undefined
        ? prev.unitCost
        : estimateDefaultWholesaleCost(name, category, bottleSizeMl, price);

    items.push({
      cloverId,
      name,
      category,
      price,
      liveCloverStock,
      expectedStock,
      bottleSizeMl,
      pourSizeMl,
      recipeDeductions,
      actualCount,
      unitCost,
      costVerified: prev?.costVerified ?? false,
    });
  }

  return items;
}

export function getInitialInventoryItems(): InventoryItem[] {
  return parseCloverInventoryCsv(RAW_CLOVER_INVENTORY_CSV);
}

export function calculateItemMetrics(item: InventoryItem) {
  const isPosRecipeOnly =
    item.bottleSizeMl === 250 &&
    item.pourSizeMl === 250 &&
    item.category.toLowerCase().includes('cocktail');

  const isPackagedCanOrSingle =
    item.bottleSizeMl === null ||
    item.pourSizeMl === null ||
    item.pourSizeMl === 0 ||
    item.bottleSizeMl === item.pourSizeMl;

  const poursPerUnit =
    !isPosRecipeOnly &&
    item.bottleSizeMl &&
    item.pourSizeMl &&
    item.pourSizeMl > 0
      ? item.bottleSizeMl / item.pourSizeMl
      : 1;

  const costPerPour = poursPerUnit > 0 ? item.unitCost / poursPerUnit : item.unitCost;
  const cogsPct = item.price > 0 ? (costPerPour / item.price) * 100 : 0;
  const gpPerPour = item.price - costPerPour;

  const effectiveCount =
    item.actualCount !== null ? item.actualCount : item.expectedStock;

  // Physical stock value excludes POS-only cocktail recipe counters
  const stockValue = isPosRecipeOnly ? 0 : Math.max(0, effectiveCount) * item.unitCost;
  const varianceUnits =
    item.actualCount !== null ? item.actualCount - item.expectedStock : null;
  const varianceCost =
    varianceUnits !== null && !isPosRecipeOnly ? varianceUnits * item.unitCost : null;

  return {
    isPosRecipeOnly,
    isPackagedCanOrSingle,
    poursPerUnit,
    costPerPour,
    cogsPct,
    gpPerPour,
    effectiveCount,
    stockValue,
    varianceUnits,
    varianceCost,
  };
}
