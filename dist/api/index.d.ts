/**
 * Vybe API client: single entry that wires tokens, holders, and trades.
 * Usage: createClient(apiKey) then client.getToken(mint), client.getTopHolders(mint), etc.
 */
import type { VybeToken } from '../types/api.js';
import { type GetTopHoldersOptions } from './holders.js';
import { type GetTradesOptions, type GetTopTradersOptions, type GetTopPnlTradersOptions, type GetWalletPnlOptions, type GetWalletPnlTimeseriesOptions, type VybeTradesResponse, type VybeWalletPnlTimeseriesResponse } from './trades.js';
import type { VybeTopHoldersResponse, VybeProgramsResponse, VybeTopTradersResponse, VybeWalletPnlResponse, VybeTokenTopPnlTradersResponse } from '../types/api.js';
export interface VybeClient {
    getToken(mintAddress: string): Promise<VybeToken>;
    getTopHolders(mintAddress: string, options?: GetTopHoldersOptions): Promise<VybeTopHoldersResponse>;
    getTrades(mintAddress: string, options?: GetTradesOptions): Promise<VybeTradesResponse>;
    getLabeledProgramAccount(programAddress: string): Promise<VybeProgramsResponse>;
    getTopTraders(options?: GetTopTradersOptions): Promise<VybeTopTradersResponse>;
    getTokenTopPnlTraders(mintAddress: string, options?: GetTopPnlTradersOptions): Promise<VybeTokenTopPnlTradersResponse>;
    getWalletPnl(ownerAddress: string, options?: GetWalletPnlOptions): Promise<VybeWalletPnlResponse>;
    getWalletPnlTimeseries(ownerAddress: string, options?: GetWalletPnlTimeseriesOptions): Promise<VybeWalletPnlTimeseriesResponse>;
}
/**
 * Create a Vybe API client. All methods use the same API key and retry logic.
 * @param apiKey - VYBE_API_KEY (from env or passed in)
 */
export declare function createClient(apiKey: string): VybeClient;
//# sourceMappingURL=index.d.ts.map