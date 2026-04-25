/**
 * Vybe API client: single entry that wires tokens, holders, and trades.
 * Usage: createClient(apiKey) then client.getToken(mint), client.getTopHolders(mint), etc.
 */

import type { VybeToken } from '../types/api.js';
import { createHttpClient } from './client.js';
import { getToken as fetchToken } from './tokens.js';
import { getTopHolders, type GetTopHoldersOptions } from './holders.js';
import {
  getTrades,
  getLabeledProgramAccount,
  getTopTraders,
  getTokenTopPnlTraders,
  type GetTradesOptions,
  type GetTopTradersOptions,
  type GetTopPnlTradersOptions,
  type VybeTradesResponse,
} from './trades.js';
import type {
  VybeTopHoldersResponse,
  VybeProgramsResponse,
  VybeTopTradersResponse,
  VybeTokenTopPnlTradersResponse,
} from '../types/api.js';

export interface VybeClient {
  getToken(mintAddress: string): Promise<VybeToken>;
  getTopHolders(mintAddress: string, options?: GetTopHoldersOptions): Promise<VybeTopHoldersResponse>;
  getTrades(mintAddress: string, options?: GetTradesOptions): Promise<VybeTradesResponse>;
  getLabeledProgramAccount(programAddress: string): Promise<VybeProgramsResponse>;
  getTopTraders(options?: GetTopTradersOptions): Promise<VybeTopTradersResponse>;
  getTokenTopPnlTraders(
    mintAddress: string,
    options?: GetTopPnlTradersOptions
  ): Promise<VybeTokenTopPnlTradersResponse>;
}

/**
 * Create a Vybe API client. All methods use the same API key and retry logic.
 * @param apiKey - VYBE_API_KEY (from env or passed in)
 */
export function createClient(apiKey: string): VybeClient {
  const http = createHttpClient(apiKey);
  return {
    getToken: (mintAddress: string) => fetchToken(http, mintAddress),
    getTopHolders: (mintAddress: string, options?: GetTopHoldersOptions) =>
      getTopHolders(http, mintAddress, options),
    getTrades: (mintAddress: string, options?: GetTradesOptions) =>
      getTrades(http, mintAddress, options),
    getLabeledProgramAccount: (programAddress: string) => getLabeledProgramAccount(http, programAddress),
    getTopTraders: (options?: GetTopTradersOptions) => getTopTraders(http, options),
    getTokenTopPnlTraders: (mintAddress: string, options?: GetTopPnlTradersOptions) =>
      getTokenTopPnlTraders(http, mintAddress, options),
  };
}
