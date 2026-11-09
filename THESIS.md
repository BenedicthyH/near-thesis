# NEAR Investment Thesis

Every number below comes from `npm run build`, which pulls free, keyless public
APIs (NEARBlocks, DefiLlama, NEAR RPC, NEAR Intents 1Click). Do not edit numbers
by hand. Re-run the pipeline. Snapshot: 2026-11-09. QoQ means the last 90 days
(2026-08-11 to 2026-11-08) against the 90 days before.

## Claim
Active accounts on NEAR fell 31.9% QoQ. Gas fees paid rose 22.1%. Fees paid per
active account rose 79.2%, from 0.0086 to 0.0154 NEAR a day, and transactions
per account rose 39.3%, from 7.5 to 10.4 a day. Fewer accounts are paying more.
We read this as usage moving from incentive farming to paid settlement, part of
it routed through NEAR Intents. At $3.64, NEAR trades inside our base fair-value
band of $2.26 to $6.79. The long-term case is growth in paid usage, not a
discount today.

## The data

### Supporting
- **Fees per account up.** +79.2% QoQ. This is the core signal.
- **Fees up.** Gas fees grew 22.1% QoQ to about 398K NEAR a year ($1.45M at
  $3.64).
- **Staking.** 580.7M NEAR, 46.5% of circulating supply, is staked across 339
  validators.
- **Cross-chain reach.** NEAR Intents routes 216 assets across 39 chains; 181
  of those assets live on chains other than NEAR.
- **Supply.** Total supply is 1.311B and circulating is 1.250B. The two move in
  parallel.
- **Capital.** DeFi TVL is $168.6M.

### Against
- **Accounts down.** Active accounts average 70.7K a day over 90 days, down
  31.9% QoQ. This is the largest weakness in the case.
- **Transactions down.** 736K a day over 90 days, down 5.1% QoQ.
- **Thin fee capture.** Price to fees is about 3,298x. Fee yield is 0.03% of
  market cap.
- **Not cheap on TVL.** Mcap/TVL is 28.3x.
- **Validator count.** 339 validators against 373 in our 2026-11-01 snapshot.
  Two snapshots are not a trend, but this is the falsifier to watch first.

## Valuation
NVT is excluded. NEARBlocks `txn_volume_usd` counts system, staking and refund
transfers, which gives an NVT of 0.07. That is not a usable signal.

Three peer-multiple lenses on live metrics; the band is the median of their low
and high ends. Multiples are assumptions, set from peer L1 ranges.

| Lens | Live basis | Base multiple (assumption) | Fair range |
| --- | --- | --- | --- |
| Price to fees | $1.45M annual fees | 2,000x to 6,000x | $2.32 to $6.95 |
| Mcap to TVL | $168.6M TVL | 15x to 40x | $2.02 to $5.40 |
| Value per active account | 70.7K active a day | $40K to $120K | $2.26 to $6.79 |
| **Median band** | | | **$2.26 to $6.79** |

Implied price (band midpoint) is $4.53, 24.5% above $3.64. Verdict: inside
the band, fair value.

### Scenarios
| Scenario | P/F | Mcap/TVL | $ per active account | Band | Midpoint |
| --- | --- | --- | --- | --- | --- |
| Bear | 1,000x to 3,000x | 8x to 20x | $20K to $60K | $1.13 to $3.40 | $2.26 |
| Base | 2,000x to 6,000x | 15x to 40x | $40K to $120K | $2.26 to $6.79 | $4.53 |
| Bull | 4,000x to 10,000x | 30x to 70x | $80K to $200K | $4.53 to $11.32 | $7.92 |

The dashboard has a Bear/Base/Bull toggle and sliders for every multiple. The
band, implied price and verdict recompute in the browser.

## What would change our mind
1. **Fees roll over.** QoQ fee growth turns negative. The paid-usage claim fails.
2. **Staking falls.** Staked ratio drops below 40%, or the validator set shrinks
   materially.
3. **Intents stalls.** Supported assets and chains stop growing for two quarters.
4. **Capital leaves.** TVL falls more than 30% while price holds.

## Reproduce
```bash
npm install
npm run build   # fetch live data and run model/thesis_model.py
npm run site    # static export to out/
```
Multiples live at the top of `model/thesis_model.py`. Change them and re-run.

Not financial advice.
