'use client';
import { useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const GREEN = '#00ec97', SLATE = '#475569', SLATE2 = '#94a3b8', TEAL = '#17d9d4';
const GRID = '#eef0f2', AX = '#9aa3ad', INK = '#0b0d0e';

const nf = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const usd = (n) => '$' + nf(n);
const compact = (n) => {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return '' + Math.round(n);
};
const pct = (x) => (x >= 0 ? '+' : '') + (x * 100).toFixed(1) + '%';

function weekly(rows, key, start = '2021-07-01') {
  const r = rows.filter((x) => x.date >= start);
  const out = [];
  for (let i = 0; i < r.length; i += 7) {
    const chunk = r.slice(i, i + 7).filter((c) => c[key] != null);
    if (!chunk.length) continue;
    out.push({ date: chunk[chunk.length - 1].date, v: chunk.reduce((a, c) => a + c[key], 0) / chunk.length });
  }
  return out;
}

const axis = { stroke: AX, fontSize: 10.5, tickLine: false, axisLine: { stroke: GRID } };
const tt = { contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, color: INK, fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }, cursor: { stroke: '#cbd5e1', strokeWidth: 1 } };
const xTick = (d) => (typeof d === 'string' ? d.slice(2, 7) : d);

function Chart({ id, title, now, take, src, rows, color = SLATE, area = true, fmt = compact }) {
  const gid = 'grad' + id;
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="metnow num">{now}</div>
      <ResponsiveContainer width="100%" height={176}>
        {area ? (
          <AreaChart data={rows} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
            <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.14} /><stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient></defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={xTick} {...axis} minTickGap={44} />
            <YAxis tickFormatter={fmt} {...axis} width={42} />
            <Tooltip {...tt} formatter={(v) => [fmt(v), title]} labelFormatter={xTick} />
            <Area isAnimationActive={false} type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} fill={`url(#${gid})`} />
          </AreaChart>
        ) : (
          <LineChart data={rows} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={xTick} {...axis} minTickGap={44} />
            <YAxis tickFormatter={fmt} {...axis} width={42} />
            <Tooltip {...tt} formatter={(v) => [fmt(v), title]} labelFormatter={xTick} />
            <Line isAnimationActive={false} type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
      <div className="foot"><div className="take">{take}</div><div className="src">{src}</div></div>
    </div>
  );
}

