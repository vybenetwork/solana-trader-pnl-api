/**
 * Vybe trades and related: /v4/trades, /v4/programs/labeled-program-accounts, /v4/wallets/top-traders.
 * @see https://docs.vybenetwork.com/reference/get_trade_data_program_v4
 * @see https://docs.vybenetwork.com/reference/get_top_traders_v4
 */
import type { AxiosInstance } from 'axios';
import type { VybeProgramsResponse, VybeTopTradersResponse, VybeWalletPnlResponse, VybeTokenTopPnlTradersResponse } from '../types/api.js';
/** Trade item from GET /v4/trades (shape varies; we use programAddress, quoteMintAddress, marketAddress). */
export type VybeTradesResponse = {
    data?: any[];
    [key: string]: unknown;
};
export interface GetTradesOptions {
    limit?: number;
    page?: number;
    sortByDesc?: string;
    /** Start time of the data to return (unix timestamp). Used for consistent pagination. */
    timeStart?: number | null;
    /** End time of the data to return (unix timestamp). */
    timeEnd?: number | null;
}
/**
 * Fetch last N trades for a base token.
 * @param http - Authenticated axios instance
 * @param mintAddress - Token mint
 * @param options - limit (default 250), page (default 0), sortByDesc (default blockTime)
 */
export declare function getTrades(http: AxiosInstance, mintAddress: string, options?: GetTradesOptions): Promise<VybeTradesResponse>;
/**
 * Fetch labeled program for a single program address.
 * GET /v4/programs/labeled-program-accounts?programAddress=xxx — one request per address.
 * @see https://docs.vybenetwork.com/reference/get_known_program_accounts_v4
 */
export declare function getLabeledProgramAccount(http: AxiosInstance, programAddress: string): Promise<VybeProgramsResponse>;
export interface GetTopTradersOptions {
    mintAddress?: string;
    ilikeFilter?: string;
    label?: string;
    resolution?: string;
    sortByAsc?: string;
    sortByDesc?: string;
    limit?: number;
    page?: number;
}
/**
 * Fetch top traders by realized PnL.
 * @param http - Authenticated axios instance
 * @param options - supports mintAddress or ilikeFilter with sorting/pagination controls
 */
export declare function getTopTraders(http: AxiosInstance, options?: GetTopTradersOptions): Promise<VybeTopTradersResponse>;
export interface GetTopPnlTradersOptions {
    resolution?: string;
    sortByAsc?: string;
    sortByDesc?: string;
    limit?: number;
    page?: number;
}
export interface GetWalletPnlOptions {
    resolution?: string;
    mintAddress?: string;
    sortByAsc?: string;
    sortByDesc?: string;
    limit?: number;
    page?: number;
}
/**
 * Fetch token top PnL traders.
 * @param http - Authenticated axios instance
 * @param mintAddress - Token mint address
 * @param options - sorting/pagination controls
 */
export declare function getTokenTopPnlTraders(http: AxiosInstance, mintAddress: string, options?: GetTopPnlTradersOptions): Promise<VybeTokenTopPnlTradersResponse>;
/** GET /v4/wallets/{ownerAddress}/pnl-ts — bucketed PnL timeseries (resolution 1d / 1w / 1mo). */
export type VybeWalletPnlTimeseriesResponse = {
    data?: any[];
    [key: string]: unknown;
};
export interface GetWalletPnlTimeseriesOptions {
    resolution?: string;
    timeStart?: number;
    timeEnd?: number;
}
export declare function getWalletPnlTimeseries(http: AxiosInstance, ownerAddress: string, options?: GetWalletPnlTimeseriesOptions): Promise<VybeWalletPnlTimeseriesResponse>;
export declare function getWalletPnl(http: AxiosInstance, ownerAddress: string, options?: GetWalletPnlOptions): Promise<VybeWalletPnlResponse>;
//# sourceMappingURL=trades.d.ts.map