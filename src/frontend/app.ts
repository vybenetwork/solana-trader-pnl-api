interface TokenData {
  symbol?: string;
  name?: string;
  mintAddress?: string;
  logoUrl?: string;
  decimal?: number;
  decimals?: number;
  category?: string;
  subcategory?: string;
  verified?: boolean;
  price?: number;
  marketCap?: number;
  price1d?: number;
  price7d?: number;
  currentSupply?: number;
  tokenAmountVolume24h?: number;
  usdValueVolume24h?: number;
  updateTime?: number;
}

interface TopTraderRow {
  accountAddress?: string;
  accountName?: string;
  accountLogoUrl?: string;
  accountTwitterUrl?: string;
  accountLabels?: string[];
  metrics?: {
    realizedPnlUsd?: number;
    unrealizedPnlUsd?: number;
    tradesCount?: number;
    tradesVolumeUsd?: number;
    winRate?: number;
    uniqueTokensTraded?: number;
    sevenDayPnl?: number[][];
    bestPerformingToken?: WalletPnlSummaryTokenRef;
    worstPerformingToken?: WalletPnlSummaryTokenRef;
  };
}

interface TokenTopPnlTraderRow {
  traderAddress?: string;
  name?: string | null;
  realizedPnlUsd?: number;
  unrealizedPnlUsd?: number;
  totalVolumeUsd?: number;
  tradesCount?: number;
}

/**
 * Same eight fixed positive realized-PnL (USD) bands as the PnL bar chart: (lower, upper], high → low.
 * Top band is (100, ∞); bottom is (0, 0.02].
 */
const CANONICAL_POSITIVE_PNL_DIST_USD_BANDS: readonly { label: string; lower: number; upper: number }[] = [
  { label: '$100 to $1,000', lower: 100, upper: Number.POSITIVE_INFINITY },
  { label: '$10 to $100', lower: 10, upper: 100 },
  { label: '$1 to $10', lower: 1, upper: 10 },
  { label: '$0.50 to $1', lower: 0.5, upper: 1 },
  { label: '$0.10 to $0.50', lower: 0.1, upper: 0.5 },
  { label: '$0.05 to $0.10', lower: 0.05, upper: 0.1 },
  { label: '$0.02 to $0.05', lower: 0.02, upper: 0.05 },
  { label: '> $0 to $0.02', lower: 0, upper: 0.02 },
];

/** Solid or `{ dark, light }` pair matching bar `linear-gradient(90deg, …)` endpoints. */
type PieSliceSpec = string | { dark: string; light: string };

/**
 * Volume-by-PnL donut: four positive bands — top three rungs match the bar chart ($100+, $10–$100,
 * $1–$10); all positive realized PnL through $1 merges into one (0, 1] slice.
 */
const VOLUME_PNL_PIE_MERGED_USD_BANDS: readonly { label: string; lower: number; upper: number }[] = [
  { label: '$100 to $1,000 PNL', lower: 100, upper: Number.POSITIVE_INFINITY },
  { label: '$10 to $100 PNL', lower: 10, upper: 100 },
  { label: '$1 to $10 PNL', lower: 1, upper: 10 },
  { label: '> $0 to $1 PNL', lower: 0, upper: 1 },
];

/** Same sweep as `.token-pnl-bar-fill--negative`. */
const VOLUME_PNL_PIE_NONPOSITIVE_FILL: PieSliceSpec = { dark: '#dc2626', light: '#f87171' };

function tradeScaleHue(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 120 - clamped * 120;
}

/** Two stops matching `.token-pnl-bar-fill--trade-scale` (85%/42% → 92%/60%). */
function tradeScaleBarGradientPair(t: number): { dark: string; light: string } {
  const h = tradeScaleHue(t);
  return {
    dark: `hsl(${h} 85% 42%)`,
    light: `hsl(${h} 92% 60%)`,
  };
}

const _volumePnlMergedBandCount = VOLUME_PNL_PIE_MERGED_USD_BANDS.length;
/** Donut slices: same per-row gradient as trade-count bars (`--trade-scale`). */
const VOLUME_PNL_PIE_MERGED_SLICE_FILLS: readonly PieSliceSpec[] = Array.from({ length: _volumePnlMergedBandCount }, (_, i) =>
  _volumePnlMergedBandCount <= 1 ? tradeScaleBarGradientPair(0) : tradeScaleBarGradientPair(i / (_volumePnlMergedBandCount - 1))
);

function volumePnlPieMergedBandIndex(pnl: number): number | null {
  if (!Number.isFinite(pnl) || pnl <= 0) return null;
  for (let i = 0; i < VOLUME_PNL_PIE_MERGED_USD_BANDS.length; i++) {
    const b = VOLUME_PNL_PIE_MERGED_USD_BANDS[i];
    if (pnl > b.lower && pnl <= b.upper) return i;
  }
  return null;
}

function traderRoiPercentFromRow(row: TokenTopPnlTraderRow): number | null {
  const vol = toNum(row.totalVolumeUsd);
  if (!Number.isFinite(vol) || vol <= 0) return null;
  const pnl = toNum(row.realizedPnlUsd);
  if (!Number.isFinite(pnl)) return null;
  return (pnl / vol) * 100;
}

/** Profitable trade-tier pie: six bands — fixed “2” and “3–5” trades plus four high bands from canonical edges (merged by least trade-mass when needed). */
const TRADE_TIER_PIE_SEGMENT_COUNT = 6;
const TRADE_TIER_FIXED_TIER_COUNT = 2;
const TRADE_TIER_HIGH_MERGE_SLOTS = TRADE_TIER_PIE_SEGMENT_COUNT - TRADE_TIER_FIXED_TIER_COUNT;

/** Trade-tier donut: same two-stop ramp per slice as `.token-pnl-bar-fill--trade-scale`. */
const TRADE_TIER_PIE_SLICE_FILLS: readonly PieSliceSpec[] = Array.from(
  { length: TRADE_TIER_PIE_SEGMENT_COUNT },
  (_, i) =>
    TRADE_TIER_PIE_SEGMENT_COUNT <= 1
      ? tradeScaleBarGradientPair(0)
      : tradeScaleBarGradientPair(i / (TRADE_TIER_PIE_SEGMENT_COUNT - 1))
);

const TIER_LEGEND_SVG_USER =
  '<svg class="token-tier-metric__svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

const TIER_LEGEND_SVG_STACK =
  '<svg class="token-tier-metric__svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 10h16v2H4v-2zm0-4h16v2H4V6zm0 8h16v2H4v-2z"/></svg>';

const TIER_LEGEND_SVG_VOLUME =
  '<svg class="token-tier-metric__svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 12h4v8H3v-8zm7-4h4v12h-4V8zm7 6h4v6h-4v-6z"/></svg>';

interface WalletPnlSummaryTokenRef {
  mintAddress?: string;
  pnlUsd?: number;
  tokenName?: string;
  tokenSymbol?: string;
  tokenLogoUrl?: string;
}

interface WalletPnlSummary {
  averageTradeUsd?: number;
  bestPerformingToken?: WalletPnlSummaryTokenRef;
  losingTradesCount?: number;
  pnlTrendSevenDays?: number[][];
  realizedPnlUsd?: number;
  tradesCount?: number;
  tradesVolumeUsd?: number;
  uniqueTokensTraded?: number;
  unrealizedPnlUsd?: number;
  winRate?: number;
  winningTradesCount?: number;
  worstPerformingToken?: WalletPnlSummaryTokenRef;
}

interface WalletPnlSideMetrics {
  transactionCount?: number;
  volumeUsd?: number;
  tokenAmount?: number;
  latestTradeBlocktime?: number;
  latestTradeSignature?: string;
}

interface WalletPnlTokenMetric {
  mintAddress?: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenLogoUrl?: string;
  tokenLabels?: string[];
  status?: string;
  realizedPnlUsd?: number;
  unrealizedPnlUsd?: number;
  latestTradeBlocktime?: number;
  buys?: WalletPnlSideMetrics;
  sells?: WalletPnlSideMetrics;
}

interface WalletPnlResponse {
  summary?: WalletPnlSummary;
  tokenMetrics?: WalletPnlTokenMetric[];
}

type SearchMode = 'token' | 'wallet';
type SortDirection = 'asc' | 'desc';

const mintInput = document.getElementById('mint') as HTMLInputElement;
const searchInputLabel = document.getElementById('searchInputLabel') as HTMLElement;
const fetchActions = document.getElementById('fetchActions') as HTMLElement;
const walletActionsTarget = document.getElementById('walletActionsTarget') as HTMLElement;
const walletLoadingSlot = document.getElementById('walletLoadingSlot') as HTMLElement;
const fetchAllBtn = document.getElementById('fetchAll') as HTMLButtonElement;
const fetchAllBtnText = document.getElementById('fetchAllBtnText') as HTMLElement | null;
const loadingIndicator = document.getElementById('loadingIndicator') as HTMLElement;
const walletLabelField = document.getElementById('walletLabelField') as HTMLElement;
const walletPageField = document.getElementById('walletPageField') as HTMLElement;

const walletLabel = document.getElementById('walletLabel') as HTMLSelectElement;
const walletTopTradersResolution = document.getElementById('walletTopTradersResolution') as HTMLSelectElement;
const walletSortDirection = document.getElementById('walletSortDirection') as HTMLSelectElement;
const walletPnlMintAddress = document.getElementById('walletPnlMintAddress') as HTMLInputElement;
const walletPnlSortField = document.getElementById('walletPnlSortField') as HTMLSelectElement;
const walletPage = document.getElementById('walletPage') as HTMLInputElement;
const walletLimit = document.getElementById('walletLimit') as HTMLSelectElement;

const tokenTopPnlResolution = document.getElementById('tokenTopPnlResolution') as HTMLSelectElement;
const tokenTopPnlSortField = document.getElementById('tokenTopPnlSortField') as HTMLSelectElement;
const tokenTopPnlSortDirection = document.getElementById('tokenTopPnlSortDirection') as HTMLSelectElement;
const tokenTopPnlPage = document.getElementById('tokenTopPnlPage') as HTMLInputElement;
const tokenTopPnlLimit = document.getElementById('tokenTopPnlLimit') as HTMLSelectElement;

const tokenSection = document.getElementById('tokenSection') as HTMLElement;
const tokenSectionLoading = document.getElementById('tokenSectionLoading') as HTMLElement;
const tokenSectionError = document.getElementById('tokenSectionError') as HTMLElement;
const tokenLogo = document.getElementById('tokenLogo') as HTMLImageElement;
const tokenSymbol = document.getElementById('tokenSymbol') as HTMLElement;
const tokenName = document.getElementById('tokenName') as HTMLElement;
const tokenLastUpdatedValue = document.getElementById('tokenLastUpdatedValue') as HTMLElement;
const tokenStats = document.getElementById('tokenStats') as HTMLElement;
const tokenSupplyPanelTotal = document.getElementById('tokenSupplyPanelTotal') as HTMLElement;
const tokenSupplyPieTotal = document.getElementById('tokenSupplyPieTotal') as HTMLElement;
const tokenSupplyLegendTotal = document.getElementById('tokenSupplyLegendTotal') as HTMLElement;
const tokenSupplyPieTradesCount = document.getElementById('tokenSupplyPieTradesCount') as HTMLElement;
const tokenSupplyLegendTradesCount = document.getElementById('tokenSupplyLegendTradesCount') as HTMLElement;
const tokenPnlBarsTotal = document.getElementById('tokenPnlBarsTotal') as HTMLElement;
const tokenSupplySelectedTitle = document.getElementById('tokenSupplySelectedTitle') as HTMLElement;
const tokenPnlSelectedTitle = document.getElementById('tokenPnlSelectedTitle') as HTMLElement;
const tokenTopVolumeSelectedTitle = document.getElementById('tokenTopVolumeSelectedTitle') as HTMLElement;
const tokenVolumePnlLede = document.getElementById('tokenVolumePnlLede');
const tokenTopTradesByProfitTitle = document.getElementById('tokenTopTradesByProfitTitle') as HTMLElement;
const tokenTradeTierLede = document.getElementById('tokenTradeTierLede');
const tokenTradeTierInsightText = document.getElementById('tokenTradeTierInsightText');
const tokenTradeTierTimeframe = document.getElementById('tokenTradeTierTimeframe');
const tokenTradeTierFooterMethodology = document.getElementById('tokenTradeTierFooterMethodology');
const tokenTradeTierFooterScope = document.getElementById('tokenTradeTierFooterScope');
const tokenVolumePnlInsightText = document.getElementById('tokenVolumePnlInsightText');
const tokenVolumePnlTimeframe = document.getElementById('tokenVolumePnlTimeframe');
const tokenVolumePnlFooterMethodology = document.getElementById('tokenVolumePnlFooterMethodology');
const tokenVolumePnlFooterScope = document.getElementById('tokenVolumePnlFooterScope');
const tokenSupplyCardDescPnl = document.getElementById('tokenSupplyCardDescPnl');
const tokenSupplyCardDescTradesVertical = document.getElementById('tokenSupplyCardDescTradesVertical');
const tokenTradesCountSelectedRow = document.getElementById('tokenTradesCountSelectedRow') as HTMLElement;
const tokenTradesCountSelectedTitle = document.getElementById('tokenTradesCountSelectedTitle') as HTMLElement;
const tokenTradesCountBarsVertical = document.getElementById('tokenTradesCountBarsVertical') as HTMLElement;

const topTradersSection = document.getElementById('topTradersSection') as HTMLElement;
const walletTopTradersTitle = document.getElementById('walletTopTradersTitle') as HTMLElement;
const topTradersLoading = document.getElementById('topTradersLoading') as HTMLElement;
const topTradersError = document.getElementById('topTradersError') as HTMLElement;
const topTradersMeta = document.getElementById('topTradersMeta') as HTMLElement;
const topTradersCards = document.getElementById('topTradersCards') as HTMLElement;
const walletPnlMeta = document.getElementById('walletPnlMeta') as HTMLElement;
const walletPnlDetails = document.getElementById('walletPnlDetails') as HTMLElement;

const tokenTopPnlSection = document.getElementById('tokenTopPnlSection') as HTMLElement;
const tokenTopPnlLoading = document.getElementById('tokenTopPnlLoading') as HTMLElement;
const tokenTopPnlError = document.getElementById('tokenTopPnlError') as HTMLElement;
const tokenTopPnlMeta = document.getElementById('tokenTopPnlMeta') as HTMLElement;
const tokenTopPnlBody = document.getElementById('tokenTopPnlBody') as HTMLElement;
const tokenTopPnlRealizedHeader = document.getElementById('tokenTopPnlRealizedHeader') as HTMLElement;
const tokenTopPnlRovHeader = document.getElementById('tokenTopPnlRovHeader') as HTMLElement;
const tokenTopPnlUnrealizedHeader = document.getElementById('tokenTopPnlUnrealizedHeader') as HTMLElement;
const tokenTopPnlVolumeHeader = document.getElementById('tokenTopPnlVolumeHeader') as HTMLElement;
const tokenTopPnl24hVolumeHeader = document.getElementById('tokenTopPnl24hVolumeHeader') as HTMLElement;
const tokenTopPnlTradesHeader = document.getElementById('tokenTopPnlTradesHeader') as HTMLElement;
const tokenTopPnl24hTradesHeader = document.getElementById('tokenTopPnl24hTradesHeader') as HTMLElement;

type EndpointMode = 'realtime' | 'historical';
const endpointModeField = document.getElementById('endpointModeField') as HTMLElement;
const endpointModeHistorical = document.getElementById('endpointModeHistorical') as HTMLInputElement;
const endpointModeSwitchLabel = document.getElementById('endpointModeSwitchLabel') as HTMLElement;
const realtimeExclusiveSurface = document.getElementById('realtimeExclusiveSurface') as HTMLElement;
const historicalInputsBlock = document.getElementById('historicalInputsBlock') as HTMLElement;
const histWalletAddress = document.getElementById('histWalletAddress') as HTMLInputElement;
const histResolution = document.getElementById('histResolution') as HTMLSelectElement;
const histTimeStart = document.getElementById('histTimeStart') as HTMLInputElement;
const histTimeEnd = document.getElementById('histTimeEnd') as HTMLInputElement;
const fetchHistoricalPnlBtn = document.getElementById('fetchHistoricalPnl') as HTMLButtonElement;
const histLoadingIndicator = document.getElementById('histLoadingIndicator') as HTMLElement;
const histPnlSection = document.getElementById('histPnlSection') as HTMLElement;
const histPnlMeta = document.getElementById('histPnlMeta') as HTMLElement;
const histPnlTableHead = document.getElementById('histPnlTableHead') as HTMLElement;
const histPnlTableBody = document.getElementById('histPnlTableBody') as HTMLElement;

const MODE_STORAGE_KEY = 'walletPnlEndpointMode';
const HIST_RES_STORAGE_KEY = 'walletPnlHistResolutionV2';

/** When true, historical PnL timeseries UI is disabled and requests are not sent. */
const HISTORICAL_WALLET_PNL_UNDER_CONSTRUCTION = false;

/** When true, Realtime/Historical toggle and lock are inactive (historical UI deferred). */
const ENDPOINT_HISTORICAL_SWITCHER_DISABLED = false;

const SEARCH_MODE_KEY = 'topTradersSearchMode';
const MAX_FETCH_RETRIES = 5;
const FETCH_RETRY_DELAY_MS = 2000;
const DEMO_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
const DEMO_WALLET = 'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o';
const FALLBACK_LOGO_URL = 'https://solana.com/src/img/branding/solanaLogoMark.png';
/** CoinMarketCap generic icon for pump.fun–style tokens when the API supplies no logo. */
const PUMP_MINT_FALLBACK_LOGO_URL =
  'https://s2.coinmarketcap.com/static/img/coins/64x64/36507.png';

const WALLET_PNL_TREND_LEDE =
  'Each row is a snapshot of cumulative realized PnL through that moment. See whether the wallet was building gains, giving them back, or chopping sideways across the last seven days.';

/** Shapes placeholder wallet PnL to match loaded layout (stable column heights). */
const WALLET_PNL_PLACEHOLDER_ASSET_ROW_COUNT = 12;

const TOKEN_TOP_PNL_PLACEHOLDER_ROW_COUNT = 12;

function buildTokenTopPnlPlaceholderRowsHtml(): string {
  const row =
    '<tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td class="token-top-pnl-24h-col">—</td><td>—</td><td class="token-top-pnl-24h-col">—</td></tr>';
  return Array.from({ length: TOKEN_TOP_PNL_PLACEHOLDER_ROW_COUNT }, () => row).join('');
}

function walletPnlTradingLedeInnerHtml(): string {
  const r = getWalletResolution();
  return `Realized and unrealized PnL plus key trade metrics for the <strong>${r}</strong> window used when wallet PnL is fetched.`;
}

function resolveTokenLogoSrc(logoUrl: string | undefined, mintAddress: string | undefined): string {
  const trimmed = (logoUrl || '').trim();
  if (trimmed) return trimmed;
  const mint = (mintAddress || '').trim();
  if (mint.endsWith('pump')) return PUMP_MINT_FALLBACK_LOGO_URL;
  return '';
}
const DEFAULT_TOKEN_RESOLUTION = '30d';
const DEFAULT_WALLET_RESOLUTION = '7d';
const WALLET_TOP_TRADERS_SORT_FIELD = 'realizedPnlUsd';
let lastTokenResolutionBeforeWalletSwitch: string = DEFAULT_TOKEN_RESOLUTION;

function normalizeTokenResolution(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === '1d' || normalized === '7d' || normalized === '30d') return normalized;
  return DEFAULT_TOKEN_RESOLUTION;
}

function getTokenResolutionAfterWalletSwitch(): string {
  const normalized = normalizeTokenResolution(lastTokenResolutionBeforeWalletSwitch);
  if (normalized === '1d' || normalized === '7d') return normalized;
  return DEFAULT_TOKEN_RESOLUTION;
}

function applyWalletTopTradersTitle(): void {
  walletTopTradersTitle.textContent = `Related Wallets (By Realized PnL, ${getWalletResolution()})`;
}

function normalizeWalletResolution(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === '1d' || normalized === '7d' || normalized === '30d') return normalized;
  return DEFAULT_WALLET_RESOLUTION;
}

function getWalletResolution(): string {
  return normalizeWalletResolution(walletTopTradersResolution?.value || DEFAULT_WALLET_RESOLUTION);
}

function getSearchMode(): SearchMode {
  return 'wallet';
}

function setSearchMode(_mode: SearchMode): void {
  localStorage.setItem(SEARCH_MODE_KEY, 'wallet');
}

function firstNonEmptySearchParam(params: URLSearchParams, keys: string[]): string {
  for (const key of keys) {
    const value = (params.get(key) || '').trim();
    if (value) return value;
  }
  return '';
}

/** URL can pre-fill the wallet / ilike search input. */
function initSearchModeFromUrlParams(): void {
  const params = new URLSearchParams(window.location.search);
  const q = firstNonEmptySearchParam(params, [
    'walletAddress',
    'wallet',
    'ownerAddress',
    'address',
    'ilikeFilter',
    'query',
    'mintAddress',
    'mint',
    'token',
  ]);
  if (q) mintInput.value = q;
}

function getEndpointMode(): EndpointMode {
  if (ENDPOINT_HISTORICAL_SWITCHER_DISABLED) return 'realtime';
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  return stored === 'historical' ? 'historical' : 'realtime';
}

function setEndpointMode(mode: EndpointMode): void {
  if (ENDPOINT_HISTORICAL_SWITCHER_DISABLED && mode === 'historical') return;
  localStorage.setItem(MODE_STORAGE_KEY, mode);
}

function getHistResolution(): string {
  const raw = localStorage.getItem(HIST_RES_STORAGE_KEY);
  if (raw === '1d' || raw === '1w' || raw === '1mo') return raw;
  return '1d';
}

function setHistResolution(value: string): void {
  localStorage.setItem(HIST_RES_STORAGE_KEY, value);
}

function histResolutionOptions(): Array<{ value: string; label: string }> {
  return [
    { value: '1d', label: '1d (daily)' },
    { value: '1w', label: '1w (weekly)' },
    { value: '1mo', label: '1mo (monthly)' },
  ];
}

function placeEndpointModeInFilterRow(): void {
  const historical = getEndpointMode() === 'historical';
  const row = historical
    ? historicalInputsBlock.querySelector('.remote-top-row')
    : realtimeExclusiveSurface.querySelector('.remote-top-row');
  if (row) row.insertBefore(endpointModeField, row.firstChild);
}

function applyEndpointModeUI(): void {
  const mode = getEndpointMode();
  const historical = mode === 'historical';

  realtimeExclusiveSurface.hidden = historical;
  historicalInputsBlock.hidden = !historical;
  placeEndpointModeInFilterRow();
  histPnlSection.hidden = !historical;
  topTradersSection.hidden = historical;

  if (historical) {
    const w = mintInput.value.trim();
    if (w && !histWalletAddress.value.trim()) histWalletAddress.value = w;
  }

  histResolution.innerHTML = histResolutionOptions()
    .map((o) => `<option value="${o.value}">${o.label}</option>`)
    .join('');
  const sel = getHistResolution();
  if (histResolutionOptions().some((o) => o.value === sel)) histResolution.value = sel;
  else histResolution.value = '1d';

  const histInputsLocked = historical && HISTORICAL_WALLET_PNL_UNDER_CONSTRUCTION;
  fetchHistoricalPnlBtn.disabled = histInputsLocked;
  histWalletAddress.disabled = histInputsLocked;
  histResolution.disabled = histInputsLocked;
  histTimeStart.disabled = histInputsLocked;
  histTimeEnd.disabled = histInputsLocked;
  fetchHistoricalPnlBtn.title = histInputsLocked
    ? 'Historical wallet PnL timeseries is under construction.'
    : 'Load PnL timeseries for this wallet and resolution.';

  if (historical && HISTORICAL_WALLET_PNL_UNDER_CONSTRUCTION) {
    histPnlMeta.textContent =
      'Historical wallet PnL timeseries is under construction. Switch to Realtime for wallet PnL and related wallets.';
    histPnlTableHead.innerHTML = '<tr><th colspan="2">Status</th></tr>';
    histPnlTableBody.innerHTML =
      '<tr><td colspan="2">Under construction — check back later.</td></tr>';
  }

  endpointModeHistorical.checked = historical;
  endpointModeField.classList.toggle('endpoint-mode-switcher-disabled', ENDPOINT_HISTORICAL_SWITCHER_DISABLED);
  endpointModeHistorical.disabled = ENDPOINT_HISTORICAL_SWITCHER_DISABLED;
  if (ENDPOINT_HISTORICAL_SWITCHER_DISABLED) {
    endpointModeSwitchLabel.title = 'Historical mode is unavailable until that section is ready.';
  } else {
    endpointModeSwitchLabel.title =
      'Switch between Realtime (wallet PnL + related wallets) and Historical (PnL timeseries).';
  }

  applySearchModeUI();
}

