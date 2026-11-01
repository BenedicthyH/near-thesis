#!/usr/bin/env python3
"""Re-runnable NEAR valuation/adoption model.

Reads ONLY the datasets produced by scripts/fetch_data.mjs (real onchain data).
Never invents numbers. If an input is missing it says so and exits.

Outputs model/model_output.json with:
  - adoption trend (active accounts / txns growth)
  - fee-based value accrual (annualized gas fees, fee/mcap yield)
  - staking security ratio (staked / circulating)
  - a transparent, assumption-driven NVT-style fair-value band
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
last = rows[-1]
last90 = rows[-90:]
prev90 = rows[-180:-90]

def avg(xs, k): return statistics.mean(r[k] for r in xs)

# --- Adoption ---
aa_now, aa_prev = avg(last90, "active_accounts"), avg(prev90, "active_accounts")
tx_now, tx_prev = avg(last90, "txns"), avg(prev90, "txns")
aa_growth = (aa_now / aa_prev - 1) if aa_prev else None
tx_growth = (tx_now / tx_prev - 1) if tx_prev else None

# --- Fee value accrual ---
daily_fee_near = avg(last90, "gas_fee_near")
annual_fee_near = daily_fee_near * 365
price = float(stats["near_price"])
annual_fee_usd = annual_fee_near * price
mcap = float(stats["market_cap"])
fee_yield = annual_fee_usd / mcap if mcap else None

# --- Security / staking ---
circ = staking  # placeholder guard
circ_supply = float(stats["circulating_supply"]) / 1e24
staked = staking["total_staked_near"]
staked_ratio = staked / circ_supply if circ_supply else None

# --- NVT-style valuation band (transparent assumptions) ---
daily_vol_usd = avg(last90, "txn_volume_usd")
annual_vol_usd = daily_vol_usd * 365
# NVT = mcap / annual on-chain value transferred
nvt = mcap / annual_vol_usd if annual_vol_usd else None
# Fair-value band: apply a range of "fair" NVT multiples to current throughput.
fair_nvt_low, fair_nvt_high = 20, 60
fair_mcap_low = annual_vol_usd * fair_nvt_low
fair_mcap_high = annual_vol_usd * fair_nvt_high
fair_price_low = fair_mcap_low / circ_supply
fair_price_high = fair_mcap_high / circ_supply

out = {
    "generated_at": date.today().isoformat(),
    "inputs": {"price_usd": price, "market_cap_usd": mcap, "circulating_supply_near": circ_supply},
    "adoption": {
        "active_accounts_90d_avg": round(aa_now),
        "active_accounts_growth_qoq": round(aa_growth, 4) if aa_growth is not None else None,
        "txns_90d_avg": round(tx_now),
        "txns_growth_qoq": round(tx_growth, 4) if tx_growth is not None else None,
    },
    "value_accrual": {
        "annual_gas_fees_near": round(annual_fee_near),
        "annual_gas_fees_usd": round(annual_fee_usd),
        "fee_yield_vs_mcap": round(fee_yield, 6) if fee_yield else None,
    },
    "security": {
        "staked_near": round(staked),
        "circulating_near": round(circ_supply),
        "staked_ratio": round(staked_ratio, 4) if staked_ratio else None,
        "num_validators": staking["num_validators"],
    },
    "valuation_band_nvt": {
        "annual_onchain_volume_usd": round(annual_vol_usd),
        "current_nvt": round(nvt, 2) if nvt else None,
        "assumed_fair_nvt_range": [fair_nvt_low, fair_nvt_high],
        "fair_price_low_usd": round(fair_price_low, 2),
        "fair_price_high_usd": round(fair_price_high, 2),
        "current_price_usd": price,
    },
    "note": "Valuation band is assumption-driven (NVT multiples), not a prediction. Change the multiples in model/thesis_model.py to re-run with your own assumptions.",
}

op = os.path.join(os.path.dirname(__file__), "model_output.json")
json.dump(out, open(op, "w"), indent=2)
print(json.dumps(out, indent=2))
