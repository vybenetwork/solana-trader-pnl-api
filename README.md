# Solana wallet PnL (Vybe API)

Browser app and small Node server for **wallet-scoped PnL**: search by wallet address or name (`ilikeFilter`), load **per-wallet PnL** from Vybe, and list **related wallets** ranked by realized PnL for the same resolution window (backed by `GET /v4/wallets/top-traders`).

![Wallet PnL demo](screenshots/solana-top-traders-wallets-and-tokens-api.png)

## Historical mode

**Historical wallet PnL timeseries** (PnL over time buckets) is **under construction** in the UI. Use **Realtime** for the working flow. The backend may still expose `/api/wallets/:owner/pnl-ts` for experiments; the in-app historical tab is disabled until the feature is finished.

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10

## Quick start

```bash
git clone https://github.com/<your-org>/solana-wallet-pnl-profit-and-loss-api.git
cd solana-wallet-pnl-profit-and-loss-api
npm install
cp .env.example .env
# Set VYBE_API_KEY in .env
npm start
```

Then open `http://localhost:3000`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VYBE_API_KEY` | Yes | API key for Vybe requests |
| `SOLANA_RPC_URL` | No | RPC for symbol fallback |
| `PORT` | No | Server port (default `3000`) |
| `TUNNEL` | No | Set `1` to run with Cloudflare Tunnel |

## What the app does (realtime)

- **Wallet search** — query params map to Vybe `ilikeFilter` / wallet PnL filters.
- **Related wallets grid** — wallets returned for the same search, ranked by realized PnL for the selected resolution (1d / 7d / 30d).
- **Wallet PnL summary** — realized / unrealized PnL, trades, win rate, and richer layout when data is available.

## Main Vybe routes used

- `GET /v4/wallets/top-traders`
- `GET /v4/wallets/{ownerAddress}/pnl` (and related wallet PnL fields in the UI)
- `GET /v4/trades` (supporting context where applicable)
- `GET /v4/programs/labeled-program-accounts`
- `GET /v4/tokens/{mintAddress}` (legacy token panels are hidden in this wallet-only build)

## Project structure

```text
solana-wallet-pnl-profit-and-loss-api/
├── README.md
├── package.json
├── public/
│   ├── index.html
│   ├── app.css
│   └── app.js
└── src/
    ├── server.ts
    ├── api/
    ├── frontend/
    └── types/
```

## Notes

- Screenshot paths under `screenshots/` may still use older filenames; replace when you refresh assets.
- Replace the GitHub clone URL with your org or fork.
- API keys: [vybenetwork.com/pricing](https://vybenetwork.com/pricing).
