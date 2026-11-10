# NEAR Investment Thesis

Every number below is written by `npm run build`, which pulls free, keyless
public APIs (NEARBlocks, DefiLlama, CoinGecko, NEAR RPC, NEAR Intents 1Click)
and then generates this file. Do not edit numbers by hand. Snapshot:
2026-11-10. QoQ means the last 90 days (2026-08-12 to
2026-11-09) against the 90 days before (2026-05-14 to 2026-08-11).

## Claim
Active accounts on NEAR fell 31.6% QoQ. Gas fees paid rose
22.6% in NEAR terms. Fees paid per active account rose 79.2%, from
0.0086 to 0.0155 NEAR a day, and transactions per account rose
39.6%. Fewer accounts are paying more.

The fee base is small: $1.44M a year against a $4.52B circulating
market cap, a fee yield of 0.032%. On live peer fee and TVL multiples
(Ethereum, Solana, Sui, Aptos) NEAR would be worth $0.52 to $2.01. At
$3.62 it trades above that band, at a premium to every named peer. This
is not a discount call. The case rests on paid usage growing into the multiple.

## NEAR fees vs USD fees
| Measure | Prior 90d | Last 90d | QoQ |
| --- | --- | --- | --- |
| Fees, NEAR terms | 80,215 NEAR | 98,309 NEAR | +22.6% |
| Fees, USD (daily fee x daily price) | $0.16M | $0.38M | +135.2% |
| Average NEAR price | $1.97 | $3.54 | +79.8% |

The NEAR-denominated figure is the activity signal because the token's price
does not move it. USD fees rose more because NEAR itself rallied.

## Other readings
Accounts are not users. One person or bot can run many accounts, and one app
can drive most of the activity. The same numbers fit bots or farmers leaving
while a core keeps paying, or fees concentrating in a few heavy apps. The APIs
used here do not give fee share by contract, so we cannot rule that out yet.
Paid settlement is one reading of the data, not a proof.

## Supply basis
All ratios use circulating market cap: $3.62 x 1.250B circulating =
$4.52B. FDV is $3.62 x 1.311B total = $4.75B, shown for
reference. NEARBlocks' `market_cap` field ($4.75B) matches FDV, so it is
not used in any ratio.

## Peer multiples (live)
Price and circulating market cap from CoinGecko, chain fees from DefiLlama
(L1 gas only, last 90 complete days annualized), TVL from DefiLlama. Fetched
2026-11-10 12:47 UTC.

| Chain | Circ. mcap | Fees / yr | P/F | TVL | Mcap/TVL |
| --- | --- | --- | --- | --- | --- |
| Ethereum * | $254.95B | $201.95M | 1,262x | $41.47B | 6.1x |
| Solana | $50.05B | $275.78M | 181x | $5.04B | 9.9x |
| Sui | $3.43B | $1.72M | 1,992x | $430.13M | 8.0x |
| Aptos | $0.51B | $1.40M | 365x | $40.04M | 12.7x |
| NEAR * | $4.75B | $1.51M | 3,146x | $169.19M | 28.1x |
| NEAR, model basis | $4.52B | $1.44M | 3,135x | $169.19M | 26.7x |

\* CoinGecko reports circulating supply equal to total supply for this chain.
The "model basis" row uses NEARBlocks circulating supply and fees, as the rest
of the model does.

Peers disagree with each other: P/F runs from 181x (Solana) to
1,992x (Sui), median 814x. Mcap/TVL runs from 6.1x
(Ethereum) to 12.7x (Aptos), median 9.0x. NEAR is at
3,135x P/F (3.85x the median) and 26.7x Mcap/TVL (2.98x).

## Valuation
The band is the average of two lenses, each a live NEAR metric times a peer
multiple range. Bear uses peer low to peer median. Base uses the full peer
range. Bull assumes the market keeps paying NEAR's current premium, from peer
high up to NEAR's own multiple.

| Scenario | P/F | Mcap/TVL | Band | Midpoint |
| --- | --- | --- | --- | --- |
| Bear | 181x to 814x | 6.1x to 9.0x | $0.52 to $1.08 | $0.80 |
| Base | 181x to 1,992x | 6.1x to 12.7x | $0.52 to $2.01 | $1.26 |
| Bull | 1,992x to 3,135x | 12.7x to 26.7x | $2.01 to $3.62 | $2.81 |

A value-per-active-account lens is shown on the dashboard
($2.26 to $6.79 at $40K to $120K per account), but there is no
like-for-like public active-address series for the peers, so its multiples
are our assumption and it is kept out of the band.

NVT is excluded. NEARBlocks `txn_volume_usd` counts system, staking and refund
transfers, which gives an NVT of 0.066. That is not a usable signal.

### The testable part
A wide band will often contain the price, so "inside the band" proves little.
The useful question is where NEAR sits against named peers. At peer-median
multiples NEAR would be $1.08. At today's price, fees must grow about
3.85x for NEAR's P/F to reach the peer median. At the latest +22.6% QoQ rate in NEAR terms that is about 6.6 quarters. That is arithmetic, not a forecast.

## Other data
- **Staking.** 582.1M NEAR, 46.6% of circulating supply, across
  351 validators.
- **NEAR Intents volume.** $12.02B routed in the last 90 days, +83.4% QoQ
  (DefiLlama `near-intents` adapter). This is swap volume, not fees to NEAR.
- **NEAR Intents listed assets.** 216 assets across 39 chains listed by the 1Click API.
  This counts breadth, not usage.
- **Capital.** DeFi TVL is $169.19M.
- **Accounts and transactions.** 70.7K active accounts a day
  (-31.6% QoQ) and 739K transactions a day (-4.6% QoQ).

## What would change our mind
1. **Fees roll over.** QoQ fee growth in NEAR terms turns negative.
2. **The premium does not close.** NEAR's P/F stays near 3.85x the peer median
   for two quarters while price holds.
3. **Fees are concentrated.** Contract-level data shows most fees come from one
   or two apps or from bot loops.
4. **Staking falls.** Staked ratio drops below 40%, or the validator set shrinks
   materially.
5. **Intents stalls.** Routed volume falls for two quarters.
6. **Capital leaves.** TVL falls more than 30% while price holds.

## Reproduce
```bash
npm install
npm run build   # fetch live data, run model/thesis_model.py, write THESIS.md
npm run site    # static export to out/
```

Not financial advice.