interface HistPnlPoint {
  timestamp?: number;
  pnlUsd?: number;
  value?: number;
}

function normalizeHistTimeseries(data: unknown): HistPnlPoint[] {
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    if (Array.isArray(row)) {
      return { timestamp: Number(row[0]), pnlUsd: Number(row[1]) };
    }
    if (typeof row === 'object' && row != null) {
      const obj = row as Record<string, unknown>;
      return {
        timestamp: Number(obj.timestamp ?? obj.time ?? obj.bucketStart ?? 0),
        pnlUsd: Number(
          obj.pnlUsd ?? obj.realizedPnlUsd ?? obj.pnl ?? obj.value ?? 0
        ),
        value: Number(obj.value ?? obj.pnlUsd ?? obj.pnl ?? 0),
      };
    }
    return {};
  });
}

/** Unix seconds: 24 hours before current moment (default timeEnd on load). */
function getUnixNowMinus24Hours(): number {
  return Math.floor(Date.now() / 1000) - 24 * 60 * 60;
}

/** Set historical timeEnd default on every full page load. */
function applyDefaultHistTimeEndOnLoad(): void {
  histTimeEnd.value = String(getUnixNowMinus24Hours());
}

function formatHistDateTime(ts: number | null | undefined): string {
  if (ts == null || Number.isNaN(Number(ts))) return '—';
  const n = Number(ts);
  const ms = n > 10_000_000_000 ? n : n * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '—';
  const weekday = d.toLocaleString('en-US', { weekday: 'long' });
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${weekday} ${month} ${day} ${year} ${hh}:${mm}`;
}

function formatHistUsd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const rounded = Math.abs(n) < 10 ? n.toFixed(2) : Math.round(n).toLocaleString();
  return `$${rounded} USD`;
}

function renderHistTable(points: HistPnlPoint[], wallet: string, resolution: string): void {
  const tsMs = (t: number | undefined): number => {
    if (t == null || Number.isNaN(Number(t))) return 0;
    const n = Number(t);
    return n > 10_000_000_000 ? n : n * 1000;
  };
  const sorted = [...points].sort((a, b) => tsMs(b.timestamp) - tsMs(a.timestamp));

  histPnlMeta.textContent = sorted.length
    ? `Wallet ${wallet.slice(0, 4)}…${wallet.slice(-4)} · ${resolution} · ${sorted.length} point(s).`
    : 'No historical points returned.';
  histPnlTableHead.innerHTML = '<tr><th>Timestamp</th><th style="text-align:right">PnL (USD)</th></tr>';
  histPnlTableBody.innerHTML = sorted.length
    ? sorted
        .map((p) => {
          const val = (p.pnlUsd ?? p.value ?? 0) as number;
          const usdHtml = formatHistUsd(val);
          const pnlClass =
            usdHtml === '—' ? '' : 'usd-tone usd-tone--positive';
          return `<tr><td>${formatHistDateTime(p.timestamp)}</td><td style="text-align:right"${pnlClass ? ` class="${pnlClass}"` : ''}>${usdHtml}</td></tr>`;
        })
        .join('')
    : '<tr><td>—</td><td>—</td></tr>';
}

async function loadHistoricalPnlTimeseries(): Promise<void> {
  if (HISTORICAL_WALLET_PNL_UNDER_CONSTRUCTION) {
    histPnlMeta.textContent =
      'Historical wallet PnL timeseries is under construction. Switch to Realtime for wallet PnL and related wallets.';
    histPnlTableHead.innerHTML = '<tr><th colspan="2">Status</th></tr>';
    histPnlTableBody.innerHTML =
      '<tr><td colspan="2">Under construction — check back later.</td></tr>';
    return;
  }
  const wallet = histWalletAddress.value.trim();
  if (!wallet) return;
  const resolution = histResolution.value || '1d';
  const qs = new URLSearchParams();
  qs.set('resolution', resolution);
  const tsRaw = histTimeStart.value.trim();
  const teRaw = histTimeEnd.value.trim();
  if (tsRaw !== '' && !Number.isNaN(Number(tsRaw)) && Number(tsRaw) >= 0) {
    qs.set('timeStart', String(Math.floor(Number(tsRaw))));
  }
  if (teRaw !== '' && !Number.isNaN(Number(teRaw)) && Number(teRaw) >= 0) {
    qs.set('timeEnd', String(Math.floor(Number(teRaw))));
  }

  fetchHistoricalPnlBtn.disabled = true;
  histLoadingIndicator.hidden = false;
  try {
    const res = await fetchWithRetry(
      `/api/wallets/${encodeURIComponent(wallet)}/pnl-ts?${qs.toString()}`
    );
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: string };
      histPnlMeta.textContent = errBody.error
        ? `Request failed (${res.status}): ${errBody.error}`
        : `Request failed (${res.status}).`;
      histPnlTableHead.innerHTML = '<tr><th>—</th></tr>';
      histPnlTableBody.innerHTML = '<tr><td>—</td></tr>';
      return;
    }
    const json = (await res.json().catch(() => ({}))) as { data?: unknown[] };
    renderHistTable(normalizeHistTimeseries(json.data), wallet, resolution);
  } finally {
    histLoadingIndicator.hidden = true;
    if (!HISTORICAL_WALLET_PNL_UNDER_CONSTRUCTION) {
      fetchHistoricalPnlBtn.disabled = false;
    }
  }
}

function applySearchModeUI(): void {
  searchInputLabel.innerHTML =
    '<span class="label-icon field-icon icon-user" aria-hidden="true"></span>Wallet address or name (ilikeFilter)';
  mintInput.placeholder = `e.g. ${DEMO_WALLET}`;
  const currentValue = mintInput.value.trim();
  if (!currentValue || currentValue === DEMO_MINT) {
    mintInput.value = DEMO_WALLET;
  }
  if (fetchAllBtnText) fetchAllBtnText.textContent = 'Load Wallet PnL';
  else fetchAllBtn.textContent = 'Load Wallet PnL';
  tokenSection.hidden = true;
  tokenSupplyPanelTotal.hidden = true;
  tokenTopPnlSection.hidden = true;
  topTradersSection.hidden = getEndpointMode() === 'historical';
  if (fetchActions.parentElement !== walletActionsTarget) walletActionsTarget.appendChild(fetchActions);
  if (loadingIndicator.parentElement !== walletLoadingSlot) walletLoadingSlot.appendChild(loadingIndicator);
  document
    .querySelectorAll<HTMLElement>('.wallet-only-control, .wallet-only-row')
    .forEach((el) => {
      el.hidden = false;
    });
  walletLabelField.hidden = true;
  walletPageField.hidden = true;
  document.querySelectorAll<HTMLElement>('.token-only-control').forEach((el) => {
    el.hidden = true;
  });
  topTradersMeta.hidden = true;
  topTradersCards.hidden = true;
  applyWalletTopTradersTitle();
  requestAnimationFrame(() => syncWalletPieStackHeights());
}

function truncateAddress(addr: string | undefined): string {
  if (!addr || addr.length <= 12) return addr ?? '';
  return `${addr.slice(0, 4)}....${addr.slice(-4)}`;
}

/** Mint in token stats: `AAAAA....BBBBB` for long addresses (full value in `title`). */
function truncateMintMiddle(mint: string | undefined, head = 5, tail = 5): string {
  const m = (mint || '').trim();
  if (!m) return '';
  if (m.length <= head + tail + 4) return m;
  return `${m.slice(0, head)}....${m.slice(-tail)}`;
}

const TOKEN_HIGHLIGHT_NAME_MAX_LEN = 12;

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncateTokenHighlightLinkText(text: string): string {
  const t = text.trim();
  if (t.length <= TOKEN_HIGHLIGHT_NAME_MAX_LEN) return t;
  return `${t.slice(0, TOKEN_HIGHLIGHT_NAME_MAX_LEN)}...`;
}

function renderTruncatedTokenMintLink(token: WalletPnlSummaryTokenRef, pnlUsd?: number): string {
  const mint = (token.mintAddress || '').trim();
  if (!mint) return '—';
  const raw = token.tokenSymbol || token.tokenName || truncateAddress(mint);
  const titleAttr = escapeHtmlAttr(`${raw} · ${mint}`);
  const pnlPart = pnlUsd != null ? ` (${formatUsdFull(pnlUsd)})` : '';
  return `<a href="https://vybe.fyi/tokens/${encodeURIComponent(mint)}" target="_blank" class="mono" title="${titleAttr}">${truncateTokenHighlightLinkText(raw)}</a>${pnlPart}`;
}

function formatNum(n: number | string | null | undefined): string {
  if (n == null) return '—';
  if (typeof n === 'number') {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(4);
  }
  return String(n);
}

function formatInt(n: number | null | undefined): string {
  if (n == null) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.round(num).toLocaleString();
}

/**
 * Compact $ suffix for |value| > 9999 — whole-number K / M / B only (no fractional part).
 */
function formatUsdCompactCore(abs: number): string {
  if (abs >= 1e9) {
    return `${Math.round(abs / 1e9)}B`;
  }
  if (abs >= 1e6) {
    return `${Math.round(abs / 1e6)}M`;
  }
  const k = Math.round(abs / 1e3);
  if (k >= 1000) {
    return `${Math.round(abs / 1e6)}M`;
  }
  return `${k}K`;
}

function formatUsdFull(n: number | null | undefined): string {
  if (n == null) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  const roundedToCent = Math.round(num * 100) / 100;
  if (roundedToCent === 0) return '$0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs < 1) return `${sign}$${abs.toFixed(2)}`;
  if (abs > 9999) {
    return `${sign}$${formatUsdCompactCore(abs)}`;
  }
  return `${sign}$${Math.abs(Math.round(num)).toLocaleString()}`;
}

function usdToneClass(n: number | null | undefined): string {
  const num = Number(n);
  if (!Number.isFinite(num)) return 'usd-tone--neutral';
  if (num > 0) return 'usd-tone--positive';
  if (num < 0) return 'usd-tone--negative';
  return 'usd-tone--neutral';
}

function formatUsdCell(n: number | null | undefined): string {
  return `<span class="usd-tone ${usdToneClass(n)}">${formatUsdFull(n)}</span>`;
}

/**
 * Top PnL traders table only: no K/M suffixes; `B` only for ≥ $1B. No fractional dollars unless amount is below $1.
 */
function formatUsdTokenTopPnlTable(n: number | null | undefined): string {
  if (n == null) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  if (num === 0) return '$0';
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs < 1) {
    return `${sign}$${abs.toFixed(2)}`;
  }
  if (abs >= 1e9) {
    return `${sign}$${Math.round(abs / 1e9)}B`;
  }
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

function formatUsdCellTokenTopPnl(n: number | null | undefined): string {
  return `<span class="usd-tone ${usdToneClass(n)}">${formatUsdTokenTopPnlTable(n)}</span>`;
}

/** Realized PnL ÷ volume for the row (RoV %); used in top-PnL table, not the volume-by-PnL pie. */
function formatRovPctCell(row: TokenTopPnlTraderRow): string {
  const pct = traderRoiPercentFromRow(row);
  if (pct == null) return '<span class="usd-tone usd-tone--neutral">—</span>';
  return `<span class="usd-tone ${usdToneClass(pct)}">${formatPctSmart(pct)}</span>`;
}

/** Sell USD volume ÷ buy USD volume. */
function computeWalletAssetGainRatio(
  buyVolUsd: number | string | null | undefined,
  sellVolUsd: number | string | null | undefined
): number | null {
  const buy = Number(buyVolUsd);
  const sell = Number(sellVolUsd);
  if (!Number.isFinite(buy) || buy <= 0 || !Number.isFinite(sell) || sell < 0) return null;
  const ratio = sell / buy;
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  return ratio;
}

/** Ratio under 5 → two decimals + "x", else floored integer + "x". */
function formatGainMultiplierLabel(ratio: number): string {
  if (ratio < 5) {
    return `${ratio.toFixed(2)}x`;
  }
  return `${Math.floor(ratio)}x`;
}

/** Mean sell/buy gain for assets-table rows with ratio > 1 vs ≤ 1 (same ratio as Gain column). */
function avgGainMultFromTableByGainGroups(metrics: WalletPnlTokenMetric[]): {
  aboveOneAvg: number | null;
  atOrBelowOneAvg: number | null;
} {
  const aboveOne: number[] = [];
  const atOrBelowOne: number[] = [];
  for (const m of metrics) {
    const ratio = computeWalletAssetGainRatio(m.buys?.volumeUsd, m.sells?.volumeUsd);
    if (ratio == null) continue;
    if (ratio > 1) aboveOne.push(ratio);
    else atOrBelowOne.push(ratio);
  }
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return {
    aboveOneAvg: aboveOne.length ? sum(aboveOne) / aboveOne.length : null,
    atOrBelowOneAvg: atOrBelowOne.length ? sum(atOrBelowOne) / atOrBelowOne.length : null,
  };
}

function formatWinLoseTradesChipValueHtml(
  count: number | null | undefined,
  avgMult: number | null,
  tone: 'pos' | 'neg'
): string {
  const countStr = formatIntFull(count);
  const posNegClass = tone === 'pos' ? 'usd-tone usd-tone--positive' : 'usd-tone usd-tone--negative';
  if (countStr === '—') {
    return `<span class="usd-tone usd-tone--neutral">${countStr}</span>`;
  }
  if (avgMult == null || !Number.isFinite(avgMult)) {
    return `<span class="${posNegClass}"><span class="wallet-pnl-trade-chip-count">${countStr}</span></span>`;
  }
  return `<span class="${posNegClass}"><span class="wallet-pnl-trade-chip-count">${countStr}</span><span class="wallet-pnl-trade-chip-avg"> (${formatGainMultiplierLabel(avgMult)} Avg)</span></span>`;
}

const GAIN_ONE_X_EPS = 0.0005;
/** Light end of the >1× range (weakest gain still above 1). */
const GAIN_GREEN_LIGHT = '#86efac';
/** Saturated green for the best (highest) gain in the response. */
const GAIN_GREEN_NORMAL = '#22c55e';
const GAIN_YELLOW = '#eab308';
/** Saturated red for the worst (lowest) gain below 1. */
const GAIN_RED_NORMAL = '#ef4444';
/** Light red closest to 1× among losers. */
const GAIN_RED_LIGHT = '#f87171';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpHex(from: string, to: string, t: number): string {
  const u = Math.max(0, Math.min(1, t));
  const A = hexToRgb(from);
  const B = hexToRgb(to);
  return `#${lerpChannel(A.r, B.r, u).toString(16).padStart(2, '0')}${lerpChannel(A.g, B.g, u)
    .toString(16)
    .padStart(2, '0')}${lerpChannel(A.b, B.b, u).toString(16).padStart(2, '0')}`;
}

/** `h`, `s`, `l` as in CSS: hue 0–360, saturation and lightness 0–100. */
function hslToHex(h: number, s: number, l: number): string {
  const H = ((h % 360) + 360) % 360;
  const S = Math.max(0, Math.min(100, s)) / 100;
  const L = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = L - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (H < 60) {
    rp = c;
    gp = x;
  } else if (H < 120) {
    rp = x;
    gp = c;
  } else if (H < 180) {
    gp = c;
    bp = x;
  } else if (H < 240) {
    gp = x;
    bp = c;
  } else if (H < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }
  const r = Math.round((rp + m) * 255);
  const g = Math.round((gp + m) * 255);
  const b = Math.round((bp + m) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function parseHslCss(input: string): { h: number; s: number; l: number } | null {
  const m = input.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/);
  if (!m) return null;
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

type WalletGainColorBounds = {
  minAbove1: number | null;
  maxAbove1: number | null;
  minBelow1: number | null;
  maxBelow1: number | null;
};

function collectWalletGainColorBounds(metrics: WalletPnlTokenMetric[]): WalletGainColorBounds {
  const aboveOne: number[] = [];
  const belowOneClosed: number[] = [];
  for (const m of metrics) {
    const r = computeWalletAssetGainRatio(m.buys?.volumeUsd, m.sells?.volumeUsd);
    if (r == null) continue;
    if (r > 1 + GAIN_ONE_X_EPS) aboveOne.push(r);
    else if (r < 1 - GAIN_ONE_X_EPS && isWalletPositionClosed(m.status)) belowOneClosed.push(r);
  }
  return {
    minAbove1: aboveOne.length ? Math.min(...aboveOne) : null,
    maxAbove1: aboveOne.length ? Math.max(...aboveOne) : null,
    minBelow1: belowOneClosed.length ? Math.min(...belowOneClosed) : null,
    maxBelow1: belowOneClosed.length ? Math.max(...belowOneClosed) : null,
  };
}

function gainMultiplierDisplayColor(
  ratio: number,
  b: WalletGainColorBounds,
  status: string | null | undefined
): string {
  if (Math.abs(ratio - 1) <= GAIN_ONE_X_EPS) {
    return GAIN_YELLOW;
  }
  if (ratio > 1) {
    if (b.minAbove1 == null || b.maxAbove1 == null) return GAIN_GREEN_NORMAL;
    const span = b.maxAbove1 - b.minAbove1;
    if (span <= 1e-9) return GAIN_GREEN_NORMAL;
    const t = (ratio - b.minAbove1) / span;
    return lerpHex(GAIN_GREEN_LIGHT, GAIN_GREEN_NORMAL, t);
  }
  if (!isWalletPositionClosed(status)) {
    return GAIN_YELLOW;
  }
  if (b.minBelow1 == null || b.maxBelow1 == null) return GAIN_RED_NORMAL;
  const span = b.maxBelow1 - b.minBelow1;
  if (span <= 1e-9) return GAIN_RED_NORMAL;
  const t = (ratio - b.minBelow1) / span;
  return lerpHex(GAIN_RED_NORMAL, GAIN_RED_LIGHT, t);
}

function renderWalletAssetGainCell(metric: WalletPnlTokenMetric, bounds: WalletGainColorBounds): string {
  const ratio = computeWalletAssetGainRatio(metric.buys?.volumeUsd, metric.sells?.volumeUsd);
  if (ratio == null) return '—';
  const color = gainMultiplierDisplayColor(ratio, bounds, metric.status);
  const label = formatGainMultiplierLabel(ratio);
  return `<span class="wallet-asset-gain" style="color:${color}">${label}</span>`;
}

function formatIntFull(n: number | null | undefined): string {
  if (n == null) return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return Math.round(num).toLocaleString();
}

function formatTradesCountCell(n: number | null | undefined): string {
  const text = formatIntFull(n);
  if (text === '—') return text;
  const num = Number(n);
  if (num === 0) {
    return `<span class="usd-tone usd-tone--neutral">${text}</span>`;
  }
  return text;
}

function calcTradeGradientT(n: number | null | undefined, min: number, max: number): number {
  const value = Number(n);
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;
  const safeMax = Math.max(min, max);
  const greenThreshold = 9;
  if (value <= greenThreshold || safeMax <= greenThreshold) return 0;
  const normalized = (value - greenThreshold) / (safeMax - greenThreshold);
  const clamped = Math.max(0, Math.min(1, normalized));
  // Any value above 9 should start shifting away from pure green.
  return 0.2 + (clamped * 0.8);
}

function formatTradesCountHeatCell(
  n: number | null | undefined,
  min: number,
  max: number
): string {
  const text = formatIntFull(n);
  if (text === '—') return text;
  const num = Number(n);
  if (num === 0) {
    return `<span class="usd-tone usd-tone--neutral">${text}</span>`;
  }
  const t = calcTradeGradientT(n, min, max);
  const hardT = num > 300 ? 1 : num > 100 ? 0.8 : t;
  return `<span class="trade-count-heat" style="--trade-grad-t:${hardT.toFixed(4)}">${text}</span>`;
}

function pickPreferredNumber(
  preferred: number | null | undefined,
  fallback: number | null | undefined
): number | undefined {
  const preferredNum = Number(preferred);
  if (Number.isFinite(preferredNum)) return preferredNum;
  const fallbackNum = Number(fallback);
  if (Number.isFinite(fallbackNum)) return fallbackNum;
  return undefined;
}

function pickPreferredString(
  preferred: string | null | undefined,
  fallback: string | null | undefined
): string | undefined {
  const preferredText = (preferred ?? '').trim();
  if (preferredText) return preferredText;
  const fallbackText = (fallback ?? '').trim();
  return fallbackText || undefined;
}

function pickPreferredList<T>(
  preferred: T[] | null | undefined,
  fallback: T[] | null | undefined
): T[] | undefined {
  if (Array.isArray(preferred) && preferred.length > 0) return preferred;
  if (Array.isArray(fallback) && fallback.length > 0) return fallback;
  return undefined;
}

function mergeTokenRef(
  preferred?: WalletPnlSummaryTokenRef,
  fallback?: WalletPnlSummaryTokenRef
): WalletPnlSummaryTokenRef | undefined {
  if (!preferred && !fallback) return undefined;
  return {
    mintAddress: pickPreferredString(preferred?.mintAddress, fallback?.mintAddress),
    pnlUsd: pickPreferredNumber(preferred?.pnlUsd, fallback?.pnlUsd),
    tokenName: pickPreferredString(preferred?.tokenName, fallback?.tokenName),
    tokenSymbol: pickPreferredString(preferred?.tokenSymbol, fallback?.tokenSymbol),
    tokenLogoUrl: pickPreferredString(preferred?.tokenLogoUrl, fallback?.tokenLogoUrl),
  };
}

function mergeWalletSummary(
  walletSummary?: WalletPnlSummary,
  topMetrics?: TopTraderRow['metrics']
): WalletPnlSummary {
  return {
    averageTradeUsd: pickPreferredNumber(walletSummary?.averageTradeUsd, undefined),
    bestPerformingToken: mergeTokenRef(walletSummary?.bestPerformingToken, topMetrics?.bestPerformingToken),
    losingTradesCount: pickPreferredNumber(walletSummary?.losingTradesCount, undefined),
    pnlTrendSevenDays: pickPreferredList(walletSummary?.pnlTrendSevenDays, topMetrics?.sevenDayPnl),
    realizedPnlUsd: pickPreferredNumber(walletSummary?.realizedPnlUsd, topMetrics?.realizedPnlUsd),
    tradesCount: pickPreferredNumber(walletSummary?.tradesCount, topMetrics?.tradesCount),
    tradesVolumeUsd: pickPreferredNumber(walletSummary?.tradesVolumeUsd, topMetrics?.tradesVolumeUsd),
    uniqueTokensTraded: pickPreferredNumber(walletSummary?.uniqueTokensTraded, topMetrics?.uniqueTokensTraded),
    unrealizedPnlUsd: pickPreferredNumber(walletSummary?.unrealizedPnlUsd, topMetrics?.unrealizedPnlUsd),
    winRate: pickPreferredNumber(walletSummary?.winRate, topMetrics?.winRate),
    winningTradesCount: pickPreferredNumber(walletSummary?.winningTradesCount, undefined),
    worstPerformingToken: mergeTokenRef(walletSummary?.worstPerformingToken, topMetrics?.worstPerformingToken),
  };
}

function renderLogoImage(url: string | undefined, alt: string, tokenMint?: string): string {
  const src =
    tokenMint !== undefined
      ? resolveTokenLogoSrc(url, tokenMint) || FALLBACK_LOGO_URL
      : (url || '').trim() || FALLBACK_LOGO_URL;
  return `<img src="${src}" alt="${alt}" class="wallet-logo-avatar" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_LOGO_URL}'" />`;
}

function renderWalletProfileAvatar(url: string | undefined, alt: string): string {
  const src = (url || '').trim() || FALLBACK_LOGO_URL;
  return `<img src="${src}" alt="${alt}" class="wallet-pnl-profile-avatar" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_LOGO_URL}'" />`;
}

