/**
 * Vybe trades and related: /v4/trades, /v4/programs/labeled-program-accounts, /v4/wallets/top-traders.
 * @see https://docs.vybenetwork.com/reference/get_trade_data_program_v4
 * @see https://docs.vybenetwork.com/reference/get_top_traders_v4
 */
import { withRetry } from './client.js';
/**
 * Fetch last N trades for a base token.
 * @param http - Authenticated axios instance
 * @param mintAddress - Token mint
 * @param options - limit (default 250), page (default 0), sortByDesc (default blockTime)
 */
export async function getTrades(http, mintAddress, options = {}) {
    const { limit = 250, page, sortByDesc = 'blockTime', timeStart, timeEnd } = options;
    return withRetry(async () => {
        const params = {};
        params.mintAddress = mintAddress;
        if (timeStart != null && timeStart >= 0)
            params.timeStart = String(timeStart);
        if (timeEnd != null && timeEnd >= 0)
            params.timeEnd = String(timeEnd);
        if (page !== undefined)
            params.page = String(page);
        params.limit = String(limit);
        params.sortByDesc = sortByDesc;
        const { data } = await http.get('/v4/trades', { params });
        return data;
    });
}
/**
 * Fetch labeled program for a single program address.
 * GET /v4/programs/labeled-program-accounts?programAddress=xxx — one request per address.
 * @see https://docs.vybenetwork.com/reference/get_known_program_accounts_v4
 */
export async function getLabeledProgramAccount(http, programAddress) {
    try {
        return await withRetry(async () => {
            const { data } = await http.get('/v4/programs/labeled-program-accounts', {
                params: { programAddress: programAddress.trim() },
            });
            return data;
        });
    }
    catch {
        return { programs: [] };
    }
}
/**
 * Fetch top traders by realized PnL.
 * @param http - Authenticated axios instance
 * @param options - supports mintAddress or ilikeFilter with sorting/pagination controls
 */
export async function getTopTraders(http, options = {}) {
    const { mintAddress, ilikeFilter, label, resolution = '1d', sortByAsc, sortByDesc = 'realizedPnlUsd', limit = 1000, page, } = options;
    return withRetry(async () => {
        const params = {
            resolution,
            limit,
        };
        if (sortByAsc) {
            params.sortByAsc = sortByAsc;
        }
        else {
            params.sortByDesc = sortByDesc;
        }
        if (mintAddress)
            params.mintAddress = mintAddress;
        if (ilikeFilter)
            params.ilikeFilter = ilikeFilter;
        if (label)
            params.label = label;
        if (page != null)
            params.page = page;
        const { data } = await http.get('/v4/wallets/top-traders', {
            params,
        });
        return data;
    });
}
/**
 * Fetch token top PnL traders.
 * @param http - Authenticated axios instance
 * @param mintAddress - Token mint address
 * @param options - sorting/pagination controls
 */
export async function getTokenTopPnlTraders(http, mintAddress, options = {}) {
    const { resolution = '1d', sortByAsc, sortByDesc = 'realizedPnlUsd', limit = 1000, page = 0, } = options;
    return withRetry(async () => {
        const params = {
            resolution,
            limit,
            page,
        };
        if (sortByAsc) {
            params.sortByAsc = sortByAsc;
        }
        else {
            params.sortByDesc = sortByDesc;
        }
        const { data } = await http.get(`/v4/tokens/${encodeURIComponent(mintAddress)}/top-pnl-traders`, { params });
        return data;
    });
}
export async function getWalletPnlTimeseries(http, ownerAddress, options = {}) {
    const { resolution = '1d', timeStart, timeEnd } = options;
    return withRetry(async () => {
        const params = { resolution };
        if (timeStart != null && Number.isFinite(timeStart) && timeStart >= 0) {
            params.timeStart = String(Math.floor(timeStart));
        }
        if (timeEnd != null && Number.isFinite(timeEnd) && timeEnd >= 0) {
            params.timeEnd = String(Math.floor(timeEnd));
        }
        const { data } = await http.get(`/v4/wallets/${encodeURIComponent(ownerAddress)}/pnl-ts`, { params });
        return data;
    });
}
export async function getWalletPnl(http, ownerAddress, options = {}) {
    const { resolution = '1d', mintAddress, sortByAsc, sortByDesc = 'realizedPnlUsd', limit = 1000, page = 0, } = options;
    return withRetry(async () => {
        const params = {
            resolution,
            limit,
            page,
        };
        if (mintAddress)
            params.mintAddress = mintAddress;
        if (sortByAsc) {
            params.sortByAsc = sortByAsc;
        }
        else {
            params.sortByDesc = sortByDesc;
        }
        const { data } = await http.get(`/v4/wallets/${encodeURIComponent(ownerAddress)}/pnl`, { params });
        return data;
    });
}
//# sourceMappingURL=trades.js.map