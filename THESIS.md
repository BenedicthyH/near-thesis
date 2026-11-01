# NEAR Investment Thesis

Every number below comes from `npm run build`, which pulls free, keyless public
APIs (NEARBlocks, DefiLlama, NEAR RPC, NEAR Intents 1Click). Do not edit numbers
by hand. Re-run the pipeline. Snapshot: 2026-11-01.

## Claim
Active accounts on NEAR fell 33% quarter over quarter. Fees paid rose 21% over
the same period. Fewer accounts are paying more. We read this as usage moving
from incentive farming to paid settlement, much of it routed through NEAR
Intents. At $4.38, NEAR trades inside our fair-value band of $2.39 to $6.90. The
long-term case is growth in paid usage, not a discount today.

## The data

### Supporting
- **Fees up.** Gas fees grew 20.6% QoQ to about 396K NEAR a year ($1.74M).
- **Staking.** 591.9M NEAR, 47.4% of circulating supply, is staked across 373
  validators. Attacking the chain is expensive, and a large share of holders are
  locked in.
- **Cross-chain reach.** NEAR Intents routes 210 assets across 38 chains. NEAR
  usage can grow even when the asset being swapped is not NEAR.
- **Supply.** Total supply is 1.310B and circulating is 1.250B. The gap is flat
  and inflation is predictable.
- **Capital.** About $200M in DeFi TVL has stayed through several market cycles.

### Against
- **Accounts down.** Active accounts average 71.9K a day over 90 days, down 33%
  QoQ. This is the largest weakness in the case.
- **Transactions down.** 738K a day over 90 days, down 6% QoQ.
- **Thin fee capture.** Price-to-fees is about 3,309x. Fee yield is 0.03% of
  market cap. The token captures little of the activity it secures today.
- **Not cheap on TVL.** Mcap/TVL is 28.8x.

## Valuation
NVT is excluded. NEARBlocks `txn_volume_usd` counts system, staking and refund
transfers, which gives an NVT of 0.09. That is not a usable signal.

We use three peer-multiple lenses on live metrics and take the median of their
low and high ends.

| Lens | Basis | Base multiple | Fair range |
| --- | --- | --- | --- |
| Price to fees | $1.74M annual fees | 2,000x to 6,000x | $2.78 to $8.34 |
| Mcap to TVL | $200M TVL | 15x to 40x | $2.39 to $6.39 |
| Value per active user | 71.9K active a day | $40K to $120K | $2.30 to $6.90 |
| **Median band** | | | **$2.39 to $6.90** |

Implied price (band midpoint) is about $4.65, roughly 6% above $4.38. Verdict:
fair value.

### Scenarios
| Scenario | P/F | Mcap/TVL | $ per active user |
| --- | --- | --- | --- |
| Bear | 1,000x to 3,000x | 8x to 20x | $20K to $60K |
| Base | 2,000x to 6,000x | 15x to 40x | $40K to $120K |
| Bull | 4,000x to 10,000x | 30x to 70x | $80K to $200K |

The dashboard has a Bear/Base/Bull toggle and sliders for every multiple. The
band, implied price and verdict recompute in the browser as you change them.

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
