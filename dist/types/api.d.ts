/**
 * TypeScript interfaces matching Vybe API response shapes.
 * Lets devs see what the API returns without making a call first.
 * @see https://docs.vybenetwork.com/reference
 */
/** Token details from GET /v4/tokens/{mintAddress} */
export interface VybeToken {
    mintAddress: string;
    symbol?: string;
    name?: string;
    decimals?: number;
    logoUrl?: string;
    priceUsd?: string;
    marketCapUsd?: string;
    volume24hUsd?: string;
    holders?: number;
    currentSupply?: string;
    [key: string]: unknown;
}
/** Single holder from GET /v4/tokens/{mintAddress}/top-holders */
export interface VybeHolder {
    rank?: number;
    ownerAddress?: string;
    ownerName?: string;
    balance?: string;
    valueUsd?: string;
    percentageOfSupplyHeld?: number;
    [key: string]: unknown;
}
/** Top holders response wrapper */
export interface VybeTopHoldersResponse {
    data: VybeHolder[];
    [key: string]: unknown;
}
/** Single trade from GET /v4/trades */
export interface VybeTrade {
    programAddress?: string;
    quoteMintAddress?: string;
    marketAddress?: string;
    blockTime?: number;
    [key: string]: unknown;
}
/** Single program from GET /v4/programs/labeled-program-accounts */
export interface VybeLabeledProgram {
    programAddress: string;
    name?: string;
    labels?: string[];
    programDescription?: string;
    logoUrl?: string;
    entityName?: string;
    [key: string]: unknown;
}
/** Programs response from GET /v4/programs/labeled-program-accounts (labeled programs by sector/entity) */
export interface VybeProgramsResponse {
    programs?: VybeLabeledProgram[];
    data?: VybeLabeledProgram[];
    [key: string]: unknown;
}
/** Top trader from GET /v4/wallets/top-traders */
export interface VybeTopTrader {
    accountAddress?: string;
    accountName?: string;
    metrics?: {
        realizedPnlUsd?: number;
        tradesCount?: number;
        tradesVolumeUsd?: number;
        winRate?: number;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
/** Top traders response wrapper */
export interface VybeTopTradersResponse {
    data: VybeTopTrader[];
    [key: string]: unknown;
}
export interface VybeWalletPnlTokenRef {
    mintAddress?: string;
    pnlUsd?: number;
    tokenLogoUrl?: string;
    tokenName?: string;
    tokenSymbol?: string;
    [key: string]: unknown;
}
export interface VybeWalletPnlSummary {
    averageTradeUsd?: number;
    bestPerformingToken?: VybeWalletPnlTokenRef;
    losingTradesCount?: number;
    pnlTrendSevenDays?: number[][];
    realizedPnlUsd?: number;
    tradesCount?: number;
    tradesVolumeUsd?: number;
    uniqueTokensTraded?: number;
    unrealizedPnlUsd?: number;
    winRate?: number;
    winningTradesCount?: number;
    worstPerformingToken?: VybeWalletPnlTokenRef;
    [key: string]: unknown;
}
export interface VybeWalletPnlSideMetrics {
    latestTradeBlocktime?: number;
    latestTradeSignature?: string;
    tokenAmount?: number;
    transactionCount?: number;
    volumeUsd?: number;
    [key: string]: unknown;
}
export interface VybeWalletPnlTokenMetric {
    buys?: VybeWalletPnlSideMetrics;
    latestTradeBlocktime?: number;
    mintAddress?: string;
    realizedPnlUsd?: number;
    sells?: VybeWalletPnlSideMetrics;
    status?: string;
    tokenLabels?: string[];
    tokenLogoUrl?: string;
    tokenName?: string;
    tokenSymbol?: string;
    unrealizedPnlUsd?: number;
    [key: string]: unknown;
}
export interface VybeWalletPnlResponse {
    summary?: VybeWalletPnlSummary;
    tokenMetrics?: VybeWalletPnlTokenMetric[];
    [key: string]: unknown;
}
/** Top PnL trader from GET /v4/tokens/{mintAddress}/top-pnl-traders */
export interface VybeTokenTopPnlTrader {
    traderAddress: string;
    name?: string | null;
    logoUrl?: string | null;
    labels?: string[];
    realizedPnlUsd: number;
    unrealizedPnlUsd: number;
    totalVolumeUsd: number;
    buyVolumeUsd: number;
    sellVolumeUsd: number;
    tradesCount: number;
    buyCount: number;
    sellCount: number;
    [key: string]: unknown;
}
/** Token top PnL traders response wrapper */
export interface VybeTokenTopPnlTradersResponse {
    data: VybeTokenTopPnlTrader[];
    [key: string]: unknown;
}
//# sourceMappingURL=api.d.ts.map