function formatBlocktime(blocktime: number | null | undefined): string {
  const num = Number(blocktime);
  if (!Number.isFinite(num) || num <= 0) return '—';
  const d = new Date(num * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const dd = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const yy = pad(d.getFullYear() % 100);
  return `${hh}:${mm} ${dd}/${month}/${yy}`;
}

/** e.g. "Saturday April 24 17:00" (local), for 7d PnL trend table */
function formatPnlTrendPointTime(tsMs: number): string {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return '—';
  const weekday = d.toLocaleString('en-US', { weekday: 'long' });
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${weekday} ${month} ${day} ${hh}:${mm}`;
}

function renderSignaturePopupLink(signature: string | null | undefined, label = 'Open TX'): string {
  const sig = (signature || '').trim();
  if (!sig) return '—';
  const href = `https://solscan.io/tx/${encodeURIComponent(sig)}`;
  const lowerLabel = label.toLowerCase();
  const toneClass = lowerLabel.includes('buy')
    ? 'wallet-tx-tone--buy'
    : lowerLabel.includes('sell')
      ? 'wallet-tx-tone--sell'
      : '';
  return `<a href="${href}" target="_blank" class="wallet-tx-link ${toneClass}" title="${sig}" onclick="window.open(this.href,'solscanTx','popup=yes,width=1100,height=780'); return false;">${label}<span class="wallet-tx-popup-icon" aria-hidden="true">↗</span></a>`;
}

function renderLatestTradeCell(
  blocktime: number | null | undefined,
  signature: string | null | undefined,
  label = 'Open TX'
): string {
  return `<div class="wallet-tx-datetime">${formatBlocktime(blocktime)}</div>${renderSignaturePopupLink(signature, label)}`;
}

function pickLatestTradeSide(metric: WalletPnlTokenMetric): {
  blocktime: number | undefined;
  signature: string | undefined;
  label: string;
} {
  const buyBlock = Number(metric.buys?.latestTradeBlocktime);
  const sellBlock = Number(metric.sells?.latestTradeBlocktime);
  const hasBuy = Number.isFinite(buyBlock) && buyBlock > 0;
  const hasSell = Number.isFinite(sellBlock) && sellBlock > 0;

  if (hasBuy && (!hasSell || buyBlock >= sellBlock)) {
    return {
      blocktime: buyBlock,
      signature: (metric.buys?.latestTradeSignature || '').trim() || undefined,
      label: 'Open Buy TX',
    };
  }
  if (hasSell) {
    return {
      blocktime: sellBlock,
      signature: (metric.sells?.latestTradeSignature || '').trim() || undefined,
      label: 'Open Sell TX',
    };
  }
  return {
    blocktime: Number(metric.latestTradeBlocktime) || undefined,
    signature: undefined,
    label: 'Open TX',
  };
}

type WalletPieSlice = {
  label: string;
  value: number;
  color: PieSliceSpec;
  /** Weighted avg sell/buy mult (win/lose pie legend). */
  avgGainMult?: number | null;
};

function walletPieLegendUsesAvgRow(pieTitle: string): boolean {
  const t = pieTitle.toLowerCase();
  return t.includes('winning') && t.includes('losing');
}

function walletPieCountUnitWord(pieTitle: string): string {
  const t = pieTitle.toLowerCase();
  return t.includes('position') ? 'positions' : 'trades';
}

/** Same normalization as {@link renderWalletPieCard} conic gradient slices. */
function normalizedWalletPieSlices(slices: WalletPieSlice[]): {
  pctSlices: number[];
  fills: PieSliceSpec[];
  total: number;
} | null {
  const normalized = slices
    .map((slice) => ({ ...slice, value: Math.max(0, Number(slice.value) || 0) }))
    .filter((slice) => slice.value > 0);
  const total = normalized.reduce((sum, slice) => sum + slice.value, 0);
  if (total <= 0) return null;
  return {
    pctSlices: normalized.map((slice) => (slice.value / total) * 100),
    fills: normalized.map((slice) => slice.color),
    total,
  };
}

/**
 * Wallet donut charts share token-mode SVG slice labels ({@link mountDonutPieOverlays}); center hub is omitted.
 */
function mountWalletPieDonutOverlays(
  root: HTMLElement,
  configs: { slices: WalletPieSlice[] }[]
): void {
  const pies = root.querySelectorAll<HTMLElement>(
    '.wallet-pnl-card--pie .wallet-pnl-pie-chart.token-supply-pie'
  );
  pies.forEach((pie, i) => {
    const cfg = configs[i];
    clearDonutPieOverlays(pie);
    if (!cfg) {
      pie.style.background = buildPieGradientWithGaps([1], ['#27272a']);
      return;
    }
    const norm = normalizedWalletPieSlices(cfg.slices);
    if (!norm) {
      pie.style.background = buildPieGradientWithGaps([1], ['#27272a']);
      return;
    }
    pie.style.background = buildPieGradientWithGaps(norm.pctSlices, norm.fills);
    mountDonutPieOverlays(pie, norm.pctSlices, norm.fills, null, { showSliceLabels: false });
  });
}

/** >1× green/up, ~1× yellow/O, <1× red/down (same ε as gain-ratio grouping). */
function walletPieAvgGainTone(mult: number): 'up' | 'flat' | 'down' {
  if (mult > 1 + GAIN_ONE_X_EPS) return 'up';
  if (mult < 1 - GAIN_ONE_X_EPS) return 'down';
  return 'flat';
}

function buildWalletPieAvgGainRow(mult: number | null | undefined): {
  bodyHtml: string;
  iconTone: 'up' | 'flat' | 'down' | 'neutral';
  iconChar: string;
} {
  if (mult == null || !Number.isFinite(mult)) {
    return {
      bodyHtml: `<span class="token-tier-metric__muted">${escapeHtmlText('—')}</span>`,
      iconTone: 'neutral',
      iconChar: '',
    };
  }
  const t = walletPieAvgGainTone(mult);
  const iconChar = t === 'up' ? '↑' : t === 'down' ? '↓' : 'O';
  const multClass =
    t === 'up'
      ? 'token-tier-wallet-avg-mult token-tier-wallet-avg-mult--up'
      : t === 'down'
        ? 'token-tier-wallet-avg-mult token-tier-wallet-avg-mult--down'
        : 'token-tier-wallet-avg-mult token-tier-wallet-avg-mult--flat';
  return {
    bodyHtml: `<span class="${multClass}">${escapeHtmlText(formatGainMultiplierLabel(mult))}</span><span class="token-tier-metric__muted"> Avg</span>`,
    iconTone: t,
    iconChar,
  };
}

/** One slice card: title + share row + count row + optional avg row (token-tier-card pattern). */
function walletPieLegendTierCardHtml(opts: {
  accent: string;
  swatchBg: string;
  titleEscaped: string;
  pctBodyHtml: string;
  countBodyHtml: string;
  avgRow: { bodyHtml: string; iconTone: 'up' | 'flat' | 'down' | 'neutral'; iconChar: string } | null;
  placeholder?: boolean;
}): string {
  const ph = opts.placeholder ? ' token-tier-card--placeholder' : '';
  const avgLi =
    opts.avgRow != null
      ? `<li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--pnl token-tier-metric__ico--wallet-avg token-tier-metric__ico--wallet-avg--${opts.avgRow.iconTone}" aria-hidden="true">${opts.avgRow.iconChar}</span>
          <div class="token-tier-metric__body">${opts.avgRow.bodyHtml}</div>
        </li>`
      : '';
  return `<div class="token-supply-legend-item token-supply-legend-item--tier-dashboard">
    <article class="token-tier-card token-tier-card--wallet-pie-legend${ph}" style="--tier-accent:${opts.accent}">
      <h4 class="token-tier-card__title token-tier-card__title--wallet-pie">${opts.titleEscaped}</h4>
      <ul class="token-tier-card__metrics token-tier-card__metrics--wallet-pie-expanded">
        <li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--share-swatch" style="--tier-swatch:${opts.swatchBg}" aria-hidden="true"></span>
          <div class="token-tier-metric__body">${opts.pctBodyHtml}</div>
        </li>
        <li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--layers" aria-hidden="true">${TIER_LEGEND_SVG_STACK}</span>
          <div class="token-tier-metric__body">${opts.countBodyHtml}</div>
        </li>
        ${avgLi}
      </ul>
    </article>
  </div>`;
}

function renderWalletPieCard(title: string, slices: WalletPieSlice[]): string {
  const normalized = slices
    .map((slice) => ({ ...slice, value: Math.max(0, Number(slice.value) || 0) }))
    .filter((slice) => slice.value > 0);
  const total = normalized.reduce((sum, slice) => sum + slice.value, 0);
  if (total <= 0) {
    const dash = '—';
    const dashEsc = escapeHtmlText(dash);
    const t = title.toLowerCase();
    const isWinLose = t.includes('winning') || t.includes('losing');
    const isOpenClosed = t.includes('open') && t.includes('closed') && t.includes('position');
    const neutralRing = '#27272a';
    const neutralAccent = '#52525b';
    const neutralSwatch = '#52525b';
    const emptyBg = buildPieGradientWithGaps([1], [neutralRing]);
    const legendRows = isWinLose || isOpenClosed ? 2 : 3;
    const showAvgPh = walletPieLegendUsesAvgRow(title);
    const pctPh = `<span class="token-tier-metric__muted">${dashEsc}</span>`;
    const countPh = `<span class="token-tier-metric__muted">${dashEsc}</span>`;
    const avgRowPh = showAvgPh
      ? { bodyHtml: `<span class="token-tier-metric__muted">${dashEsc}</span>`, iconTone: 'neutral' as const, iconChar: '' }
      : null;
    const legendHtml = Array.from({ length: legendRows }, () =>
      walletPieLegendTierCardHtml({
        accent: neutralAccent,
        swatchBg: neutralSwatch,
        titleEscaped: dashEsc,
        pctBodyHtml: pctPh,
        countBodyHtml: countPh,
        avgRow: avgRowPh,
        placeholder: true,
      })
    ).join('');
    return `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--pie">
      <h3 class="token-stats-group-title"><span>${title}</span></h3>
      <div class="wallet-pnl-pie-wrap">
        <div class="wallet-pnl-pie-chart token-supply-pie token-supply-pie--donut-labels" role="img" aria-label="${title}" style="background:${emptyBg}"></div>
        <div class="wallet-pnl-pie-legend token-supply-legend token-supply-legend--tier-dashboard wallet-pnl-pie-legend--tier-match">${legendHtml}</div>
      </div>
    </section>`;
  }
  const pctSlices = normalized.map((slice) => (slice.value / total) * 100);
  const pieGradient = buildPieGradientWithGaps(pctSlices, normalized.map((slice) => slice.color));
  const unitWord = walletPieCountUnitWord(title);
  const showAvg = walletPieLegendUsesAvgRow(title);
  const legendHtml = normalized
    .map((slice) => {
      const pct = (slice.value / total) * 100;
      const accent = pieSliceAccentSolid(slice.color);
      const swatchBg = pieSliceLegendBackground(slice.color);
      const pctBodyHtml = `<span class="token-tier-metric__slice-pct">${formatPctSmart(pct)}</span><span class="token-tier-metric__muted"> share</span>`;
      const countBodyHtml = `<span class="token-tier-metric__emph">${formatIntFull(slice.value)}</span><span class="token-tier-metric__muted"> ${unitWord}</span>`;
      const avgRow = showAvg ? buildWalletPieAvgGainRow(slice.avgGainMult) : null;
      return walletPieLegendTierCardHtml({
        accent,
        swatchBg,
        titleEscaped: escapeHtmlText(slice.label),
        pctBodyHtml,
        countBodyHtml,
        avgRow,
      });
    })
    .join('');
  return `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--pie">
    <h3 class="token-stats-group-title"><span>${title}</span></h3>
    <div class="wallet-pnl-pie-wrap">
      <div class="wallet-pnl-pie-chart token-supply-pie token-supply-pie--donut-labels" role="img" aria-label="${title}" style="background:${pieGradient}"></div>
      <div class="wallet-pnl-pie-legend token-supply-legend token-supply-legend--tier-dashboard wallet-pnl-pie-legend--tier-match">${legendHtml}</div>
    </div>
  </section>`;
}

function syncWalletPieStackHeights(): void {
  const trendCard = walletPnlDetails.querySelector('.wallet-pnl-card--trend') as HTMLElement | null;
  const pieStack = walletPnlDetails.querySelector('.wallet-pnl-pie-stack') as HTMLElement | null;
  if (!trendCard || !pieStack) return;
  if (window.innerWidth <= 1100) {
    pieStack.style.height = '';
    return;
  }
  const h = trendCard.getBoundingClientRect().height;
  // Section hidden (e.g. token mode) yields 0 — do not persist 0px or pie stack collapses after mode switch.
  if (h <= 1) {
    pieStack.style.height = '';
    return;
  }
  pieStack.style.height = `${Math.max(0, Math.round(h))}px`;
}

function renderStatusBadge(status: string | null | undefined): string {
  const value = (status || '').trim().toLowerCase();
  if (!value) return '—';
  if (value === 'open') {
    return '<span class="wallet-status-badge wallet-status-badge--open">open</span>';
  }
  if (value === 'closed') {
    return '<span class="wallet-status-badge wallet-status-badge--closed">closed</span>';
  }
  return `<span class="wallet-status-badge">${value}</span>`;
}

function isWalletPositionClosed(status: string | null | undefined): boolean {
  return (status || '').trim().toLowerCase() === 'closed';
}

function renderWalletAssetBuySellAmtCell(metric: WalletPnlTokenMetric): string {
  const buyText = formatNum(metric.buys?.tokenAmount);
  const sellText = formatNum(metric.sells?.tokenAmount);
  return `<div class="wallet-asset-buysell-amt">
    <div class="wallet-amt-stack-row"><span class="wallet-amt-stack-value wallet-amt-stack-value--buy">${buyText}</span><span class="wallet-amt-side-icon wallet-amt-side-icon--buy" aria-hidden="true">▲</span></div>
    <div class="wallet-amt-stack-row"><span class="wallet-amt-stack-value wallet-amt-stack-value--sell">${sellText}</span><span class="wallet-amt-side-icon wallet-amt-side-icon--sell" aria-hidden="true">▼</span></div>
  </div>`;
}

function buildWalletPnlPlaceholder(): string {
  const dash = '—';
  const dummyAssetRows = Array.from({ length: WALLET_PNL_PLACEHOLDER_ASSET_ROW_COUNT }, () => {
    return `<tr>
        <td class="wallet-asset-icon-cell">${dash}</td>
        <td>${dash}</td>
        <td class="wallet-asset-buysell-amt-cell"><div class="wallet-asset-buysell-amt"><div class="wallet-amt-stack-row"><span class="wallet-amt-stack-value wallet-amt-stack-value--buy">${dash}</span><span class="wallet-amt-side-icon wallet-amt-side-icon--buy" aria-hidden="true">▲</span></div><div class="wallet-amt-stack-row"><span class="wallet-amt-stack-value wallet-amt-stack-value--sell">${dash}</span><span class="wallet-amt-side-icon wallet-amt-side-icon--sell" aria-hidden="true">▼</span></div></div></td>
        <td>${dash}</td>
        <td>${dash}</td>
        <td>${dash}</td>
        <td>${dash}</td>
        <td>${dash}</td>
        <td>${dash}</td>
        <td>${dash}</td>
        <td>${dash}</td>
        <td class="wallet-asset-tx-cell">${dash}</td>
      </tr>`;
  }).join('');

  const phHighlightFilled = (kind: 'best' | 'worst'): string => {
    const isBest = kind === 'best';
    const roleClass = isBest ? 'wallet-pnl-highlight-card--best' : 'wallet-pnl-highlight-card--worst';
    const ribbon = isBest ? 'Best performer' : 'Worst Performer';
    return `<article class="wallet-pnl-highlight-card ${roleClass}" aria-label="${ribbon}">
        <span class="wallet-pnl-highlight-ribbon">${ribbon}</span>
        <div class="wallet-pnl-highlight-body">
          <div class="wallet-pnl-highlight-token"><span class="wallet-token-ref">${renderLogoImage(undefined, dash)}</span><span class="mono">${dash}</span></div>
          <div class="wallet-pnl-highlight-mint mono">${dash}</div>
          <div class="wallet-pnl-highlight-metrics">
            <span class="wallet-pnl-highlight-metric-label">Period PnL</span>
            <span class="wallet-pnl-highlight-metric-value usd-tone usd-tone--neutral">${dash}</span>
          </div>
        </div>
      </article>`;
  };

  const phTrendRowCount = 7;
  const phTrendBody = Array.from({ length: phTrendRowCount }, () => {
    return `<tr><td>${dash}</td><td style="text-align:right">${dash}</td></tr>`;
  }).join('');

  const pieStackPlaceholderHtml = `<div class="wallet-pnl-pie-stack">
      ${renderWalletPieCard('Open VS Closed Positions', [])}
      ${renderWalletPieCard('Winning vs Losing Trades', [])}
    </div>`;

  return `<div class="wallet-pnl-layout">
    <div class="wallet-pnl-sections">
      <section class="token-stats-group wallet-pnl-card wallet-pnl-card--profile">
        <h3 class="token-stats-group-title"><span>Wallet profile</span></h3>
        <div class="wallet-pnl-profile-header">
          <div class="wallet-pnl-profile-avatar-wrap" aria-hidden="true">
            ${renderWalletProfileAvatar(undefined, dash)}
          </div>
          <dl class="token-stats wallet-pnl-kv wallet-pnl-profile-kv">
            <dt>Name:</dt><dd class="wallet-pnl-profile-value-emphasis">${dash}</dd>
            <dt>X ACC:</dt><dd class="wallet-pnl-profile-value-emphasis">${dash}</dd>
          </dl>
        </div>
      </section>
      <section class="token-stats-group wallet-pnl-card wallet-pnl-card--highlights">
        <h3 class="token-stats-group-title"><span>Token highlights</span></h3>
        <div class="wallet-pnl-highlight-grid">${phHighlightFilled('best')}${phHighlightFilled('worst')}</div>
      </section>
      ${pieStackPlaceholderHtml}
    </div>
    <div class="wallet-pnl-trend-col">
      <section class="token-stats-group wallet-pnl-card wallet-pnl-card--pnl-trading">
        <h3 class="token-stats-group-title"><span>PnL & trading</span></h3>
        <p class="wallet-pnl-pnl-trading-lede">${walletPnlTradingLedeInnerHtml()}</p>
        <div class="wallet-pnl-pnl-trading-stack">
          <div class="wallet-pnl-metric-hero">
            <div class="wallet-pnl-metric-hero-item wallet-pnl-metric-hero-item--realized">
              <span class="wallet-pnl-metric-hero-label">Realized PnL</span>
              <span class="wallet-pnl-metric-hero-value">${formatUsdCell(undefined)}</span>
            </div>
            <div class="wallet-pnl-metric-hero-item wallet-pnl-metric-hero-item--unrealized">
              <span class="wallet-pnl-metric-hero-label">Unrealized PnL</span>
              <span class="wallet-pnl-metric-hero-value">${formatUsdCell(undefined)}</span>
            </div>
          </div>
          <div class="wallet-pnl-metric-row">
            <div class="wallet-pnl-metric-chip wallet-pnl-metric-chip--pos"><span class="wallet-pnl-metric-chip-label">Winning Trades</span><span class="wallet-pnl-metric-chip-value">${formatWinLoseTradesChipValueHtml(undefined, null, 'pos')}</span></div>
            <div class="wallet-pnl-metric-chip wallet-pnl-metric-chip--neg"><span class="wallet-pnl-metric-chip-label">Losing Trades</span><span class="wallet-pnl-metric-chip-value">${formatWinLoseTradesChipValueHtml(undefined, null, 'neg')}</span></div>
          </div>
          <div class="wallet-pnl-metric-row">
            <div class="wallet-pnl-metric-chip"><span class="wallet-pnl-metric-chip-label">Unique Tokens</span><span class="wallet-pnl-metric-chip-value">${formatIntFull(undefined)}</span></div>
            <div class="wallet-pnl-metric-chip"><span class="wallet-pnl-metric-chip-label">Total Volume</span><span class="wallet-pnl-metric-chip-value">${formatUsdCell(undefined)}</span></div>
          </div>
          <div class="wallet-pnl-metric-row">
            <div class="wallet-pnl-metric-chip"><span class="wallet-pnl-metric-chip-label">Total Trade Count</span><span class="wallet-pnl-metric-chip-value">${formatTradesCountCell(undefined)}</span></div>
            <div class="wallet-pnl-metric-chip"><span class="wallet-pnl-metric-chip-label">Average Trade Amount</span><span class="wallet-pnl-metric-chip-value">${formatUsdCell(undefined)}</span></div>
          </div>
        </div>
      </section>
      <section class="token-stats-group wallet-pnl-card wallet-pnl-card--trend">
        <h3 class="token-stats-group-title"><span>7d PnL trend points</span></h3>
        <p class="wallet-pnl-trend-lede">${WALLET_PNL_TREND_LEDE}</p>
        <div class="table-wrap wallet-pnl-trend-table-wrap">
          <table class="wallet-trend-table">
            <thead>
              <tr>
                <th>Time</th>
                <th style="text-align:right">PnL</th>
              </tr>
            </thead>
            <tbody>${phTrendBody}</tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
  <section class="token-stats-group wallet-pnl-card wallet-pnl-card--assets">
    <h3 class="token-stats-group-title"><span>Assets (0)</span></h3>
    <div class="table-wrap wallet-assets-table-wrap">
      <table class="wallet-assets-table">
        <thead>
          <tr>
            <th class="wallet-assets-th-icon" scope="col" aria-label="Icon"></th>
            <th>Asset</th>
            <th>Buy/Sell Amt</th>
            <th>Status</th>
            <th>Real. PnL</th>
            <th>Unreal. PnL</th>
            <th>Buys</th>
            <th>Sells</th>
            <th>Buy vol</th>
            <th>Sell vol</th>
            <th>Gain</th>
            <th>Latest TX</th>
          </tr>
        </thead>
        <tbody>${dummyAssetRows}</tbody>
      </table>
    </div>
  </section>`;
}

function renderXProfileLink(url: string | null | undefined): string {
  const href = (url || '').trim();
  if (!href) return '—';
  const match = href.match(/x\.com\/([^/?#]+)/i) || href.match(/twitter\.com\/([^/?#]+)/i);
  const handle = match?.[1] ? `@${match[1]}` : href;
  return `<a href="${href}" target="_blank">${handle}</a>`;
}

function applyTokenTopPnl24hColumnVisibility(): void {
  const resolution = tokenTopPnlResolution.value.trim().toLowerCase();
  const is24hResolution = resolution === '1d' || resolution === '24h' || resolution === '24hr';
  const show24hColumns = !is24hResolution;
  const resolutionLabel = is24hResolution ? '24h' : tokenTopPnlResolution.value.trim();
  tokenTopPnlRealizedHeader.textContent = `Realized PnL (${resolutionLabel})`;
  tokenTopPnlRovHeader.textContent = `RoV % (${resolutionLabel})`;
  tokenTopPnlUnrealizedHeader.textContent = `Unrealized PnL (${resolutionLabel})`;
  tokenTopPnlVolumeHeader.textContent = `Volume (${resolutionLabel})`;
  tokenTopPnlTradesHeader.textContent = `Trades (${resolutionLabel})`;
  tokenTopPnl24hVolumeHeader.textContent = 'Volume (24h)';
  tokenTopPnl24hTradesHeader.textContent = 'Trades (24h)';
  tokenTopPnl24hVolumeHeader.hidden = !show24hColumns;
  tokenTopPnl24hTradesHeader.hidden = !show24hColumns;
  document.querySelectorAll<HTMLElement>('.token-top-pnl-24h-col').forEach((cell) => {
    cell.hidden = !show24hColumns;
  });
}

function formatPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  const trim = (s: string) => s.replace(/\.?0+$/, '') || '0';
  if (num >= 1) {
    const s = num.toFixed(2);
    return s.endsWith('.00') ? s.replace(/\.00$/, '') : s;
  }
  if (num > 0.0099) return trim(num.toFixed(4));
  return trim(num.toFixed(12));
}

/** Parse `0.0123…` → leading `0` count after `.` before first 1–9, and remaining significant digits. */
function parseLeadingZeroFraction(normalized: string): { zeroRun: number; sigRest: string } | null {
  const m = normalized.match(/^0\.(\d*)$/);
  if (!m) return null;
  const frac = m[1] ?? '';
  let i = 0;
  while (i < frac.length && frac[i] === '0') i++;
  if (i >= frac.length) return { zeroRun: frac.length, sigRest: '' };
  return { zeroRun: i, sigRest: frac.slice(i) };
}

/**
 * Token stats: sub-unity prices as 0.0<sup>n</sup> + mantissa.
 * - n = count of `0` after decimal before first non-zero digit.
 * - If n ≤ 1: show exactly **4** digits after that first non-zero (omit the first digit in the mantissa), e.g. 0.0562033 → ^1 + `6203`.
 * - If n ≥ 2: show **4** significant digits total, e.g. 0.0000062404 → ^5 + `6240`.
 */
function formatTokenStatPriceValueHtml(
  n: number | null | undefined,
  opts?: { usdSuffix?: boolean },
): string {
  if (n == null || !Number.isFinite(Number(n))) return escapeHtmlText('—');
  const raw = Number(n);
  const neg = raw < 0;
  const num = Math.abs(raw);
  const minus = neg ? '<span class="token-stat-price-neg">−</span>' : '';
  const suffix = opts?.usdSuffix
    ? '<span class="token-stat-price-suffix">USD</span>'
    : '';

  if (num === 0) {
    return `${minus}<span class="token-stat-row-price-num">0</span>${suffix}`;
  }
  if (num >= 1) {
    return `${minus}<span class="token-stat-row-price-num">${escapeHtmlText(formatPrice(neg ? -num : num))}</span>${suffix}`;
  }

  const s = num.toFixed(24).replace(/\.?0+$/, '');
  const parsed = parseLeadingZeroFraction(s);
  if (!parsed || parsed.sigRest.length === 0) {
    return `${minus}<span class="token-stat-row-price-num">${escapeHtmlText(formatPrice(neg ? -num : num))}</span>${suffix}`;
  }

  const { zeroRun, sigRest } = parsed;
  if (zeroRun === 0) {
    return `${minus}<span class="token-stat-row-price-num">${escapeHtmlText(formatPrice(neg ? -num : num))}</span>${suffix}`;
  }

  const mantissa = zeroRun <= 1 ? sigRest.slice(1, 5) : sigRest.slice(0, 4);

  return `${minus}<span class="token-stat-row-price-num token-stat-row-price-num--compact">0.0<sup class="token-price-zero-run">${String(zeroRun)}</sup>${escapeHtmlText(mantissa)}</span>${suffix}`;
}

function formatCategoryOverviewValueHtml(category: string | undefined, subcategory: string | undefined): string {
  const cat = (category ?? '').trim();
  const sub = (subcategory ?? '').trim();
  if (!cat && !sub) return escapeHtmlText('—');
  if (cat && sub) return escapeHtmlText(`${cat} (${sub})`);
  return escapeHtmlText(cat || sub);
}

const tokenSectionIcons: Record<string, string> = {
  overview:
    '<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>',
  price:
    '<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  supply:
    '<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
};

type TokenStatRowKey =
  | 'mint'
  | 'decimals'
  | 'category'
  | 'verified'
  | 'priceUsd'
  | 'marketCap'
  | 'price1d'
  | 'price7d'
  | 'supply'
  | 'tokenVol24h'
  | 'usdVol24h'
  | 'topPnlCohortVol';

interface TokenStatRow {
  key: TokenStatRowKey;
  label: string;
  /** Inner HTML (caller supplies safe markup or escaped text). */
  valueHtml: string;
}

const TOKEN_STAT_ROW_ICONS: Record<TokenStatRowKey, string> = {
  mint:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  decimals:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h8M8 18h5"/></svg>',
  category:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  verified:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  priceUsd:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  marketCap:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  price1d:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  price7d:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  supply:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  tokenVol24h:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  usdVol24h:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
  topPnlCohortVol:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
};

interface SectionSpec {
  icon: string;
  title: string;
  theme: 'overview' | 'price' | 'supply';
  rows: TokenStatRow[];
  /** Overview: two columns (legacy). Omit or use single column (default) for one column × N rows. */
  statRowsLayout?: 'single' | 'twoColumn';
}

function tokenStatRowHtml(row: TokenStatRow): string {
  const icon = TOKEN_STAT_ROW_ICONS[row.key];
  const aria = escapeHtmlAttr(row.label);
  return `<div class="token-stat-row token-stat-row--${row.key}" role="group" aria-label="${aria}">
    <div class="token-stat-row-icon" aria-hidden="true">${icon}</div>
    <div class="token-stat-row-body">
      <span class="token-stat-row-label">${escapeHtmlText(row.label)}</span>
      <span class="token-stat-row-value">${row.valueHtml}</span>
    </div>
  </div>`;
}

/** Insert `$` immediately before the numeric part (after optional leading − span). */
function prefixTokenStatUsdDollar(priceHtml: string): string {
  if (priceHtml.includes('token-stat-price-neg')) {
    return priceHtml.replace(
      /^(<span class="token-stat-price-neg">[\s\S]*?<\/span>)/,
      `$1<span class="token-stat-usd-dollar" aria-hidden="true">$</span>`
    );
  }
  return `<span class="token-stat-usd-dollar" aria-hidden="true">$</span>${priceHtml}`;
}

/** Wrap token-stat USD amounts (green); use inner HTML from trusted formatters only. */
function wrapTokenStatUsdHtml(innerHtml: string): string {
  return `<span class="token-stat-usd-value">${innerHtml}</span>`;
}

/** Escaped plain text only (already safe). */
function wrapTokenStatUsdText(escapedPlain: string): string {
  return `<span class="token-stat-usd-value">${escapedPlain}</span>`;
}

function tokenStatSectionHtml(s: SectionSpec): string {
  const rows = s.rows.map((r) => tokenStatRowHtml(r)).join('');
  const rowsClass =
    s.statRowsLayout === 'twoColumn' ? 'token-stat-rows token-stat-rows--2col' : 'token-stat-rows';
  return `<section class="token-stats-group token-stats-group--${s.theme}">
      <h3 class="token-stats-group-title">${s.icon}<span>${s.title}</span></h3>
      <div class="${rowsClass}">${rows}</div>
    </section>`;
  }

function formatTokenUpdateTime(ts: number | undefined): string {
    if (ts == null) return '—';
    const d = new Date(ts * 1000);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
}

function showSectionError(el: HTMLElement, msg: string): void {
  el.textContent = msg;
  el.hidden = false;
  el.removeAttribute('aria-hidden');
}

function hideSectionError(el: HTMLElement): void {
  el.textContent = '';
  el.hidden = true;
  el.setAttribute('aria-hidden', 'true');
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_FETCH_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if ([502, 503, 504].includes(res.status)) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_FETCH_RETRIES) {
        await new Promise((r) => setTimeout(r, FETCH_RETRY_DELAY_MS));
      }
    }
  }
  throw lastErr;
}