export default function Dashboard({ data }) {
  const { charts, stats, tvl, staking, intents, model } = data;
  const s = stats.data, st = staking.data, it = intents.data, m = model;
  const price = Number(s.near_price);

  const tx = weekly(charts.rows, 'txns');
  const aa = weekly(charts.rows, 'active_accounts');
  const na = weekly(charts.rows, 'new_accounts');
  const fees = weekly(charts.rows, 'gas_fee_near');
  const tvlRows = (() => { const r = tvl.rows.filter((x) => x.date >= '2021-07-01'); const o = []; for (let i = 0; i < r.length; i += 7) { const c = r.slice(i, i + 7); o.push({ date: c[c.length - 1].date, v: c.reduce((a, x) => a + x.tvl_usd, 0) / c.length }); } return o; })();
  const supply = charts.rows.filter((x) => x.date >= '2021-07-01').filter((_, i) => i % 7 === 0)
    .map((x) => ({ date: x.date, total: x.total_supply, circ: x.circulating_supply }));
  const chainBars = [...it.chains].slice(0, 16).map((c) => ({ chain: c.toUpperCase(), v: 1 }));

  const [lo, hi] = m.valuation.blended_fair_range_usd;
  const [scn, setScn] = useState('base');
  const V = m.valuation, B = V.basis, S = V.scenarios[scn];
  const med = (a) => [...a].sort((x, y) => x - y)[1];
  const r2 = (x) => Math.round(x * 100) / 100;
  const L = {
    fee: S.pf.map((k) => r2(B.annual_fees_usd * k / B.circ_supply)),
    tvl: S.mt.map((k) => r2(B.tvl_usd * k / B.circ_supply)),
    usr: S.per_user.map((k) => r2(B.active_accounts * k / B.circ_supply)),
  };
  const sLo = med([L.fee[0], L.tvl[0], L.usr[0]]), sHi = med([L.fee[1], L.tvl[1], L.usr[1]]);
  const implied = r2((sLo + sHi) / 2), updown = implied / price - 1;
  const verdict = price < sLo ? 'below band — undervalued' : price > sHi ? 'above band — overvalued' : 'inside band — fairly valued';
  const scaleMax = Math.max(sHi, price) * 1.15;
  const leftPct = (x) => (x / scaleMax) * 100;
  const aaDown = m.adoption.active_accounts_growth_qoq < 0;
  const txDown = m.adoption.txns_growth_qoq < 0;

  return (
    <>
      <div className="topbar"><div className="topbar-in">
        <div className="brand">
          <img src="/near-wordmark.svg" alt="NEAR" />
          <span className="div" />
          <span className="prod">Investment Thesis</span>
        </div>
        <span className="tag">Research</span>
        <span className="spacer" />
        <span className="meta num">Updated {m.generated_at} · all data keyless &amp; reproducible</span>
      </div></div>

      <div className="nav"><div className="nav-in">
        <a className="active" href="#overview">Overview</a>
        <a href="#usage">Usage</a>
        <a href="#network">Network</a>
        <a href="#valuation">Valuation</a>
      </div></div>

      <div className="wrap">
        <div className="hero" id="overview">
          <h1>NEAR's settlement demand is decoupling from speculative growth.</h1>
          <p className="sub">An evidence-first investment thesis. Every figure is pulled live from free, public sources by one command — nothing is hand-typed, and anyone can re-run it.</p>
          <div className="thesis">
            <b>Thesis.</b> Active accounts fell <b>{pct(m.adoption.active_accounts_growth_qoq)}</b> quarter-over-quarter — yet fees paid <b>{pct(m.adoption.fees_growth_qoq)}</b>, a <b>{pct(m.security.staked_ratio).replace('+','')}</b> staking ratio held across {st.num_validators} validators, and NEAR Intents now routes <b>{it.asset_count} assets across {it.chains_supported} chains</b>. The tourists are leaving; the fee-paying settlement demand is staying. NEAR's value is decoupling from speculative account growth and anchoring to durable, chain-abstracted usage. With fee capture still thin, NEAR trades <b>inside its fair-value band</b> (${lo}–${hi} vs ${price}) — the return case is that sticky demand compounding, not a discount today.
          </div>
          <div className="diverge">
            <div><span className="l">Active accounts QoQ</span><span className="num down">{pct(m.adoption.active_accounts_growth_qoq)}</span></div>
            <div><span className="l">Fees paid QoQ</span><span className={'num ' + (m.adoption.fees_growth_qoq >= 0 ? 'up' : 'down')}>{pct(m.adoption.fees_growth_qoq)}</span></div>
            <div><span className="l">Staked supply</span><span className="num up">{pct(m.security.staked_ratio).replace('+','')}</span></div>
            <div><span className="l">Intents reach</span><span className="num up">{it.asset_count} / {it.chains_supported} chains</span></div>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi"><div className="l">NEAR price</div><div className="v num">${price}</div><div className="d flat num">{usd(s.market_cap)} mcap</div></div>
          <div className="kpi"><div className="l">Active accts / day</div><div className="v num">{compact(m.adoption.active_accounts_90d_avg)}</div><div className={'d num ' + (aaDown ? 'down' : 'up')}>{pct(m.adoption.active_accounts_growth_qoq)} QoQ</div></div>
          <div className="kpi"><div className="l">Txns / day</div><div className="v num">{compact(m.adoption.txns_90d_avg)}</div><div className={'d num ' + (txDown ? 'down' : 'up')}>{pct(m.adoption.txns_growth_qoq)} QoQ</div></div>
          <div className="kpi"><div className="l">Staked supply</div><div className="v num">{pct(m.security.staked_ratio).replace('+','')}</div><div className="d flat num">{st.num_validators} validators</div></div>
          <div className="kpi"><div className="l">Intents reach</div><div className="v num">{it.asset_count}</div><div className="d flat num">{it.chains_supported} chains</div></div>
        </div>

        <div className="sec" id="usage"><h2>Network usage</h2></div>
        <div className="grid">
          <Chart id="tx" title="Transactions per day" now={compact(m.adoption.txns_90d_avg) + ' / day · 90d avg'} color={SLATE}
            take="A broad, multi-year transaction base — raw demand for NEAR blockspace, not a single incentive spike."
            src="api.nearblocks.io/v1/charts → txns · weekly avg" rows={tx} />
          <Chart id="aa" title="Active accounts per day" now={compact(m.adoption.active_accounts_90d_avg) + ' / day · ' + pct(m.adoption.active_accounts_growth_qoq) + ' QoQ'} color={aaDown ? '#b45309' : SLATE}
            take="Down vs the prior quarter — the clearest headwind to the thesis, shown here rather than hidden."
            src="api.nearblocks.io/v1/charts → active_accounts · weekly avg" rows={aa} />
          <Chart id="na" title="New accounts per day" now={compact(na[na.length-1].v) + ' latest wk'} color={SLATE}
            take="Top-of-funnel onboarding onto NEAR; spikes track onboarding campaigns and app launches."
            src="api.nearblocks.io/v1/charts → new_accounts · weekly avg" rows={na} />
          <Chart id="fee" title="Gas fees paid (NEAR)" now={compact(m.value_accrual.annual_gas_fees_near) + ' Ⓝ / yr annualized'} color={GREEN}
            take="The clean economic-activity signal used in valuation — not the inflated USD transfer volume."
            src="api.nearblocks.io/v1/charts → gas_fee · weekly avg" rows={fees} fmt={(v) => compact(v)} />
        </div>

        <div className="sec" id="network"><h2>Capital &amp; network security</h2></div>
        <div className="grid">
          <Chart id="tvl" title="DeFi TVL (USD)" now={usd(m.defi.tvl_usd) + ' · Mcap/TVL ' + m.defi.mcap_to_tvl + '×'} color={SLATE}
            take="Capital that trusts the chain enough to stay, through multiple market cycles."
            src="api.llama.fi/v2/historicalChainTvl/Near · weekly avg" rows={tvlRows} fmt={(v) => '$' + compact(v)} />

          <div className="card">
            <h3>Token supply &amp; inflation</h3>
            <div className="metnow num">{compact(m.inputs?.circulating_supply_near || 0)} Ⓝ circulating of {compact(m.inputs?.total_supply_near || 0)} Ⓝ</div>
            <ResponsiveContainer width="100%" height={176}>
              <LineChart data={supply} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={xTick} {...axis} minTickGap={44} />
                <YAxis tickFormatter={compact} {...axis} width={42} domain={['auto', 'auto']} />
                <Tooltip {...tt} formatter={(v) => compact(v) + ' Ⓝ'} labelFormatter={xTick} />
                <Legend wrapperStyle={{ fontSize: 11, color: AX }} iconType="plainline" />
                <Line isAnimationActive={false} type="monotone" dataKey="total" name="Total" stroke={SLATE2} dot={false} strokeWidth={1.6} />
                <Line isAnimationActive={false} type="monotone" dataKey="circ" name="Circulating" stroke={SLATE} dot={false} strokeWidth={1.6} />
              </LineChart>
            </ResponsiveContainer>
            <div className="foot"><div className="take">A flat, predictable gap between total and circulating supply — low, bounded inflation for a long-term hold.</div><div className="src">api.nearblocks.io/v1/charts → total_supply, circulating_supply</div></div>
          </div>

          <div className="card">
            <h3>Staking security</h3>
            <div className="metnow num">{compact(m.security.staked_near)} Ⓝ staked · {pct(m.security.staked_ratio).replace('+','')} of circulating</div>
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={[{ n: 'Staked', v: m.security.staked_near }, { n: 'Circulating', v: m.security.circulating_near }]} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="n" {...axis} />
                <YAxis tickFormatter={compact} {...axis} width={42} />
                <Tooltip {...tt} formatter={(v) => compact(v) + ' Ⓝ'} />
                <Bar isAnimationActive={false} dataKey="v" fill={GREEN} radius={[3, 3, 0, 0]} maxBarSize={88} />
              </BarChart>
            </ResponsiveContainer>
            <div className="foot"><div className="take">{st.num_validators} validators secure the chain; a high staking ratio raises the economic cost to attack it.</div><div className="src">rpc.mainnet.near.org → validators (sum of stake)</div></div>
          </div>

          <div className="card">
            <h3>NEAR Intents reach</h3>
            <div className="metnow num">{it.asset_count} assets · {it.chains_supported} chains routable</div>
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={chainBars} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="chain" {...axis} interval={0} angle={-45} textAnchor="end" height={48} fontSize={9} />
                <YAxis hide />
                <Tooltip {...tt} formatter={() => 'supported'} />
                <Bar isAnimationActive={false} dataKey="v" fill={SLATE2} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="foot"><div className="take">Chain abstraction turns NEAR into a cross-chain settlement hub — usage can grow even when the end asset isn't NEAR.</div><div className="src">1click.chaindefuser.com/v0/tokens (first 16 of {it.chains_supported} chains)</div></div>
          </div>
        </div>

        <div className="sec" id="valuation"><h2>Valuation</h2></div>
        <div className="grid">
          <div className="card full">
            <div className="scnbar">
              <span className="scnl">Scenario</span>
              <div className="seg" role="tablist">
                {['bear', 'base', 'bull'].map((k) => (
                  <button key={k} className={scn === k ? 'on' : ''} onClick={() => setScn(k)}>{k[0].toUpperCase() + k.slice(1)}</button>
                ))}
              </div>
              <span className="scnv num">Implied ${implied} · <span className={updown >= 0 ? 'up' : 'down'}>{pct(updown)}</span> vs ${price}</span>
            </div>
            <h3>Fair value — three independent lenses</h3>
            <div className="metnow num">{scn[0].toUpperCase() + scn.slice(1)} fair range ${sLo}–${sHi} · current ${price} · {verdict}</div>
            <div className="valbar">
              <div className="valrange" style={{ left: leftPct(sLo) + '%', width: (leftPct(sHi) - leftPct(sLo)) + '%' }} />
              <div className="valnow" style={{ left: leftPct(price) + '%' }}><span>now ${price}</span></div>
            </div>
            <div className="scale num"><span>$0</span><span>fair ${sLo}–${sHi}</span><span>${scaleMax.toFixed(0)}</span></div>
            <div className="tscroll"><table className="lens">
              <thead><tr><th>Lens</th><th>Basis (live)</th><th>Multiple ({scn})</th><th>Fair range</th></tr></thead>
              <tbody>
                <tr><td>Fee multiple</td><td className="num">{usd(m.value_accrual.annual_gas_fees_usd)}/yr fees · now P/F {nf(m.value_accrual.price_to_fees_ratio)}×</td><td className="num">P/F {nf(S.pf[0])}–{nf(S.pf[1])}×</td><td className="rng num">${L.fee[0]}–${L.fee[1]}</td></tr>
                <tr><td>TVL multiple</td><td className="num">{usd(m.defi.tvl_usd)} TVL · now {m.defi.mcap_to_tvl}×</td><td className="num">Mcap/TVL {S.mt[0]}–{S.mt[1]}×</td><td className="rng num">${L.tvl[0]}–${L.tvl[1]}</td></tr>
                <tr><td>Active-user</td><td className="num">{compact(m.adoption.active_accounts_90d_avg)} active/day</td><td className="num">${compact(S.per_user[0])}–{compact(S.per_user[1])} / acct</td><td className="rng num">${L.usr[0]}–${L.usr[1]}</td></tr>
              </tbody>
            </table></div>
            <div className="scnnote">Base = model defaults (blended ${lo}–${hi}). Bear/Bull swap the peer multiples and recompute the median-of-lenses band live in your browser.</div>
            <div className="caveat"><b>Method &amp; caveat.</b> The band is the median of three peer-multiple lenses applied to live metrics — a defensible range, not a forecast (edit the multiples in <code>model/thesis_model.py</code> and re-run). NVT is deliberately excluded: NEARBlocks <code>txn_volume_usd</code> over-counts system and staking transfers (implying an unreliable NVT of {m.nvt_caveat.current_nvt}). The main bear case is thin fee capture — fee yield is just {(m.value_accrual.fee_yield_vs_mcap*100).toFixed(2)}% of market cap.</div>
          </div>
        </div>

        <div className="pageft">
          Model generated {m.generated_at}. Sources — NEARBlocks, DefiLlama, NEAR RPC, NEAR Intents (1Click) — all free &amp; keyless; rebuild everything with <code>npm run build</code>. Built at NEAR HACKATHON · track: thesis. Not financial advice.
        </div>
      </div>
    </>
  );
}
