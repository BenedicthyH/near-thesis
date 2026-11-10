#!/usr/bin/env python3
"""Writes THESIS.md from model/model_output.json so the write-up can never drift from the data."""
import json, os
ROOT = os.path.join(os.path.dirname(__file__), "..")
m = json.load(open(os.path.join(ROOT, "model", "model_output.json")))
A, P, VA, V, PR, I, IV = m["adoption"], m["per_account"], m["value_accrual"], m["valuation"], m["peers"], m["inputs"], m["intents_volume"]
B = V["basis"]
pct = lambda x: f"{x*100:+.1f}%"
pp = lambda x: f"{x*100:.1f}%"
usdM = lambda n: f"${n/1e6:.2f}M"
usdB = lambda n: f"${n/1e9:.2f}B"
usdC = lambda n: usdB(n) if n >= 1e9 else usdM(n)
px = lambda x: f"${x:.2f}"
price = I["price_usd"]
w = A["window"]
lo, hi = V["blended_fair_range_usd"]
where = "below" if price < lo else "above" if price > hi else "inside"

def band(s):
    f = [B["annual_fees_usd"] * k / B["circ_supply"] for k in s["pf"]]
    t = [B["tvl_usd"] * k / B["circ_supply"] for k in s["mt"]]
    return (f[0] + t[0]) / 2, (f[1] + t[1]) / 2

peer_lines = []
for r in PR["rows"]:
    star = " *" if r["circ_equals_total"] else ""
    f = lambda v, fn: fn(v) if v is not None else "n/a"
    peer_lines.append(f"| {r['name']}{star} | {f(r['circ_mcap_usd'], usdB)} | {f(r['annual_fees_usd'], usdM)} | "
                      f"{f(r['pf'], lambda v: f'{v:,.0f}x')} | {f(r['tvl_usd'], usdC)} | {f(r['mcap_tvl'], lambda v: f'{v:.1f}x')} |")
peer_lines.append(f"| NEAR, model basis | {usdB(I['circ_mcap_usd'])} | {usdM(VA['annual_gas_fees_usd'])} | {VA['price_to_fees_ratio']:,}x | {usdM(m['defi']['tvl_usd'])} | {m['defi']['mcap_to_tvl']}x |")

scen_lines = []
for k in ["bear", "base", "bull"]:
    s = V["scenarios"][k]; b = band(s)
    scen_lines.append(f"| {k.title()} | {s['pf'][0]:,}x to {s['pf'][1]:,}x | {s['mt'][0]}x to {s['mt'][1]}x | {px(b[0])} to {px(b[1])} | {px(sum(b)/2)} |")

q = V["quarters_at_current_fee_growth"]
qtxt = f" At the latest {pct(A['fees_growth_qoq'])} QoQ rate in NEAR terms that is about {q} quarters. That is arithmetic, not a forecast." if q else ""

