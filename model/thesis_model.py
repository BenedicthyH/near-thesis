#!/usr/bin/env python3
"""Re-runnable NEAR valuation/adoption model.

Reads ONLY datasets produced by scripts/fetch_data.mjs (real onchain data).
Never invents numbers. Missing input -> it says so and exits.

Outputs model/model_output.json:
  - adoption trend (active accounts / txns, 90d vs prior 90d)
  - fee-based value accrual (annualized gas fees, P/F ratio, fee yield)
  - staking security ratio (staked / circulating)
  - DeFi TVL + Mcap/TVL
  - a DEFENSIBLE valuation range from 3 independent lenses, plus a caveated NVT
"""
import json, os, statistics
from datetime import date

DATA = os.path.join(os.path.dirname(__file__), "..", "data")

def load(name):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        raise SystemExit(f"Missing {name}. Run `npm run fetch` first.")
    return json.load(open(p))

charts = load("nearblocks_charts.json")["rows"]
stats = load("nearblocks_stats.json")["data"]
staking = load("staking.json")["data"]
tvl = load("defillama_tvl.json")["rows"]

rows = [r for r in charts if r["active_accounts"] is not None]
last90, prev90 = rows[-90:], rows[-180:-90]
def avg(xs, k): return statistics.mean(r[k] for r in xs)

price = float(stats["near_price"])
mcap = float(stats["market_cap"])
circ_supply = float(stats["circulating_supply"]) / 1e24
total_supply = float(stats["total_supply"]) / 1e24

# --- Adoption ---
aa_now, aa_prev = avg(last90, "active_accounts"), avg(prev90, "active_accounts")
tx_now, tx_prev = avg(last90, "txns"), avg(prev90, "txns")
aa_growth = aa_now / aa_prev - 1
tx_growth = tx_now / tx_prev - 1

# --- Fee value accrual (real economic demand for blockspace) ---
daily_fee_near = avg(last90, "gas_fee_near")
annual_fee_near = daily_fee_near * 365
annual_fee_usd = annual_fee_near * price
pf_ratio = mcap / annual_fee_usd            # price-to-fees (lower = cheaper)
fee_yield = annual_fee_usd / mcap

# --- Security / staking ---
staked = staking["total_staked_near"]
staked_ratio = staked / circ_supply

# --- TVL ---
tvl_now = tvl[-1]["tvl_usd"]
mcap_tvl = mcap / tvl_now

# --- Valuation: 3 defensible lenses (assumption-driven, NOT predictions) ---
# Lens A: Fee multiple. NEAR fees are a clean economic-activity proxy (not the
# inflated txn_volume_usd). Apply a peer L1 P/F band to current annualized fees.
PF_LOW, PF_HIGH = 2000, 6000   # mature-L1 P/F range (ETH/SOL historically 1k-8k)
valA_low = annual_fee_usd * PF_LOW / circ_supply
valA_high = annual_fee_usd * PF_HIGH / circ_supply
# Lens B: TVL multiple (Mcap/TVL). Peer L1s cluster ~10-40x in bull/bear.
MT_LOW, MT_HIGH = 15, 40
valB_low = tvl_now * MT_LOW / circ_supply
valB_high = tvl_now * MT_HIGH / circ_supply
# Lens C: user-based (mcap per 90d-active-account), peer band.
PER_USER_LOW, PER_USER_HIGH = 40000, 120000   # mcap $/active-account peer band
valC_low = aa_now * PER_USER_LOW / circ_supply
valC_high = aa_now * PER_USER_HIGH / circ_supply

lenses = {
    "fee_multiple": [round(valA_low, 2), round(valA_high, 2)],
    "tvl_multiple": [round(valB_low, 2), round(valB_high, 2)],
    "active_user": [round(valC_low, 2), round(valC_high, 2)],
}
lows = [valA_low, valB_low, valC_low]
highs = [valA_high, valB_high, valC_high]
blended_low = statistics.median(lows)
blended_high = statistics.median(highs)

# Caveated NVT (kept for transparency, flagged unreliable).
daily_vol_usd = avg(last90, "txn_volume_usd")
annual_vol_usd = daily_vol_usd * 365
nvt = mcap / annual_vol_usd

out = {
    "generated_at": date.today().isoformat(),
    "inputs": {"price_usd": price, "market_cap_usd": round(mcap),
               "circulating_supply_near": round(circ_supply),
               "total_supply_near": round(total_supply)},
    "adoption": {
        "active_accounts_90d_avg": round(aa_now),
        "active_accounts_growth_qoq": round(aa_growth, 4),
        "txns_90d_avg": round(tx_now),
        "txns_growth_qoq": round(tx_growth, 4),
    },
    "value_accrual": {
        "annual_gas_fees_near": round(annual_fee_near),
        "annual_gas_fees_usd": round(annual_fee_usd),
        "price_to_fees_ratio": round(pf_ratio),
        "fee_yield_vs_mcap": round(fee_yield, 6),
    },
    "security": {
        "staked_near": round(staked), "circulating_near": round(circ_supply),
        "staked_ratio": round(staked_ratio, 4), "num_validators": staking["num_validators"],
    },
    "defi": {"tvl_usd": round(tvl_now), "mcap_to_tvl": round(mcap_tvl, 1)},
    "valuation": {
        "current_price_usd": price,
        "lenses_usd": lenses,
        "blended_fair_range_usd": [round(blended_low, 2), round(blended_high, 2)],
        "method": "Median of 3 independent peer-multiple lenses (fees, TVL, active users). Assumption-driven, not a forecast. Edit the multiples at the top of model/thesis_model.py to re-run.",
    },
    "nvt_caveat": {
        "current_nvt": round(nvt, 3),
        "note": "NVT excluded from the fair-value range: NEARBlocks txn_volume_usd over-counts system/staking/refund transfers, so NVT is unreliable. Shown for transparency only.",
    },
}

op = os.path.join(os.path.dirname(__file__), "model_output.json")
json.dump(out, open(op, "w"), indent=2)
print(json.dumps(out, indent=2))