function parseTokenTopPnlLimitForLabel(): number {
  const n = Number.parseInt(String(tokenTopPnlLimit.value).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 1000;
}

/** Sum 24h USD volume for each wallet in the main cohort using values from the 1d API fetch (same map as Volume (24h) column). */
function sumCohortVolume24hUsd(
  cohortRows: TokenTopPnlTraderRow[],
  volume24hByTrader: Record<string, number>
): number {
  let s = 0;
  for (const r of cohortRows) {
    const addr = (r.traderAddress || '').trim();
    if (!addr) continue;
    const v = volume24hByTrader[addr];
    if (v != null && Number.isFinite(v)) s += v;
  }
  return s;
}

/** Same K/M/B breakpoints as {@link formatNum} on token stat USD volumes. */
function usdVolStatDisplayTier(refAbs: number): 'B' | 'M' | 'K' | 'raw' {
  const abs = Math.abs(refAbs);
  if (abs >= 1e9) return 'B';
  if (abs >= 1e6) return 'M';
  if (abs >= 1e3) return 'K';
  return 'raw';
}

/** Format USD amount in the given tier (cohort + 24h total use the same tier as 24h reference). */
function formatUsdVolStatAligned(value: number, tier: 'B' | 'M' | 'K' | 'raw'): string {
  let numPart: string;
  switch (tier) {
    case 'B':
      numPart = (value / 1e9).toFixed(2);
      break;
    case 'M':
      numPart = (value / 1e6).toFixed(2);
      break;
    case 'K':
      numPart = (value / 1e3).toFixed(2);
      break;
    default:
      numPart = value.toFixed(4);
  }
  numPart = numPart.replace(/\.?0+$/, '');
  const suf = tier === 'raw' ? '' : tier;
  return `${numPart}${suf}`;
}

/**
 * Cohort share of 24h USD volume: `(0.4%)` style. For tiny shares (&lt; 0.01%), uses enough
 * decimals to keep the first significant digits (e.g. 0.000453%).
 */
function formatVolumeShareOf24hPctPlain(pct: number): string {
  if (!Number.isFinite(pct)) return '—';
  if (pct === 0) return '0%';
  const abs = Math.abs(pct);
  if (abs >= 0.01) {
    return `${pct.toFixed(2).replace(/\.?0+$/, '')}%`;
  }
  const decimalsToFirstNonZero = Math.ceil(-Math.log10(abs));
  const decimals = Math.max(3, Math.min(12, decimalsToFirstNonZero + 2));
  return `${pct.toFixed(decimals).replace(/\.?0+$/, '')}%`;
}

function formatCohortVolumeSharePctSuffixHtml(cohortUsd: number, totalUsd: number): string {
  if (!Number.isFinite(cohortUsd) || !Number.isFinite(totalUsd) || totalUsd <= 0) return '';
  const pct = (cohortUsd / totalUsd) * 100;
  if (!Number.isFinite(pct)) return '';
  const plain = formatVolumeShareOf24hPctPlain(pct);
  return ` <span class="token-stat-cohort-vol-share">${escapeHtmlText(`(${plain})`)}</span>`;
}

function formatTopPnlCohortVolRowHtml(t: TokenData, cohortVolume24hUsd: number | undefined): string {
  const dashTxt = escapeHtmlText('—');
  const metaN = t.usdValueVolume24h;

  const metaRightHtml =
    metaN != null && Number.isFinite(metaN)
      ? (() => {
          const tier = usdVolStatDisplayTier(metaN);
          return wrapTokenStatUsdText(
            escapeHtmlText(`$${formatUsdVolStatAligned(metaN, tier)} USD`)
          );
        })()
      : dashTxt;

  if (cohortVolume24hUsd === undefined) {
    return `${dashTxt}<span class="token-stat-usd-ratio-sep"> / </span>${metaRightHtml}`;
  }

  const sum = cohortVolume24hUsd;

  if (metaN != null && Number.isFinite(metaN)) {
    const tier = usdVolStatDisplayTier(metaN);
    const left = wrapTokenStatUsdText(escapeHtmlText(`$${formatUsdVolStatAligned(sum, tier)}`));
    const right = wrapTokenStatUsdText(
      escapeHtmlText(`$${formatUsdVolStatAligned(metaN, tier)} USD`)
    );
    const shareHtml = formatCohortVolumeSharePctSuffixHtml(sum, metaN);
    return `${left}<span class="token-stat-usd-ratio-sep"> / </span>${right}${shareHtml}`;
  }

  const tierOnlySum = usdVolStatDisplayTier(sum);
  return `${wrapTokenStatUsdText(escapeHtmlText(`$${formatUsdVolStatAligned(sum, tierOnlySum)}`))}<span class="token-stat-usd-ratio-sep"> / </span>${dashTxt}`;
}

function renderToken(t: TokenData, cohortVolume24hUsd?: number): void {
  const tokenLogoSrc = resolveTokenLogoSrc(t.logoUrl, t.mintAddress);
  tokenLogo.src = tokenLogoSrc;
  tokenLogo.alt = t.symbol || '';
  tokenLogo.style.display = tokenLogoSrc ? 'block' : 'none';
  tokenSymbol.textContent = t.symbol || '—';
  const nameTrim = (t.name || '').trim();
  const mintTrim = (t.mintAddress || '').trim();
  if (nameTrim) {
    tokenName.textContent = nameTrim;
    tokenName.removeAttribute('title');
  } else if (mintTrim) {
    tokenName.textContent = truncateMintMiddle(mintTrim);
    tokenName.title = mintTrim;
  } else {
    tokenName.textContent = '—';
    tokenName.removeAttribute('title');
  }

  const sym = (t.symbol || '').toUpperCase();
  const dashTxt = escapeHtmlText('—');

  const mintLink = mintTrim
    ? `<a href="https://vybe.fyi/tokens/${encodeURIComponent(mintTrim)}" target="_blank" class="mono" title="${escapeHtmlAttr(mintTrim)}">${truncateMintMiddle(mintTrim)}</a>`
    : '';
  const decVal = t.decimal ?? t.decimals;
  const overview: SectionSpec = {
    icon: tokenSectionIcons.overview,
    title: 'Overview',
    theme: 'overview',
    rows: [
      { key: 'mint', label: 'Mint', valueHtml: mintLink || dashTxt },
      {
        key: 'category',
        label: 'Category',
        valueHtml: formatCategoryOverviewValueHtml(t.category, t.subcategory),
      },
      {
        key: 'verified',
        label: 'Verified',
        valueHtml: t.verified != null ? escapeHtmlText(String(t.verified)) : dashTxt,
      },
      {
        key: 'decimals',
        label: 'Decimals',
        valueHtml: decVal != null ? escapeHtmlText(String(decVal)) : dashTxt,
      },
    ],
  };
  const priceSection: SectionSpec = {
    icon: tokenSectionIcons.price,
    title: 'Price & Market Cap',
    theme: 'price',
    rows: [
      {
        key: 'priceUsd',
        label: 'Price (USD)',
        valueHtml:
          t.price != null
            ? wrapTokenStatUsdHtml(prefixTokenStatUsdDollar(formatTokenStatPriceValueHtml(t.price, { usdSuffix: true })))
            : dashTxt,
      },
      {
        key: 'marketCap',
        label: 'Market cap',
        valueHtml:
          t.marketCap != null
            ? wrapTokenStatUsdText(escapeHtmlText(`$${formatNum(t.marketCap)} USD`))
            : dashTxt,
      },
      {
        key: 'price1d',
        label: 'Price (24h ago)',
        valueHtml:
          t.price1d != null
            ? wrapTokenStatUsdHtml(prefixTokenStatUsdDollar(formatTokenStatPriceValueHtml(t.price1d))) +
              formatHistoricalPricePctVsSpotHtml(t.price, t.price1d, '24hr')
            : dashTxt,
      },
      {
        key: 'price7d',
        label: 'Price (7d ago)',
        valueHtml:
          t.price7d != null
            ? wrapTokenStatUsdHtml(prefixTokenStatUsdDollar(formatTokenStatPriceValueHtml(t.price7d))) +
              formatHistoricalPricePctVsSpotHtml(t.price, t.price7d, '7d')
            : dashTxt,
      },
    ],
  };
  const supplyVolumeSection: SectionSpec = {
    icon: tokenSectionIcons.supply,
    title: 'Supply & Volume (24h)',
    theme: 'supply',
    rows: [
      {
        key: 'supply',
        label: 'Current supply',
        valueHtml:
          t.currentSupply != null
            ? escapeHtmlText(`${formatNum(t.currentSupply)}${sym ? ` ${sym}` : ''}`)
            : dashTxt,
      },
      {
        key: 'tokenVol24h',
        label: 'Token volume (24h)',
        valueHtml:
        t.tokenAmountVolume24h != null
            ? escapeHtmlText(`${formatNum(t.tokenAmountVolume24h)}${sym ? ` ${sym}` : ''}`)
            : dashTxt,
      },
      {
        key: 'usdVol24h',
        label: 'USD volume (24h)',
        valueHtml:
          t.usdValueVolume24h != null && Number.isFinite(t.usdValueVolume24h)
            ? wrapTokenStatUsdText(
                escapeHtmlText(
                  `$${formatUsdVolStatAligned(t.usdValueVolume24h, usdVolStatDisplayTier(t.usdValueVolume24h))} USD`
                )
              )
            : dashTxt,
      },
      {
        key: 'topPnlCohortVol',
        label: `Top ${parseTokenTopPnlLimitForLabel().toLocaleString('en-US')} by PnL volume (24h)`,
        valueHtml: formatTopPnlCohortVolRowHtml(t, cohortVolume24hUsd),
      },
    ],
  };

  tokenLastUpdatedValue.textContent = formatTokenUpdateTime(t.updateTime);
  const statsMain = `<div class="token-stats-row token-stats-row--split-overview"><div class="token-stats-col token-stats-col--overview">${tokenStatSectionHtml(overview)}</div><div class="token-stats-col token-stats-col--pair"><div class="token-stats-pair-grid">${tokenStatSectionHtml(priceSection)}${tokenStatSectionHtml(supplyVolumeSection)}</div></div></div>`;
  tokenStats.innerHTML = statsMain;
}

/** Same sections/labels as `renderToken`, values shown as em dash until data loads. */
function buildTokenStatsPlaceholderHtml(): string {
  const dash = '—';
  const d = escapeHtmlText(dash);
  const overview: SectionSpec = {
    icon: tokenSectionIcons.overview,
    title: 'Overview',
    theme: 'overview',
    rows: [
      { key: 'mint', label: 'Mint', valueHtml: `<span class="mono">${d}</span>` },
      { key: 'category', label: 'Category', valueHtml: d },
      { key: 'verified', label: 'Verified', valueHtml: d },
      { key: 'decimals', label: 'Decimals', valueHtml: d },
    ],
  };
  const priceSection: SectionSpec = {
    icon: tokenSectionIcons.price,
    title: 'Price & Market Cap',
    theme: 'price',
    rows: [
      { key: 'priceUsd', label: 'Price (USD)', valueHtml: d },
      { key: 'marketCap', label: 'Market cap', valueHtml: d },
      { key: 'price1d', label: 'Price (24h ago)', valueHtml: d },
      { key: 'price7d', label: 'Price (7d ago)', valueHtml: d },
    ],
  };
  const supplyVolumeSection: SectionSpec = {
    icon: tokenSectionIcons.supply,
    title: 'Supply & Volume (24h)',
    theme: 'supply',
    rows: [
      { key: 'supply', label: 'Current supply', valueHtml: d },
      { key: 'tokenVol24h', label: 'Token volume (24h)', valueHtml: d },
      { key: 'usdVol24h', label: 'USD volume (24h)', valueHtml: d },
      {
        key: 'topPnlCohortVol',
        label: `Top ${parseTokenTopPnlLimitForLabel().toLocaleString('en-US')} by PnL volume (24h)`,
        valueHtml: d,
      },
    ],
  };
  const statsMain = `<div class="token-stats-row token-stats-row--split-overview"><div class="token-stats-col token-stats-col--overview">${tokenStatSectionHtml(overview)}</div><div class="token-stats-col token-stats-col--pair"><div class="token-stats-pair-grid">${tokenStatSectionHtml(priceSection)}${tokenStatSectionHtml(supplyVolumeSection)}</div></div></div>`;
  return statsMain;
}

function buildWalletTopTraderParams(mode: SearchMode, query: string): URLSearchParams {
  const params = new URLSearchParams({
    resolution: getWalletResolution(),
    limit: walletLimit.value,
    page: String(Math.max(0, Number(walletPage.value) || 0)),
  });
  const labelVal = walletLabel.value.trim().toLowerCase();
  // Vybe rejects `label=all`; "All" means omit the filter (same as top-traders UI intent).
  if (labelVal && labelVal !== 'all') params.set('label', labelVal);
  const direction = walletSortDirection.value as SortDirection;
  const field = WALLET_TOP_TRADERS_SORT_FIELD;
  if (direction === 'asc') {
    params.set('sortByAsc', field);
  } else {
    params.set('sortByDesc', field);
  }
  if (mode === 'token') params.set('mintAddress', query);
  else params.set('ilikeFilter', query);
  return params;
}

function looksLikeSolanaAddress(value: string): boolean {
  const trimmed = value.trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
}

function buildWalletPnlParams(): URLSearchParams {
  const params = new URLSearchParams({
    resolution: getWalletResolution(),
    limit: walletLimit.value,
    page: String(Math.max(0, Number(walletPage.value) || 0)),
  });
  const mintAddress = walletPnlMintAddress.value.trim();
  if (mintAddress) params.set('mintAddress', mintAddress);
  const direction = walletSortDirection.value as SortDirection;
  const field = walletPnlSortField.value;
  if (direction === 'asc') {
    params.set('sortByAsc', field);
  } else {
    params.set('sortByDesc', field);
  }
  return params;
}

function renderWalletPnl(
  ownerAddress: string,
  data: WalletPnlResponse,
  queryParams: URLSearchParams,
  topTraderRow?: TopTraderRow
): void {
  const summary = data.summary;
  const topMetrics = topTraderRow?.metrics;
  const tokenMetrics = data.tokenMetrics ?? [];
  walletPnlMeta.textContent = `Wallet PnL: ${tokenMetrics.length} per-token row(s) for the current filter.`;
  const mergedSummary = mergeWalletSummary(summary, topMetrics);
  const metricsByMint = new Map(
    tokenMetrics
      .map((metric) => [(metric.mintAddress || '').trim(), metric] as const)
      .filter(([mint]) => mint.length > 0)
  );
  const buysTxValues = tokenMetrics
    .map((metric) => toNum(metric.buys?.transactionCount))
    .filter((value) => Number.isFinite(value));
  const buysTxMin = buysTxValues.length ? Math.min(...buysTxValues) : 0;
  const buysTxMax = buysTxValues.length ? Math.max(...buysTxValues) : 0;
  const sellsTxValues = tokenMetrics
    .map((metric) => toNum(metric.sells?.transactionCount))
    .filter((value) => Number.isFinite(value));
  const sellsTxMin = sellsTxValues.length ? Math.min(...sellsTxValues) : 0;
  const sellsTxMax = sellsTxValues.length ? Math.max(...sellsTxValues) : 0;

  const { aboveOneAvg: winAvgGainMult, atOrBelowOneAvg: loseAvgGainMult } =
    avgGainMultFromTableByGainGroups(tokenMetrics);

  const tokenLabel = (token?: WalletPnlSummaryTokenRef): string => {
    if (!token) return '—';
    const mint = (token.mintAddress || '').trim();
    if (!mint) return '—';
    const matchedMetric = metricsByMint.get(mint);
    const fullLabel =
      matchedMetric?.tokenSymbol ||
      matchedMetric?.tokenName ||
      token.tokenSymbol ||
      token.tokenName ||
      truncateAddress(mint);
    const linkText = truncateTokenHighlightLinkText(fullLabel);
    const logoUrl = matchedMetric?.tokenLogoUrl || token.tokenLogoUrl;
    const titleAttr = escapeHtmlAttr(`${fullLabel} · ${mint}`);
    return `<span class="wallet-token-ref">${renderLogoImage(logoUrl, fullLabel, mint)}<a href="https://vybe.fyi/tokens/${encodeURIComponent(mint)}" target="_blank" class="mono" title="${titleAttr}">${linkText}</a></span>`;
  };

  const renderWalletPnlHighlightCard = (kind: 'best' | 'worst', token?: WalletPnlSummaryTokenRef): string => {
    const isBest = kind === 'best';
    const roleClass = isBest ? 'wallet-pnl-highlight-card--best' : 'wallet-pnl-highlight-card--worst';
    const ribbon = isBest ? 'Best performer' : 'Worst Performer';
    const mint = (token?.mintAddress || '').trim();
    if (!mint) {
      return `<article class="wallet-pnl-highlight-card ${roleClass} wallet-pnl-highlight-card--empty" aria-label="${ribbon}">
        <span class="wallet-pnl-highlight-ribbon">${ribbon}</span>
        <div class="wallet-pnl-highlight-body">
          <p class="wallet-pnl-highlight-empty">No ${isBest ? 'top' : 'bottom'} token in the summary for this window.</p>
        </div>
      </article>`;
    }
    const pnl = token?.pnlUsd;
    const pnlToneClass = pnl != null && pnl < 0 ? 'wallet-pnl-highlight-pnl--negative' : 'wallet-pnl-highlight-pnl--positive';
    return `<article class="wallet-pnl-highlight-card ${roleClass}" aria-label="${ribbon}">
      <span class="wallet-pnl-highlight-ribbon">${ribbon}</span>
      <div class="wallet-pnl-highlight-body">
        <div class="wallet-pnl-highlight-token">${tokenLabel(token)}</div>
        <div class="wallet-pnl-highlight-mint mono" title="${mint}">${truncateAddress(mint)}</div>
        <div class="wallet-pnl-highlight-metrics">
          <span class="wallet-pnl-highlight-metric-label">Period PnL</span>
          <span class="wallet-pnl-highlight-metric-value ${pnlToneClass}">${pnl != null ? formatUsdFull(pnl) : '—'}</span>
      </div>
        </div>
    </article>`;
  };

  const profileLabels = (topTraderRow?.accountLabels ?? []).filter((label) => (label || '').trim() !== '');
  const baseName = topTraderRow?.accountName || truncateAddress(ownerAddress);
  const labelSuffix = profileLabels.length ? ` (${profileLabels.join(', ')})` : '';
  const nameDisplay = `${baseName}${labelSuffix}`;
  const walletProfileHtml = `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--profile">
      <h3 class="token-stats-group-title"><span>Wallet profile</span></h3>
      <div class="wallet-pnl-profile-header">
        <div class="wallet-pnl-profile-avatar-wrap" aria-hidden="true">
          ${renderWalletProfileAvatar(topTraderRow?.accountLogoUrl, topTraderRow?.accountName || ownerAddress)}
      </div>
        <dl class="token-stats wallet-pnl-kv wallet-pnl-profile-kv">
          <dt>Name:</dt><dd class="wallet-pnl-profile-value-emphasis"><a href="https://vybe.fyi/wallets/${encodeURIComponent(ownerAddress)}" target="_blank" class="mono" title="${ownerAddress}">${nameDisplay}</a></dd>
          <dt>X ACC:</dt><dd class="wallet-pnl-profile-value-emphasis">${renderXProfileLink(topTraderRow?.accountTwitterUrl)}</dd>
        </dl>
        </div>
    </section>`;

  const pnlTradingHtml = `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--pnl-trading">
      <h3 class="token-stats-group-title"><span>PnL & trading</span></h3>
      <p class="wallet-pnl-pnl-trading-lede">${walletPnlTradingLedeInnerHtml()}</p>
      <div class="wallet-pnl-pnl-trading-stack">
        <div class="wallet-pnl-metric-hero">
          <div class="wallet-pnl-metric-hero-item wallet-pnl-metric-hero-item--realized">
            <span class="wallet-pnl-metric-hero-label">Realized PnL</span>
            <span class="wallet-pnl-metric-hero-value">${formatUsdCell(mergedSummary.realizedPnlUsd)}</span>
      </div>
          <div class="wallet-pnl-metric-hero-item wallet-pnl-metric-hero-item--unrealized">
            <span class="wallet-pnl-metric-hero-label">Unrealized PnL</span>
            <span class="wallet-pnl-metric-hero-value">${formatUsdCell(mergedSummary.unrealizedPnlUsd)}</span>
          </div>
        </div>
        <div class="wallet-pnl-metric-row">
          <div class="wallet-pnl-metric-chip wallet-pnl-metric-chip--pos"><span class="wallet-pnl-metric-chip-label">Winning Trades</span><span class="wallet-pnl-metric-chip-value">${formatWinLoseTradesChipValueHtml(mergedSummary.winningTradesCount, winAvgGainMult, 'pos')}</span></div>
          <div class="wallet-pnl-metric-chip wallet-pnl-metric-chip--neg"><span class="wallet-pnl-metric-chip-label">Losing Trades</span><span class="wallet-pnl-metric-chip-value">${formatWinLoseTradesChipValueHtml(mergedSummary.losingTradesCount, loseAvgGainMult, 'neg')}</span></div>
        </div>
        <div class="wallet-pnl-metric-row">
          <div class="wallet-pnl-metric-chip"><span class="wallet-pnl-metric-chip-label">Unique Tokens</span><span class="wallet-pnl-metric-chip-value">${formatIntFull(mergedSummary.uniqueTokensTraded)}</span></div>
          <div class="wallet-pnl-metric-chip"><span class="wallet-pnl-metric-chip-label">Total Volume</span><span class="wallet-pnl-metric-chip-value">${formatUsdCell(mergedSummary.tradesVolumeUsd)}</span></div>
        </div>
        <div class="wallet-pnl-metric-row">
          <div class="wallet-pnl-metric-chip"><span class="wallet-pnl-metric-chip-label">Total Trade Count</span><span class="wallet-pnl-metric-chip-value">${formatTradesCountCell(mergedSummary.tradesCount)}</span></div>
          <div class="wallet-pnl-metric-chip"><span class="wallet-pnl-metric-chip-label">Average Trade Amount</span><span class="wallet-pnl-metric-chip-value">${formatUsdCell(mergedSummary.averageTradeUsd)}</span></div>
        </div>
      </div>
    </section>`;

  const tokenHighlightsHtml = `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--highlights">
      <h3 class="token-stats-group-title"><span>Token highlights</span></h3>
      <div class="wallet-pnl-highlight-grid">
        ${renderWalletPnlHighlightCard('best', mergedSummary.bestPerformingToken)}
        ${renderWalletPnlHighlightCard('worst', mergedSummary.worstPerformingToken)}
      </div>
    </section>`;

  const statusSlices = (() => {
    const openCount = tokenMetrics.filter((metric) => (metric.status || '').toLowerCase() === 'open').length;
    const closedCount = tokenMetrics.filter((metric) => (metric.status || '').toLowerCase() === 'closed').length;
    const otherCount = Math.max(0, tokenMetrics.length - openCount - closedCount);
    return [
      { label: 'Open Positions', value: openCount, color: { dark: '#475569', light: '#94a3b8' } },
      { label: 'Closed Positions', value: closedCount, color: { dark: '#1d4ed8', light: '#93c5fd' } },
      { label: 'Other', value: otherCount, color: { dark: '#1e3a8a', light: '#60a5fa' } },
    ];
  })();

  const winningLosingTradeSlices = (() => {
    const win = Math.max(0, Math.round(Number(mergedSummary.winningTradesCount) || 0));
    const lose = Math.max(0, Math.round(Number(mergedSummary.losingTradesCount) || 0));
    return [
      { label: 'Winning Trades', value: win, color: tradeScaleBarGradientPair(0), avgGainMult: winAvgGainMult },
      { label: 'Losing Trades', value: lose, color: VOLUME_PNL_PIE_NONPOSITIVE_FILL, avgGainMult: loseAvgGainMult },
    ];
  })();

  const pieStackHtml = `<div class="wallet-pnl-pie-stack">
      ${renderWalletPieCard('Open VS Closed Positions', statusSlices)}
      ${renderWalletPieCard('Winning vs Losing Trades', winningLosingTradeSlices)}
    </div>`;

  const trendRowsRaw = mergedSummary.pnlTrendSevenDays ?? [];
  const trendRows = [...trendRowsRaw].sort((a, b) => {
    const ta = Number(a?.[0]);
    const tb = Number(b?.[0]);
    if (!Number.isFinite(ta) && !Number.isFinite(tb)) return 0;
    if (!Number.isFinite(ta)) return 1;
    if (!Number.isFinite(tb)) return -1;
    return tb - ta;
  });
  const pnlTrendHtml = trendRows.length
    ? `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--trend">
      <h3 class="token-stats-group-title"><span>7d PnL trend points</span></h3>
      <p class="wallet-pnl-trend-lede">${WALLET_PNL_TREND_LEDE}</p>
      <div class="table-wrap wallet-pnl-trend-table-wrap">
        <table class="wallet-trend-table">
          <thead>
            <tr>
              <th>Time</th>
              <th style="text-align:right">PnL</th>
            </tr>
          </thead>
          <tbody>${trendRows.map((point) => {
      const ts = Number(point?.[0]);
      const pnl = Number(point?.[1]);
      const timeLabel = Number.isFinite(ts) ? formatPnlTrendPointTime(ts) : '—';
      return `<tr>
              <td>${timeLabel}</td>
              <td style="text-align:right">${formatUsdCell(Number.isFinite(pnl) ? pnl : undefined)}</td>
            </tr>`;
    }).join('')}</tbody>
        </table>
      </div>
    </section>`
    : `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--trend wallet-pnl-empty">
      <h3 class="token-stats-group-title"><span>7d PnL trend points</span></h3>
      <p class="wallet-pnl-trend-lede">${WALLET_PNL_TREND_LEDE}</p>
      <p class="wallet-pnl-trend-empty-msg">No seven-day trend samples returned for this wallet.</p>
    </section>`;

  const assetCount = tokenMetrics.length;
  const gainColorBounds = collectWalletGainColorBounds(tokenMetrics);
  const assetsTableHtml = tokenMetrics.length
    ? `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--assets">
      <h3 class="token-stats-group-title"><span>Assets (${assetCount})</span></h3>
      <div class="table-wrap wallet-assets-table-wrap">
        <table class="wallet-assets-table">
          <thead>
            <tr>
              <th class="wallet-assets-th-icon" scope="col" aria-label="Icon"></th>
              <th>Asset</th>
              <th>Buy/Sell Amt</th>
              <th>Status</th>
              <th>Real. PnL</th>
              <th>Unreal. PnL</th>
              <th>Buys</th>
              <th>Sells</th>
              <th>Buy vol</th>
              <th>Sell vol</th>
              <th>Gain</th>
              <th>Latest TX</th>
            </tr>
          </thead>
          <tbody>${tokenMetrics.map((metric) => {
      const mint = metric.mintAddress || '';
      const symbol = metric.tokenSymbol || metric.tokenName || (mint ? truncateAddress(mint) : '—');
      const tokenLink = mint
        ? `<a href="https://vybe.fyi/tokens/${encodeURIComponent(mint)}" target="_blank" class="mono" title="${mint}">${symbol}</a>`
        : symbol;
      const iconCell = renderLogoImage(metric.tokenLogoUrl, symbol, mint);
      const assetCell = mint
        ? `${tokenLink}<div class="wallet-asset-mint mono">${truncateAddress(mint)}</div>`
        : tokenLink;
      const latestTrade = pickLatestTradeSide(metric);
      return `<tr>
        <td class="wallet-asset-icon-cell">${iconCell}</td>
        <td>${assetCell}</td>
        <td class="wallet-asset-buysell-amt-cell">${renderWalletAssetBuySellAmtCell(metric)}</td>
        <td>${renderStatusBadge(metric.status)}</td>
        <td>${formatUsdCell(metric.realizedPnlUsd)}</td>
        <td>${formatUsdCell(metric.unrealizedPnlUsd)}</td>
        <td>${formatTradesCountHeatCell(metric.buys?.transactionCount, buysTxMin, buysTxMax)}</td>
        <td>${formatTradesCountHeatCell(metric.sells?.transactionCount, sellsTxMin, sellsTxMax)}</td>
        <td><span class="wallet-amt-vol-usd">${formatUsdFull(metric.buys?.volumeUsd)}</span></td>
        <td><span class="wallet-amt-vol-usd">${formatUsdFull(metric.sells?.volumeUsd)}</span></td>
        <td style="text-align:center">${renderWalletAssetGainCell(metric, gainColorBounds)}</td>
        <td class="wallet-asset-tx-cell">${renderLatestTradeCell(latestTrade.blocktime, latestTrade.signature, latestTrade.label)}</td>
      </tr>`;
    }).join('')}</tbody>
        </table>
      </div>
    </section>`
    : `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--assets">
      <h3 class="token-stats-group-title"><span>Assets (0)</span></h3>
      <p class="wallet-pnl-assets-empty-msg">No token metrics returned for this wallet and filter.</p>
    </section>`;

  walletPnlDetails.innerHTML = `<div class="wallet-pnl-layout">
    <div class="wallet-pnl-sections">${walletProfileHtml}${tokenHighlightsHtml}${pieStackHtml}</div>
    <div class="wallet-pnl-trend-col">${pnlTradingHtml}${pnlTrendHtml}</div>
  </div>${assetsTableHtml}`;
  mountWalletPieDonutOverlays(walletPnlDetails, [{ slices: statusSlices }, { slices: winningLosingTradeSlices }]);
  requestAnimationFrame(() => syncWalletPieStackHeights());
}

function buildTokenTopPnlParams(): URLSearchParams {
  const params = new URLSearchParams({
    resolution: tokenTopPnlResolution.value,
    limit: tokenTopPnlLimit.value,
    page: String(Math.max(0, Number(tokenTopPnlPage.value) || 0)),
  });
  const direction = tokenTopPnlSortDirection.value as SortDirection;
  const field = tokenTopPnlSortField.value;
  if (direction === 'asc') {
    params.set('sortByAsc', field);
  } else {
    params.set('sortByDesc', field);
  }
  return params;
}

function renderTopTraders(
  data: { data?: TopTraderRow[] },
  mode: SearchMode,
  query: string,
  queryParams: URLSearchParams,
  ownerAddress?: string,
  walletPnlData?: WalletPnlResponse
): void {
  const list = data.data || [];
  const pnlSummary = walletPnlData?.summary;
  const normalizedOwner = (ownerAddress || '').trim();
  const mergedList = list.map((row) => {
    const rowAddress = (row.accountAddress || '').trim();
    if (!normalizedOwner || rowAddress !== normalizedOwner || !pnlSummary) return row;
    const rowMetrics = row.metrics;
    const mergedSummary = mergeWalletSummary(pnlSummary, rowMetrics);
    return {
      ...row,
      metrics: {
        ...rowMetrics,
        realizedPnlUsd: mergedSummary.realizedPnlUsd,
        unrealizedPnlUsd: mergedSummary.unrealizedPnlUsd,
        tradesCount: mergedSummary.tradesCount,
        tradesVolumeUsd: mergedSummary.tradesVolumeUsd,
        winRate: mergedSummary.winRate,
        uniqueTokensTraded: mergedSummary.uniqueTokensTraded,
        sevenDayPnl: mergedSummary.pnlTrendSevenDays,
        bestPerformingToken: mergedSummary.bestPerformingToken,
        worstPerformingToken: mergedSummary.worstPerformingToken,
      },
    };
  });
  const finalList = mergedList.length || !normalizedOwner || !pnlSummary
    ? mergedList
    : [{
      accountAddress: normalizedOwner,
      metrics: {
        realizedPnlUsd: pnlSummary.realizedPnlUsd,
        unrealizedPnlUsd: pnlSummary.unrealizedPnlUsd,
        tradesCount: pnlSummary.tradesCount,
        tradesVolumeUsd: pnlSummary.tradesVolumeUsd,
        winRate: pnlSummary.winRate,
        uniqueTokensTraded: pnlSummary.uniqueTokensTraded,
        sevenDayPnl: pnlSummary.pnlTrendSevenDays,
        bestPerformingToken: pnlSummary.bestPerformingToken,
        worstPerformingToken: pnlSummary.worstPerformingToken,
      },
    }];
  const scope = mode === 'wallet' ? `ilikeFilter="${query}"` : `mintAddress="${query}"`;
  topTradersMeta.textContent = finalList.length
    ? `GET /v4/wallets/top-traders (related wallets) with ${scope} and ${queryParams.toString()} returned ${list.length} row(s).`
    : `GET /v4/wallets/top-traders (related wallets) with ${scope} returned 0 rows.`;
  topTradersCards.innerHTML = finalList.length
    ? finalList.map((row, i) => {
          const rank = i + 1;
          const addr = row.accountAddress;
          const display = row.accountName || (addr ? truncateAddress(addr) : '—');
          const accountLink = addr
        ? `<a href="https://vybe.fyi/wallets/${encodeURIComponent(addr)}" target="_blank" class="mono" title="${addr}">${display}</a>`
            : `<span class="mono">${display}</span>`;
          const m = row.metrics || {};
      const labels = (row.accountLabels ?? []).filter((label) => (label || '').trim() !== '');
      const bestToken = m.bestPerformingToken;
      const worstToken = m.worstPerformingToken;
      const bestTokenLabel = bestToken?.mintAddress ? renderTruncatedTokenMintLink(bestToken, bestToken.pnlUsd) : '—';
      const worstTokenLabel = worstToken?.mintAddress ? renderTruncatedTokenMintLink(worstToken, worstToken.pnlUsd) : '—';
      return `<section class="token-stats-group wallet-top-trader-card">
        <h3 class="token-stats-group-title"><span>#${rank} wallet</span></h3>
        <dl class="token-stats">
          <dt>Account</dt><dd>${accountLink}</dd>
          <dt>Name</dt><dd>${row.accountName || '—'}</dd>
          <dt>Logo</dt><dd>${renderLogoImage(row.accountLogoUrl, row.accountName || display)}</dd>
          <dt>X (Twitter)</dt><dd>${row.accountTwitterUrl ? `<a href="${row.accountTwitterUrl}" target="_blank">${row.accountTwitterUrl}</a>` : '—'}</dd>
          <dt>Labels</dt><dd>${labels.length ? labels.join(', ') : '—'}</dd>
          <dt>Realized PnL</dt><dd>${formatUsdCell(m.realizedPnlUsd)}</dd>
          <dt>Unrealized PnL</dt><dd>${formatUsdCell(m.unrealizedPnlUsd)}</dd>
          <dt>Trades</dt><dd>${formatTradesCountCell(m.tradesCount)}</dd>
          <dt>Volume</dt><dd>${formatUsdCell(m.tradesVolumeUsd)}</dd>
          <dt>Win rate</dt><dd>${m.winRate != null ? `${Math.round(Number(m.winRate))}%` : '—'}</dd>
          <dt>Unique tokens</dt><dd>${formatIntFull(m.uniqueTokensTraded)}</dd>
          <dt>7d PnL points</dt><dd>${formatIntFull(m.sevenDayPnl?.length)}</dd>
          <dt>Best token</dt><dd>${bestTokenLabel}</dd>
          <dt>Worst token</dt><dd>${worstTokenLabel}</dd>
        </dl>
      </section>`;
    }).join('')
    : `<section class="token-stats-group wallet-top-trader-card">
        <h3 class="token-stats-group-title"><span>Wallet</span></h3>
        <dl class="token-stats">
          <dt>Account</dt><dd>—</dd>
          <dt>Name</dt><dd>—</dd>
          <dt>Logo</dt><dd>—</dd>
          <dt>X (Twitter)</dt><dd>—</dd>
          <dt>Labels</dt><dd>—</dd>
          <dt>Realized PnL</dt><dd>—</dd>
          <dt>Unrealized PnL</dt><dd>—</dd>
          <dt>Trades</dt><dd>—</dd>
          <dt>Volume</dt><dd>—</dd>
          <dt>Win rate</dt><dd>—</dd>
          <dt>Unique tokens</dt><dd>—</dd>
          <dt>7d PnL points</dt><dd>—</dd>
          <dt>Best token</dt><dd>—</dd>
          <dt>Worst token</dt><dd>—</dd>
        </dl>
      </section>`;
}

function renderTokenTopPnlTraders(
  data: { data?: TokenTopPnlTraderRow[] },
  query: string,
  queryParams: URLSearchParams,
  volume24hByTrader: Record<string, number>,
  trades24hByTrader: Record<string, number>
): void {
  const list = data.data || [];
  const tradesValues = list.map((row) => toNum(row.tradesCount)).filter((value) => Number.isFinite(value));
  const tradesMin = tradesValues.length ? Math.min(...tradesValues) : 0;
  const tradesMax = tradesValues.length ? Math.max(...tradesValues) : 0;
  const trades24hValues = list
    .map((row) => {
      const addr = row.traderAddress;
      if (!addr || !Object.prototype.hasOwnProperty.call(trades24hByTrader, addr)) return NaN;
      return toNum(trades24hByTrader[addr]);
    })
    .filter((value) => Number.isFinite(value));
  const trades24hMin = trades24hValues.length ? Math.min(...trades24hValues) : 0;
  const trades24hMax = trades24hValues.length ? Math.max(...trades24hValues) : 0;
  tokenTopPnlMeta.textContent = list.length
    ? `GET /v4/tokens/${query}/top-pnl-traders with ${queryParams.toString()} returned ${list.length} row(s).`
    : `GET /v4/tokens/${query}/top-pnl-traders returned 0 rows.`;
  tokenTopPnlBody.innerHTML = list.length
    ? list.map((row, i) => {
      const rank = i + 1;
      const addr = row.traderAddress;
      const display = row.name || (addr ? truncateAddress(addr) : '—');
      const traderLink = addr
        ? `<a href="https://vybe.fyi/wallets/${encodeURIComponent(addr)}" target="_blank" class="mono" title="${addr}">${display}</a>`
        : `<span class="mono">${display}</span>`;
      const vol24h = addr && Object.prototype.hasOwnProperty.call(volume24hByTrader, addr) ? volume24hByTrader[addr] : 0;
      const trades24h = addr && Object.prototype.hasOwnProperty.call(trades24hByTrader, addr) ? trades24hByTrader[addr] : 0;
          return `<tr>
        <td>${rank}</td>
        <td>${traderLink}</td>
        <td style="text-align:right">${formatUsdCellTokenTopPnl(row.realizedPnlUsd)}</td>
        <td style="text-align:right">${formatRovPctCell(row)}</td>
        <td style="text-align:right">${formatUsdCellTokenTopPnl(row.unrealizedPnlUsd)}</td>
        <td style="text-align:right">${formatUsdCellTokenTopPnl(row.totalVolumeUsd)}</td>
        <td class="token-top-pnl-24h-col" style="text-align:right">${formatUsdCellTokenTopPnl(vol24h)}</td>
        <td style="text-align:right">${formatTradesCountHeatCell(row.tradesCount, tradesMin, tradesMax)}</td>
        <td class="token-top-pnl-24h-col" style="text-align:right">${formatTradesCountHeatCell(trades24h, trades24hMin, trades24hMax)}</td>
      </tr>`;
    }).join('')
    : buildTokenTopPnlPlaceholderRowsHtml();
  applyTokenTopPnl24hColumnVisibility();
}

function toNum(value: number | string | undefined): number {
  if (value == null) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatResolutionSectionLabel(resolution: string): string {
  const raw = resolution.trim().toLowerCase();
  const match = raw.match(/^(\d+)([a-z]+)$/);
  if (!match) return resolution;
  const amount = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(amount) || amount <= 0) return resolution;
  if (unit === 'd' && amount === 1) return '24hr';
  if (unit === 'h' && amount === 24) return '24hr';
  if (unit === 'd') return `${amount} Day${amount === 1 ? '' : 's'}`;
  if (unit === 'h') return `${amount} Hour${amount === 1 ? '' : 's'}`;
  if (unit === 'm') return `${amount} Minute${amount === 1 ? '' : 's'}`;
  if (unit === 'w') return `${amount} Week${amount === 1 ? '' : 's'}`;
  return resolution;
}

function formatResolutionForTitle(resolutionLabel: string): string {
  return resolutionLabel.toLowerCase() === '24hr' ? '24Hr' : resolutionLabel;
}

function formatTradeTierValue(n: number): string {
  const num = Math.max(0, Number(n));
  if (!Number.isFinite(num)) return '0';
  if (num >= 1e9) {
    return `${Math.round(num / 1e9)}B`;
  }
  if (num >= 1e6) {
    return `${Math.round(num / 1e6)}M`;
  }
  if (num >= 1e3) {
    const k = Math.round(num / 1e3);
    if (k >= 1000) {
      return `${Math.round(num / 1e6)}M`;
    }
    return `${k}K`;
  }
  return Math.round(num).toLocaleString();
}

/** Legend counts: plain locale ≤999, else compact K/M/B like {@link formatTradeTierValue}. */
function formatLegendTradeCount(n: number): string {
  return formatTradeTierValue(Math.round(Math.max(0, n)));
}

/** Donut hub second line: compact K / M / B with no fractional digits. */
function formatTradeTierCenterTradesSubtitle(totalTrades: number): string {
  const num = Math.round(Math.max(0, totalTrades));
  if (!Number.isFinite(num) || num === 0) return '0 Trades';
  if (num >= 1e9) {
    return `${Math.round(num / 1e9)}B Trades`;
  }
  if (num >= 1e6) {
    return `${Math.round(num / 1e6)}M Trades`;
  }
  if (num >= 1e3) {
    const k = Math.round(num / 1e3);
    if (k >= 1000) {
      return `${Math.round(num / 1e6)}M Trades`;
    }
    return `${k}K Trades`;
  }
  return `${num.toLocaleString()} Trades`;
}

function getResolutionKey(): string {
  return tokenTopPnlResolution.value.trim().toLowerCase();
}

function shouldShowSelectedTradesVerticalRow(): boolean {
  const resolution = getResolutionKey();
  return resolution === '1d' || resolution === '7d' || resolution === '30d';
}

function applySelectedTradesVerticalRowVisibility(): void {
  tokenTradesCountSelectedRow.hidden = !shouldShowSelectedTradesVerticalRow();
}

/** Selected token top‑PnL `limit` query value for labels (never the letter “N”). */
function getTokenTopPnlLimitDisplay(): string {
  const parsed = Number.parseInt(String(tokenTopPnlLimit.value).trim(), 10);
  if (Number.isFinite(parsed) && parsed > 0) return String(parsed);
  return '1000';
}

function setTradeTierDashboardMeta(titleResolution: string, resolutionLabel: string): void {
  const lim = getTokenTopPnlLimitDisplay();
  tokenTopTradesByProfitTitle.textContent = `Profitable traders by activity (Last ${titleResolution})`;
  if (tokenTradeTierLede) {
    tokenTradeTierLede.textContent = `Top ${lim} (${resolutionLabel}). Profitable-only trade-share; full-list tiers.`;
  }
  if (tokenVolumePnlLede) {
    tokenVolumePnlLede.textContent = `Top ${lim} (${resolutionLabel}). Dollar volume split by realized PnL band.`;
  }
  if (tokenTradeTierFooterMethodology) {
    tokenTradeTierFooterMethodology.textContent =
      'Listed trade count by activity tier among profitable wallets; slice ∝ each tier’s share of total trades.';
  }
  if (tokenTradeTierFooterScope) {
    tokenTradeTierFooterScope.textContent = `Top ${lim} (${resolutionLabel}). Trade-share pie and tier bars on this card; volume donut and PnL bars in the card below.`;
  }
  if (tokenSupplyCardDescPnl) {
    tokenSupplyCardDescPnl.textContent = `Traders per realized PnL band (top ${lim}, ${resolutionLabel}). Positive bands: green → yellow by amount. A red < $0 column appears only when some traders have negative realized PnL.`;
  }
  if (tokenSupplyCardDescTradesVertical) {
    tokenSupplyCardDescTradesVertical.textContent = `Traders per trade-count band (top ${lim}; same tiers as the pie).`;
  }
  if (tokenTradeTierTimeframe) {
    tokenTradeTierTimeframe.textContent = resolutionLabel;
  }
  if (tokenVolumePnlFooterMethodology) {
    tokenVolumePnlFooterMethodology.textContent =
      'Listed volume by merged realized PnL band; slice ∝ each band’s share of total traded USD.';
  }
  if (tokenVolumePnlFooterScope) {
    tokenVolumePnlFooterScope.textContent = `Top ${lim} (${resolutionLabel}). Volume donut and PnL bars on this card; trade-share tiers in the card above.`;
  }
  if (tokenVolumePnlTimeframe) {
    tokenVolumePnlTimeframe.textContent = resolutionLabel;
  }
}

function syncTokenSupplySectionHeadingsForResolution(): void {
  const resolutionLabel = formatResolutionSectionLabel(tokenTopPnlResolution.value);
  const titleResolution = formatResolutionForTitle(resolutionLabel);
  tokenSupplySelectedTitle.textContent = resolutionLabel;
  tokenTopVolumeSelectedTitle.textContent = `Profitable traders by volume (Last ${titleResolution})`;
  setTradeTierDashboardMeta(titleResolution, resolutionLabel);
  tokenPnlSelectedTitle.textContent = `PnL distribution (Last ${titleResolution})`;
  tokenTradesCountSelectedTitle.textContent = `Trades count distribution (Last ${titleResolution})`;
}

/**
 * Volume-by-PnL donut legend: share → realized → trades (band only) → traders → slice volume / total vol USD.
 */
function renderPieLegendVolumePnlCard(
  label: string,
  slicePct: number,
  realizedUsd: number,
  traderCount: number,
  bandTrades: number,
  volumeUsd: number,
  totalVolUsdAll: number,
  fill: PieSliceSpec
): string {
  const accent = pieSliceAccentSolid(fill);
  const swatchBg = pieSliceLegendBackground(fill);
  const tradesCompact = formatLegendTradeCount(bandTrades);
  const tradesWord = bandTrades === 1 ? ' trade' : ' trades';
  const volSlice = formatUsdFull(volumeUsd);
  const volTotal = formatUsdFull(totalVolUsdAll);
  const title = escapeHtmlText(label);
  return `<div class="token-supply-legend-item token-supply-legend-item--tier-dashboard">
    <article class="token-tier-card" style="--tier-accent:${accent};--tier-swatch:${accent}">
      <h4 class="token-tier-card__title">${title}</h4>
      <ul class="token-tier-card__metrics">
        <li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--share-swatch" style="--tier-swatch:${swatchBg}" aria-hidden="true"></span>
          <div class="token-tier-metric__body">
            <span class="token-tier-metric__slice-pct">${formatPctSmart(slicePct)}</span><span class="token-tier-metric__muted"> share</span>
        </div>
        </li>
        <li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--usd" aria-hidden="true">$</span>
          <div class="token-tier-metric__body">
            <span class="token-tier-metric__accent-usd">${formatUsdFull(realizedUsd)}</span><span class="token-tier-metric__muted"> realized</span>
      </div>
        </li>
        <li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--layers" aria-hidden="true">${TIER_LEGEND_SVG_STACK}</span>
          <div class="token-tier-metric__body">
            <span class="token-tier-metric__vol-pnl-trades-val">${tradesCompact}</span><span class="token-tier-metric__muted">${tradesWord}</span>
        </div>
        </li>
        <li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--people" aria-hidden="true">${TIER_LEGEND_SVG_USER}</span>
          <div class="token-tier-metric__body">
            <span class="token-tier-metric__emph">${Math.max(0, Math.round(traderCount)).toLocaleString()}</span><span class="token-tier-metric__muted"> traders</span>
      </div>
        </li>
        <li class="token-tier-metric token-tier-metric--total">
          <span class="token-tier-metric__ico token-tier-metric__ico--volume" aria-hidden="true">${TIER_LEGEND_SVG_VOLUME}</span>
          <div class="token-tier-metric__body token-tier-metric__body--stack">
            <span class="token-tier-metric__label">Total volume</span>
            <span class="token-tier-metric__ratio token-tier-metric__ratio--vol-pnl-split">
              <span class="token-tier-metric__vol-pnl-slice-val">${volSlice}</span><span class="token-tier-metric__vol-pnl-totalvol-suffix"> / ${volTotal}</span>
            </span>
        </div>
        </li>
      </ul>
    </article>
  </div>`;
}

function renderPieLegendVolumePnlCardPlaceholder(fill: PieSliceSpec): string {
  const dash = '—';
  const accent = pieSliceAccentSolid(fill);
  const swatchBg = pieSliceLegendBackground(fill);
  return `<div class="token-supply-legend-item token-supply-legend-item--tier-dashboard">
    <article class="token-tier-card token-tier-card--placeholder" style="--tier-accent:${accent};--tier-swatch:${accent}">
      <h4 class="token-tier-card__title">${dash}</h4>
      <ul class="token-tier-card__metrics">
        <li class="token-tier-metric"><span class="token-tier-metric__ico token-tier-metric__ico--share-swatch" style="--tier-swatch:${swatchBg}" aria-hidden="true"></span><div class="token-tier-metric__body"><span class="token-tier-metric__muted">${dash}</span></div></li>
        <li class="token-tier-metric"><span class="token-tier-metric__ico token-tier-metric__ico--usd" aria-hidden="true">$</span><div class="token-tier-metric__body"><span class="token-tier-metric__muted">${dash}</span></div></li>
        <li class="token-tier-metric"><span class="token-tier-metric__ico token-tier-metric__ico--layers" aria-hidden="true">${TIER_LEGEND_SVG_STACK}</span><div class="token-tier-metric__body"><span class="token-tier-metric__muted">${dash}</span></div></li>
        <li class="token-tier-metric"><span class="token-tier-metric__ico token-tier-metric__ico--people" aria-hidden="true">${TIER_LEGEND_SVG_USER}</span><div class="token-tier-metric__body"><span class="token-tier-metric__muted">${dash}</span></div></li>
        <li class="token-tier-metric token-tier-metric--total"><span class="token-tier-metric__ico token-tier-metric__ico--volume" aria-hidden="true">${TIER_LEGEND_SVG_VOLUME}</span><div class="token-tier-metric__body token-tier-metric__body--stack"><span class="token-tier-metric__label">Total volume</span><span class="token-tier-metric__ratio token-tier-metric__ratio--vol-pnl-split"><span class="token-tier-metric__vol-pnl-slice-val">${dash}</span><span class="token-tier-metric__vol-pnl-totalvol-suffix"> / ${dash}</span></span></div></li>
      </ul>
    </article>
  </div>`;
}

/** Trade-tier pie: dashboard-style tier cards (share, realized, volume, traders, total trades). */
function renderPieLegendTradeTierRow(
  label: string,
  slicePct: number,
  realizedUsd: number,
  volumeUsd: number,
  traderCount: number,
  tierTrades: number,
  totalTrades: number,
  fill: PieSliceSpec
): string {
  const tierStr = formatLegendTradeCount(tierTrades);
  const totalStr = formatLegendTradeCount(totalTrades);
  const title = escapeHtmlText(label);
  const accent = pieSliceAccentSolid(fill);
  const swatchBg = pieSliceLegendBackground(fill);
  return `<div class="token-supply-legend-item token-supply-legend-item--tier-dashboard">
    <article class="token-tier-card" style="--tier-accent:${accent};--tier-swatch:${accent}">
      <h4 class="token-tier-card__title">${title}</h4>
      <ul class="token-tier-card__metrics">
        <li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--share-swatch" style="--tier-swatch:${swatchBg}" aria-hidden="true"></span>
          <div class="token-tier-metric__body">
            <span class="token-tier-metric__slice-pct">${formatPctSmart(slicePct)}</span><span class="token-tier-metric__muted"> share</span>
      </div>
        </li>
        <li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--usd" aria-hidden="true">$</span>
          <div class="token-tier-metric__body">
            <span class="token-tier-metric__accent-usd">${formatUsdFull(realizedUsd)}</span><span class="token-tier-metric__muted"> realized</span>
          </div>
        </li>
        <li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--volume" aria-hidden="true">${TIER_LEGEND_SVG_VOLUME}</span>
          <div class="token-tier-metric__body">
            <span class="token-tier-metric__accent-volume">${formatUsdFull(volumeUsd)}</span><span class="token-tier-metric__muted"> volume</span>
          </div>
        </li>
        <li class="token-tier-metric">
          <span class="token-tier-metric__ico token-tier-metric__ico--people" aria-hidden="true">${TIER_LEGEND_SVG_USER}</span>
          <div class="token-tier-metric__body">
            <span class="token-tier-metric__emph">${traderCount.toLocaleString()}</span><span class="token-tier-metric__muted"> traders</span>
          </div>
        </li>
        <li class="token-tier-metric token-tier-metric--total">
          <span class="token-tier-metric__ico token-tier-metric__ico--layers" aria-hidden="true">${TIER_LEGEND_SVG_STACK}</span>
          <div class="token-tier-metric__body token-tier-metric__body--stack">
            <span class="token-tier-metric__label">Total trades</span>
            <span class="token-tier-metric__ratio token-tier-metric__ratio--vol-pnl-split">
              <span class="token-tier-metric__vol-pnl-slice-val">${tierStr}</span><span class="token-tier-metric__vol-pnl-totalvol-suffix"> / ${totalStr}</span>
            </span>
          </div>
        </li>
      </ul>
    </article>
    </div>`;
}

function renderTierPieLegendPlaceholder(fill: PieSliceSpec): string {
  const dash = '—';
  const accent = pieSliceAccentSolid(fill);
  const swatchBg = pieSliceLegendBackground(fill);
  return `<div class="token-supply-legend-item token-supply-legend-item--tier-dashboard">
    <article class="token-tier-card token-tier-card--placeholder" style="--tier-accent:${accent};--tier-swatch:${accent}">
      <h4 class="token-tier-card__title">${dash}</h4>
      <ul class="token-tier-card__metrics">
        <li class="token-tier-metric"><span class="token-tier-metric__ico token-tier-metric__ico--share-swatch" style="--tier-swatch:${swatchBg}" aria-hidden="true"></span><div class="token-tier-metric__body"><span class="token-tier-metric__muted">${dash}</span></div></li>
        <li class="token-tier-metric"><span class="token-tier-metric__ico token-tier-metric__ico--usd" aria-hidden="true">$</span><div class="token-tier-metric__body"><span class="token-tier-metric__muted">${dash}</span></div></li>
        <li class="token-tier-metric"><span class="token-tier-metric__ico token-tier-metric__ico--volume" aria-hidden="true">${TIER_LEGEND_SVG_VOLUME}</span><div class="token-tier-metric__body"><span class="token-tier-metric__muted">${dash}</span></div></li>
        <li class="token-tier-metric"><span class="token-tier-metric__ico token-tier-metric__ico--people" aria-hidden="true">${TIER_LEGEND_SVG_USER}</span><div class="token-tier-metric__body"><span class="token-tier-metric__muted">${dash}</span></div></li>
        <li class="token-tier-metric token-tier-metric--total"><span class="token-tier-metric__ico token-tier-metric__ico--layers" aria-hidden="true">${TIER_LEGEND_SVG_STACK}</span><div class="token-tier-metric__body token-tier-metric__body--stack"><span class="token-tier-metric__label">Total trades</span><span class="token-tier-metric__ratio token-tier-metric__ratio--vol-pnl-split"><span class="token-tier-metric__vol-pnl-slice-val">${dash}</span><span class="token-tier-metric__vol-pnl-totalvol-suffix"> / ${dash}</span></span></div></li>
      </ul>
    </article>
  </div>`;
}

function applyTokenModeChartsPlaceholder(): void {
  tokenSupplyPieTotal.style.background = buildPieGradientWithGaps(
    new Array(VOLUME_PNL_PIE_MERGED_USD_BANDS.length).fill(0),
    [...VOLUME_PNL_PIE_MERGED_SLICE_FILLS]
  );
  tokenSupplyLegendTotal.innerHTML = VOLUME_PNL_PIE_MERGED_USD_BANDS.map((_, i) =>
    renderPieLegendVolumePnlCardPlaceholder(VOLUME_PNL_PIE_MERGED_SLICE_FILLS[i] ?? '#27272a')
  ).join('');
  clearDonutPieOverlays(tokenSupplyPieTotal);
  mountDonutPieCenterHub(tokenSupplyPieTotal, { mock: true, hubSubline: '—' });

  tokenSupplyPieTradesCount.style.background = buildPieGradientWithGaps(
    new Array(TRADE_TIER_PIE_SEGMENT_COUNT).fill(0),
    [...TRADE_TIER_PIE_SLICE_FILLS]
  );
  clearDonutPieOverlays(tokenSupplyPieTradesCount);
  mountDonutPieCenterHub(tokenSupplyPieTradesCount, { mock: true, hubSubline: '—' });
  tokenSupplyLegendTradesCount.innerHTML = TRADE_TIER_PIE_SLICE_FILLS.map((fill) => renderTierPieLegendPlaceholder(fill)).join('');
  if (tokenTradeTierInsightText) tokenTradeTierInsightText.textContent = '—';
  if (tokenVolumePnlInsightText) tokenVolumePnlInsightText.textContent = '—';

  tokenPnlBarsTotal.innerHTML = Array.from({ length: 8 }, (_, j) => {
    const t = j / 7;
    const dash = '—';
    return `<div class="token-trades-vertical-bar-item">
        <div class="token-trades-vertical-track">
          <div class="token-trades-vertical-fill token-pnl-bar-fill--trade-scale-pnl-dist" style="height:0%; --trade-grad-t:${t.toFixed(4)};"></div>
          <span class="token-trades-vertical-count">${dash}</span>
        </div>
        <div class="token-trades-vertical-label token-pnl-dist-band-text" style="--trade-grad-t:${t.toFixed(4)}">${dash}</div>
      </div>`;
  }).join('');
  syncPnlDistributionBarsGrid(false);

  syncTokenSupplySectionHeadingsForResolution();

  applySelectedTradesVerticalRowVisibility();
  if (shouldShowSelectedTradesVerticalRow()) {
    const dash = '—';
    tokenTradesCountBarsVertical.innerHTML = Array.from({ length: 10 }, (_, i) => {
      const t = 1 - i / 9;
      return `<div class="token-trades-vertical-bar-item">
        <div class="token-trades-vertical-track">
          <div class="token-trades-vertical-fill token-pnl-bar-fill--trade-scale" style="height:0%; --trade-grad-t:${t.toFixed(4)};"></div>
          <span class="token-trades-vertical-count">${dash}</span>
        </div>
        <div class="token-trades-vertical-label token-trades-count-dist-band-text" style="--trade-grad-t:${t.toFixed(4)}">${dash}</div>
      </div>`;
    }).join('');
  } else {
    tokenTradesCountBarsVertical.innerHTML = '';
  }
}

function applyTokenModePlaceholder(): void {
  const dash = '—';
  tokenLogo.style.display = 'none';
  tokenSymbol.textContent = dash;
  tokenName.textContent = dash;
  tokenName.removeAttribute('title');
  tokenLastUpdatedValue.textContent = dash;
  tokenStats.innerHTML = buildTokenStatsPlaceholderHtml();
  applyTokenModeChartsPlaceholder();
}

function formatPctSmart(value: number): string {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return '0%';
  const abs = Math.abs(num);
  if (abs >= 0.01) return `${num.toFixed(2)}%`;
  const decimalsToFirstNonZero = Math.ceil(-Math.log10(abs));
  const decimals = Math.max(3, Math.min(8, decimalsToFirstNonZero));
  return `${num.toFixed(decimals)}%`;
}

type HistoricalPricePctPeriod = '24hr' | '7d';

/**
 * % vs current USD price with **spot as denominator**: `(spot − historical) / spot × 100`.
 * Appended after historical price rows when spot is valid; arrow + period label after the %.
 */
function formatHistoricalPricePctVsSpotHtml(
  spot: number | undefined,
  historical: number | undefined,
  period: HistoricalPricePctPeriod
): string {
  if (spot == null || historical == null || !Number.isFinite(spot) || !Number.isFinite(historical) || spot === 0) {
    return '';
  }
  const pct = ((spot - historical) / spot) * 100;
  const toneClass =
    pct > 0 ? 'usd-tone usd-tone--positive' : pct < 0 ? 'usd-tone usd-tone--negative' : 'usd-tone usd-tone--neutral';
  const sign = pct > 0 ? '+' : '';
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '';
  const pctSpan = `<span class="token-stat-price-pct ${toneClass}">${sign}${formatPctSmart(pct)}</span>`;
  const arrowSpan = arrow
    ? `<span class="token-stat-price-pct-arrow ${toneClass}" aria-hidden="true">${arrow}</span>`
    : '';
  const periodSpan = `<span class="token-stat-price-pct-period">${escapeHtmlText(period)}</span>`;
  const meta = `<span class="token-stat-price-pct-meta">${arrowSpan}${periodSpan}</span>`;
  return ` ${pctSpan}${meta}`;
}

function getTraderPnl(row: TokenTopPnlTraderRow): number {
  return toNum(row.realizedPnlUsd);
}

function formatUsdBucketValue(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs === 0) return '$0';
  if (abs >= 0.01 && abs < 1) {
    return `${sign}$${abs.toFixed(2)}`;
  }
  if (abs >= 1) {
    const core = Number.isInteger(abs)
      ? abs.toLocaleString()
      : abs.toFixed(2).replace(/\.?0+$/, '');
    return `${sign}$${core}`;
  }
  const fixed = abs.toFixed(6).replace(/\.?0+$/, '');
  const core = fixed.length > 0 && Number(fixed) > 0 ? fixed : abs.toExponential(2);
  return `${sign}$${core}`;
}

