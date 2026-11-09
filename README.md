# NEAR Investment Thesis

A live onchain dashboard and a re-runnable valuation model for NEAR.
Built for the NEAR Hackathon, Investment Thesis track.

**Live:** https://out-sage-gamma.vercel.app

![Dashboard](shots/desktop-hero.png)

## Thesis in one line
Fewer NEAR accounts are paying more for blockspace. Over the last 90 days,
active accounts fell 31.9% against the prior 90 days while gas fees paid rose
22.1%, so fees paid per active account rose 79.2%. We read this as usage
moving from incentive farming to paid settlement. At $3.64, NEAR sits inside
our base fair-value band of $2.26 to $6.79. Fee capture is still thin, so the
case rests on paid usage growing, not on a discount today.

Snapshot: 2026-11-09. All numbers above come from `npm run build`. Re-run it
and they will update. Full write-up in [THESIS.md](THESIS.md).

## What the dashboard shows
- **Key insight and read.** Fees per active account, then three short points:
  what changed, what it is worth, what would prove it wrong.
- **Network usage.** Transactions, active accounts, new accounts, gas fees,
  and fees per active account (derived).
- **Capital and security.** DeFi TVL, total and circulating supply, staking
  ratio and validator count, NEAR Intents assets per chain.
- **Valuation.** Three peer-multiple lenses (price to fees, market cap to
  TVL, value per active account) and the median fair-value band. Bear, Base
  and Bull presets plus sliders for every multiple. The band, implied price
  and verdict recompute in the browser as you move them.
- **Falsifiers.** The conditions that would change the view, with current
  values next to each.

Every chart cites its endpoint. The valuation multiples are assumptions and
are labelled as such on the page. The metrics they multiply are live data.

## Data sources
All free and keyless.

| Source | Endpoint | Used for |
| --- | --- | --- |
| NEARBlocks | `api.nearblocks.io/v1/charts` | daily txns, active and new accounts, gas fees, supply |
| NEARBlocks | `api.nearblocks.io/v1/stats` | price, market cap, supply snapshot |
| DefiLlama | `api.llama.fi/v2/historicalChainTvl/Near` | DeFi TVL history |
| NEAR RPC | `rpc.mainnet.near.org` (`validators`) | total stake, validator count |
| NEAR Intents | `1click.chaindefuser.com/v0/tokens` | routable assets and chains |

NVT is computed but left out of the band. NEARBlocks `txn_volume_usd` counts
system, staking and refund transfers, which makes NVT unreliable.

## Re-run the model
Requires Node 18+ and Python 3.

```bash
npm install
npm run build   # fetch every source into data/*.json, then run the model
npm run site    # static export to out/
npx serve out   # or any static server
```

- `scripts/fetch_data.mjs` pulls each source and writes `data/*.json`.
- `model/thesis_model.py` reads only those files and writes
  `model/model_output.json`. It exits if an input is missing.
- The base multiples sit at the top of `model/thesis_model.py`. Change them
  and re-run, or move the sliders on the live page.

Method: QoQ compares the 90-day average of the last 90 days with the 90 days
before. Each lens turns a live metric into a price with a low and high
multiple. The band is the median of the three lows and the three highs.

## Layout
```
scripts/fetch_data.mjs   data fetch, no dependencies
model/thesis_model.py    valuation model
app/                     Next.js + Recharts dashboard (static export)
data/                    latest fetched snapshot
shots/                   screenshots
```

## License
MIT. Not financial advice.
