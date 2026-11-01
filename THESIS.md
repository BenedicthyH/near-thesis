# NEAR Investment Thesis

> Every figure here is produced by `npm run build` from free, public, keyless
> sources (NEARBlocks, DefiLlama, NEAR RPC, NEAR Intents 1Click). Do not edit
> numbers by hand — re-run the pipeline. Snapshot generated 2026-11-01.

## The claim (one line)
**NEAR is a security-dense, chain-abstraction settlement layer whose durable,
multi-year usage underwrites long-term value — and at ~$4.38 it trades inside,
not below, a defensible fair-value band, so the thesis is "own the compounding
of real usage," not "it's cheap today."**

## Why NEAR, long term
NEAR's bull case does not rest on price. It rests on three things that are hard
to fake and that we can measure onchain:

1. **Security density.** 591.9M NEAR (**47.4% of circulating supply**) is staked
   across **373 validators**. A high staking ratio makes the chain expensive to
   attack and signals long holders, not mercenary float.
2. **Chain abstraction as distribution.** NEAR Intents can route **210 assets
   across 38 chains**. NEAR's wager is that users shouldn't care which chain they
   are on; Intents turns NEAR into a cross-chain settlement hub, so NEAR usage
   can grow even when the end asset isn't NEAR.
3. **A real, multi-year transaction base.** Daily transactions and active
   accounts have a years-long history (charted from 2021), not a single
   incentive spike — the floor of genuine demand for NEAR blockspace.

## Evidence FOR (all live)
- **Staking ratio 47.4%** across 373 validators — deep economic security.
- **Low, bounded inflation.** Total supply ~1.310B vs circulating ~1.250B; the
  supply chart shows a flat, predictable gap, not aggressive dilution.
- **Cross-chain reach**: 210 assets / 38 chains via NEAR Intents.
- **Persistent DeFi capital**: ~$200M TVL that has survived multiple cycles.
- **Sustained throughput**: ~738K txns/day (90d avg), a multi-year base.

## Evidence AGAINST (we show this on purpose)
- **Active accounts are falling.** 90-day average ≈ **71.9K/day, down ~33% vs the
  prior quarter.** This is the single biggest crack in the thesis and is front
  and center on the dashboard.
- **Transactions also softening**: 90d avg down ~6% QoQ — milder, but the same
  direction.
- **Thin fee capture.** Annualized gas fees ≈ **$1.73M**, a **price-to-fees ratio
  of ~3,315×** and a fee yield of just **~0.03%** of market cap. Today the token
  captures little of the activity it secures; the bull case needs fee capture (or
  Intents-driven demand) to grow into the valuation.
- **Mcap/TVL ~28.7×** is not screaming-cheap versus peer L1s.

## Valuation — a defensible range, not a prediction
We deliberately **exclude NVT**: NEARBlocks `txn_volume_usd` over-counts system,
staking and refund transfers (it implies an absurd NVT of ~0.09), so it is not a
clean economic signal. Instead we triangulate three independent peer-multiple
lenses on real metrics and take the **median band**:

| Lens | Basis | Fair range |
| --- | --- | --- |
| Fee multiple (P/F 2,000–6,000×) | $1.73M annual fees | $2.77–$8.32 |
| TVL multiple (Mcap/TVL 15–40×) | $200M TVL | $2.40–$6.40 |
| Active-user (mcap $40K–120K/active acct) | 71.9K active/day | $2.30–$6.90 |
| **Blended (median)** | | **$2.40–$6.90** |

Current price **$4.38 sits inside this band** → NEAR looks **roughly fairly
valued**, not a deep-value buy. The long-term return comes from the numerator
(fees, TVL, active users) compounding, which is exactly what the dashboard
tracks over time. The multiples live at the top of `model/thesis_model.py`; edit
them and re-run to stress-test your own assumptions.

## What would change our mind
- **Bearish:** active accounts AND transactions decline for 2+ more quarters, or
  Intents asset/chain coverage stalls while price rises (usage not backing price).
- **Bullish:** fee yield climbs toward peer-L1 levels (P/F compressing under
  ~1,000×), or Intents-routed volume and active accounts re-accelerate — either
  pushes the fair-value band above the current price.

## Reproduce this
```sh
npm install
npm run build   # fetch live data + recompute the model
npm run site    # build the static dashboard (out/)
```
Nothing is hard-coded. If a metric can't be computed from these keyless sources
it is omitted here rather than invented.