txt = f"""# NEAR Investment Thesis

Every number below is written by `npm run build`, which pulls free, keyless
public APIs (NEARBlocks, DefiLlama, CoinGecko, NEAR RPC, NEAR Intents 1Click)
and then generates this file. Do not edit numbers by hand. Snapshot:
{m['generated_at']}. QoQ means the last 90 days ({w['last90'][0]} to
{w['last90'][1]}) against the 90 days before ({w['prev90'][0]} to {w['prev90'][1]}).

## Claim
Active accounts on NEAR fell {pp(-A['active_accounts_growth_qoq'])} QoQ. Gas fees paid rose
{pp(A['fees_growth_qoq'])} in NEAR terms. Fees paid per active account rose {pp(P['fee_per_account_growth_qoq'])}, from
{P['fee_near_per_active_account_day_prev']:.4f} to {P['fee_near_per_active_account_day']:.4f} NEAR a day, and transactions per account rose
{pp(P['txns_per_account_growth_qoq'])}. Fewer accounts are paying more.

The fee base is small: {usdM(VA['annual_gas_fees_usd'])} a year against a {usdB(I['circ_mcap_usd'])} circulating
market cap, a fee yield of {VA['fee_yield_vs_mcap']*100:.3f}%. On live peer fee and TVL multiples
(Ethereum, Solana, Sui, Aptos) NEAR would be worth {px(lo)} to {px(hi)}. At
{px(price)} it trades {where} that band, at a premium to every named peer. This
is not a discount call. The case rests on paid usage growing into the multiple.

## NEAR fees vs USD fees
| Measure | Prior 90d | Last 90d | QoQ |
| --- | --- | --- | --- |
| Fees, NEAR terms | {A['fees_near_prev90d']:,} NEAR | {A['fees_near_90d']:,} NEAR | {pct(A['fees_growth_qoq'])} |
| Fees, USD (daily fee x daily price) | {usdM(A['fees_usd_prev90d'])} | {usdM(A['fees_usd_90d'])} | {pct(A['fees_usd_growth_qoq'])} |
| Average NEAR price | {px(A['avg_price_prev90d'])} | {px(A['avg_price_90d'])} | {pct(A['avg_price_growth_qoq'])} |

The NEAR-denominated figure is the activity signal because the token's price
does not move it. USD fees rose more because NEAR itself rallied.

## Other readings
Accounts are not users. One person or bot can run many accounts, and one app
can drive most of the activity. The same numbers fit bots or farmers leaving
while a core keeps paying, or fees concentrating in a few heavy apps. The APIs
used here do not give fee share by contract, so we cannot rule that out yet.
Paid settlement is one reading of the data, not a proof.

## Supply basis
All ratios use circulating market cap: {px(price)} x {I['circulating_supply_near']/1e9:.3f}B circulating =
{usdB(I['circ_mcap_usd'])}. FDV is {px(price)} x {I['total_supply_near']/1e9:.3f}B total = {usdB(I['fdv_usd'])}, shown for
reference. NEARBlocks' `market_cap` field ({usdB(I['nearblocks_market_cap_field_usd'])}) matches FDV, so it is
not used in any ratio.

## Peer multiples (live)
Price and circulating market cap from CoinGecko, chain fees from DefiLlama
(L1 gas only, last 90 complete days annualized), TVL from DefiLlama. Fetched
{PR['fetched_at'][:16].replace('T', ' ')} UTC.

| Chain | Circ. mcap | Fees / yr | P/F | TVL | Mcap/TVL |
| --- | --- | --- | --- | --- | --- |
{chr(10).join(peer_lines)}

\\* CoinGecko reports circulating supply equal to total supply for this chain.
The "model basis" row uses NEARBlocks circulating supply and fees, as the rest
of the model does.

Peers disagree with each other: P/F runs from {PR['pf_range_ex_near'][0]:,}x ({PR['pf_range_names'][0]}) to
{PR['pf_range_ex_near'][2]:,}x ({PR['pf_range_names'][1]}), median {PR['pf_range_ex_near'][1]:,}x. Mcap/TVL runs from {PR['mt_range_ex_near'][0]}x
({PR['mt_range_names'][0]}) to {PR['mt_range_ex_near'][2]}x ({PR['mt_range_names'][1]}), median {PR['mt_range_ex_near'][1]}x. NEAR is at
{VA['price_to_fees_ratio']:,}x P/F ({PR['near_pf_vs_peer_median']}x the median) and {m['defi']['mcap_to_tvl']}x Mcap/TVL ({PR['near_mt_vs_peer_median']}x).

## Valuation
The band is the average of two lenses, each a live NEAR metric times a peer
multiple range. Bear uses peer low to peer median. Base uses the full peer
range. Bull assumes the market keeps paying NEAR's current premium, from peer
high up to NEAR's own multiple.

| Scenario | P/F | Mcap/TVL | Band | Midpoint |
| --- | --- | --- | --- | --- |
{chr(10).join(scen_lines)}

A value-per-active-account lens is shown on the dashboard
({px(V['lenses_usd']['active_user'][0])} to {px(V['lenses_usd']['active_user'][1])} at $40K to $120K per account), but there is no
like-for-like public active-address series for the peers, so its multiples
are our assumption and it is kept out of the band.

NVT is excluded. NEARBlocks `txn_volume_usd` counts system, staking and refund
transfers, which gives an NVT of {m['nvt_caveat']['current_nvt']}. That is not a usable signal.

### The testable part
A wide band will often contain the price, so "inside the band" proves little.
The useful question is where NEAR sits against named peers. At peer-median
multiples NEAR would be {px(V['price_at_peer_medians_usd'])}. At today's price, fees must grow about
{V['fee_multiple_needed_for_peer_median_pf']}x for NEAR's P/F to reach the peer median.{qtxt}

## Other data
- **Staking.** {m['security']['staked_near']/1e6:.1f}M NEAR, {pp(m['security']['staked_ratio'])} of circulating supply, across
  {m['security']['num_validators']} validators.
- **NEAR Intents volume.** {usdB(IV['volume_usd_90d'])} routed in the last 90 days, {pct(IV['volume_growth_qoq'])} QoQ
  (DefiLlama `near-intents` adapter). This is swap volume, not fees to NEAR.
- **NEAR Intents listed assets.** {json.load(open(os.path.join(ROOT,'data','intents_assets.json')))['data']['asset_count']} assets across {json.load(open(os.path.join(ROOT,'data','intents_assets.json')))['data']['chains_supported']} chains listed by the 1Click API.
  This counts breadth, not usage.
- **Capital.** DeFi TVL is {usdM(m['defi']['tvl_usd'])}.
- **Accounts and transactions.** {A['active_accounts_90d_avg']/1e3:.1f}K active accounts a day
  ({pct(A['active_accounts_growth_qoq'])} QoQ) and {A['txns_90d_avg']/1e3:.0f}K transactions a day ({pct(A['txns_growth_qoq'])} QoQ).

## What would change our mind
1. **Fees roll over.** QoQ fee growth in NEAR terms turns negative.
2. **The premium does not close.** NEAR's P/F stays near {PR['near_pf_vs_peer_median']}x the peer median
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
"""
open(os.path.join(ROOT, "THESIS.md"), "w").write(txt)
print("THESIS.md written")
