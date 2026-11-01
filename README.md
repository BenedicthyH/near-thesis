# NEAR Investment Thesis

A live onchain dashboard and a re-runnable valuation model for NEAR.
Submission for NEAR HACKATHON, **Investment Thesis** track.

**Live:** https://out-sage-gamma.vercel.app

## What it shows
- Usage: transactions, active accounts, new accounts, gas fees.
- Capital and security: DeFi TVL, supply and inflation, staking, NEAR Intents reach.
- Valuation: three lenses (price to fees, mcap to TVL, value per active user),
  a median fair-value band, Bear/Base/Bull presets and live sliders for every
  multiple.
- Each chart has a one-line read (bullish, bearish or neutral) and the page
  lists the data that would falsify the thesis.

Full write-up: [THESIS.md](THESIS.md).

## Run it
Requires Node 18+ and Python 3. No API keys.
```bash
npm install
npm run build   # fetch data to data/*.json, run model to model/model_output.json
npm run site    # static export to out/
```

## Data sources (all free, keyless)
| Source | Used for |
| --- | --- |
| NEARBlocks `api.nearblocks.io/v1/charts`, `/v1/stats` | txns, accounts, fees, supply, price |
| DefiLlama `api.llama.fi/v2/historicalChainTvl/Near` | TVL |
| NEAR RPC `rpc.mainnet.near.org` (validators) | staking |
| NEAR Intents `1click.chaindefuser.com/v0/tokens` | assets and chains |

## Layout
```
scripts/fetch_data.mjs   data fetch, no dependencies
model/thesis_model.py    valuation model
app/                     Next.js + Recharts dashboard
```

## License
MIT. Not financial advice.
