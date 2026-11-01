# NEAR Investment Thesis — Live Onchain Dashboard + Re-runnable Model

Built at **NEAR HACKATHON** · track id: `thesis`.

An evidence-first, reproducible investment thesis for NEAR. Every number comes
from a free, public, keyless data source — pulled live, never hand-typed.

## What the product is
- **Data-fetch layer** (`scripts/fetch_data.mjs`) — one command pulls 5 live datasets into `data/`.
- **Model** (`model/thesis_model.py`) — turns raw data into adoption, fee accrual, security and a 3-lens valuation. Edit the multiples and re-run.
- **Dashboard** (`app/`) — a static Next.js + Recharts page. Each chart shows the chart, the query/source behind it, and one plain sentence on what it shows.
- **THESIS.md** — the claim, evidence for, evidence against, and what would change our mind.

## How NEAR fits in
The thesis is *about* NEAR and reads *from* NEAR: public RPC validator set, NEARBlocks indexed chain history, DefiLlama TVL, and the NEAR Intents (1Click) router.

## Do X → see Y (for judges)
```sh
# 0. Prerequisites: Node 20+, Python 3.10+. No API keys.
npm install

# 1. Rebuild every dataset + the model from live public sources
npm run build
# → writes data/*.json and model/model_output.json
# → prints adoption, fees, staking ratio, and the $2.40–$6.90 fair-value band

# 2. Build the static dashboard
npm run site
# → writes out/ (open out/index.html, or: python3 -m http.server 8099 --directory out)

# 3. Local preview (optional)
npx next start   # after `npm run site`, serves the production build
# or: npm run dev
```
Open the dashboard: each section has a monospace source line under the chart
(`GET api.nearblocks.io/v1/charts → txns`, etc.). Read `THESIS.md` for the
narrative that the charts support.

## Dashboard sections
1. Daily transactions
2. Active accounts (flags the QoQ decline)
3. New accounts
4. Gas fees paid (the clean economic signal used in valuation)
5. DeFi TVL
6. Token supply & inflation
7. Staking security (ratio + validators)
8. NEAR Intents asset/chain coverage
9. Valuation — three independent lenses + NVT caveat

## Data sources (all free / keyless)
| Metric | Source | Endpoint |
| --- | --- | --- |
| Daily txns, active accounts, fees, supply, price | NEARBlocks | `GET api.nearblocks.io/v1/charts` |
| Network snapshot | NEARBlocks | `GET api.nearblocks.io/v1/stats` |
| DeFi TVL history | DefiLlama | `GET api.llama.fi/v2/historicalChainTvl/Near` |
| Total staked / validators | NEAR RPC | `POST rpc.mainnet.near.org` `validators` |
| Intents assets / chains | 1Click | `GET 1click.chaindefuser.com/v0/tokens` |

## Scripts
| Command | What it does |
| --- | --- |
| `npm run fetch` | Pull live datasets → `data/` |
| `npm run model` | Recompute metrics → `model/model_output.json` |
| `npm run build` | `fetch` + `model` (full data regenerate) |
| `npm run site` | Next.js static export → `out/` |
| `npm run dev` | Next.js dev server |

## Known caveats
- NVT is shown but **excluded** from the fair-value range: NEARBlocks `txn_volume_usd` over-counts system/staking transfers.
- Intents *swap volume* needs a partner JWT (not used here); we show asset/chain coverage instead.
- Fee capture is thin (~0.03% of mcap) — the main bear case, documented in THESIS.md.

## License
MIT (see LICENSE). Not financial advice.
