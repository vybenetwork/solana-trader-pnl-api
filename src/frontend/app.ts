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
  metrics?: {
    realizedPnlUsd?: number;
    tradesCount?: number;
    tradesVolumeUsd?: number;
    winRate?: number;
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

type SearchMode = 'token' | 'wallet';
type SortDirection = 'asc' | 'desc';

const mintInput = document.getElementById('mint') as HTMLInputElement;
const searchInputLabel = document.getElementById('searchInputLabel') as HTMLElement;
const searchModeWallet = document.getElementById('searchModeWallet') as HTMLInputElement;
const searchModeSwitchLabel = document.getElementById('searchModeSwitchLabel') as HTMLElement;
const fetchActions = document.getElementById('fetchActions') as HTMLElement;
const walletActionsTarget = document.getElementById('walletActionsTarget') as HTMLElement;
const tokenActionsTarget = document.getElementById('tokenActionsTarget') as HTMLElement;
const fetchAllBtn = document.getElementById('fetchAll') as HTMLButtonElement;
const loadingIndicator = document.getElementById('loadingIndicator') as HTMLElement;
const tokenOnlyControls = document.getElementById('tokenOnlyControls') as HTMLElement;

const walletResolution = document.getElementById('walletResolution') as HTMLSelectElement;
const walletLabel = document.getElementById('walletLabel') as HTMLSelectElement;
const walletSortField = document.getElementById('walletSortField') as HTMLSelectElement;
const walletSortDirection = document.getElementById('walletSortDirection') as HTMLSelectElement;
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

const topTradersSection = document.getElementById('topTradersSection') as HTMLElement;
const topTradersLoading = document.getElementById('topTradersLoading') as HTMLElement;
const topTradersError = document.getElementById('topTradersError') as HTMLElement;
const topTradersMeta = document.getElementById('topTradersMeta') as HTMLElement;
const topTradersBody = document.getElementById('topTradersBody') as HTMLElement;

const tokenTopPnlSection = document.getElementById('tokenTopPnlSection') as HTMLElement;
const tokenTopPnlLoading = document.getElementById('tokenTopPnlLoading') as HTMLElement;
const tokenTopPnlError = document.getElementById('tokenTopPnlError') as HTMLElement;
const tokenTopPnlMeta = document.getElementById('tokenTopPnlMeta') as HTMLElement;
const tokenTopPnlBody = document.getElementById('tokenTopPnlBody') as HTMLElement;

const SEARCH_MODE_KEY = 'topTradersSearchMode';
const MAX_FETCH_RETRIES = 5;
const FETCH_RETRY_DELAY_MS = 2000;
const DEMO_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';

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
    : 'e.g. 7xKXtg2CW4fXh1vM4dfV2Qx9tqGk8hL38Gy4X9Kq8p7y';
  fetchAllBtn.textContent = tokenMode ? 'Load token analytics' : 'Search top traders';
  tokenSection.hidden = !tokenMode;
  topTradersSection.hidden = tokenMode;
  tokenTopPnlSection.hidden = !tokenMode;
  tokenOnlyControls.hidden = !tokenMode;
  if (tokenMode) tokenActionsTarget.appendChild(fetchActions);
  else walletActionsTarget.appendChild(fetchActions);
  document
    .querySelectorAll<HTMLElement>('.wallet-only-control, .wallet-only-row')
    .forEach((el) => {
      el.hidden = tokenMode;
    });
  document.querySelectorAll<HTMLElement>('.token-only-control').forEach((el) => {
    el.hidden = !tokenMode;
  });
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
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs < 10) return `$${num.toFixed(2)} USD`;
  return `$${sign}${Math.abs(Math.round(num)).toLocaleString()} USD`;
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
  tokenLogo.src = t.logoUrl || '';
  tokenLogo.alt = t.symbol || '';
  tokenLogo.style.display = t.logoUrl ? 'block' : 'none';
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
    resolution: walletResolution.value,
    limit: walletLimit.value,
    page: String(Math.max(0, Number(walletPage.value) || 0)),
  });
  const labelVal = walletLabel.value.trim().toLowerCase();
  if (labelVal) params.set('label', labelVal);
  const direction = walletSortDirection.value as SortDirection;
  const field = walletSortField.value;
  if (direction === 'asc') {
    params.set('sortByAsc', field);
  } else {
    params.set('sortByDesc', field);
  }
  if (mode === 'token') params.set('mintAddress', query);
  else params.set('ilikeFilter', query);
  return params;
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