function buildCountTierEdges(maxVal: number): number[] {
  // 9 edges => 8 visible groups by default.
  const edges = [0, 1, 5, 10, 25, 50, 100, 500, 1000];
  while (edges[edges.length - 1] < maxVal) {
    edges.push(edges[edges.length - 1] * 10);
  }
  return edges;
}

/** Gap wedges between slices; must stay in sync with {@link tradeTierPieSliceMidAnglesDeg}. */
const PIE_CONIC_GAP_DEG = 1.2;

function pieSliceLegendBackground(spec: PieSliceSpec): string {
  if (typeof spec === 'string') return spec;
  return `linear-gradient(90deg, ${spec.dark}, ${spec.light})`;
}

/** Solid stop for `border-left` / `--tier-accent` (gradients are invalid there). */
function pieSliceAccentSolid(spec: PieSliceSpec): string {
  if (typeof spec === 'string') return spec;
  return spec.dark;
}

function pieSliceSpecToLabelHex(spec: PieSliceSpec): string {
  if (typeof spec === 'string') {
    return spec.startsWith('#') ? spec : hslToHex(0, 0, 55);
  }
  const a = parseHslCss(spec.dark);
  const b = parseHslCss(spec.light);
  if (a && b) {
    return hslToHex(a.h, (a.s + b.s) / 2, (a.l + b.l) / 2);
  }
  if (spec.dark.startsWith('#') && spec.light.startsWith('#')) {
    return lerpHex(spec.dark, spec.light, 0.5);
  }
  return '#64748b';
}

