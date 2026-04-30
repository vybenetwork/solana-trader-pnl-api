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
const searchModeWallet = document.getElementById('searchModeWallet') as HTMLInputElement;
const searchModeSwitchLabel = document.getElementById('searchModeSwitchLabel') as HTMLElement;
const fetchActions = document.getElementById('fetchActions') as HTMLElement;
const walletActionsTarget = document.getElementById('walletActionsTarget') as HTMLElement;
const tokenFetchSlot = document.getElementById('tokenFetchSlot') as HTMLElement;
const fetchAllBtn = document.getElementById('fetchAll') as HTMLButtonElement;
const loadingIndicator = document.getElementById('loadingIndicator') as HTMLElement;
const tokenOnlyControls = document.getElementById('tokenOnlyControls') as HTMLElement;

const walletLabel = document.getElementById('walletLabel') as HTMLSelectElement;
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
const tokenStats = document.getElementById('tokenStats') as HTMLElement;
const tokenSupplyPanel = document.getElementById('tokenSupplyPanel') as HTMLElement;
const tokenSupplyPie = document.getElementById('tokenSupplyPie') as HTMLElement;
const tokenSupplyLegend = document.getElementById('tokenSupplyLegend') as HTMLElement;
const tokenPnlBars24h = document.getElementById('tokenPnlBars24h') as HTMLElement;
const tokenSupplyPanelTotal = document.getElementById('tokenSupplyPanelTotal') as HTMLElement;
const tokenSupplyPieTotal = document.getElementById('tokenSupplyPieTotal') as HTMLElement;
const tokenSupplyLegendTotal = document.getElementById('tokenSupplyLegendTotal') as HTMLElement;
const tokenPnlBarsTotal = document.getElementById('tokenPnlBarsTotal') as HTMLElement;
const tokenSupplySelectedTitle = document.getElementById('tokenSupplySelectedTitle') as HTMLElement;
const tokenPnlSelectedTitle = document.getElementById('tokenPnlSelectedTitle') as HTMLElement;
const tokenTopVolumeSelectedTitle = document.getElementById('tokenTopVolumeSelectedTitle') as HTMLElement;
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
const tokenTopPnlUnrealizedHeader = document.getElementById('tokenTopPnlUnrealizedHeader') as HTMLElement;
const tokenTopPnlVolumeHeader = document.getElementById('tokenTopPnlVolumeHeader') as HTMLElement;
const tokenTopPnl24hVolumeHeader = document.getElementById('tokenTopPnl24hVolumeHeader') as HTMLElement;
const tokenTopPnlTradesHeader = document.getElementById('tokenTopPnlTradesHeader') as HTMLElement;
const tokenTopPnl24hTradesHeader = document.getElementById('tokenTopPnl24hTradesHeader') as HTMLElement;

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
  'Each row is a snapshot of cumulative realized PnL through that moment. Use it to see whether the wallet was building gains, giving them back, or chopping sideways across the last seven days.';

/** Shapes placeholder wallet PnL to match loaded layout (stable column heights). */
const WALLET_PNL_PLACEHOLDER_ASSET_ROW_COUNT = 12;

function walletPnlTradingLedeInnerHtml(): string {
  const r = WALLET_TOP_TRADERS_RESOLUTION;
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
/** Fixed query params for GET /v4/wallets/top-traders (resolution & sort field removed from UI). */
const WALLET_TOP_TRADERS_RESOLUTION = DEFAULT_WALLET_RESOLUTION;
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
  walletTopTradersTitle.textContent = `Top traders (by realized PnL, ${WALLET_TOP_TRADERS_RESOLUTION})`;
}

function getSearchMode(): SearchMode {
  return localStorage.getItem(SEARCH_MODE_KEY) === 'wallet' ? 'wallet' : 'token';
}

function setSearchMode(mode: SearchMode): void {
  localStorage.setItem(SEARCH_MODE_KEY, mode);
}

function applySearchModeUI(): void {
  const mode = getSearchMode();
  const tokenMode = mode === 'token';
  searchModeWallet.checked = !tokenMode;
  searchModeSwitchLabel.classList.remove('trades-fetch-switch--locked');
  searchModeSwitchLabel.title = 'Switch between token and wallet search.';
  searchInputLabel.innerHTML = tokenMode
    ? '<span class="label-icon field-icon icon-tag" aria-hidden="true"></span>Token mint address'
    : '<span class="label-icon field-icon icon-user" aria-hidden="true"></span>Wallet address or name (ilikeFilter)';
  mintInput.placeholder = tokenMode
    ? 'e.g. DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
    : `e.g. ${DEMO_WALLET}`;
  const currentValue = mintInput.value.trim();
  if (
    !currentValue
    || (!tokenMode && currentValue === DEMO_MINT)
    || (tokenMode && currentValue === DEMO_WALLET)
  ) {
    mintInput.value = tokenMode ? DEMO_MINT : DEMO_WALLET;
  }
  fetchAllBtn.textContent = tokenMode ? 'Load token analytics' : 'Search top traders';
  tokenSection.hidden = !tokenMode;
  tokenSupplyPanel.hidden = !tokenMode;
  tokenSupplyPanelTotal.hidden = !tokenMode;
  topTradersSection.hidden = tokenMode;
  tokenTopPnlSection.hidden = !tokenMode;
  tokenOnlyControls.hidden = !tokenMode;
  if (tokenMode) tokenFetchSlot.appendChild(fetchActions);
  else walletActionsTarget.appendChild(fetchActions);
  document
    .querySelectorAll<HTMLElement>('.wallet-only-control, .wallet-only-row')
    .forEach((el) => {
      el.hidden = tokenMode;
    });
  document.querySelectorAll<HTMLElement>('.token-only-control').forEach((el) => {
    el.hidden = !tokenMode;
  });
  topTradersMeta.hidden = true;
  topTradersCards.hidden = true;
  applyWalletTopTradersTitle();
}

