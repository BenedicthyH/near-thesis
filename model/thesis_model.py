#!/usr/bin/env python3
"""Re-runnable NEAR valuation/adoption model.

Reads ONLY datasets produced by scripts/fetch_data.mjs (real onchain data).
Never invents numbers. Missing input -> it says so and exits.

Outputs model/model_output.json:
  - adoption trend (active accounts / txns, 90d vs prior 90d)
  - fee-based value accrual (annualized gas fees, P/F ratio, fee yield)
  - staking security ratio (staked / circulating)
  - DeFi TVL + Mcap/TVL
  - live peer multiples (Ethereum, Solana, Sui, Aptos) and a fair-value band built on them
  - one supply basis: circulating market cap for every ratio; FDV shown separately
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
peers = load("peers.json")
_iv = load("intents_volume.json")
ivol, ivol_src = _iv["rows"], _iv["source"]

rows = [r for r in charts if r["active_accounts"] is not None]
last90, prev90 = rows[-90:], rows[-180:-90]
def avg(xs, k): return statistics.mean(r[k] for r in xs)

price = float(stats["near_price"])
circ_supply = float(stats["circulating_supply"]) / 1e24
total_supply = float(stats["total_supply"]) / 1e24
# One supply basis for every ratio: circulating market cap = price x circulating supply.
# NEARBlocks' own market_cap field is price x TOTAL supply (fully diluted), so it is
# reported separately as FDV and never used in a ratio.
circ_mcap = price * circ_supply
fdv = price * total_supply

# --- Adoption ---
aa_now, aa_prev = avg(last90, "active_accounts"), avg(prev90, "active_accounts")
tx_now, tx_prev = avg(last90, "txns"), avg(prev90, "txns")
aa_growth = aa_now / aa_prev - 1
tx_growth = tx_now / tx_prev - 1
fee_growth = avg(last90, "gas_fee_near") / avg(prev90, "gas_fee_near") - 1

# Fees in USD: each day's NEAR fees x that day's NEAR price. Rises with the token price,
# so NEAR-denominated growth is the cleaner activity signal; USD is shown next to it.
def usd_fees(xs): return sum(r["gas_fee_near"] * r["near_price"] for r in xs)
fee_usd_now, fee_usd_prev = usd_fees(last90), usd_fees(prev90)
fee_usd_growth = fee_usd_now / fee_usd_prev - 1
px_now, px_prev = avg(last90, "near_price"), avg(prev90, "near_price")
px_growth = px_now / px_prev - 1

# --- Key insight: fees paid per active account (derived, no new inputs) ---
fpa_now = avg(last90, "gas_fee_near") / aa_now
fpa_prev = avg(prev90, "gas_fee_near") / aa_prev
fpa_growth = fpa_now / fpa_prev - 1
tpa_now, tpa_prev = tx_now / aa_now, tx_prev / aa_prev
tpa_growth = tpa_now / tpa_prev - 1

# --- Fee value accrual ---
daily_fee_near = avg(last90, "gas_fee_near")
annual_fee_near = daily_fee_near * 365
annual_fee_usd = annual_fee_near * price      # run-rate at today's price
pf_ratio = circ_mcap / annual_fee_usd          # price-to-fees on circulating mcap
fee_yield = annual_fee_usd / circ_mcap

# --- Security / staking ---
staked = staking["total_staked_near"]
staked_ratio = staked / circ_supply

# --- TVL ---
tvl_now = tvl[-1]["tvl_usd"]
mcap_tvl = circ_mcap / tvl_now

# --- NEAR Intents routed volume (DefiLlama), 90d vs prior 90d ---
iv = [r for r in ivol if r["date"] <= last90[-1]["date"]]
iv_last, iv_prev = iv[-90:], iv[-180:-90]
iv_now_sum = sum(r["volume_usd"] for r in iv_last)
iv_prev_sum = sum(r["volume_usd"] for r in iv_prev) if len(iv_prev) == 90 else None
iv_growth = (iv_now_sum / iv_prev_sum - 1) if iv_prev_sum else None

# --- Peer multiples (live: CoinGecko circulating mcap, DefiLlama chain fees + TVL) ---
peer_rows = []
for r in peers["rows"]:
    f = r.get("fees") or {}
    ann = f.get("annualized_usd")
    mc, t = r.get("circ_mcap_usd"), r.get("tvl_usd")
    peer_rows.append({
        "name": r["name"], "symbol": r["symbol"], "price_usd": r["price_usd"],
        "circ_mcap_usd": mc, "fdv_usd": r.get("fdv_usd"),
        "annual_fees_usd": ann, "fee_window": f.get("window"),
        "pf": (mc / ann) if (mc and ann) else None,
        "fee_yield": (ann / mc) if (mc and ann) else None,
        "tvl_usd": t, "mcap_tvl": (mc / t) if (mc and t) else None,
        "price_as_of": r.get("price_as_of"),
        "circ_equals_total": bool(r.get("circulating_supply") and r.get("total_supply")
                                  and abs(r["circulating_supply"] / r["total_supply"] - 1) < 0.001),
    })
comps = [r for r in peer_rows if r["name"] != "NEAR"]
pf_peers = sorted(r["pf"] for r in comps if r["pf"])
mt_peers = sorted(r["mcap_tvl"] for r in comps if r["mcap_tvl"])
if len(pf_peers) < 2 or len(mt_peers) < 2:
    raise SystemExit("Not enough live peer data to set multiples. Re-run `npm run fetch`.")
pf_min, pf_med, pf_max = pf_peers[0], statistics.median(pf_peers), pf_peers[-1]
mt_min, mt_med, mt_max = mt_peers[0], statistics.median(mt_peers), mt_peers[-1]
def name_of(rows, key, v): return next(r["name"] for r in rows if r[key] == v)

# --- Valuation ---
# Lens A (fees) and Lens B (TVL) take their multiples from the live peer set above.
#   Bear = peer low to peer median, Base = full peer range, Bull = peer high to NEAR's
#   own current multiple (the market keeps paying today's premium).
# Lens C (value per active account) has no like-for-like public peer series, so it is an
# unsourced assumption: shown and adjustable, but kept OUT of the fair-value band.
PER_USER_LOW, PER_USER_HIGH = 40000, 120000
scen = {
    "bear": {"pf": [pf_min, pf_med], "mt": [mt_min, mt_med], "per_user": [20000, 60000]},
    "base": {"pf": [pf_min, pf_max], "mt": [mt_min, mt_max], "per_user": [PER_USER_LOW, PER_USER_HIGH]},
    "bull": {"pf": [pf_max, max(pf_max, pf_ratio)], "mt": [mt_max, max(mt_max, mcap_tvl)], "per_user": [80000, 200000]},
}
for k in scen:
    scen[k]["pf"] = [round(x) for x in scen[k]["pf"]]
    scen[k]["mt"] = [round(x, 1) for x in scen[k]["mt"]]

def lens_px(basis, mult): return [round(basis * m / circ_supply, 2) for m in mult]
base = scen["base"]
lenses = {
    "fee_multiple": lens_px(annual_fee_usd, base["pf"]),
    "tvl_multiple": lens_px(tvl_now, base["mt"]),
    "active_user": lens_px(aa_now, base["per_user"]),
}
band_low = statistics.mean([lenses["fee_multiple"][0], lenses["tvl_multiple"][0]])
band_high = statistics.mean([lenses["fee_multiple"][1], lenses["tvl_multiple"][1]])
at_median = statistics.mean([annual_fee_usd * pf_med, tvl_now * mt_med]) / circ_supply

# Testable gap: fee growth needed, at today's price, for NEAR's P/F to reach the peer median.
fee_multiple_needed = pf_ratio / pf_med
import math
q_at_current_growth = (math.log(fee_multiple_needed) / math.log(1 + fee_growth)) if fee_growth > 0 and fee_multiple_needed > 1 else None

# Caveated NVT (kept for transparency, flagged unreliable).
daily_vol_usd = avg(last90, "txn_volume_usd")
annual_vol_usd = daily_vol_usd * 365
nvt = circ_mcap / annual_vol_usd

out = {
    "generated_at": date.today().isoformat(),
    "inputs": {"price_usd": price, "circ_mcap_usd": round(circ_mcap), "fdv_usd": round(fdv),
               "nearblocks_market_cap_field_usd": round(float(stats["market_cap"])),
               "circulating_supply_near": round(circ_supply),
               "total_supply_near": round(total_supply),
               "supply_note": "All ratios use circulating market cap (price x circulating supply). FDV = price x total supply, shown for reference. NEARBlocks' market_cap field matches FDV."},
    "adoption": {
        "active_accounts_90d_avg": round(aa_now),
        "active_accounts_growth_qoq": round(aa_growth, 4),
        "txns_90d_avg": round(tx_now),
        "txns_growth_qoq": round(tx_growth, 4),
        "fees_growth_qoq": round(fee_growth, 4),
        "fees_usd_growth_qoq": round(fee_usd_growth, 4),
        "fees_near_90d": round(sum(r["gas_fee_near"] for r in last90)),
        "fees_near_prev90d": round(sum(r["gas_fee_near"] for r in prev90)),
        "fees_usd_90d": round(fee_usd_now), "fees_usd_prev90d": round(fee_usd_prev),
        "avg_price_90d": round(px_now, 4), "avg_price_prev90d": round(px_prev, 4),
        "avg_price_growth_qoq": round(px_growth, 4),
        "window": {"last90": [last90[0]["date"], last90[-1]["date"]],
                   "prev90": [prev90[0]["date"], prev90[-1]["date"]]},
    },
    "per_account": {
        "fee_near_per_active_account_day": round(fpa_now, 6),
        "fee_near_per_active_account_day_prev": round(fpa_prev, 6),
        "fee_per_account_growth_qoq": round(fpa_growth, 4),
        "txns_per_active_account_day": round(tpa_now, 2),
        "txns_per_active_account_day_prev": round(tpa_prev, 2),
        "txns_per_account_growth_qoq": round(tpa_growth, 4),
    },
    "value_accrual": {
        "annual_gas_fees_near": round(annual_fee_near),
        "annual_gas_fees_usd": round(annual_fee_usd),
        "price_to_fees_ratio": round(pf_ratio),
        "fee_yield_vs_mcap": round(fee_yield, 6),
        "basis": "circulating market cap",
    },
    "security": {
        "staked_near": round(staked), "circulating_near": round(circ_supply),
        "staked_ratio": round(staked_ratio, 4), "num_validators": staking["num_validators"],
    },
    "defi": {"tvl_usd": round(tvl_now), "mcap_to_tvl": round(mcap_tvl, 1)},
    "intents_volume": {
        "volume_usd_90d": round(iv_now_sum),
        "volume_usd_prev90d": round(iv_prev_sum) if iv_prev_sum else None,
        "volume_growth_qoq": round(iv_growth, 4) if iv_growth is not None else None,
        "window": [iv_last[0]["date"], iv_last[-1]["date"]] if iv_last else None,
        "source": ivol_src,
    },
    "peers": {
        "rows": peer_rows,
        "pf_range_ex_near": [round(pf_min), round(pf_med), round(pf_max)],
        "pf_range_names": [name_of(comps, "pf", pf_min), name_of(comps, "pf", pf_max)],
        "mt_range_ex_near": [round(mt_min, 1), round(mt_med, 1), round(mt_max, 1)],
        "mt_range_names": [name_of(comps, "mcap_tvl", mt_min), name_of(comps, "mcap_tvl", mt_max)],
        "near_pf_vs_peer_median": round(pf_ratio / pf_med, 2),
        "near_mt_vs_peer_median": round(mcap_tvl / mt_med, 2),
        "fetched_at": peers["fetched_at"],
        "source": peers["source"],
    },
    "valuation": {
        "current_price_usd": price,
        "lenses_usd": lenses,
        "blended_fair_range_usd": [round(band_low, 2), round(band_high, 2)],
        "price_at_peer_medians_usd": round(at_median, 2),
        "fee_multiple_needed_for_peer_median_pf": round(fee_multiple_needed, 2),
        "quarters_at_current_fee_growth": round(q_at_current_growth, 1) if q_at_current_growth else None,
        "scenarios": scen,
        "basis": {"annual_fees_usd": annual_fee_usd, "tvl_usd": tvl_now, "active_accounts": aa_now, "circ_supply": circ_supply},
        "method": "Band = average of the fee lens and the TVL lens. Their multiples come from live peer data (Ethereum, Solana, Sui, Aptos). The active-account lens is an unsourced assumption, shown but excluded from the band. Not a forecast.",
    },
    "nvt_caveat": {
        "current_nvt": round(nvt, 3),
        "note": "NVT excluded from the fair-value range: NEARBlocks txn_volume_usd over-counts system/staking/refund transfers, so NVT is unreliable. Shown for transparency only.",
    },
}

op = os.path.join(os.path.dirname(__file__), "model_output.json")
json.dump(out, open(op, "w"), indent=2)
print(json.dumps(out, indent=2))