function renderTopTraders(data: { data?: TopTraderRow[] }, mode: SearchMode, query: string, queryParams: URLSearchParams): void {
  const list = data.data || [];
  const scope = mode === 'wallet' ? `ilikeFilter="${query}"` : `mintAddress="${query}"`;
  topTradersMeta.textContent = list.length
    ? `GET /v4/wallets/top-traders with ${scope} and ${queryParams.toString()} returned ${list.length} row(s).`
    : `GET /v4/wallets/top-traders with ${scope} returned 0 rows.`;
  topTradersBody.innerHTML = list.length
    ? list.map((row, i) => {
      const rank = i + 1;
      const addr = row.accountAddress;
      const display = row.accountName || (addr ? truncateAddress(addr) : '—');
      const accountLink = addr
        ? `<a href="https://vybe.fyi/wallets/${encodeURIComponent(addr)}" target="_blank" rel="noopener noreferrer" class="mono" title="${addr}">${display}</a>`
        : `<span class="mono">${display}</span>`;
      const m = row.metrics || {};
      return `<tr>
        <td>${rank}</td>
        <td>${accountLink}</td>
        <td>${formatUsdFull(m.realizedPnlUsd)}</td>
        <td style="text-align:right">${formatInt(m.tradesCount)}</td>
        <td style="text-align:right">${formatUsdFull(m.tradesVolumeUsd)}</td>
        <td style="text-align:right">${m.winRate != null ? `${Math.round(Number(m.winRate))}%` : '—'}</td>
      </tr>`;
    }).join('')
    : '<tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>';
}

function renderTokenTopPnlTraders(data: { data?: TokenTopPnlTraderRow[] }, query: string, queryParams: URLSearchParams): void {
  const list = data.data || [];
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
      return `<tr>
        <td>${rank}</td>
        <td>${traderLink}</td>
        <td style="text-align:right">${formatUsdFull(row.realizedPnlUsd)}</td>
        <td style="text-align:right">${formatUsdFull(row.unrealizedPnlUsd)}</td>
        <td style="text-align:right">${formatUsdFull(row.totalVolumeUsd)}</td>
        <td style="text-align:right">${formatInt(row.tradesCount)}</td>
      </tr>`;
    }).join('')
    : '<tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>';
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
    if (tokenMode) {
      const tokenRes = await fetchWithRetry(`/api/tokens/${encodeURIComponent(query)}`);
      if (tokenRes.ok) {
        renderToken((await tokenRes.json()) as TokenData);
      } else {
        showSectionError(tokenSectionError, `Failed (${tokenRes.status})`);
      }
      const tokenTopPnlRes = await fetchWithRetry(`/api/tokens/${encodeURIComponent(query)}/top-pnl-traders?${tokenTopPnlParams.toString()}`);
      if (tokenTopPnlRes.ok) {
        renderTokenTopPnlTraders(await tokenTopPnlRes.json() as { data?: TokenTopPnlTraderRow[] }, query, tokenTopPnlParams);
      } else {
        showSectionError(tokenTopPnlError, `Failed (${tokenTopPnlRes.status})`);
      }
    } else {
      const topRes = await fetchWithRetry(`/api/wallets/top-traders?${walletTopTraderParams.toString()}`);
      if (topRes.ok) {
        renderTopTraders(await topRes.json() as { data?: TopTraderRow[] }, mode, query, walletTopTraderParams);
      } else {
        showSectionError(topTradersError, `Failed (${topRes.status})`);
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
  setSearchMode(searchModeWallet.checked ? 'wallet' : 'token');
  applySearchModeUI();
});

fetchAllBtn.addEventListener('click', () => {
  void loadData();
});

setSearchMode(getSearchMode());
if (!mintInput.value.trim()) mintInput.value = DEMO_MINT;
applySearchModeUI();
topTradersBody.innerHTML = '<tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>';
tokenTopPnlBody.innerHTML = '<tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>';
