/**
 * Vybe trades and related: /v4/trades, /v4/programs/labeled-program-accounts, /v4/wallets/top-traders.
 * @see https://docs.vybenetwork.com/reference/get_trade_data_program_v4
 * @see https://docs.vybenetwork.com/reference/get_top_traders_v4
 */

import type { AxiosInstance } from 'axios';
import type {
  VybeProgramsResponse,
  VybeTopTradersResponse,
  VybeTokenTopPnlTradersResponse,
} from '../types/api.js';
import { withRetry } from './client.js';

/** Trade item from GET /v4/trades (shape varies; we use programAddress, quoteMintAddress, marketAddress). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VybeTradesResponse = { data?: any[]; [key: string]: unknown };

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
export async function getTrades(
  http: AxiosInstance,
  mintAddress: string,
  options: GetTradesOptions = {}
): Promise<VybeTradesResponse> {
  const { limit = 250, page, sortByDesc = 'blockTime', timeStart, timeEnd } = options;
  return withRetry(async () => {
    const params: Record<string, string> = {};
    params.mintAddress = mintAddress;
    if (timeStart != null && timeStart >= 0) params.timeStart = String(timeStart);
    if (timeEnd != null && timeEnd >= 0) params.timeEnd = String(timeEnd);
    if (page !== undefined) params.page = String(page);
    params.limit = String(limit);
    params.sortByDesc = sortByDesc;
    const { data } = await http.get<VybeTradesResponse>('/v4/trades', { params });
    return data;
  });
}

/**
 * Fetch labeled program for a single program address.
 * GET /v4/programs/labeled-program-accounts?programAddress=xxx — one request per address.
 * @see https://docs.vybenetwork.com/reference/get_known_program_accounts_v4
 */
export async function getLabeledProgramAccount(
  http: AxiosInstance,
  programAddress: string
): Promise<VybeProgramsResponse> {
  try {
    return await withRetry(async () => {
      const { data } = await http.get<VybeProgramsResponse>('/v4/programs/labeled-program-accounts', {
        params: { programAddress: programAddress.trim() },
      });
      return data;
    });
  } catch {
    return { programs: [] };
  }
}

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
export async function getTopTraders(
  http: AxiosInstance,
  options: GetTopTradersOptions = {}
): Promise<VybeTopTradersResponse> {
  const {
    mintAddress,
    ilikeFilter,
    label,
    resolution = '1d',
    sortByAsc,
    sortByDesc = 'realizedPnlUsd',
    limit = 1000,
    page,
  } = options;
  return withRetry(async () => {
    const params: Record<string, string | number> = {
      resolution,
      limit,
    };
    if (sortByAsc) {
      params.sortByAsc = sortByAsc;
    } else {
      params.sortByDesc = sortByDesc;
    }
    if (mintAddress) params.mintAddress = mintAddress;
    if (ilikeFilter) params.ilikeFilter = ilikeFilter;
    if (label) params.label = label;
    if (page != null) params.page = page;
    const { data } = await http.get<VybeTopTradersResponse>('/v4/wallets/top-traders', {
      params,
    });
    return data;
  });
}

export interface GetTopPnlTradersOptions {
  resolution?: string;
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
export async function getTokenTopPnlTraders(
  http: AxiosInstance,
  mintAddress: string,
  options: GetTopPnlTradersOptions = {}
): Promise<VybeTokenTopPnlTradersResponse> {
  const {
    resolution = '1d',
    sortByAsc,
    sortByDesc = 'realizedPnlUsd',
    limit = 1000,
    page = 0,
  } = options;
  return withRetry(async () => {
    const params: Record<string, string | number> = {
      resolution,
      limit,
      page,
    };
    if (sortByAsc) {
      params.sortByAsc = sortByAsc;
    } else {
      params.sortByDesc = sortByDesc;
    }
    const { data } = await http.get<VybeTokenTopPnlTradersResponse>(
      `/v4/tokens/${encodeURIComponent(mintAddress)}/top-pnl-traders`,
      { params }
    );
    return data;
  });
}