function truncateAddress(addr: string | undefined): string {
  if (!addr || addr.length <= 12) return addr ?? '';
  return `${addr.slice(0, 4)}....${addr.slice(-4)}`;
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

function formatUsdFull(n: number | null | undefined): string {
  if (n == null) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  const roundedToCent = Math.round(num * 100) / 100;
  if (roundedToCent === 0) return '0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs < 1) return `${sign}$${abs.toFixed(2)}`;
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
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="wallet-tx-link ${toneClass}" title="${sig}" onclick="window.open(this.href,'solscanTx','popup=yes,width=1100,height=780,noopener,noreferrer'); return false;">${label}<span class="wallet-tx-popup-icon" aria-hidden="true">↗</span></a>`;
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

function buildWalletPnlPlaceholder(): string {
  const dash = '—';
  const dummyAssetRows = Array.from({ length: WALLET_PNL_PLACEHOLDER_ASSET_ROW_COUNT }, () => {
    return `<tr>
        <td class="wallet-asset-icon-cell">${dash}</td>
        <td>${dash}</td>
        <td>${dash}</td>
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

  return `<div class="wallet-pnl-layout">
    <div class="wallet-pnl-sections">
      <section class="token-stats-group wallet-pnl-card wallet-pnl-card--profile">
        <h3 class="token-stats-group-title"><span>Wallet profile</span></h3>
        <div class="wallet-pnl-profile-header">
          <div class="wallet-pnl-profile-avatar-wrap" aria-hidden="true">
            ${renderWalletProfileAvatar(undefined, dash)}
          </div>
          <dl class="token-stats wallet-pnl-kv wallet-pnl-profile-kv">
            <dt>Name</dt><dd>${dash}</dd>
            <dt>X</dt><dd>${dash}</dd>
            <dt>Labels</dt><dd>${dash}</dd>
          </dl>
        </div>
      </section>
      <section class="token-stats-group wallet-pnl-card wallet-pnl-card--highlights">
        <h3 class="token-stats-group-title"><span>Token highlights</span></h3>
        <div class="wallet-pnl-highlight-grid">${phHighlightFilled('best')}${phHighlightFilled('worst')}</div>
      </section>
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
            <div class="wallet-pnl-metric-chip"><span class="wallet-pnl-metric-chip-label">Winning Trades</span><span class="wallet-pnl-metric-chip-value">${formatIntFull(undefined)}</span></div>
            <div class="wallet-pnl-metric-chip"><span class="wallet-pnl-metric-chip-label">Losing Trades</span><span class="wallet-pnl-metric-chip-value">${formatIntFull(undefined)}</span></div>
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
    <h3 class="token-stats-group-title"><span>Assets (${WALLET_PNL_PLACEHOLDER_ASSET_ROW_COUNT})</span></h3>
    <div class="table-wrap wallet-assets-table-wrap">
      <table class="wallet-assets-table">
        <thead>
          <tr>
            <th class="wallet-assets-th-icon" scope="col" aria-label="Icon"></th>
            <th>Asset</th>
            <th>Status</th>
            <th>Real. PnL</th>
            <th>Unreal. PnL</th>
            <th>Buys</th>
            <th>Sells</th>
            <th>Buy amt</th>
            <th>Buy vol</th>
            <th>Sell amt</th>
            <th>Sell vol</th>
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
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${handle}</a>`;
}

function applyTokenTopPnl24hColumnVisibility(): void {
  const resolution = tokenTopPnlResolution.value.trim().toLowerCase();
  const is24hResolution = resolution === '1d' || resolution === '24h' || resolution === '24hr';
  const show24hColumns = !is24hResolution;
  const resolutionLabel = is24hResolution ? '24h' : tokenTopPnlResolution.value.trim();
  tokenTopPnlRealizedHeader.textContent = `Realized PnL (${resolutionLabel})`;
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

const tokenSectionIcons: Record<string, string> = {
  overview:
    '<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>',
  price:
    '<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  supply:
    '<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  meta:
    '<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
};

interface SectionSpec {
  icon: string;
  title: string;
  rows: [string, string | number | undefined][];
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

function renderToken(t: TokenData): void {
  const tokenLogoSrc = resolveTokenLogoSrc(t.logoUrl, t.mintAddress);
  tokenLogo.src = tokenLogoSrc;
  tokenLogo.alt = t.symbol || '';
  tokenLogo.style.display = tokenLogoSrc ? 'block' : 'none';
  tokenSymbol.textContent = t.symbol || '—';
  tokenName.textContent = t.name || t.mintAddress || '—';

  const sectionHtml = (s: SectionSpec): string => `<section class="token-stats-group">
      <h3 class="token-stats-group-title">${s.icon}<span>${s.title}</span></h3>
      <dl class="token-stats">${s.rows.map(([label, value]) => `<dt>${label}</dt><dd>${value ?? '—'}</dd>`).join('')}</dl>
    </section>`;

  const sym = (t.symbol || '').toUpperCase();
  const formatUpdateTime = (ts: number | undefined): string => {
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
  };

  const mintLink = t.mintAddress
    ? `<a href="https://vybe.fyi/tokens/${encodeURIComponent(t.mintAddress)}" target="_blank" rel="noopener noreferrer" class="mono" title="${t.mintAddress}">${t.mintAddress}</a>`
    : '—';
  const overview: SectionSpec = {
    icon: tokenSectionIcons.overview,
    title: 'Overview',
    rows: [
      ['Mint', mintLink],
      ['Symbol', sym || '—'],
      ['Decimals', t.decimal ?? t.decimals],
      ['Category', t.category ?? '—'],
      ['Subcategory', t.subcategory ?? '—'],
      ['Verified', t.verified != null ? String(t.verified) : '—'],
    ],
  };
  const priceSection: SectionSpec = {
    icon: tokenSectionIcons.price,
    title: 'Price & market cap',
    rows: [
      ['Price (USD)', t.price != null ? `${formatPrice(t.price)} USD` : '—'],
      ['Market cap', t.marketCap != null ? `${formatNum(t.marketCap)} USD` : '—'],
      ['Price (1d ago)', t.price1d != null ? formatPrice(t.price1d) : '—'],
      ['Price (7d ago)', t.price7d != null ? formatPrice(t.price7d) : '—'],
    ],
  };
  const supplyVolumeSection: SectionSpec = {
    icon: tokenSectionIcons.supply,
    title: 'Supply & volume (24h)',
    rows: [
      ['Current supply', t.currentSupply != null ? `${formatNum(t.currentSupply)}${sym ? ` ${sym}` : ''}` : '—'],
      ['Token volume (24h)', t.tokenAmountVolume24h != null ? `${formatNum(t.tokenAmountVolume24h)}${sym ? ` ${sym}` : ''}` : '—'],
      ['USD volume (24h)', t.usdValueVolume24h != null ? `${formatNum(t.usdValueVolume24h)} USD` : '—'],
    ],
  };
  const metaSection: SectionSpec = {
    icon: tokenSectionIcons.meta,
    title: 'Last updated',
    rows: [['Update time', formatUpdateTime(t.updateTime)]],
  };

  tokenStats.innerHTML =
    sectionHtml(overview) +
    `<div class="token-stats-row"><div class="token-stats-col">${sectionHtml(priceSection)}</div><div class="token-stats-col">${sectionHtml(supplyVolumeSection)}</div></div>` +
    sectionHtml(metaSection);
}

function buildWalletTopTraderParams(mode: SearchMode, query: string): URLSearchParams {
  const params = new URLSearchParams({
    resolution: WALLET_TOP_TRADERS_RESOLUTION,
    limit: walletLimit.value,
    page: String(Math.max(0, Number(walletPage.value) || 0)),
  });
  const labelVal = walletLabel.value.trim().toLowerCase();
  if (labelVal) params.set('label', labelVal);
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
    resolution: WALLET_TOP_TRADERS_RESOLUTION,
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

  const tokenLabel = (token?: WalletPnlSummaryTokenRef): string => {
    if (!token) return '—';
    const mint = (token.mintAddress || '').trim();
    if (!mint) return '—';
    const matchedMetric = metricsByMint.get(mint);
    const symbol = matchedMetric?.tokenSymbol || matchedMetric?.tokenName || token.tokenSymbol || token.tokenName || truncateAddress(mint);
    const logoUrl = matchedMetric?.tokenLogoUrl || token.tokenLogoUrl;
    return `<span class="wallet-token-ref">${renderLogoImage(logoUrl, symbol, mint)}<a href="https://vybe.fyi/tokens/${encodeURIComponent(mint)}" target="_blank" rel="noopener noreferrer" class="mono" title="${mint}">${symbol}</a></span>`;
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
  const walletProfileHtml = `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--profile">
      <h3 class="token-stats-group-title"><span>Wallet profile</span></h3>
      <div class="wallet-pnl-profile-header">
        <div class="wallet-pnl-profile-avatar-wrap" aria-hidden="true">
          ${renderWalletProfileAvatar(topTraderRow?.accountLogoUrl, topTraderRow?.accountName || ownerAddress)}
        </div>
        <dl class="token-stats wallet-pnl-kv wallet-pnl-profile-kv">
          <dt>Name</dt><dd><a href="https://vybe.fyi/wallets/${encodeURIComponent(ownerAddress)}" target="_blank" rel="noopener noreferrer" class="mono" title="${ownerAddress}">${topTraderRow?.accountName || truncateAddress(ownerAddress)}</a></dd>
          <dt>X</dt><dd>${renderXProfileLink(topTraderRow?.accountTwitterUrl)}</dd>
          <dt>Labels</dt><dd>${profileLabels.length ? profileLabels.join(', ') : '—'}</dd>
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
          <div class="wallet-pnl-metric-chip wallet-pnl-metric-chip--pos"><span class="wallet-pnl-metric-chip-label">Winning Trades</span><span class="wallet-pnl-metric-chip-value">${formatIntFull(mergedSummary.winningTradesCount)}</span></div>
          <div class="wallet-pnl-metric-chip wallet-pnl-metric-chip--neg"><span class="wallet-pnl-metric-chip-label">Losing Trades</span><span class="wallet-pnl-metric-chip-value">${formatIntFull(mergedSummary.losingTradesCount)}</span></div>
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

  const trendRows = mergedSummary.pnlTrendSevenDays ?? [];
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
      const timeLabel = Number.isFinite(ts) ? new Date(ts).toLocaleString() : '—';
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
  const assetsTableHtml = tokenMetrics.length
    ? `<section class="token-stats-group wallet-pnl-card wallet-pnl-card--assets">
      <h3 class="token-stats-group-title"><span>Assets (${assetCount})</span></h3>
      <div class="table-wrap wallet-assets-table-wrap">
        <table class="wallet-assets-table">
          <thead>
            <tr>
              <th class="wallet-assets-th-icon" scope="col" aria-label="Icon"></th>
              <th>Asset</th>
              <th>Status</th>
              <th>Real. PnL</th>
              <th>Unreal. PnL</th>
              <th>Buys</th>
              <th>Sells</th>
              <th>Buy amt</th>
              <th>Buy vol</th>
              <th>Sell amt</th>
              <th>Sell vol</th>
              <th>Latest TX</th>
            </tr>
          </thead>
          <tbody>${tokenMetrics.map((metric) => {
      const mint = metric.mintAddress || '';
      const symbol = metric.tokenSymbol || metric.tokenName || (mint ? truncateAddress(mint) : '—');
      const tokenLink = mint
        ? `<a href="https://vybe.fyi/tokens/${encodeURIComponent(mint)}" target="_blank" rel="noopener noreferrer" class="mono" title="${mint}">${symbol}</a>`
        : symbol;
      const iconCell = renderLogoImage(metric.tokenLogoUrl, symbol, mint);
      const assetCell = mint
        ? `${tokenLink}<div class="wallet-asset-mint mono">${truncateAddress(mint)}</div>`
        : tokenLink;
      const latestTrade = pickLatestTradeSide(metric);
      return `<tr>
        <td class="wallet-asset-icon-cell">${iconCell}</td>
        <td>${assetCell}</td>
        <td>${renderStatusBadge(metric.status)}</td>
        <td>${formatUsdCell(metric.realizedPnlUsd)}</td>
        <td>${formatUsdCell(metric.unrealizedPnlUsd)}</td>
        <td>${formatTradesCountHeatCell(metric.buys?.transactionCount, buysTxMin, buysTxMax)}</td>
        <td>${formatTradesCountHeatCell(metric.sells?.transactionCount, sellsTxMin, sellsTxMax)}</td>
        <td>${formatNum(metric.buys?.tokenAmount)}</td>
        <td><span class="wallet-amt-vol-usd">${formatUsdFull(metric.buys?.volumeUsd)}</span></td>
        <td>${formatNum(metric.sells?.tokenAmount)}</td>
        <td><span class="wallet-amt-vol-usd">${formatUsdFull(metric.sells?.volumeUsd)}</span></td>
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
    <div class="wallet-pnl-sections">${walletProfileHtml}${tokenHighlightsHtml}</div>
    <div class="wallet-pnl-trend-col">${pnlTradingHtml}${pnlTrendHtml}</div>
  </div>${assetsTableHtml}`;
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
    ? `GET /v4/wallets/top-traders with ${scope} and ${queryParams.toString()} returned ${list.length} row(s).`
    : `GET /v4/wallets/top-traders with ${scope} returned 0 rows.`;
  topTradersCards.innerHTML = finalList.length
    ? finalList.map((row, i) => {
      const rank = i + 1;
      const addr = row.accountAddress;
      const display = row.accountName || (addr ? truncateAddress(addr) : '—');
      const accountLink = addr
        ? `<a href="https://vybe.fyi/wallets/${encodeURIComponent(addr)}" target="_blank" rel="noopener noreferrer" class="mono" title="${addr}">${display}</a>`
        : `<span class="mono">${display}</span>`;
      const m = row.metrics || {};
      const labels = (row.accountLabels ?? []).filter((label) => (label || '').trim() !== '');
      const bestToken = m.bestPerformingToken;
      const worstToken = m.worstPerformingToken;
      const bestTokenLabel = bestToken?.mintAddress
        ? `<a href="https://vybe.fyi/tokens/${encodeURIComponent(bestToken.mintAddress)}" target="_blank" rel="noopener noreferrer" class="mono" title="${bestToken.mintAddress}">${bestToken.tokenSymbol || bestToken.tokenName || truncateAddress(bestToken.mintAddress)}</a>${bestToken.pnlUsd != null ? ` (${formatUsdFull(bestToken.pnlUsd)})` : ''}`
        : '—';
      const worstTokenLabel = worstToken?.mintAddress
        ? `<a href="https://vybe.fyi/tokens/${encodeURIComponent(worstToken.mintAddress)}" target="_blank" rel="noopener noreferrer" class="mono" title="${worstToken.mintAddress}">${worstToken.tokenSymbol || worstToken.tokenName || truncateAddress(worstToken.mintAddress)}</a>${worstToken.pnlUsd != null ? ` (${formatUsdFull(worstToken.pnlUsd)})` : ''}`
        : '—';
      return `<section class="token-stats-group wallet-top-trader-card">
        <h3 class="token-stats-group-title"><span>#${rank} Trader</span></h3>
        <dl class="token-stats">
          <dt>Account</dt><dd>${accountLink}</dd>
          <dt>Name</dt><dd>${row.accountName || '—'}</dd>
          <dt>Logo</dt><dd>${renderLogoImage(row.accountLogoUrl, row.accountName || display)}</dd>
          <dt>X (Twitter)</dt><dd>${row.accountTwitterUrl ? `<a href="${row.accountTwitterUrl}" target="_blank" rel="noopener noreferrer">${row.accountTwitterUrl}</a>` : '—'}</dd>
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
        <h3 class="token-stats-group-title"><span>Top trader</span></h3>
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
        ? `<a href="https://vybe.fyi/wallets/${encodeURIComponent(addr)}" target="_blank" rel="noopener noreferrer" class="mono" title="${addr}">${display}</a>`
        : `<span class="mono">${display}</span>`;
      const vol24h = addr && Object.prototype.hasOwnProperty.call(volume24hByTrader, addr) ? volume24hByTrader[addr] : 0;
      const trades24h = addr && Object.prototype.hasOwnProperty.call(trades24hByTrader, addr) ? trades24hByTrader[addr] : 0;
      return `<tr>
        <td>${rank}</td>
        <td>${traderLink}</td>
        <td style="text-align:right">${formatUsdCell(row.realizedPnlUsd)}</td>
        <td style="text-align:right">${formatUsdCell(row.unrealizedPnlUsd)}</td>
        <td style="text-align:right">${formatUsdCell(row.totalVolumeUsd)}</td>
        <td class="token-top-pnl-24h-col" style="text-align:right">${formatUsdCell(vol24h)}</td>
        <td style="text-align:right">${formatTradesCountHeatCell(row.tradesCount, tradesMin, tradesMax)}</td>
        <td class="token-top-pnl-24h-col" style="text-align:right">${formatTradesCountHeatCell(trades24h, trades24hMin, trades24hMax)}</td>
      </tr>`;
    }).join('')
    : '<tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td class="token-top-pnl-24h-col">—</td><td>—</td><td class="token-top-pnl-24h-col">—</td></tr>';
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
    const scaled = (num / 1e9).toFixed(2).replace(/\.?0+$/, '');
    return `${scaled}B`;
  }
  if (num >= 1e6) {
    const scaled = (num / 1e6).toFixed(2).replace(/\.?0+$/, '');
    return `${scaled}M`;
  }
  if (num >= 1e3) {
    const scaled = (num / 1e3).toFixed(2).replace(/\.?0+$/, '');
    return `${scaled}K`;
  }
  return Math.round(num).toLocaleString();
}

function getResolutionKey(): string {
  return tokenTopPnlResolution.value.trim().toLowerCase();
}

function shouldShowSelectedTradesVerticalRow(): boolean {
  const resolution = getResolutionKey();
  return resolution === '7d' || resolution === '30d';
}

function applySelectedTradesVerticalRowVisibility(): void {
  tokenTradesCountSelectedRow.hidden = !shouldShowSelectedTradesVerticalRow();
}

function renderPieLegendRow(label: string, percentage: number, volume: string, color: string): string {
  return `<div class="token-supply-legend-item">
    <span class="token-supply-legend-swatch" style="background:${color}"></span>
    <div class="token-supply-legend-content">
      <div class="token-supply-legend-label">${label}</div>
      <ul class="token-supply-legend-sublist">
        <li><span class="token-supply-legend-pct">${formatPctSmart(percentage)}</span> <span class="token-supply-legend-usd">(${volume})</span></li>
      </ul>
    </div>
  </div>`;
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

function getTraderPnl(row: TokenTopPnlTraderRow): number {
  return toNum(row.realizedPnlUsd);
}

function formatUsdBucketValue(value: number): string {
  const abs = Math.abs(value);
  if (abs === 0) return '$0';
  const core = abs < 1
    ? abs.toFixed(2)
    : Number.isInteger(abs)
      ? abs.toLocaleString()
      : abs.toFixed(2).replace(/\.?0+$/, '');
  return `${value < 0 ? '-' : ''}$${core}`;
}

type PnlDistributionGroup = {
  label: string;
  count: number;
  tone: 'positive' | 'negative' | 'neutral';
  lower?: number;
  upper?: number;
};

function formatPnlRangeLabel(tone: 'positive' | 'negative', lower: number, upper: number): string {
  if (tone === 'positive') {
    return lower === 0
      ? `> ${formatUsdBucketValue(0)} to ${formatUsdBucketValue(upper)}`
      : `${formatUsdBucketValue(lower)} to ${formatUsdBucketValue(upper)}`;
  }
  return upper === 0
    ? `< ${formatUsdBucketValue(0)} to ${formatUsdBucketValue(lower)}`
    : `${formatUsdBucketValue(upper)} to ${formatUsdBucketValue(lower)}`;
}

function expandPnlGroupsToTarget(groups: PnlDistributionGroup[], values: number[], targetCount: number): PnlDistributionGroup[] {
  if (groups.length >= targetCount) return groups;
  const expanded = [...groups];
  const safeTarget = Math.max(groups.length, targetCount);

  const countValuesInRange = (tone: 'positive' | 'negative', lower: number, upper: number): number => {
    if (tone === 'positive') {
      return values.filter((v) => v > lower && v <= upper).length;
    }
    return values.filter((v) => v >= lower && v < upper).length;
  };

  while (expanded.length < safeTarget) {
    const splittable = expanded
      .map((group, index) => ({ group, index }))
      .filter(({ group }) => (
        group.tone !== 'neutral'
        && group.count > 1
        && Number.isFinite(group.lower)
        && Number.isFinite(group.upper)
        && Math.abs(Number(group.upper) - Number(group.lower)) > Number.EPSILON
      ))
      .sort((a, b) => b.group.count - a.group.count);

    if (splittable.length === 0) break;
    const primary = splittable[0];
    const secondary = splittable[1];
    const candidates = [primary, secondary].filter((item): item is { group: PnlDistributionGroup; index: number } => Boolean(item));

    let didSplit = false;
    for (const candidate of candidates) {
      const source = candidate.group;
      const lower = Number(source.lower);
      const upper = Number(source.upper);
      const mid = (lower + upper) / 2;
      if (!Number.isFinite(mid) || mid <= lower || mid >= upper) continue;

      const tone = source.tone as 'positive' | 'negative';
      const lowCount = countValuesInRange(tone, lower, mid);
      const highCount = countValuesInRange(tone, mid, upper);
      if (lowCount <= 0 || highCount <= 0) continue;

      const replacement: PnlDistributionGroup[] = tone === 'positive'
        ? [
          {
            label: formatPnlRangeLabel('positive', mid, upper),
            count: highCount,
            tone: 'positive',
            lower: mid,
            upper,
          },
          {
            label: formatPnlRangeLabel('positive', lower, mid),
            count: lowCount,
            tone: 'positive',
            lower,
            upper: mid,
          },
        ]
        : [
          {
            label: formatPnlRangeLabel('negative', mid, upper),
            count: highCount,
            tone: 'negative',
            lower: mid,
            upper,
          },
          {
            label: formatPnlRangeLabel('negative', lower, mid),
            count: lowCount,
            tone: 'negative',
            lower,
            upper: mid,
          },
        ];
      expanded.splice(candidate.index, 1, ...replacement);
      didSplit = true;
      break;
    }

    if (!didSplit) break;
  }

  return expanded;
}

function buildTierEdges(maxAbs: number): number[] {
  const edges = [0, 0.5, 1, 10, 100, 1000];
  while (edges[edges.length - 1] < maxAbs) {
    edges.push(edges[edges.length - 1] * 10);
  }
  return edges;
}

function buildCountTierEdges(maxVal: number): number[] {
  // 9 edges => 8 visible groups by default.
  const edges = [0, 1, 5, 10, 25, 50, 100, 500, 1000];
  while (edges[edges.length - 1] < maxVal) {
    edges.push(edges[edges.length - 1] * 10);
  }
  return edges;
}

function applyMinVisibleSlices(realSlices: number[], minVisiblePct = 1.5): number[] {
  const adjusted = realSlices.map((v) => Math.max(0, v));
  const tinyEntries = adjusted
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v > 0 && v < minVisiblePct);
  const tinyIdx = tinyEntries.map(({ i }) => i);
  if (tinyIdx.length === 0) return adjusted;

  const targetTotal = adjusted.reduce((sum, v) => sum + v, 0);
  const tinyValues = tinyEntries.map(({ v }) => v);
  const minTiny = Math.min(...tinyValues);
  const maxTiny = Math.max(...tinyValues);
  tinyEntries.forEach(({ v, i }) => {
    if (maxTiny === minTiny) {
      adjusted[i] = minVisiblePct;
      return;
    }
    // Boost tiny slices for visibility while preserving their ordering.
    const normalized = (v - minTiny) / (maxTiny - minTiny);
    adjusted[i] = minVisiblePct * (1 + normalized * 0.5);
  });
  let overflow = adjusted.reduce((sum, v) => sum + v, 0) - targetTotal;
  if (overflow <= 0) return adjusted;

  const donorIndices = adjusted
    .map((v, i) => ({ v, i }))
    .filter(({ i, v }) => !tinyIdx.includes(i) && v > 0)
    .sort((a, b) => b.v - a.v)
    .map(({ i }) => i);

  for (const i of donorIndices) {
    if (overflow <= 0) break;
    const reducible = Math.max(0, adjusted[i]);
    const cut = Math.min(reducible, overflow);
    adjusted[i] -= cut;
    overflow -= cut;
  }

  if (overflow > 0) {
    const total = adjusted.reduce((sum, v) => sum + v, 0);
    if (total > 0) {
      return adjusted.map((v) => (v / total) * targetTotal);
    }
  }

  return adjusted;
}

function buildPieGradientWithGaps(
  slices: number[],
  colors: string[],
  gapColor = '#0a0a0d',
  gapDeg = 1.2
): string {
  const entries = slices
    .map((value, i) => ({ value: Math.max(0, value), color: colors[i] ?? '#27272a' }))
    .filter((entry) => entry.value > 0);

  if (entries.length === 0) {
    return `conic-gradient(${gapColor} 0deg 360deg)`;
  }

  if (entries.length === 1) {
    return `conic-gradient(${entries[0].color} 0deg 360deg)`;
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
    stops.push(`${entry.color} ${sliceStart.toFixed(3)}deg ${sliceEnd.toFixed(3)}deg`);
    cursor = sliceEnd;
  });

  if (cursor < 360) {
    stops.push(`${gapColor} ${cursor.toFixed(3)}deg 360deg`);
  }

  return `conic-gradient(${stops.join(', ')})`;
}

function applyMaxPnlGroups(
  groups: PnlDistributionGroup[],
  maxGroups: number
): PnlDistributionGroup[] {
  if (groups.length <= maxGroups) return groups;
  const safeMax = Math.max(1, maxGroups);
  const keep = groups.slice(0, safeMax - 1);
  const overflow = groups.slice(safeMax - 1);
  const overflowCount = overflow.reduce((sum, g) => sum + g.count, 0);
  const overflowTone = overflow.some((g) => g.tone === 'negative')
    ? 'negative'
    : overflow.some((g) => g.tone === 'positive')
      ? 'positive'
      : 'neutral';
  keep.push({
    label: `${overflow[0]?.label ?? 'Other'} and below`,
    count: overflowCount,
    tone: overflowTone,
  });
  return keep;
}

function renderPnlDistributionBars(
  rows: TokenTopPnlTraderRow[],
  topLimit: number,
  target: HTMLElement,
  maxGroups: number
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

  const groups: PnlDistributionGroup[] = [];
  const positiveValues = values.filter((pnl) => pnl > 0);
  const positiveEdges = buildTierEdges(Math.max(0, ...positiveValues));
  for (let i = positiveEdges.length - 1; i >= 1; i--) {
    const lower = positiveEdges[i - 1];
    const upper = positiveEdges[i];
    const count = positiveValues.filter((pnl) => pnl > lower && pnl <= upper).length;
    if (count === 0) continue;
    groups.push({
      label: formatPnlRangeLabel('positive', lower, upper),
      count,
      tone: 'positive',
      lower,
      upper,
    });
  }

  const zeroCount = values.filter((pnl) => pnl === 0).length;
  if (zeroCount > 0) groups.push({ label: '0', count: zeroCount, tone: 'neutral', lower: 0, upper: 0 });

  const negativeValues = values.filter((pnl) => pnl < 0);
  const negativeEdges = buildTierEdges(Math.max(0, ...negativeValues.map((pnl) => Math.abs(pnl))));
  for (let i = 1; i < negativeEdges.length; i++) {
    const upper = -negativeEdges[i - 1];
    const lower = -negativeEdges[i];
    const count = negativeValues.filter((pnl) => pnl >= lower && pnl < upper).length;
    if (count === 0) continue;
    groups.push({
      label: formatPnlRangeLabel('negative', lower, upper),
      count,
      tone: 'negative',
      lower,
      upper,
    });
  }

  if (groups.length === 0) {
    target.innerHTML = '<div class="token-pnl-bar-label">No non-zero PnL groups for current selection.</div>';
    return;
  }

  const expandedGroups = (maxGroups === 9 || maxGroups === 8)
    ? expandPnlGroupsToTarget(groups, values, maxGroups)
    : groups;
  const limitedGroups = applyMaxPnlGroups(expandedGroups, maxGroups);
  const maxCount = Math.max(1, ...limitedGroups.map((g) => g.count));
  target.innerHTML = limitedGroups
    .map((group) => {
      const widthPct = (group.count / maxCount) * 100;
      return `<div class="token-pnl-bar-row">
        <div class="token-pnl-bar-label">${group.label}</div>
        <div class="token-pnl-bar-track">
          <div class="token-pnl-bar-fill token-pnl-bar-fill--${group.tone}" style="width:${widthPct.toFixed(2)}%"></div>
          <span class="token-pnl-bar-count">${group.count}</span>
        </div>
      </div>`;
    })
    .join('');
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

function buildTradesCountGroups(
  rows: TokenTopPnlTraderRow[],
  topLimit: number,
  groupCount: number
): TradesCountDistributionGroup[] | null {
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
  const positiveSlots = Math.max(1, groupCount - (zeroCount > 0 ? 1 : 0));
  const edges = buildCountTierEdges(Math.max(0, ...positiveValues));
  const ranges: { lower: number; upper: number }[] = [];
  for (let i = edges.length - 1; i >= 1; i--) {
    ranges.push({ lower: edges[i - 1], upper: edges[i] });
  }

  const countForRange = (lower: number, upper: number): number =>
    positiveValues.filter((v) => v > lower && v <= upper).length;

  // If the top bucket is empty, split the first non-zero bucket in half
  // and move its upper half to the first slot for better visibility.
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

  const selectedRanges = ranges.slice(0, positiveSlots);
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
  const groups: TradesCountDistributionGroup[] = selectedRanges.map((range, idx) => {
    const count = countForRange(range.lower, range.upper);
    const gradientT = groupCount <= 1 ? 1 : 1 - (idx / (groupCount - 1));
    const label = (() => {
      if (range.lower === 0) {
        return `>${formatTradeTierValue(0)}-${formatTradeTierValue(range.upper)}`;
      }
      if (
        zeroCount === 0 &&
        Number.isInteger(range.lower) &&
        Number.isInteger(range.upper) &&
        range.upper <= 10
      ) {
        const start = range.lower + 1;
        if (start >= range.upper) return formatTradeTierValue(range.upper);
        return `${formatTradeTierValue(start)}-${formatTradeTierValue(range.upper)}`;
      }
      return `${formatTradeTierValue(range.lower)}-${formatTradeTierValue(range.upper)}`;
    })();
    return {
      label,
      count,
      gradientT,
    };
  });

  if (zeroCount > 0) groups.push({ label: '0', count: zeroCount, gradientT: 0 });
  return groups.slice(0, groupCount);
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
        <div class="token-trades-vertical-label">${group.label}</div>
      </div>`;
    })
    .join('');
}

function renderTopTraderVolumeCharts(rows: TokenTopPnlTraderRow[], topLimit: number, token: TokenData | null): void {
  const limitN = Math.max(1, topLimit);
  const volumeRows = rows.slice(0, limitN);
  const showTop101Bucket = limitN >= 250;
  const topNVol = volumeRows.reduce((acc, row) => acc + toNum(row.totalVolumeUsd), 0);
  const top100Vol = volumeRows.slice(0, 100).reduce((acc, row) => acc + toNum(row.totalVolumeUsd), 0);
  const top10Vol = volumeRows.slice(0, 10).reduce((acc, row) => acc + toNum(row.totalVolumeUsd), 0);
  const top11to100Vol = Math.max(0, Math.min(top100Vol, topNVol) - top10Vol);
  const top101toNVol = showTop101Bucket ? Math.max(0, topNVol - Math.min(top100Vol, topNVol)) : 0;
  const token24hVolumeUsd = Math.max(0, toNum(token?.usdValueVolume24h));
  const denominatorUsd = Math.max(1, token24hVolumeUsd, topNVol);
  const remainingVol = Math.max(0, denominatorUsd - topNVol);

  const top10Slice = Math.max(0, Math.min(100, (top10Vol / denominatorUsd) * 100));
  const top11to100Slice = Math.max(0, Math.min(100, (top11to100Vol / denominatorUsd) * 100));
  const top101toNSlice = showTop101Bucket ? Math.max(0, Math.min(100, (top101toNVol / denominatorUsd) * 100)) : 0;
  const remainingSlice = Math.max(0, Math.min(100, (remainingVol / denominatorUsd) * 100));
  const [displayTop10, displayTop11to100, displayTop101toN] = applyMinVisibleSlices(
    [top10Slice, top11to100Slice, top101toNSlice, remainingSlice]
  );
  tokenSupplyPie.style.background = buildPieGradientWithGaps(
    [displayTop10, displayTop11to100, displayTop101toN, remainingSlice],
    ['#3b82f6', '#2563eb', '#1d4ed8', '#27272a']
  );

  tokenSupplyLegend.innerHTML = `
    ${renderPieLegendRow('Top 10 traders', top10Slice, formatUsdFull(top10Vol), '#3b82f6')}
    ${renderPieLegendRow('Top 11-100 traders', top11to100Slice, formatUsdFull(top11to100Vol), '#2563eb')}
    ${showTop101Bucket ? renderPieLegendRow(`Top 101-${limitN.toLocaleString()} traders`, top101toNSlice, formatUsdFull(top101toNVol), '#1d4ed8') : ''}
    ${renderPieLegendRow('Non-top traders', remainingSlice, formatUsdFull(remainingVol), '#27272a')}
  `;
  renderPnlDistributionBars(rows, topLimit, tokenPnlBars24h, 9);
}

function renderTopTraderSelectedResolutionCharts(rows: TokenTopPnlTraderRow[], topLimit: number): void {
  const limitN = Math.max(1, topLimit);
  const volumeRows = rows.slice(0, limitN);
  const showTop101Bucket = limitN >= 250;
  const topNVol = volumeRows.reduce((acc, row) => acc + toNum(row.totalVolumeUsd), 0);
  const top100Vol = volumeRows.slice(0, 100).reduce((acc, row) => acc + toNum(row.totalVolumeUsd), 0);
  const top10Vol = volumeRows.slice(0, 10).reduce((acc, row) => acc + toNum(row.totalVolumeUsd), 0);
  const top11to100Vol = Math.max(0, Math.min(top100Vol, topNVol) - top10Vol);
  const top101toNVol = showTop101Bucket ? Math.max(0, topNVol - Math.min(top100Vol, topNVol)) : 0;
  const denominatorUsd = Math.max(1, topNVol);
  const top10Slice = Math.max(0, Math.min(100, (top10Vol / denominatorUsd) * 100));
  const top11to100Slice = Math.max(0, Math.min(100, (top11to100Vol / denominatorUsd) * 100));
  const top101toNSlice = showTop101Bucket ? Math.max(0, Math.min(100, (top101toNVol / denominatorUsd) * 100)) : 0;
  const resolutionLabel = formatResolutionSectionLabel(tokenTopPnlResolution.value);
  const titleResolution = formatResolutionForTitle(resolutionLabel);
  tokenSupplySelectedTitle.textContent = resolutionLabel;
  tokenTopVolumeSelectedTitle.textContent = `Top Traders Volume (Last ${titleResolution})`;
  tokenPnlSelectedTitle.textContent = resolutionLabel.toLowerCase() === '24hr'
    ? `Trades count distribution (Last ${titleResolution})`
    : `PnL distribution (Last ${titleResolution})`;
  tokenTradesCountSelectedTitle.textContent = `Trades count distribution (Last ${titleResolution})`;
  if (resolutionLabel.toLowerCase() === '24hr') {
    renderTradesCountDistributionBars(rows, topLimit, tokenPnlBarsTotal, 8);
  } else {
    renderPnlDistributionBars(rows, topLimit, tokenPnlBarsTotal, 8);
  }
  applySelectedTradesVerticalRowVisibility();
  if (shouldShowSelectedTradesVerticalRow()) {
    renderTradesCountDistributionVerticalBars(rows, topLimit, tokenTradesCountBarsVertical, 10);
  } else {
    tokenTradesCountBarsVertical.innerHTML = '';
  }

  const [displayTop10, displayTop11to100, displayTop101toN] = applyMinVisibleSlices(
    [top10Slice, top11to100Slice, top101toNSlice]
  );
  tokenSupplyPieTotal.style.background = showTop101Bucket
    ? buildPieGradientWithGaps(
      [displayTop10, displayTop11to100, displayTop101toN],
      ['#3b82f6', '#2563eb', '#1d4ed8']
    )
    : buildPieGradientWithGaps(
      [displayTop10, displayTop11to100],
      ['#3b82f6', '#2563eb']
    );
  tokenSupplyLegendTotal.innerHTML = `
    ${renderPieLegendRow('Top 10 traders', top10Slice, formatUsdFull(top10Vol), '#3b82f6')}
    ${renderPieLegendRow('Top 11-100 traders', top11to100Slice, formatUsdFull(top11to100Vol), '#2563eb')}
    ${showTop101Bucket ? renderPieLegendRow(`Top 101-${limitN.toLocaleString()} traders`, top101toNSlice, formatUsdFull(top101toNVol), '#1d4ed8') : ''}
  `;
}

async function loadData(): Promise<void> {
  const query = mintInput.value.trim();
  if (!query) return;
  const mode = getSearchMode();
  const tokenMode = mode === 'token';

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

        const chartLimit = Math.max(10, Math.min(1000, Number(tokenTopPnlLimit.value) || 1000));
        renderTopTraderVolumeCharts(chartRows, chartLimit, tokenData);
        renderTopTraderSelectedResolutionCharts(tokenTopPnlData.data ?? [], chartLimit);
      } else {
        tokenSupplyLegend.innerHTML = '';
        tokenPnlBars24h.innerHTML = '';
        tokenSupplyLegendTotal.innerHTML = '';
        tokenPnlBarsTotal.innerHTML = '';
        tokenTradesCountBarsVertical.innerHTML = '';
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
          walletPnlDetails.innerHTML = '<div class="token-stats-group wallet-pnl-empty">No wallet address found in top-traders results for this filter.</div>';
        }
      } else {
        showSectionError(topTradersError, `Failed (${topRes.status})`);
        walletPnlMeta.textContent = '—';
        walletPnlDetails.innerHTML = '<div class="token-stats-group wallet-pnl-empty">Wallet PnL unavailable while top-traders request fails.</div>';
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

searchModeWallet.addEventListener('change', () => {
  const prevMode = getSearchMode();
  const nextMode = searchModeWallet.checked ? 'wallet' : 'token';
  if (nextMode === 'wallet') {
    if (prevMode === 'token') {
      lastTokenResolutionBeforeWalletSwitch = normalizeTokenResolution(tokenTopPnlResolution.value);
    }
  } else {
    tokenTopPnlResolution.value = getTokenResolutionAfterWalletSwitch();
    tokenTopPnlResolution.dispatchEvent(new Event('change'));
  }
  setSearchMode(nextMode);
  applySearchModeUI();
});

fetchAllBtn.addEventListener('click', () => {
  void loadData();
});

tokenTopPnlResolution.addEventListener('change', () => {
  const resolutionLabel = formatResolutionSectionLabel(tokenTopPnlResolution.value);
  const titleResolution = formatResolutionForTitle(resolutionLabel);
  tokenSupplySelectedTitle.textContent = resolutionLabel;
  tokenTopVolumeSelectedTitle.textContent = `Top Traders Volume (Last ${titleResolution})`;
  tokenPnlSelectedTitle.textContent = resolutionLabel.toLowerCase() === '24hr'
    ? `Trades count distribution (Last ${titleResolution})`
    : `PnL distribution (Last ${titleResolution})`;
  tokenTradesCountSelectedTitle.textContent = `Trades count distribution (Last ${titleResolution})`;
  applySelectedTradesVerticalRowVisibility();
  applyTokenTopPnl24hColumnVisibility();
});

const initialResolutionLabel = formatResolutionSectionLabel(tokenTopPnlResolution.value);
const initialTitleResolution = formatResolutionForTitle(initialResolutionLabel);
tokenSupplySelectedTitle.textContent = initialResolutionLabel;
tokenTopVolumeSelectedTitle.textContent = `Top Traders Volume (Last ${initialTitleResolution})`;
tokenPnlSelectedTitle.textContent = initialResolutionLabel.toLowerCase() === '24hr'
  ? `Trades count distribution (Last ${initialTitleResolution})`
  : `PnL distribution (Last ${initialTitleResolution})`;
tokenTradesCountSelectedTitle.textContent = `Trades count distribution (Last ${initialTitleResolution})`;
lastTokenResolutionBeforeWalletSwitch = normalizeTokenResolution(tokenTopPnlResolution.value);
applyWalletTopTradersTitle();
setSearchMode(getSearchMode());
applySearchModeUI();
applySelectedTradesVerticalRowVisibility();
topTradersMeta.hidden = true;
topTradersCards.hidden = true;
walletPnlMeta.textContent = '—';
walletPnlDetails.innerHTML = buildWalletPnlPlaceholder();
tokenTopPnlBody.innerHTML = '<tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td class="token-top-pnl-24h-col">—</td><td>—</td><td class="token-top-pnl-24h-col">—</td></tr>';
applyTokenTopPnl24hColumnVisibility();