function buildPieGradientWithGaps(
  slices: number[],
  colors: PieSliceSpec[],
  gapColor = '#0a0a0d',
  gapDeg = PIE_CONIC_GAP_DEG
): string {
  const entries = slices
    .map((value, i) => ({ value: Math.max(0, value), fill: colors[i] ?? '#27272a' }))
    .filter((entry) => entry.value > 0);

  if (entries.length === 0) {
    return `conic-gradient(${gapColor} 0deg 360deg)`;
  }

  if (entries.length === 1) {
    const spec = entries[0].fill;
    if (typeof spec === 'string') {
      return `conic-gradient(${spec} 0deg 360deg)`;
    }
    return `conic-gradient(${spec.dark} 0deg, ${spec.light} 360deg)`;
  }

  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const totalGap = Math.min(359, gapDeg * entries.length);
  const usableDeg = Math.max(1, 360 - totalGap);
  const stops: string[] = [];
  let cursor = 0;

  entries.forEach((entry) => {
    const gapStart = cursor;
    const gapEnd = gapStart + gapDeg;
    stops.push(`${gapColor} ${gapStart.toFixed(3)}deg ${gapEnd.toFixed(3)}deg`);
    cursor = gapEnd;

    const sliceDeg = usableDeg * (entry.value / total);
    const sliceStart = cursor;
    const sliceEnd = sliceStart + sliceDeg;
    const spec = entry.fill;
    if (typeof spec === 'string') {
      stops.push(`${spec} ${sliceStart.toFixed(3)}deg ${sliceEnd.toFixed(3)}deg`);
    } else {
      stops.push(`${spec.dark} ${sliceStart.toFixed(3)}deg, ${spec.light} ${sliceEnd.toFixed(3)}deg`);
    }
    cursor = sliceEnd;
  });

  if (cursor < 360) {
    stops.push(`${gapColor} ${cursor.toFixed(3)}deg 360deg`);
  }

  return `conic-gradient(${stops.join(', ')})`;
}

/** Mid-angle (degrees, CSS conic: 0° = top, clockwise) per slice index; null if slice weight is 0. */
function tradeTierPieSliceMidAnglesDeg(slices: number[], gapDeg: number): (number | null)[] {
  const out: (number | null)[] = slices.map(() => null);
  const entries = slices
    .map((value, i) => ({ value: Math.max(0, value), i }))
    .filter((e) => e.value > 0);
  if (entries.length === 0) return out;
  if (entries.length === 1) {
    out[entries[0].i] = 0;
    return out;
  }
  const total = entries.reduce((sum, e) => sum + e.value, 0);
  const totalGap = Math.min(359, gapDeg * entries.length);
  const usableDeg = Math.max(1, 360 - totalGap);
  let cursor = 0;
  for (const entry of entries) {
    cursor += gapDeg;
    const sliceDeg = usableDeg * (entry.value / total);
    out[entry.i] = cursor + sliceDeg / 2;
    cursor += sliceDeg;
  }
  return out;
}

/** Angular width (degrees) of each slice; null if weight is 0. Mirrors {@link buildPieGradientWithGaps}. */
function tradeTierPieSliceSpanDeg(slices: number[], gapDeg: number): (number | null)[] {
  const out: (number | null)[] = slices.map(() => null);
  const entries = slices
    .map((value, i) => ({ value: Math.max(0, value), i }))
    .filter((e) => e.value > 0);
  if (entries.length === 0) return out;
  if (entries.length === 1) {
    out[entries[0].i] = 360;
    return out;
  }
  const total = entries.reduce((sum, e) => sum + e.value, 0);
  const totalGap = Math.min(359, gapDeg * entries.length);
  const usableDeg = Math.max(1, 360 - totalGap);
  let cursor = 0;
  for (const entry of entries) {
    cursor += gapDeg;
    const sliceDeg = usableDeg * (entry.value / total);
    out[entry.i] = sliceDeg;
    cursor += sliceDeg;
  }
  return out;
}

function clearDonutPieOverlays(pieEl: HTMLElement): void {
  pieEl.querySelector('.token-supply-pie__label-svg')?.remove();
  pieEl.querySelector('.token-supply-pie__hub')?.remove();
}

function mountDonutPieCenterHub(pieEl: HTMLElement, options: { mock: boolean; hubSubline: string }): void {
  pieEl.querySelector('.token-supply-pie__hub')?.remove();
  const hub = document.createElement('div');
  hub.className = 'token-supply-pie__hub';
  hub.setAttribute('aria-hidden', 'true');
  const pctEl = document.createElement('div');
  pctEl.className = 'token-supply-pie__hub-pct';
  pctEl.textContent = options.mock ? '—' : '100%';
  const subEl = document.createElement('div');
  subEl.className = 'token-supply-pie__hub-sub';
  subEl.textContent = options.hubSubline;
  hub.appendChild(pctEl);
  hub.appendChild(subEl);
  pieEl.appendChild(hub);
}

