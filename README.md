# NEAR Investment Thesis — Live Onchain Dashboard + Re-runnable Model

Built at **NEAR HACKATHON** (Investment Thesis track, `thesis`).

An evidence-first, reproducible investment thesis for NEAR. Every number comes
from a free, public, keyless data source — pulled live, never hand-typed.

## What this is
- **Data-fetch layer** (`scripts/fetch_data.mjs`): one command pulls 5 live datasets.
- **Model** (`model/thesis_model.py`): turns raw data into adoption, value-accrual,
  security and valuation metrics. Re-run it with your own assumptions.
- **Dashboard** (planned): a static page that renders each chart next to the query
  behind it and one plain sentence on what it shows.
- **THESIS.md**: the claim, evidence for and against, and what would change our mind.

## Try it (do X → see Y)
```sh
npm run build        # == npm run fetch && npm run model
```
- `npm run fetch` → writes JSON datasets into `data/`.
- `npm run model` → writes `model/model_output.json` and prints the metrics.

No API keys required. (Node 20+, Python 3.10+.)

## Data sources (all free / keyless)
| Metric | Source | Endpoint |
| --- | --- | --- |
| Daily txns, active accounts, fees, supply, price (2021→now) | NEARBlocks | `GET api.nearblocks.io/v1/charts` |
| Network snapshot (supply, price, TPS, nodes) | NEARBlocks | `GET api.nearblocks.io/v1/stats` |
| NEAR DeFi TVL history | DefiLlama | `GET api.llama.fi/v2/historicalChainTvl/Near` |
| Total staked / validators | NEAR RPC | `POST rpc.mainnet.near.org validators` |
| NEAR Intents supported assets/chains | 1Click | `GET 1click.chaindefuser.com/v0/tokens` |

## How NEAR fits in
The thesis is *about* NEAR and reads *from* NEAR: public RPC validator set,
NEARBlocks indexed chain history, and the NEAR Intents cross-chain router.

## Status
Phase 1 complete: data pipeline + model proven on live data. Dashboard UI and
THESIS.md narrative in progress.

## License
MIT (see LICENSE).
