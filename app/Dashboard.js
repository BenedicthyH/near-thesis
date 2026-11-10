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
const d2 = (x) => Number(x).toFixed(2);
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

function Chart({ full, id, title, now, take, src, rows, color = SLATE, area = true, fmt = compact }) {
  const gid = 'grad' + id;
  return (
    <div className={'card' + (full ? ' full' : '')}>
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
  const { charts, stats, tvl, staking, intents, ivol, model } = data;
  const s = stats.data, st = staking.data, it = intents.data, m = model;
  const price = Number(s.near_price);

  const tx = weekly(charts.rows, 'txns');
  const aa = weekly(charts.rows, 'active_accounts');
  const na = weekly(charts.rows, 'new_accounts');
  const fees = weekly(charts.rows, 'gas_fee_near');
  const feesUsd = weekly(charts.rows.map((r) => ({ date: r.date, fee_usd: r.gas_fee_near * r.near_price })), 'fee_usd');
  const ivRows = weekly(ivol.rows, 'volume_usd', '2025-01-01');
  const IV = m.intents_volume, I = m.inputs, PR = m.peers;
  const usdM = (n) => '$' + (n / 1e6).toFixed(2) + 'M';
  const usdB = (n) => '$' + (n / 1e9).toFixed(2) + 'B';
  const feeYield = (m.value_accrual.fee_yield_vs_mcap * 100).toFixed(3) + '%';
  const nearModel = { name: 'NEAR, model basis', model: true, price_usd: price, circ_mcap_usd: I.circ_mcap_usd, annual_fees_usd: m.value_accrual.annual_gas_fees_usd,
    pf: m.value_accrual.price_to_fees_ratio, fee_yield: m.value_accrual.fee_yield_vs_mcap, tvl_usd: m.defi.tvl_usd, mcap_tvl: m.defi.mcap_to_tvl };
  const peerTable = [...PR.rows, nearModel];
  const peerBars = (key) => peerTable.filter((r) => r[key] != null && r.name !== 'NEAR').map((r) => ({ n: r.model ? 'NEAR' : r.name, v: r[key], near: !!r.model }));
  const bil = (n) => (n / 1e9).toFixed(3) + 'B';
  const tvlRows = (() => { const r = tvl.rows.filter((x) => x.date >= '2021-07-01'); const o = []; for (let i = 0; i < r.length; i += 7) { const c = r.slice(i, i + 7); o.push({ date: c[c.length - 1].date, v: c.reduce((a, x) => a + x.tvl_usd, 0) / c.length }); } return o; })();
  const supply = charts.rows.filter((x) => x.date >= '2021-07-01').filter((_, i) => i % 7 === 0)
    .map((x) => ({ date: x.date, total: x.total_supply, circ: x.circulating_supply }));
  const apc = it.assets_per_chain || {};
  const chainBars = Object.entries(apc).sort((a, b) => b[1] - a[1]).slice(0, 16).map(([c, v]) => ({ chain: c.toUpperCase(), v }));
  const fpaRows = (() => { const f = weekly(charts.rows, 'gas_fee_near', '2023-01-01'), a = weekly(charts.rows, 'active_accounts', '2023-01-01');
    return f.map((x, i) => ({ date: x.date, v: a[i] && a[i].v ? x.v / a[i].v : null })).filter((x) => x.v != null); })();
  const P = m.per_account;

  const [lo, hi] = m.valuation.blended_fair_range_usd;
  const V = m.valuation, B = V.basis;
  const preset = (k) => ({ pf: [...V.scenarios[k].pf], mt: [...V.scenarios[k].mt], per_user: [...V.scenarios[k].per_user] });
  const [scn, setScn] = useState('base');
  const [S, setS] = useState(() => preset('base'));
  const pick = (k) => { setScn(k); setS(preset(k)); };
  const edit = (key, i, val) => {
    const v = Math.max(0, Number(val) || 0);
    setS((p) => { const n = { ...p, [key]: [...p[key]] }; n[key][i] = v;
      if (i === 0 && v > n[key][1]) n[key][1] = v; if (i === 1 && v < n[key][0]) n[key][0] = v; return n; });
    setScn('custom');
  };
  const scnLabel = scn === 'custom' ? 'Custom' : scn[0].toUpperCase() + scn.slice(1);
  const r2 = (x) => Math.round(x * 100) / 100;
  const L = {
    fee: S.pf.map((k) => r2(B.annual_fees_usd * k / B.circ_supply)),
    tvl: S.mt.map((k) => r2(B.tvl_usd * k / B.circ_supply)),
    usr: S.per_user.map((k) => r2(B.active_accounts * k / B.circ_supply)),
  };
  const sLo = r2((L.fee[0] + L.tvl[0]) / 2), sHi = r2((L.fee[1] + L.tvl[1]) / 2);
  const implied = r2((sLo + sHi) / 2), updown = implied / price - 1;
  const verdict = price < sLo ? 'below band: cheap vs these multiples' : price > sHi ? 'above band: premium to these multiples' : 'inside band';
  const baseWhere = price < lo ? 'below the peer-multiple band' : price > hi ? 'above the peer-multiple band' : 'inside the peer-multiple band';
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
        <span className="meta num">Data as of {m.generated_at} · keyless, re-runnable</span>
      </div></div>

      <div className="nav"><div className="nav-in">
        <a className="active" href="#overview">Overview</a>
        <a href="#usage">Usage</a>
        <a href="#network">Network</a>
        <a href="#valuation">Valuation</a>
      </div></div>

      <div className="wrap">
        <div className="hero" id="overview">
          <h1>Fewer NEAR accounts are paying more for blockspace.</h1>
          <p className="sub">A live read of NEAR usage, fees, capital and security, plus a valuation model you can re-run or adjust here. Every figure comes from free public APIs via one command. Nothing is typed in by hand.</p>
          <div className="insight">
            <div className="ins-k">
              <span className="l">Key insight · fees paid per active account, 90d vs prior 90d</span>
              <span className="big num up">{pct(P.fee_per_account_growth_qoq)}</span>
              <span className="ins-d num">{P.fee_near_per_active_account_day_prev.toFixed(4)} → {P.fee_near_per_active_account_day.toFixed(4)} Ⓝ per account per day</span>
              <span className="ins-base"><span className="l">Fee base, for scale</span><span className="num">{usdM(m.value_accrual.annual_gas_fees_usd)} / yr vs {usdB(I.circ_mcap_usd)} circ. mcap</span><span className="num">Fee yield {feeYield} · P/F {nf(m.value_accrual.price_to_fees_ratio)}×</span></span>
            </div>
            <ol className="read">
              <li><b>What changed.</b> Active accounts {pct(m.adoption.active_accounts_growth_qoq)} QoQ. Fees paid {pct(m.adoption.fees_growth_qoq)} in NEAR terms, the cleaner activity measure. In USD fees rose {pct(m.adoption.fees_usd_growth_qoq)}, mostly because NEAR's average price rose {pct(m.adoption.avg_price_growth_qoq)}. Txns per account {pct(P.txns_per_account_growth_qoq)}.</li>
              <li><b>What it costs.</b> The fee base is small: {usdM(m.value_accrual.annual_gas_fees_usd)} a year against {usdB(I.circ_mcap_usd)} circulating market cap. That is P/F {nf(m.value_accrual.price_to_fees_ratio)}× vs a {nf(PR.pf_range_ex_near[1])}× median for Ethereum, Solana, Sui and Aptos. On peer fee and TVL multiples NEAR would be worth ${d2(lo)} to ${d2(hi)}; at ${d2(price)} it trades {baseWhere}. Not a discount call.</li>
              <li><b>What would prove it wrong.</b> NEAR-denominated fee growth turning negative, staking below 40% of supply, or NEAR Intents routed volume falling for two quarters.</li>
            </ol>
          </div>
          <div className="others">
            <b>Other readings.</b> Accounts are not users: one person or bot can run many, and one app can drive most of the activity. The same numbers fit bots or farmers leaving while a core keeps paying, or fees concentrating in a few heavy apps. These APIs do not give fee share by contract, so we cannot yet rule that out. Paid settlement is one reading of the data, not a proof.
          </div>
          <div className="thesis">
            <b>Thesis.</b> Active accounts fell <b>{pct(m.adoption.active_accounts_growth_qoq)}</b> quarter over quarter while fees paid rose <b>{pct(m.adoption.fees_growth_qoq)}</b> in NEAR terms ({pct(m.adoption.fees_usd_growth_qoq)} in USD, helped by the token's own rally). Staking holds at <b>{pct(m.security.staked_ratio).replace('+','')}</b> of circulating supply across {st.num_validators} validators, and NEAR Intents routed <b>{usdB(IV.volume_usd_90d)}</b> in 90 days ({pct(IV.volume_growth_qoq)} QoQ, per DefiLlama). We read that as usage shifting toward paid settlement, with the caveats above. The fee base is still small, and on peer fee and TVL multiples NEAR trades <b>{baseWhere}</b> (${d2(lo)} to ${d2(hi)} vs ${d2(price)}). At today's price, fees would need to rise about <b>{V.fee_multiple_needed_for_peer_median_pf}×</b> for NEAR's P/F to reach the peer median. The return case depends on paid usage growing into the multiple, not on a discount today.
          </div>
          <div className="diverge">
            <div><span className="l">Active accounts QoQ</span><span className="num down">{pct(m.adoption.active_accounts_growth_qoq)}</span></div>
            <div><span className="l">Fees QoQ, in NEAR</span><span className={'num ' + (m.adoption.fees_growth_qoq >= 0 ? 'up' : 'down')}>{pct(m.adoption.fees_growth_qoq)}</span></div>
            <div><span className="l">Fees QoQ, in USD</span><span className={'num ' + (m.adoption.fees_usd_growth_qoq >= 0 ? 'up' : 'down')}>{pct(m.adoption.fees_usd_growth_qoq)}</span></div>
            <div><span className="l">Fees / yr vs circ. mcap</span><span className="num">{usdM(m.value_accrual.annual_gas_fees_usd)} · {feeYield}</span></div>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi"><div className="l">NEAR price</div><div className="v num">${d2(price)}</div><div className="d flat num">{usdB(I.circ_mcap_usd)} circ. mcap · {usdB(I.fdv_usd)} FDV</div></div>
          <div className="kpi"><div className="l">Active accts / day</div><div className="v num">{compact(m.adoption.active_accounts_90d_avg)}</div><div className={'d num ' + (aaDown ? 'down' : 'up')}>{pct(m.adoption.active_accounts_growth_qoq)} QoQ</div></div>
          <div className="kpi"><div className="l">Txns / day</div><div className="v num">{compact(m.adoption.txns_90d_avg)}</div><div className={'d num ' + (txDown ? 'down' : 'up')}>{pct(m.adoption.txns_growth_qoq)} QoQ</div></div>
          <div className="kpi"><div className="l">Staked supply</div><div className="v num">{pct(m.security.staked_ratio).replace('+','')}</div><div className="d flat num">{st.num_validators} validators</div></div>
          <div className="kpi"><div className="l">Intents volume, 90d</div><div className="v num">{usdB(IV.volume_usd_90d)}</div><div className={'d num ' + (IV.volume_growth_qoq >= 0 ? 'up' : 'down')}>{pct(IV.volume_growth_qoq)} QoQ · {it.asset_count} listed assets</div></div>
        </div>

        <div className="sec" id="usage"><h2>Network usage</h2></div>
        <div className="grid">
          <Chart id="tx" title="Transactions per day" now={compact(m.adoption.txns_90d_avg) + ' / day · 90d avg'} color={SLATE}
            take={<>Multi-year transaction base, not one incentive spike.<span className="cap">Neutral. Txns {pct(m.adoption.txns_growth_qoq)} QoQ, a smaller drop than accounts. Usage per account is up.</span></>}
            src="api.nearblocks.io/v1/charts → txns · weekly avg" rows={tx} />
          <Chart id="aa" title="Active accounts per day" now={compact(m.adoption.active_accounts_90d_avg) + ' / day · ' + pct(m.adoption.active_accounts_growth_qoq) + ' QoQ'} color={aaDown ? '#b45309' : SLATE}
            take={<>Down vs the prior quarter. This is the main headwind.<span className="cap">Bearish on its own. Read it next to fees.</span></>}
            src="api.nearblocks.io/v1/charts → active_accounts · weekly avg" rows={aa} />
          <Chart id="na" title="New accounts per day" now={compact(na[na.length-1].v) + ' latest wk'} color={SLATE}
            take={<>Onboarding. Spikes follow campaigns and app launches.<span className="cap">Neutral. The thesis does not depend on it.</span></>}
            src="api.nearblocks.io/v1/charts → new_accounts · weekly avg" rows={na} />
          <Chart id="fee" title="Gas fees paid (NEAR)" now={compact(m.value_accrual.annual_gas_fees_near) + ' Ⓝ / yr annualized · ' + pct(m.adoption.fees_growth_qoq) + ' QoQ'} color={GREEN}
            take={<>In NEAR terms, so the token's price does not move it. Used in valuation instead of USD transfer volume, which is overstated.<span className="cap">Bullish. Fees {pct(m.adoption.fees_growth_qoq)} QoQ in NEAR while accounts fell.</span></>}
            src="api.nearblocks.io/v1/charts → gas_fee · weekly avg" rows={fees} fmt={(v) => compact(v)} />
          <Chart id="feeusd" title="Gas fees paid (USD)" now={usdM(m.value_accrual.annual_gas_fees_usd) + ' / yr at $' + d2(price) + ' · ' + pct(m.adoption.fees_usd_growth_qoq) + ' QoQ'} color={SLATE}
            take={<>Each day's NEAR fees times that day's NEAR price.<span className="cap">Flattered by price. Average NEAR price was {pct(m.adoption.avg_price_growth_qoq)} QoQ (${d2(m.adoption.avg_price_prev90d)} to ${d2(m.adoption.avg_price_90d)}), so most of this rise is the token, not usage.</span></>}
            src="api.nearblocks.io/v1/charts → gas_fee × near_price · weekly avg" rows={feesUsd} fmt={(v) => '$' + compact(v)} />
          <Chart id="fpa" title="Fees paid per active account (NEAR / day)" now={P.fee_near_per_active_account_day.toFixed(4) + ' Ⓝ · ' + pct(P.fee_per_account_growth_qoq) + ' QoQ'} color={GREEN}
            take={<>Derived: weekly gas fees divided by weekly active accounts. This is the core of the thesis.<span className="cap">Bullish if real demand. Could also be bots leaving or a few heavy apps. Watch whether total accounts stabilize.</span></>}
            src="api.nearblocks.io/v1/charts → gas_fee ÷ active_accounts · weekly avg, since 2023" rows={fpaRows} fmt={(v) => v.toFixed(3)} />
        </div>

        <div className="sec" id="network"><h2>Capital &amp; network security</h2></div>
        <div className="grid">
          <Chart id="tvl" title="DeFi TVL (USD)" now={usd(m.defi.tvl_usd) + ' · Mcap/TVL ' + m.defi.mcap_to_tvl + '×'} color={SLATE}
            take={<>Capital that has stayed through several market cycles.<span className="cap">Bearish on valuation. Mcap/TVL is {m.defi.mcap_to_tvl}× on circulating mcap vs {PR.mt_range_ex_near[1]}× for the peer median.</span></>}
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
            <div className="foot"><div className="take">Total and circulating supply move in parallel. Inflation is low and predictable.<span className="cap">Neutral to bullish. No supply overhang.</span></div><div className="src">api.nearblocks.io/v1/charts → total_supply, circulating_supply</div></div>
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
            <div className="foot"><div className="take">{st.num_validators} validators. A high staking ratio raises the cost of attack.<span className="cap">Bullish. {pct(m.security.staked_ratio).replace('+','')} of supply is staked.</span></div><div className="src">rpc.mainnet.near.org → validators (sum of stake)</div></div>
          </div>

          <div className="card">
            <h3>NEAR Intents: listed assets (not volume)</h3>
            <div className="metnow num">{it.asset_count} listed assets · {it.chains_supported} chains · {apc.near || 0} on NEAR, {it.asset_count - (apc.near || 0)} elsewhere</div>
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={chainBars} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="chain" {...axis} interval={0} angle={-45} textAnchor="end" height={48} fontSize={9} />
                <YAxis {...axis} width={28} allowDecimals={false} />
                <Tooltip {...tt} formatter={(v) => [v + ' assets', 'Listed']} />
                <Bar isAnimationActive={false} dataKey="v" fill={SLATE2} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="foot"><div className="take">A count of assets the 1Click API lists as swappable, per chain. Breadth, not usage: it says nothing about how much is routed.<span className="cap">Neutral on its own. Routed volume is in the next chart.</span></div><div className="src">1click.chaindefuser.com/v0/tokens → listed assets per chain, top 16 of {it.chains_supported}</div></div>
          </div>
          <Chart full id="iv" title="NEAR Intents routed volume (USD / day)" now={usdB(IV.volume_usd_90d) + ' in 90d · ' + pct(IV.volume_growth_qoq) + ' QoQ'} color={TEAL}
            take={<>Swap volume settled through NEAR Intents, as counted by DefiLlama's adapter. This is volume, not fees: most of it does not show up in NEAR gas fees.<span className="cap">Bullish for the settlement reading. Volume {pct(IV.volume_growth_qoq)} QoQ ({usdB(IV.volume_usd_prev90d)} to {usdB(IV.volume_usd_90d)}).</span></>}
            src="api.llama.fi/summary/dexs/near-intents → dailyVolume · weekly avg, since 2025" rows={ivRows} fmt={(v) => '$' + compact(v)} />
        </div>

        <div className="sec" id="valuation"><h2>Valuation</h2></div>
        <div className="grid">
          <div className="card full">
            <h3>Peer multiples (live)</h3>
            <div className="metnow num">NEAR P/F {nf(m.value_accrual.price_to_fees_ratio)}× vs peer median {nf(PR.pf_range_ex_near[1])}× ({PR.near_pf_vs_peer_median}×) · Mcap/TVL {m.defi.mcap_to_tvl}× vs {PR.mt_range_ex_near[1]}× ({PR.near_mt_vs_peer_median}×)</div>
            <div className="tscroll"><table className="lens peers">
              <thead><tr><th>Chain</th><th>Price</th><th>Circ. mcap</th><th>Fees / yr</th><th>P/F</th><th>Fee yield</th><th>TVL</th><th>Mcap/TVL</th></tr></thead>
              <tbody>
                {peerTable.map((r) => (
                  <tr key={r.name} className={r.model ? 'me' : r.name === 'NEAR' ? 'me2' : ''}>
                    <td>{r.name}{r.circ_equals_total ? ' *' : ''}{r.model ? ' †' : ''}</td>
                    <td className="num">{r.price_usd != null ? '$' + (r.price_usd < 10 ? r.price_usd.toFixed(3) : nf(r.price_usd, 2)) : 'n/a'}</td>
                    <td className="num">{r.circ_mcap_usd != null ? '$' + compact(r.circ_mcap_usd) : 'n/a'}</td>
                    <td className="num">{r.annual_fees_usd != null ? '$' + compact(r.annual_fees_usd) : 'n/a'}</td>
                    <td className="num rng">{r.pf != null ? nf(r.pf) + '×' : 'n/a'}</td>
                    <td className="num">{r.fee_yield != null ? (r.fee_yield * 100).toFixed(3) + '%' : 'n/a'}</td>
                    <td className="num">{r.tvl_usd != null ? '$' + compact(r.tvl_usd) : 'n/a'}</td>
                    <td className="num rng">{r.mcap_tvl != null ? r.mcap_tvl.toFixed(1) + '×' : 'n/a'}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="peerch">
              {[['pf', 'P/F (circ. mcap ÷ annualized fees)', (v) => nf(v) + '×'], ['mcap_tvl', 'Mcap / TVL', (v) => v.toFixed(1) + '×']].map(([k, t, f]) => (
                <div key={k}>
                  <div className="pch-t">{t}</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={peerBars(k)} layout="vertical" margin={{ top: 2, right: 40, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={GRID} horizontal={false} />
                      <XAxis type="number" {...axis} tickFormatter={(v) => nf(v)} />
                      <YAxis type="category" dataKey="n" {...axis} width={64} />
                      <Tooltip {...tt} formatter={(v) => [f(v), t]} />
                      <Bar isAnimationActive={false} dataKey="v" radius={[0, 2, 2, 0]} maxBarSize={16}
                        label={{ position: 'right', fontSize: 10.5, fill: INK, formatter: f }}
                        shape={(p) => <rect x={p.x} y={p.y} width={p.width} height={p.height} fill={p.payload.near ? GREEN : SLATE2} rx={2} />} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
            <div className="foot"><div className="take">On both measures NEAR is the most expensive chain in this set. Peers disagree with each other too: P/F runs from {nf(PR.pf_range_ex_near[0])}× ({PR.pf_range_names[0]}) to {nf(PR.pf_range_ex_near[2])}× ({PR.pf_range_names[1]}), a spread of {Math.round(PR.pf_range_ex_near[2] / PR.pf_range_ex_near[0])}×, and Mcap/TVL from {PR.mt_range_ex_near[0]}× ({PR.mt_range_names[0]}) to {PR.mt_range_ex_near[2]}× ({PR.mt_range_names[1]}). We use that full range rather than tighten it.<span className="cap">Fees are DefiLlama chain fees (L1 gas only; Ethereum excludes its L2s), last 90 complete days annualized. * CoinGecko reports circulating supply equal to total supply for this chain. † The basis used everywhere else on this page: NEARBlocks circulating supply ({bil(I.circulating_supply_near)}) and NEARBlocks fees. The CoinGecko and DefiLlama row for NEAR is kept so every chain can be read on the same sources; the ranking is the same either way.</span></div><div className="src">CoinGecko /coins/markets (price, circulating mcap) · api.llama.fi/summary/fees/&#123;chain&#125; · api.llama.fi/v2/chains (TVL) · fetched {PR.fetched_at.slice(0, 16).replace('T', ' ')} UTC</div></div>
          </div>
          <div className="card full">
            <div className="scnbar">
              <span className="scnl">Scenario</span>
              <div className="seg" role="tablist">
                {['bear', 'base', 'bull'].map((k) => (
                  <button key={k} className={scn === k ? 'on' : ''} onClick={() => pick(k)}>{k[0].toUpperCase() + k.slice(1)}</button>
                ))}
              </div>
              {scn === 'custom' && <span className="tag">Custom</span>}
              <button className="reset" onClick={() => pick('base')}>Reset to Base</button>
              <span className="scnv num">Implied ${d2(implied)} · <span className={updown >= 0 ? 'up' : 'down'}>{pct(updown)}</span> vs ${d2(price)}</span>
            </div>
            <h3>Fair value at peer multiples</h3>
            <div className="metnow num">{scnLabel} fair range ${d2(sLo)} to ${d2(sHi)} · current ${d2(price)} · {verdict}</div>
            <div className="valbar">
              <div className="valrange" style={{ left: leftPct(sLo) + '%', width: (leftPct(sHi) - leftPct(sLo)) + '%' }} />
              <div className="valnow" style={{ left: leftPct(price) + '%' }}><span>now ${d2(price)}</span></div>
            </div>
            <div className="scale num"><span>$0</span><span>fair ${d2(sLo)} to ${d2(sHi)}</span><span>${scaleMax.toFixed(0)}</span></div>
            <div className="tscroll"><table className="lens">
              <thead><tr><th>Lens</th><th>Basis (live)</th><th>Multiple ({scnLabel.toLowerCase()})</th><th>Fair range</th></tr></thead>
              <tbody>
                <tr><td>Fee multiple</td><td className="num">{usd(m.value_accrual.annual_gas_fees_usd)}/yr fees · now P/F {nf(m.value_accrual.price_to_fees_ratio)}×</td><td className="num">P/F {nf(S.pf[0])}-{nf(S.pf[1])}× <span className="src-t">{scn === 'custom' ? 'custom' : 'peer data'}</span></td><td className="rng num">${d2(L.fee[0])} to ${d2(L.fee[1])}</td></tr>
                <tr><td>TVL multiple</td><td className="num">{usd(m.defi.tvl_usd)} TVL · now {m.defi.mcap_to_tvl}×</td><td className="num">Mcap/TVL {S.mt[0]}-{S.mt[1]}× <span className="src-t">{scn === 'custom' ? 'custom' : 'peer data'}</span></td><td className="rng num">${d2(L.tvl[0])} to ${d2(L.tvl[1])}</td></tr>
                <tr className="excl"><td>Active-account <span className="asm">unsourced, not in band</span></td><td className="num">{compact(m.adoption.active_accounts_90d_avg)} active/day</td><td className="num">${compact(S.per_user[0])}-{compact(S.per_user[1])} / acct <span className="asm">assumption</span></td><td className="num">${d2(L.usr[0])} to ${d2(L.usr[1])}</td></tr>
              </tbody>
            </table></div>
            <div className="assume">
              <div className="assume-h">Drag or type a multiple. Band, implied price and verdict update instantly. Fee and TVL presets come from peer data; anything you type is your assumption.</div>
              {[
                ['pf', 'Price-to-fees multiple', 100, 20000, 100, (v) => nf(v) + '×'],
                ['mt', 'Market-cap / TVL multiple', 1, 150, 1, (v) => v + '×'],
                ['per_user', 'Value per active account ($), unsourced', 1000, 400000, 1000, (v) => '$' + compact(v)],
              ].map(([k, label, min, max, step, f]) => (
                <div className="arow" key={k}>
                  <div className="al">{label}</div>
                  {[0, 1].map((i) => (
                    <label className="actl" key={i}>
                      <span className="ab">{i ? 'High' : 'Low'}</span>
                      <input type="range" min={min} max={max} step={step} value={S[k][i]} onChange={(e) => edit(k, i, e.target.value)} aria-label={label + (i ? ' high' : ' low')} />
                      <input type="number" className="num" min={min} step={step} value={S[k][i]} onChange={(e) => edit(k, i, e.target.value)} />
                      <span className="af num">{f(S[k][i])}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <div className="scnnote">Band = average of the fee lens and the TVL lens. Base uses the full peer range (P/F {nf(V.scenarios.base.pf[0])}-{nf(V.scenarios.base.pf[1])}×, Mcap/TVL {V.scenarios.base.mt[0]}-{V.scenarios.base.mt[1]}×), giving ${d2(lo)} to ${d2(hi)}. Bear uses peer low to peer median. Bull assumes the market keeps paying NEAR's current premium: peer high up to NEAR's own multiples. The active-account lens has no like-for-like public peer series, so it is shown but kept out of the band. A manual edit switches to Custom.</div>
            <div className="testable">
              <b>Why the band alone proves little.</b> A band this wide will often contain the price, so "inside the band" is weak evidence. The testable question is where NEAR sits against named peers. Today its P/F is <b>{PR.near_pf_vs_peer_median}×</b> the peer median and its Mcap/TVL <b>{PR.near_mt_vs_peer_median}×</b>. At peer-median multiples the price would be <b>${d2(V.price_at_peer_medians_usd)}</b>. At today's price, NEAR's fees need to grow about <b>{V.fee_multiple_needed_for_peer_median_pf}×</b> to reach the peer-median P/F{V.quarters_at_current_fee_growth ? <>; at the latest {pct(m.adoption.fees_growth_qoq)} QoQ rate in NEAR terms that takes about <b>{V.quarters_at_current_fee_growth} quarters</b> (arithmetic, not a forecast)</> : null}. If that gap stops closing, the thesis is wrong.
            </div>
            <div className="risks">
              <b>What would change our mind</b>
              <ul>
                <li><b>Fees roll over.</b> QoQ fee growth in NEAR terms turns negative. The paid-usage claim fails.</li>
                <li><b>The premium does not close.</b> NEAR's P/F stays near {PR.near_pf_vs_peer_median}× the peer median for two quarters while price holds. The market is paying for something other than fees.</li>
                <li><b>Fees are concentrated.</b> Contract-level data shows most fees come from one or two apps or from bot loops.</li>
                <li><b>Security erodes.</b> Staked ratio falls below 40% (now {pct(m.security.staked_ratio).replace('+','')}) or the validator set shrinks materially.</li>
                <li><b>Intents stalls.</b> Routed volume (now {usdB(IV.volume_usd_90d)} per 90 days) falls for two quarters.</li>
                <li><b>Capital leaves.</b> DeFi TVL falls over 30% while price holds, pushing Mcap/TVL further above every peer.</li>
              </ul>
            </div>
            <div className="caveat"><b>Method &amp; caveat.</b> Every ratio uses circulating market cap ({usdB(I.circ_mcap_usd)} = price × {bil(I.circulating_supply_near)} circulating). FDV ({usdB(I.fdv_usd)} = price × {bil(I.total_supply_near)} total) is shown for reference only; NEARBlocks' own market_cap field equals FDV, so it is not used. The band is the average of the fee and TVL lenses at live peer multiples. It is a range, not a forecast (the logic is in <code>model/thesis_model.py</code>). NVT is excluded: NEARBlocks <code>txn_volume_usd</code> over-counts system and staking transfers (implying an unreliable NVT of {m.nvt_caveat.current_nvt}). The main bear case is thin fee capture. Fee yield is {feeYield} of circulating market cap.</div>
          </div>
        </div>

        <div className="pageft">
          Model generated {m.generated_at}. QoQ = last 90 days ({m.adoption.window.last90[0]} to {m.adoption.window.last90[1]}) vs the 90 days before. Sources, fetched {charts.fetched_at.slice(0, 16).replace('T', ' ')} UTC: NEARBlocks, DefiLlama (TVL, chain fees, NEAR Intents volume), CoinGecko (peer prices and mcap), NEAR RPC, NEAR Intents 1Click. All free and keyless. Rebuild with <code>npm run build</code>. NEAR HACKATHON, Investment Thesis track. Not financial advice.
        </div>
      </div>
    </>
  );
}