/**
 * Minimum angle (degrees) between adjacent **outside** % labels around the donut.
 * Raise this to spread callouts wider; lower to let labels sit closer (may overlap on tiny slices).
 * `TIER_PIE_LABEL_MAX_TANGENT_DEG` must stay large enough to reach this target at the 0°/360° wrap.
 */
const TIER_PIE_OUTSIDE_LABEL_MIN_ANGULAR_SEP_DEG = 28;

const TIER_PIE_LABEL_MIN_SEP_DEG = TIER_PIE_OUTSIDE_LABEL_MIN_ANGULAR_SEP_DEG;
const TIER_PIE_LABEL_TIGHT_PAIR_MIN_DEG = TIER_PIE_OUTSIDE_LABEL_MIN_ANGULAR_SEP_DEG;
const TIER_PIE_LABEL_MAX_ANGLE_OFF = 15;
const TIER_PIE_LABEL_MAX_TANGENT_DEG = 44;
const TIER_PIE_LABEL_R_STACK = 7.25;
/** Donut hole inset 27% → inner radius ≈ 23 in viewBox-50 units; outer rim ~49.25. */
const TIER_PIE_R_INNER = 23;
const TIER_PIE_R_OUTER = 49.25;
const TIER_PIE_R_LABEL_INSIDE = (TIER_PIE_R_INNER + TIER_PIE_R_OUTER) / 2;
const TIER_PIE_INSIDE_FONT_UNITS = 4.35;
/** Below this angular width, labels always use outside callouts. */
const TIER_PIE_INSIDE_MIN_SLICE_DEG = 10;
/**
 * Below this share of the donut (% points), labels always use outside callouts so text
 * does not crowd thin slices (geometric fit alone may still allow inside for ~4–5%).
 */
const TIER_PIE_INSIDE_MIN_PCT = 5;
/**
 * Inside labels only if arc length at label radius fits estimated text width × pad.
 * Lower pad → more labels inside (narrow slices like ~6%); higher → safer from clipping.
 */
const TIER_PIE_INSIDE_ARC_PAD = 0.84;

type TierPieLabelCand = { mid: number; pct: number; i: number };

function tradeTierEstimatePctLabelWidth(pct: number, fontUnits: number): number {
  const len = `${pct.toFixed(2)}%`.length;
  return len * fontUnits * 0.52;
}

function tradeTierPieLabelFitsInside(spanDeg: number | null, pct: number): boolean {
  if (spanDeg == null || spanDeg < TIER_PIE_INSIDE_MIN_SLICE_DEG) return false;
  if (pct < TIER_PIE_INSIDE_MIN_PCT) return false;
  const arcLen = TIER_PIE_R_LABEL_INSIDE * ((spanDeg * Math.PI) / 180);
  const w = tradeTierEstimatePctLabelWidth(pct, TIER_PIE_INSIDE_FONT_UNITS);
  return arcLen >= w * TIER_PIE_INSIDE_ARC_PAD;
}

function tradeTierPieLabelFillForSlice(hex: string): { fill: string; onDarkSlice: boolean } {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.52 ? { fill: '#0f172a', onDarkSlice: false } : { fill: '#f8fafc', onDarkSlice: true };
}

function clampNum(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Separate outside labels on the circle, including the wrap at 0°/360° (linear sort misses that pair).
 * Phase 1: nudge slice-linked angles. Phase 2: tangential offsets (label-only bearing) so text separates
 * even when radial stacking cannot. Phase 3: radial tiers from combined label bearing.
 */
function computeTradeTierPieLabelLayout(cands: TierPieLabelCand[]): {
  angleOff: Map<number, number>;
  tangentialDeg: Map<number, number>;
  radialBoost: Map<number, number>;
} {
  const angleOff = new Map<number, number>();
  const tangentialDeg = new Map<number, number>();
  for (const c of cands) {
    angleOff.set(c.i, 0);
    tangentialDeg.set(c.i, 0);
  }
  const eff = (c: TierPieLabelCand) => c.mid + (angleOff.get(c.i) ?? 0);
  const lab = (c: TierPieLabelCand) => c.mid + (angleOff.get(c.i) ?? 0) + (tangentialDeg.get(c.i) ?? 0);
  const n = cands.length;
  const radialBoost = new Map<number, number>();

  if (n <= 1) return { angleOff, tangentialDeg, radialBoost };

  for (let pass = 0; pass < 32; pass++) {
    const ord = [...cands].sort((a, b) => eff(a) - eff(b));
    let changed = false;
    for (let k = 0; k < n; k++) {
      const a = ord[k];
      const b = ord[(k + 1) % n];
      const ea = eff(a);
      const eb = eff(b) + (k === n - 1 ? 360 : 0);
      const gap = eb - ea;
      if (gap >= TIER_PIE_LABEL_MIN_SEP_DEG) continue;
      const deficit = TIER_PIE_LABEL_MIN_SEP_DEG - gap;
      const step = Math.min(deficit * 0.52, 5.5);
      angleOff.set(a.i, clampNum((angleOff.get(a.i) ?? 0) - step, -TIER_PIE_LABEL_MAX_ANGLE_OFF, TIER_PIE_LABEL_MAX_ANGLE_OFF));
      angleOff.set(b.i, clampNum((angleOff.get(b.i) ?? 0) + step, -TIER_PIE_LABEL_MAX_ANGLE_OFF, TIER_PIE_LABEL_MAX_ANGLE_OFF));
      changed = true;
    }
    if (!changed) break;
  }

  for (let pass = 0; pass < 36; pass++) {
    const ord = [...cands].sort((a, b) => lab(a) - lab(b));
    let changed = false;
    for (let k = 0; k < n; k++) {
      const a = ord[k];
      const b = ord[(k + 1) % n];
      const la = lab(a);
      const lb = lab(b) + (k === n - 1 ? 360 : 0);
      const gap = lb - la;
      if (gap >= TIER_PIE_LABEL_MIN_SEP_DEG) continue;
      const deficit = TIER_PIE_LABEL_MIN_SEP_DEG - gap;
      const half = Math.min(deficit * 0.55, 9);
      tangentialDeg.set(
        a.i,
        clampNum((tangentialDeg.get(a.i) ?? 0) - half, -TIER_PIE_LABEL_MAX_TANGENT_DEG, TIER_PIE_LABEL_MAX_TANGENT_DEG)
      );
      tangentialDeg.set(
        b.i,
        clampNum((tangentialDeg.get(b.i) ?? 0) + half, -TIER_PIE_LABEL_MAX_TANGENT_DEG, TIER_PIE_LABEL_MAX_TANGENT_DEG)
      );
      changed = true;
    }
    if (!changed) break;
  }

  {
    const ord = [...cands].sort((a, b) => lab(a) - lab(b));
    let tightK = 0;
    let tightGap = Infinity;
    for (let k = 0; k < n; k++) {
      const la = lab(ord[k]);
      const lb = lab(ord[(k + 1) % n]) + (k === n - 1 ? 360 : 0);
      const g = lb - la;
      if (g < tightGap) {
        tightGap = g;
        tightK = k;
      }
    }
    if (tightGap < TIER_PIE_LABEL_TIGHT_PAIR_MIN_DEG) {
      const a = ord[tightK];
      const b = ord[(tightK + 1) % n];
      const push = (TIER_PIE_LABEL_TIGHT_PAIR_MIN_DEG - tightGap) * 0.45 + 12;
      tangentialDeg.set(
        a.i,
        clampNum((tangentialDeg.get(a.i) ?? 0) - push, -TIER_PIE_LABEL_MAX_TANGENT_DEG, TIER_PIE_LABEL_MAX_TANGENT_DEG)
      );
      tangentialDeg.set(
        b.i,
        clampNum((tangentialDeg.get(b.i) ?? 0) + push, -TIER_PIE_LABEL_MAX_TANGENT_DEG, TIER_PIE_LABEL_MAX_TANGENT_DEG)
      );
    }
  }

  const ord = [...cands].sort((a, b) => lab(a) - lab(b));
  let prev = -Infinity;
  let stack = 0;
  for (const item of ord) {
    const e = lab(item);
    if (e - prev < TIER_PIE_LABEL_MIN_SEP_DEG * 0.55) stack += 1;
    else stack = 0;
    prev = e;
    let boost = stack * TIER_PIE_LABEL_R_STACK;
    if (item.pct < 8) boost += TIER_PIE_LABEL_R_STACK * 0.55;
    radialBoost.set(item.i, boost);
  }
  if (n >= 2) {
    const wrapGap = lab(ord[0]) + 360 - lab(ord[n - 1]);
    if (wrapGap < TIER_PIE_LABEL_MIN_SEP_DEG * 0.55) {
      const victim = ord[0].i;
      radialBoost.set(victim, (radialBoost.get(victim) ?? 0) + TIER_PIE_LABEL_R_STACK);
      const victim2 = ord[n - 1].i;
      radialBoost.set(victim2, (radialBoost.get(victim2) ?? 0) + TIER_PIE_LABEL_R_STACK * 0.85);
    }
  }

  return { angleOff, tangentialDeg, radialBoost };
}

/** Slice labels: inside the ring when arc fits the string; otherwise outside with leaders. */
function mountDonutPieSliceLabelOverlay(pieEl: HTMLElement, slicePcts: number[], sliceSpecs: PieSliceSpec[]): void {
  clearDonutPieOverlays(pieEl);
  const mids = tradeTierPieSliceMidAnglesDeg(slicePcts, PIE_CONIC_GAP_DEG);
  const spans = tradeTierPieSliceSpanDeg(slicePcts, PIE_CONIC_GAP_DEG);
  const cx = 50;
  const cy = 50;
  const rEdge = TIER_PIE_R_OUTER;
  const rTextBase = 61;
  const lineEndInset = 5.2;

  const candidates: TierPieLabelCand[] = [];
  for (let i = 0; i < slicePcts.length; i++) {
    const pct = slicePcts[i];
    const mid = mids[i];
    if (pct <= 0 || mid == null || !Number.isFinite(mid)) continue;
    candidates.push({ mid, pct, i });
  }

  const inside = new Set<number>();
  for (const c of candidates) {
    if (tradeTierPieLabelFitsInside(spans[c.i], c.pct)) inside.add(c.i);
  }

  const outsideCands = candidates.filter((c) => !inside.has(c.i));
  const { angleOff, tangentialDeg, radialBoost } = computeTradeTierPieLabelLayout(outsideCands);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'token-supply-pie__label-svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('overflow', 'visible');
  svg.setAttribute('aria-hidden', 'true');

  for (const { mid, pct, i } of candidates) {
    const color = pieSliceSpecToLabelHex(sliceSpecs[i] ?? '#38bdf8');

    if (inside.has(i)) {
      const rad = (mid * Math.PI) / 180;
      const tx = cx + TIER_PIE_R_LABEL_INSIDE * Math.sin(rad);
      const ty = cy - TIER_PIE_R_LABEL_INSIDE * Math.cos(rad);
      const { fill, onDarkSlice } = tradeTierPieLabelFillForSlice(color);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute(
        'class',
        `token-supply-pie__label-text token-supply-pie__label-text--inside${onDarkSlice ? ' token-supply-pie__label-text--inside-on-dark' : ' token-supply-pie__label-text--inside-on-light'}`
      );
      text.setAttribute('x', tx.toFixed(2));
      text.setAttribute('y', ty.toFixed(2));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', fill);
      text.textContent = `${pct.toFixed(2)}%`;
      svg.appendChild(text);
      continue;
    }

    const showMid = mid + (angleOff.get(i) ?? 0) + (tangentialDeg.get(i) ?? 0);
    const rText = rTextBase + (radialBoost.get(i) ?? 0);
    const radRim = (mid * Math.PI) / 180;
    const radLbl = (showMid * Math.PI) / 180;
    const sx = cx + rEdge * Math.sin(radRim);
    const sy = cy - rEdge * Math.cos(radRim);
    const tx = cx + rText * Math.sin(radLbl);
    const ty = cy - rText * Math.cos(radLbl);
    const lx = cx + (rText - lineEndInset) * Math.sin(radLbl);
    const ly = cy - (rText - lineEndInset) * Math.cos(radLbl);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'token-supply-pie__label-line');
    line.setAttribute('x1', sx.toFixed(2));
    line.setAttribute('y1', sy.toFixed(2));
    line.setAttribute('x2', lx.toFixed(2));
    line.setAttribute('y2', ly.toFixed(2));
    svg.appendChild(line);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'token-supply-pie__label-text');
    text.setAttribute('x', tx.toFixed(2));
    text.setAttribute('y', ty.toFixed(2));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = `${pct.toFixed(2)}%`;
    svg.appendChild(text);
  }

  if (svg.childNodes.length > 0) pieEl.appendChild(svg);
}

function mountDonutPieOverlays(
  pieEl: HTMLElement,
  slicePcts: number[],
  sliceSpecs: PieSliceSpec[],
  hub: { mock: boolean; hubSubline: string } | null,
  opts?: { showSliceLabels?: boolean }
): void {
  if (opts?.showSliceLabels !== false) {
    mountDonutPieSliceLabelOverlay(pieEl, slicePcts, sliceSpecs);
  } else {
    pieEl.querySelector('.token-supply-pie__label-svg')?.remove();
  }
  if (hub) {
    mountDonutPieCenterHub(pieEl, hub);
  } else {
    pieEl.querySelector('.token-supply-pie__hub')?.remove();
  }
}

function syncPnlDistributionBarsGrid(hasNegativeColumn: boolean): void {
  tokenPnlBarsTotal.classList.remove('token-trades-vertical-bars--cols8', 'token-trades-vertical-bars--cols9');
  tokenPnlBarsTotal.classList.add(hasNegativeColumn ? 'token-trades-vertical-bars--cols9' : 'token-trades-vertical-bars--cols8');
}

function renderPnlDistributionBars(
  rows: TokenTopPnlTraderRow[],
  topLimit: number,
  target: HTMLElement,
  _bandCount: number
): void {
  const limitN = Math.max(1, topLimit);
  const values = rows
    .slice(0, limitN)
    .map((row) => getTraderPnl(row))
    .filter((pnl) => Number.isFinite(pnl));

  if (values.length === 0) {
    target.innerHTML = '<div class="token-pnl-bar-label">No PnL data for current selection.</div>';
    return;
  }

  const negativeCount = values.filter((pnl) => pnl < 0).length;
  const positiveValues = values.filter((pnl) => pnl > 0);
  const n = CANONICAL_POSITIVE_PNL_DIST_USD_BANDS.length;
  const groups = CANONICAL_POSITIVE_PNL_DIST_USD_BANDS.map((band, i) => ({
    label: band.label,
    count: positiveValues.filter((pnl) => pnl > band.lower && pnl <= band.upper).length,
    gradientT: n <= 1 ? 1 : 1 - i / (n - 1),
  }));

  const leftToRightPositive = [...groups].reverse();
  const maxCount = Math.max(
    1,
    ...(negativeCount > 0 ? [negativeCount] : []),
    ...leftToRightPositive.map((g) => g.count)
  );

  const negativeHeightPct = negativeCount > 0 ? (negativeCount / maxCount) * 100 : 0;
  const negativeColumn =
    negativeCount > 0
      ? `<div class="token-trades-vertical-bar-item">
        <div class="token-trades-vertical-track">
          <div class="token-trades-vertical-fill token-pnl-bar-fill--negative" style="height:${negativeHeightPct.toFixed(2)}%;"></div>
          <span class="token-trades-vertical-count">${negativeCount}</span>
        </div>
        <div class="token-trades-vertical-label token-pnl-dist-band-text token-pnl-dist-band-text--negative">&lt; $0</div>
      </div>`
      : '';

  const positiveColumns = leftToRightPositive
    .map((group) => {
      const heightPct = (group.count / maxCount) * 100;
      /** Far left = yellow (smallest positive band), far right = green (largest band): invert trade-scale t. */
      const t = Math.max(0, Math.min(1, 1 - group.gradientT));
      return `<div class="token-trades-vertical-bar-item">
        <div class="token-trades-vertical-track">
          <div class="token-trades-vertical-fill token-pnl-bar-fill--trade-scale-pnl-dist" style="height:${heightPct.toFixed(2)}%; --trade-grad-t:${t.toFixed(4)};"></div>
          <span class="token-trades-vertical-count">${group.count}</span>
        </div>
        <div class="token-trades-vertical-label token-pnl-dist-band-text" style="--trade-grad-t:${t.toFixed(4)}">${group.label}</div>
      </div>`;
    })
    .join('');

  target.innerHTML = negativeColumn + positiveColumns;
  syncPnlDistributionBarsGrid(negativeCount > 0);
}

function renderTradesCountDistributionBars(
  rows: TokenTopPnlTraderRow[],
  topLimit: number,
  target: HTMLElement,
  maxGroups: number
): void {
  const groups = buildTradesCountGroups(rows, topLimit, maxGroups);
  if (groups == null) {
    target.innerHTML = '<div class="token-pnl-bar-label">No trades-count data for current selection.</div>';
    return;
  }

  const maxCount = Math.max(1, ...groups.map((g) => g.count));
  target.innerHTML = groups
    .map((group) => {
      const widthPct = (group.count / maxCount) * 100;
      const t = Math.max(0, Math.min(1, group.gradientT));
      return `<div class="token-pnl-bar-row">
        <div class="token-pnl-bar-label">${group.label}</div>
        <div class="token-pnl-bar-track">
          <div class="token-pnl-bar-fill token-pnl-bar-fill--trade-scale" style="width:${widthPct.toFixed(2)}%; --trade-grad-t:${t.toFixed(4)};"></div>
          <span class="token-pnl-bar-count">${group.count}</span>
        </div>
      </div>`;
    })
    .join('');
}

type TradesCountDistributionGroup = { label: string; count: number; gradientT: number };

/** Dynamic trade-count tiers (same bucketing as trades-count distribution bars). */
type TradeTierDefinitions = {
  positiveValues: number[];
  zeroCount: number;
  tiers: { lower: number; upper: number; label: string }[];
};

function buildTradeTierDefinitions(
  rows: TokenTopPnlTraderRow[],
  topLimit: number,
  tierSlotCount: number,
  options?: { tierSpan?: 'highest' | 'lowest' }
): TradeTierDefinitions | null {
  const limitN = Math.max(1, topLimit);
  const values = rows
    .slice(0, limitN)
    .map((row) => Math.max(0, toNum(row.tradesCount)))
    .filter((v) => Number.isFinite(v));

  if (values.length === 0) {
    return null;
  }

  const positiveValues = values.filter((v) => v > 0);
  const zeroCount = values.filter((v) => v === 0).length;
  const positiveSlots = Math.max(1, tierSlotCount - (zeroCount > 0 ? 1 : 0));
  const edges = buildCountTierEdges(Math.max(0, ...positiveValues));
  const ranges: { lower: number; upper: number }[] = [];
  for (let i = edges.length - 1; i >= 1; i--) {
    ranges.push({ lower: edges[i - 1], upper: edges[i] });
  }

  const countForRange = (lower: number, upper: number): number =>
    positiveValues.filter((v) => v > lower && v <= upper).length;

  while (ranges.length > 0 && countForRange(ranges[0].lower, ranges[0].upper) === 0) {
    const firstNonZeroIndex = ranges.findIndex((range) => countForRange(range.lower, range.upper) > 0);
    if (firstNonZeroIndex <= 0) break;
    const source = ranges[firstNonZeroIndex];
    const width = source.upper - source.lower;
    if (width <= 1) break;
    const mid = Math.round((source.lower + source.upper) / 2);
    if (mid <= source.lower || mid >= source.upper) break;

    ranges[0] = { lower: mid, upper: source.upper };
    ranges[firstNonZeroIndex] = { lower: source.lower, upper: mid };
    break;
  }

  while (ranges.length < positiveSlots) {
    const splitIndex = ranges.findIndex((range) => range.upper - range.lower > 1);
    if (splitIndex < 0) break;
    const source = ranges[splitIndex];
    const mid = Math.round((source.lower + source.upper) / 2);
    if (mid <= source.lower || mid >= source.upper) break;
    ranges.splice(splitIndex, 1, { lower: mid, upper: source.upper }, { lower: source.lower, upper: mid });
  }

  const span = options?.tierSpan ?? 'highest';
  const selectedRanges =
    span === 'lowest'
      ? [...ranges.slice(-positiveSlots)].reverse()
      : ranges.slice(0, positiveSlots);
  if (zeroCount === 0) {
    const lowSingleIndex = selectedRanges.findIndex((range) => range.lower === 0 && range.upper === 1);
    const lowBandIndex = selectedRanges.findIndex((range) => range.lower === 1 && range.upper === 5);
    if (lowSingleIndex >= 0 && lowBandIndex >= 0) {
      let start = 1;
      while (start < 5 && countForRange(start - 1, start) === 0) {
        start += 1;
      }
      if (start > 1 && start < 5) {
        selectedRanges[lowSingleIndex] = { lower: start - 1, upper: start };
        selectedRanges[lowBandIndex] = { lower: start, upper: 5 };
      }
    }
  }

  const tiers: { lower: number; upper: number; label: string }[] = selectedRanges.map((range) => ({
    lower: range.lower,
    upper: range.upper,
    label: formatTradeTierIntervalLabel(range.lower, range.upper, zeroCount),
  }));

  return { positiveValues, zeroCount, tiers };
}

/** Same slot count as full edge decomposition so `buildTradeTierDefinitions` does not split/merge ranges. */
function tierSlotCountForFullTradeRanges(rows: TokenTopPnlTraderRow[], topLimit: number): number | null {
  const limitN = Math.max(1, topLimit);
  const values = rows
    .slice(0, limitN)
    .map((row) => Math.max(0, toNum(row.tradesCount)))
    .filter((v) => Number.isFinite(v));
  if (values.length === 0) return null;
  const positiveValues = values.filter((v) => v > 0);
  const zeroCount = values.filter((v) => v === 0).length;
  const maxPV = positiveValues.length > 0 ? Math.max(0, ...positiveValues) : 0;
  const edges = buildCountTierEdges(maxPV);
  const rangeCount = edges.length - 1;
  return rangeCount + (zeroCount > 0 ? 1 : 0);
}

/** Smallest integer count in a (lower, upper] tier (matches `v > lower && v <= upper`). */
function tradeTierInclusiveMinCount(lower: number): number {
  return Math.floor(lower) + 1;
}

function formatTradeTierIntervalLabel(lower: number, upper: number, zeroCount: number): string {
  if (lower === 0) {
    return `>${formatTradeTierValue(0)}-${formatTradeTierValue(upper)}`;
  }
  const minCount = tradeTierInclusiveMinCount(lower);
  if (
    zeroCount === 0 &&
    Number.isInteger(lower) &&
    Number.isInteger(upper) &&
    upper <= 10
  ) {
    if (minCount >= upper) return formatTradeTierValue(upper);
    return `${formatTradeTierValue(minCount)}-${formatTradeTierValue(upper)}`;
  }
  if (minCount >= upper) return formatTradeTierValue(upper);
  return `${formatTradeTierValue(minCount)}-${formatTradeTierValue(upper)}`;
}

function splitTradeRangeEqualParts(lo: number, hi: number, parts: number): { lower: number; upper: number }[] {
  const span = hi - lo;
  if (span <= 0 || parts <= 1) return [{ lower: lo, upper: hi }];
  const out: { lower: number; upper: number }[] = [];
  for (let k = 0; k < parts; k++) {
    const a = lo + (span * k) / parts;
    const b = lo + (span * (k + 1)) / parts;
    out.push({ lower: a, upper: b });
  }
  return out;
}

function tradeCountMassInBin(lower: number, upper: number, tradeCounts: number[]): number {
  return tradeCounts.filter((v) => v > lower && v <= upper).reduce((s, v) => s + v, 0);
}

/**
 * Six pie tiers: fixed “2” and “3–5”, plus four bands for trade counts &gt; 5 from the same canonical
 * ranges as `buildTradeTierDefinitions`. When folding to four high slots, merge adjacent pairs with the
 * smallest combined trade-mass (Σ tradesCount in range) so sparse gaps collapse before dense bands.
 */
