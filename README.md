# NEAR Investment Thesis

A live onchain dashboard and a re-runnable valuation model for NEAR.
Built for the NEAR Hackathon, Investment Thesis track.

**Live:** https://out-sage-gamma.vercel.app

![Dashboard](shots/desktop-hero.png)

## Thesis in one line
Fewer NEAR accounts are paying more for blockspace. Over the last 90 days,
active accounts fell 31.6% against the prior 90 days while gas fees paid rose
22.6% in NEAR terms (135.2% in USD, mostly because NEAR's price rose), so fees
paid per active account rose 79.2%. The fee base is still small: $1.44M a year
against a $4.52B circulating market cap. On live peer multiples (Ethereum,
Solana, Sui, Aptos) NEAR would be worth $0.52 to $2.01; at $3.62 it trades at
a premium to every named peer. Not a discount call. The case rests on paid
usage growing into the multiple: fees need to rise about 3.85x at today's
price to reach the peer-median price to fees.

Snapshot: 2026-11-10. `npm run build` regenerates every number, including
[THESIS.md](THESIS.md), which is written from the model output.

## What the dashboard shows
- **Key insight and read.** Fees per active account, the fee base for scale,
  then what changed, what it costs and what would prove it wrong.
- **Other readings.** Accounts are not users. The same data fits bots or
  farmers leaving, or fees concentrating in a few apps.
- **Network usage.** Transactions, active and new accounts, gas fees in NEAR
  and in USD, and fees per active account (derived).
- **Capital and security.** DeFi TVL, total and circulating supply, staking
  ratio and validator count, NEAR Intents listed assets per chain (breadth,
  not volume) and NEAR Intents routed volume (DefiLlama).
- **Valuation.** A live peer table (price, circulating mcap, annualized fees,
  P/F, fee yield, TVL, Mcap/TVL) with sources, then a fair-value band from the
  fee and TVL lenses at peer multiples. Bear, Base and Bull presets plus
  sliders. The value-per-active-account lens is shown but labelled unsourced
  and kept out of the band, since no like-for-like public peer series exists.
- **Falsifiers.** The conditions that would change the view, with current
  values next to each.

All ratios use circulating market cap (price x circulating supply). FDV is
shown separately. NEARBlocks' `market_cap` field equals FDV, so it is not used
in any ratio.

## Data sources
All free and keyless.

| Source | Endpoint | Used for |
| --- | --- | --- |
| NEARBlocks | `api.nearblocks.io/v1/charts` | daily txns, active and new accounts, gas fees, supply |
| NEARBlocks | `api.nearblocks.io/v1/stats` | price, supply snapshot |
| DefiLlama | `api.llama.fi/v2/historicalChainTvl/Near` | DeFi TVL history |
| NEAR RPC | `rpc.mainnet.near.org` (`validators`) | total stake, validator count |
| NEAR Intents | `1click.chaindefuser.com/v0/tokens` | listed assets and chains |
| DefiLlama | `api.llama.fi/summary/dexs/near-intents` | NEAR Intents routed volume |
| DefiLlama | `api.llama.fi/summary/fees/{chain}` | peer chain fees (Ethereum, Solana, Sui, Aptos, NEAR) |
| DefiLlama | `api.llama.fi/v2/chains` | peer chain TVL |
| CoinGecko | `api.coingecko.com/api/v3/coins/markets` | peer price, circulating mcap, FDV |

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
- `model/write_thesis.py` writes `THESIS.md` from the model output.
- Fee and TVL multiples come from the live peer data. Move the sliders on the
  live page to try your own.

Method: QoQ compares the last 90 days with the 90 days before. Each lens
turns a live metric into a price with a low and high multiple. The band is the
average of the fee lens and the TVL lens. Base uses the full peer range, Bear
uses peer low to peer median, Bull uses peer high up to NEAR's own multiple.

## Layout
```
scripts/fetch_data.mjs   data fetch, no dependencies
model/thesis_model.py    valuation model
model/write_thesis.py    writes THESIS.md from the model
app/                     Next.js + Recharts dashboard (static export)
data/                    latest fetched snapshot
shots/                   screenshots
```

## Design
The dashboard's visual style (paper, black ink, one oxblood accent, hairlines, running heads, numbered figures) is inspired by the [Parallel, Finance](https://www.framer.com/marketplace/templates/parallel-finance/) Framer template. The code is original and uses the free Google Fonts Newsreader and Instrument Sans; no template code or assets are used.

## License
MIT. Not financial advice.
