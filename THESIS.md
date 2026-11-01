# NEAR Investment Thesis (working draft)

> Every figure below is produced by `npm run build` from public sources. Do not
> edit numbers by hand; re-run the pipeline.

## Claim (working hypothesis)
NEAR is a durable settlement + chain-abstraction layer whose real usage
(active accounts, transactions, cross-chain intents, staking security) is a
better long-term value driver than price action.

## Evidence for
- Deep staking security: ~47% of circulating NEAR staked across 373 validators.
- Broad chain abstraction: NEAR Intents routes 210 assets across 38 chains.
- Multi-year, queryable onchain history (2021→now) — reproducible, not vibes.

## Evidence against (we show this on purpose)
- 90-day active accounts are **down** vs the prior quarter (see model output).
- Gas-fee value accrual is small relative to market cap (fee yield ~0.03%).
- Reported onchain USD volume over-counts system/staking transfers, so a naive
  NVT valuation is unreliable (see caveat below). TODO: filter to economic transfers.

## What would change our mind
- Sustained decline in active accounts AND transactions over 2+ quarters.
- Intents volume stagnating while token price rises (usage not backing price).

## Known caveats / TODO
- NVT fair-value band is assumption-driven and currently distorted by inflated
  volume; replace `txn_volume_usd` with a cleaned economic-transfer metric.
- Add NEAR Intents swap volume (needs partner JWT in `.env`) for a usage leading indicator.