function buildProfitableTradersTradeTierPieDefinitions(
  rows: TokenTopPnlTraderRow[],
  topLimit: number
): TradeTierDefinitions | null {
  const slotCount = tierSlotCountForFullTradeRanges(rows, topLimit);
  if (slotCount == null) return null;
  const fullDef = buildTradeTierDefinitions(rows, topLimit, slotCount);
  if (!fullDef) return null;

  const { positiveValues, zeroCount } = fullDef;
  const maxT = positiveValues.length > 0 ? Math.max(...positiveValues) : 0;

  const sortedTiers = [...fullDef.tiers].sort((a, b) => a.lower - b.lower);
  const clipped: { lower: number; upper: number }[] = [];
  for (const tier of sortedTiers) {
    if (tier.upper <= 5) continue;
    const lo = Math.max(5, tier.lower);
    const hi = tier.upper;
    if (lo + 1e-9 < hi) clipped.push({ lower: lo, upper: hi });
  }

  let merged = [...clipped].sort((a, b) => a.lower - b.lower);
  if (maxT > 5 && merged.length === 0) {
    merged = [{ lower: 5, upper: maxT }];
  }

  while (merged.length > TRADE_TIER_HIGH_MERGE_SLOTS && merged.length >= 2) {
    let bestI = 0;
    let bestMass = Infinity;
    for (let i = 0; i < merged.length - 1; i++) {
      const lo = merged[i].lower;
      const hi = merged[i + 1].upper;
      const mass = tradeCountMassInBin(lo, hi, positiveValues);
      if (mass < bestMass) {
        bestMass = mass;
        bestI = i;
      }
    }
    merged = [
      ...merged.slice(0, bestI),
      { lower: merged[bestI].lower, upper: merged[bestI + 1].upper },
      ...merged.slice(bestI + 2),
    ];
  }

  while (merged.length < TRADE_TIER_HIGH_MERGE_SLOTS && maxT > 5) {
    if (merged.length === 0) {
      merged = splitTradeRangeEqualParts(5, maxT, TRADE_TIER_HIGH_MERGE_SLOTS);
      break;
    }
    let widestI = 0;
    let widestSpan = -1;
    for (let i = 0; i < merged.length; i++) {
      const w = merged[i].upper - merged[i].lower;
      if (w > widestSpan) {
        widestSpan = w;
        widestI = i;
      }
    }
    const seg = merged[widestI];
    if (seg.upper - seg.lower <= 1e-9) break;
    const mid = (seg.lower + seg.upper) / 2;
    const left = { lower: seg.lower, upper: mid };
    const right = { lower: mid, upper: seg.upper };
    merged = [...merged.slice(0, widestI), left, right, ...merged.slice(widestI + 1)];
    merged.sort((a, b) => a.lower - b.lower);
  }

  const highTiers = merged.slice(0, TRADE_TIER_HIGH_MERGE_SLOTS).map((r) => ({
    lower: r.lower,
    upper: r.upper,
    label: formatTradeTierIntervalLabel(r.lower, r.upper, zeroCount),
  }));

  const tiers: { lower: number; upper: number; label: string }[] = [
    { lower: 1, upper: 2, label: formatTradeTierIntervalLabel(1, 2, zeroCount) },
    { lower: 2, upper: 5, label: formatTradeTierIntervalLabel(2, 5, zeroCount) },
    ...highTiers,
  ];

  return { positiveValues, zeroCount, tiers };
}

function buildTradesCountGroups(
  rows: TokenTopPnlTraderRow[],
  topLimit: number,
  groupCount: number
): TradesCountDistributionGroup[] | null {
  const def = buildTradeTierDefinitions(rows, topLimit, groupCount);
  if (!def) return null;

  const countForRange = (lower: number, upper: number): number =>
    def.positiveValues.filter((v) => v > lower && v <= upper).length;

  const groups: TradesCountDistributionGroup[] = def.tiers.map((tier, idx) => ({
    label: tier.label,
    count: countForRange(tier.lower, tier.upper),
    gradientT: groupCount <= 1 ? 1 : 1 - idx / (groupCount - 1),
  }));

  if (def.zeroCount > 0) groups.push({ label: '0', count: def.zeroCount, gradientT: 0 });
  return groups.slice(0, groupCount);
}

function tradeTierIndexForTraderCount(tRaw: number, def: TradeTierDefinitions): number | null {
  const t = Math.round(Math.max(0, tRaw));
  if (def.zeroCount > 0 && t === 0) return def.tiers.length;

  for (let i = 0; i < def.tiers.length; i++) {
    const { lower, upper } = def.tiers[i];
    if (t > lower && t <= upper) return i;
  }
  if (t > 0 && def.tiers.length > 0) return def.tiers.length - 1;
  return null;
}

/**
 * Pie slice angle ∝ sum of each trader’s `tradesCount` in that tier (share of total trades, not share of traders).
 * Only rows with positive realized PnL (requires volume on the row). Legend cards show realized PnL, volume, traders, and trades per tier.
 */
function renderProfitableTradersTradeTierPie(
  rows: TokenTopPnlTraderRow[],
  topLimit: number,
  target: { pie: HTMLElement; legend: HTMLElement }
): void {
  const { pie, legend } = target;
  const limitN = Math.max(1, topLimit);
  const sliceRows = rows.slice(0, limitN);
  const profitable = sliceRows.filter((row) => {
    const roi = traderRoiPercentFromRow(row);
    return roi != null && roi > 0;
  });

  if (profitable.length === 0) {
    pie.style.background = buildPieGradientWithGaps([1], ['#27272a']);
    clearDonutPieOverlays(pie);
    mountDonutPieCenterHub(pie, { mock: true, hubSubline: '—' });
    legend.innerHTML =
      `<div class="token-supply-legend-item"><div class="token-supply-legend-content"><div class="token-supply-legend-label">No profitable traders in top ${limitN} list</div></div></div>`;
    if (tokenTradeTierInsightText) tokenTradeTierInsightText.textContent = '—';
    return;
  }

  const tierDef = buildProfitableTradersTradeTierPieDefinitions(rows, limitN);
  if (!tierDef || tierDef.tiers.length === 0) {
    pie.style.background = buildPieGradientWithGaps([1], ['#27272a']);
    clearDonutPieOverlays(pie);
    mountDonutPieCenterHub(pie, { mock: true, hubSubline: '—' });
    legend.innerHTML =
      '<div class="token-supply-legend-item"><div class="token-supply-legend-content"><div class="token-supply-legend-label">No trade-count tiers for profitable traders</div></div></div>';
    if (tokenTradeTierInsightText) tokenTradeTierInsightText.textContent = '—';
    return;
  }

  const slotCount = tierDef.tiers.length + (tierDef.zeroCount > 0 ? 1 : 0);
  const weightByTier = new Array(slotCount).fill(0);
  const roiCountByTier = new Array(slotCount).fill(0);
  const realizedSumByTier = new Array(slotCount).fill(0);
  const volumeSumByTier = new Array(slotCount).fill(0);

  for (const row of profitable) {
    const roi = traderRoiPercentFromRow(row);
    if (roi == null || roi <= 0) continue;
    const trades = toNum(row.tradesCount);
    if (!Number.isFinite(trades)) continue;
    const idx = tradeTierIndexForTraderCount(trades, tierDef);
    if (idx == null) continue;
    const w = Math.max(0, Math.round(trades));
    weightByTier[idx] += w;
    roiCountByTier[idx] += 1;
    realizedSumByTier[idx] += Math.max(0, toNum(row.realizedPnlUsd));
    volumeSumByTier[idx] += Math.max(0, toNum(row.totalVolumeUsd));
  }

  const totalW = weightByTier.reduce((a, b) => a + b, 0);
  if (totalW <= 0) {
    pie.style.background = buildPieGradientWithGaps([1], ['#27272a']);
    clearDonutPieOverlays(pie);
    mountDonutPieCenterHub(pie, { mock: true, hubSubline: '—' });
    legend.innerHTML =
      '<div class="token-supply-legend-item"><div class="token-supply-legend-content"><div class="token-supply-legend-label">No trades for profitable traders</div></div></div>';
    if (tokenTradeTierInsightText) tokenTradeTierInsightText.textContent = '—';
    return;
  }

  const tierLabels: string[] = tierDef.tiers.map((t) => `${t.label} trades`);
  if (tierDef.zeroCount > 0) tierLabels.push('0 trades');

  const slicePcts = weightByTier.map((w) => (w / totalW) * 100);
  const nSlices = weightByTier.length;
  const segFills: PieSliceSpec[] = weightByTier.map((_, i) =>
    nSlices <= 1 ? tradeScaleBarGradientPair(0) : tradeScaleBarGradientPair(i / (nSlices - 1))
  );
  pie.style.background = buildPieGradientWithGaps(slicePcts, segFills);
  mountDonutPieOverlays(pie, slicePcts, segFills, {
    mock: false,
    hubSubline: formatTradeTierCenterTradesSubtitle(totalW),
  });

  const tierSortKey = (idx: number): number => {
    if (tierDef.zeroCount > 0 && idx === tierDef.tiers.length) return -1;
    if (idx < tierDef.tiers.length) return tierDef.tiers[idx].lower;
    return Infinity;
  };
  const activeIndices = weightByTier
    .map((w, i) => ({ w, i }))
    .filter((x) => x.w > 0)
    .sort((a, b) => {
      const ka = tierSortKey(a.i);
      const kb = tierSortKey(b.i);
      if (ka !== kb) return ka - kb;
      return a.i - b.i;
    })
    .map((x) => x.i);

  legend.innerHTML = activeIndices
    .map((i) => {
      const label = tierLabels[i] ?? `Tier ${i + 1}`;
      const n = roiCountByTier[i];
      const realized = realizedSumByTier[i];
      const tierVol = volumeSumByTier[i];
      return renderPieLegendTradeTierRow(
        label,
        slicePcts[i],
        realized,
        tierVol,
        n,
        weightByTier[i],
        totalW,
        segFills[i]
      );
    })
    .join('');

  if (tokenTradeTierInsightText && activeIndices.length > 0) {
    let maxI = activeIndices[0];
    let maxPct = slicePcts[maxI];
    for (const i of activeIndices) {
      if (slicePcts[i] > maxPct) {
        maxPct = slicePcts[i];
        maxI = i;
      }
    }
    const lbl = tierLabels[maxI] ?? 'Leading tier';
    tokenTradeTierInsightText.textContent = `${lbl} holds the largest share at ${formatPctSmart(maxPct)}.`;
  }
}

function roiProfitPieRowWeight(row: TokenTopPnlTraderRow): number {
  return Math.max(0, toNum(row.totalVolumeUsd));
}

function renderTopTraderVolumeByPnlUsdPie(rows: TokenTopPnlTraderRow[], target: { pie: HTMLElement; legend: HTMLElement }): void {
  const { pie, legend } = target;

  const k = VOLUME_PNL_PIE_MERGED_USD_BANDS.length;
  const weightByBand = new Array(k).fill(0);
  const realizedSumByBand = new Array(k).fill(0);
  const tradersByBand = new Array(k).fill(0);
  const tradesByBand = new Array(k).fill(0);
  let nonPosWeight = 0;
  let nonPosRealized = 0;
  let nonPosTraders = 0;
  let nonPosTrades = 0;

  for (const row of rows) {
    const w = roiProfitPieRowWeight(row);
    if (w <= 0) continue;
    const pnl = toNum(row.realizedPnlUsd);
    const tc = Math.max(0, Math.round(toNum(row.tradesCount)));
    const idx = volumePnlPieMergedBandIndex(pnl);
    if (idx != null) {
      weightByBand[idx] += w;
      realizedSumByBand[idx] += pnl;
      tradersByBand[idx] += 1;
      tradesByBand[idx] += tc;
    } else {
      nonPosWeight += w;
      nonPosRealized += pnl;
      nonPosTraders += 1;
      nonPosTrades += tc;
    }
  }

  const totalWeight = weightByBand.reduce((a, b) => a + b, 0) + nonPosWeight;
  if (totalWeight <= 0) {
    pie.style.background = buildPieGradientWithGaps([1], ['#27272a']);
    clearDonutPieOverlays(pie);
    const lim = getTokenTopPnlLimitDisplay();
    legend.innerHTML =
      `<div class="token-supply-legend-item"><div class="token-supply-legend-content"><div class="token-supply-legend-label">No volume in top ${lim} list</div></div></div>`;
    mountDonutPieCenterHub(pie, { mock: true, hubSubline: '—' });
    if (tokenVolumePnlInsightText) tokenVolumePnlInsightText.textContent = '—';
    return;
  }

  const hubLine = `${formatUsdFull(totalWeight)} volume`;
  const sliceWeights = nonPosWeight > 0 ? [...weightByBand, nonPosWeight] : [...weightByBand];
  const sliceFills: PieSliceSpec[] =
    nonPosWeight > 0 ? [...VOLUME_PNL_PIE_MERGED_SLICE_FILLS, VOLUME_PNL_PIE_NONPOSITIVE_FILL] : [...VOLUME_PNL_PIE_MERGED_SLICE_FILLS];
  const slicePcts = sliceWeights.map((v) => (v / totalWeight) * 100);

  pie.style.background = buildPieGradientWithGaps(slicePcts, sliceFills);

  const nonPosLabel = 'At or below $0 realized PnL';
  const legendRows: {
    label: string;
    pct: number;
    w: number;
    realizedUsd: number;
    fill: PieSliceSpec;
    traders: number;
    trades: number;
  }[] = VOLUME_PNL_PIE_MERGED_USD_BANDS.map((def, i) => ({
    label: def.label,
    pct: slicePcts[i],
    w: weightByBand[i],
    realizedUsd: realizedSumByBand[i],
    fill: VOLUME_PNL_PIE_MERGED_SLICE_FILLS[i] ?? '#27272a',
    traders: tradersByBand[i],
    trades: tradesByBand[i],
  }));
  if (nonPosWeight > 0) {
    legendRows.push({
      label: nonPosLabel,
      pct: slicePcts[k],
      w: nonPosWeight,
      realizedUsd: nonPosRealized,
      fill: VOLUME_PNL_PIE_NONPOSITIVE_FILL,
      traders: nonPosTraders,
      trades: nonPosTrades,
    });
  }

  legend.innerHTML = legendRows
    .map((row) =>
      renderPieLegendVolumePnlCard(
        row.label,
        row.pct,
        row.realizedUsd,
        row.traders,
        row.trades,
        row.w,
        totalWeight,
        row.fill
      )
    )
    .join('');
  mountDonutPieOverlays(pie, slicePcts, sliceFills, { mock: false, hubSubline: hubLine });

  const activeVolRows = legendRows.filter((r) => r.w > 0);
  if (tokenVolumePnlInsightText) {
    if (activeVolRows.length === 0) {
      tokenVolumePnlInsightText.textContent = '—';
    } else {
      let maxRow = activeVolRows[0];
      for (const r of activeVolRows) {
        if (r.pct > maxRow.pct) maxRow = r;
      }
      tokenVolumePnlInsightText.textContent = `${maxRow.label} holds the largest dollar share at ${formatPctSmart(maxRow.pct)}.`;
    }
  }
}

function renderTradesCountDistributionVerticalBars(
  rows: TokenTopPnlTraderRow[],
  topLimit: number,
  target: HTMLElement,
  groupCount: number
): void {
  const groups = buildTradesCountGroups(rows, topLimit, groupCount);
  if (groups == null) {
    target.innerHTML = '<div class="token-pnl-bar-label">No trades-count data for current selection.</div>';
    return;
  }

  const leftToRightGroups = [...groups].reverse();
  const maxCount = Math.max(1, ...leftToRightGroups.map((g) => g.count));
  target.innerHTML = leftToRightGroups
    .map((group) => {
      const heightPct = (group.count / maxCount) * 100;
      const t = Math.max(0, Math.min(1, group.gradientT));
      return `<div class="token-trades-vertical-bar-item">
        <div class="token-trades-vertical-track">
          <div class="token-trades-vertical-fill token-pnl-bar-fill--trade-scale" style="height:${heightPct.toFixed(2)}%; --trade-grad-t:${t.toFixed(4)};"></div>
          <span class="token-trades-vertical-count">${group.count}</span>
        </div>
        <div class="token-trades-vertical-label token-trades-count-dist-band-text" style="--trade-grad-t:${t.toFixed(4)}">${group.label}</div>
      </div>`;
    })
    .join('');
}

function renderTopTraderSelectedResolutionCharts(rows: TokenTopPnlTraderRow[], topLimit: number): void {
  const limitN = Math.max(1, topLimit);
  const volumeRows = rows.slice(0, limitN);
  syncTokenSupplySectionHeadingsForResolution();
  renderPnlDistributionBars(rows, topLimit, tokenPnlBarsTotal, 8);
  applySelectedTradesVerticalRowVisibility();
  if (shouldShowSelectedTradesVerticalRow()) {
    renderTradesCountDistributionVerticalBars(rows, topLimit, tokenTradesCountBarsVertical, 10);
  } else {
    tokenTradesCountBarsVertical.innerHTML = '';
  }

  renderTopTraderVolumeByPnlUsdPie(volumeRows, {
    pie: tokenSupplyPieTotal,
    legend: tokenSupplyLegendTotal,
  });
  renderProfitableTradersTradeTierPie(volumeRows, limitN, {
    pie: tokenSupplyPieTradesCount,
    legend: tokenSupplyLegendTradesCount,
  });
}

async function loadData(): Promise<void> {
  if (getEndpointMode() === 'historical') return;
  const query = mintInput.value.trim();
  if (!query) return;
  const mode = getSearchMode();
  const tokenMode = false;

  hideSectionError(tokenSectionError);
      hideSectionError(topTradersError);
  hideSectionError(tokenTopPnlError);
  fetchAllBtn.disabled = true;
  loadingIndicator.hidden = false;
  tokenSectionLoading.hidden = !tokenMode;
  topTradersLoading.hidden = tokenMode;
  tokenTopPnlLoading.hidden = !tokenMode;

  const walletTopTraderParams = buildWalletTopTraderParams(mode, query);
  const tokenTopPnlParams = buildTokenTopPnlParams();

  try {
    let tokenData: TokenData | null = null;
    if (tokenMode) {
      const tokenRes = await fetchWithRetry(`/api/tokens/${encodeURIComponent(query)}`);
      if (tokenRes.ok) {
        tokenData = (await tokenRes.json()) as TokenData;
        renderToken(tokenData);
      } else {
        showSectionError(tokenSectionError, `Failed (${tokenRes.status})`);
        tokenLogo.style.display = 'none';
        tokenSymbol.textContent = '—';
        tokenName.textContent = '—';
        tokenName.removeAttribute('title');
        tokenLastUpdatedValue.textContent = '—';
        tokenStats.innerHTML = buildTokenStatsPlaceholderHtml();
      }
      const tokenTopPnlRes = await fetchWithRetry(`/api/tokens/${encodeURIComponent(query)}/top-pnl-traders?${tokenTopPnlParams.toString()}`);
      if (tokenTopPnlRes.ok) {
        const tokenTopPnlData = await tokenTopPnlRes.json() as { data?: TokenTopPnlTraderRow[] };

        const chartParams = new URLSearchParams(tokenTopPnlParams);
        chartParams.set('resolution', '1d');
        let chartRows = tokenTopPnlData.data ?? [];
        if ((tokenTopPnlParams.get('resolution') || '').toLowerCase() !== '1d') {
          const tokenTopPnl1dRes = await fetchWithRetry(`/api/tokens/${encodeURIComponent(query)}/top-pnl-traders?${chartParams.toString()}`);
          if (tokenTopPnl1dRes.ok) {
            const tokenTopPnl1dBody = await tokenTopPnl1dRes.json() as { data?: TokenTopPnlTraderRow[] };
            chartRows = tokenTopPnl1dBody.data ?? [];
          }
        }

        const volume24hByTrader: Record<string, number> = {};
        const trades24hByTrader: Record<string, number> = {};
        chartRows.forEach((row) => {
          const addr = row.traderAddress;
          if (!addr) return;
          volume24hByTrader[addr] = toNum(row.totalVolumeUsd);
          trades24hByTrader[addr] = toNum(row.tradesCount);
        });
        renderTokenTopPnlTraders(tokenTopPnlData, query, tokenTopPnlParams, volume24hByTrader, trades24hByTrader);

        if (tokenData) {
          const cohortVol24hSum = sumCohortVolume24hUsd(tokenTopPnlData.data ?? [], volume24hByTrader);
          renderToken(tokenData, cohortVol24hSum);
        }

        const chartLimit = Math.max(10, Math.min(1000, Number(tokenTopPnlLimit.value) || 1000));
        renderTopTraderSelectedResolutionCharts(tokenTopPnlData.data ?? [], chartLimit);
      } else {
        applyTokenModeChartsPlaceholder();
        showSectionError(tokenTopPnlError, `Failed (${tokenTopPnlRes.status})`);
      }
    } else {
      const topRes = await fetchWithRetry(`/api/wallets/top-traders?${walletTopTraderParams.toString()}`);
      if (topRes.ok) {
        const topData = await topRes.json() as { data?: TopTraderRow[] };
        const topList = topData.data ?? [];
        const ownerAddressFromList = (topList[0]?.accountAddress || '').trim();
        const ownerAddress = ownerAddressFromList || (looksLikeSolanaAddress(query) ? query : '');
        if (ownerAddress) {
          const walletPnlParams = buildWalletPnlParams();
          const walletPnlRes = await fetchWithRetry(`/api/wallets/${encodeURIComponent(ownerAddress)}/pnl?${walletPnlParams.toString()}`);
          if (walletPnlRes.ok) {
            const walletPnlData = await walletPnlRes.json() as WalletPnlResponse;
            const matchedTopRow = topList.find((row) => (row.accountAddress || '').trim() === ownerAddress);
            renderWalletPnl(ownerAddress, walletPnlData, walletPnlParams, matchedTopRow);
          } else {
            walletPnlMeta.textContent = `Wallet PnL request failed (${walletPnlRes.status}).`;
            walletPnlDetails.innerHTML = '<div class="token-stats-group wallet-pnl-empty">Wallet PnL request failed for current selection.</div>';
          }
        } else {
          walletPnlMeta.textContent = 'Wallet PnL endpoint not called: no wallet address resolved from current filter.';
          walletPnlDetails.innerHTML = '<div class="token-stats-group wallet-pnl-empty">No wallet address found in related-wallets results for this filter.</div>';
        }
      } else {
        showSectionError(topTradersError, `Failed (${topRes.status})`);
        walletPnlMeta.textContent = '—';
        walletPnlDetails.innerHTML = '<div class="token-stats-group wallet-pnl-empty">Wallet PnL unavailable while the related-wallets request fails.</div>';
      }
    }
  } catch {
    showSectionError(tokenMode ? tokenTopPnlError : topTradersError, 'Failed');
  } finally {
    fetchAllBtn.disabled = false;
    loadingIndicator.hidden = true;
    tokenSectionLoading.hidden = true;
    topTradersLoading.hidden = true;
    tokenTopPnlLoading.hidden = true;
  }
}

endpointModeHistorical.addEventListener('change', () => {
  if (ENDPOINT_HISTORICAL_SWITCHER_DISABLED) {
    endpointModeHistorical.checked = false;
    return;
  }
  const next: EndpointMode = endpointModeHistorical.checked ? 'historical' : 'realtime';
  setEndpointMode(next);
  applyEndpointModeUI();
  if (next === 'historical') {
    setHistResolution(histResolution.value || getHistResolution());
  }
});

histResolution.addEventListener('change', () => {
  setHistResolution(histResolution.value);
});

fetchHistoricalPnlBtn.addEventListener('click', () => {
  fetchHistoricalPnlBtn.classList.remove('fetch-btn-attention');
  void loadHistoricalPnlTimeseries();
});

fetchAllBtn.addEventListener('click', () => {
  fetchAllBtn.classList.remove('fetch-btn-attention');
  void loadData();
});

tokenTopPnlResolution.addEventListener('change', () => {
  syncTokenSupplySectionHeadingsForResolution();
  applySelectedTradesVerticalRowVisibility();
  applyTokenTopPnl24hColumnVisibility();
});

tokenTopPnlLimit.addEventListener('change', () => {
  syncTokenSupplySectionHeadingsForResolution();
});

walletTopTradersResolution.addEventListener('change', () => {
  walletTopTradersResolution.value = getWalletResolution();
  applyWalletTopTradersTitle();
});

window.addEventListener('resize', () => {
  syncWalletPieStackHeights();
});

syncTokenSupplySectionHeadingsForResolution();
lastTokenResolutionBeforeWalletSwitch = normalizeTokenResolution(tokenTopPnlResolution.value);
walletTopTradersResolution.value = getWalletResolution();
applyWalletTopTradersTitle();
initSearchModeFromUrlParams();
applyEndpointModeUI();
applyDefaultHistTimeEndOnLoad();
applySelectedTradesVerticalRowVisibility();
topTradersMeta.hidden = true;
topTradersCards.hidden = true;
walletPnlMeta.textContent = '—';
walletPnlDetails.innerHTML = buildWalletPnlPlaceholder();
mountWalletPieDonutOverlays(walletPnlDetails, [{ slices: [] }, { slices: [] }]);
requestAnimationFrame(() => syncWalletPieStackHeights());
applyTokenModePlaceholder();
tokenTopPnlBody.innerHTML = buildTokenTopPnlPlaceholderRowsHtml();
applyTokenTopPnl24hColumnVisibility();
