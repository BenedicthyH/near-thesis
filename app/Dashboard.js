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
  const med = (a) => [...a].sort((x, y) => x - y)[1];
  const r2 = (x) => Math.round(x * 100) / 100;
  const L = {
    fee: S.pf.map((k) => r2(B.annual_fees_usd * k / B.circ_supply)),
    tvl: S.mt.map((k) => r2(B.tvl_usd * k / B.circ_supply)),
    usr: S.per_user.map((k) => r2(B.active_accounts * k / B.circ_supply)),
  };
  const sLo = med([L.fee[0], L.tvl[0], L.usr[0]]), sHi = med([L.fee[1], L.tvl[1], L.usr[1]]);
  const implied = r2((sLo + sHi) / 2), updown = implied / price - 1;
  const verdict = price < sLo ? 'below band: undervalued' : price > sHi ? 'above band: overvalued' : 'inside band: fair value';
  const baseWhere = price < lo ? 'below its fair-value band' : price > hi ? 'above its fair-value band' : 'inside its fair-value band';
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
            </div>
            <ol className="read">
              <li><b>What changed.</b> Active accounts {pct(m.adoption.active_accounts_growth_qoq)} QoQ, fees paid {pct(m.adoption.fees_growth_qoq)}, txns per account {pct(P.txns_per_account_growth_qoq)}. The accounts that stayed are using the chain harder and paying for it.</li>
              <li><b>What it is worth.</b> Three peer-multiple lenses put fair value at ${d2(lo)} to ${d2(hi)}. At ${d2(price)}, NEAR trades {baseWhere}. Fee capture is still thin ({(m.value_accrual.fee_yield_vs_mcap*100).toFixed(2)}% of market cap), so this is not a discount call.</li>
              <li><b>What would prove it wrong.</b> Fee growth turning negative, staking below 40% of supply, or NEAR Intents reach ({it.asset_count} assets, {it.chains_supported} chains) flat for two quarters.</li>
            </ol>
          </div>
          <div className="thesis">
            <b>Thesis.</b> Active accounts fell <b>{pct(m.adoption.active_accounts_growth_qoq)}</b> quarter over quarter. Fees paid rose <b>{pct(m.adoption.fees_growth_qoq)}</b>, a <b>{pct(m.security.staked_ratio).replace('+','')}</b> staking ratio held across {st.num_validators} validators, and NEAR Intents now routes <b>{it.asset_count} assets across {it.chains_supported} chains</b>. We read that as usage shifting from incentive farming to paid settlement. Fee capture is still small, so NEAR trades <b>{baseWhere}</b> (${d2(lo)} to ${d2(hi)} vs ${d2(price)}). The return case depends on paid usage growing, not on a discount today.
          </div>
          <div className="diverge">
            <div><span className="l">Active accounts QoQ</span><span className="num down">{pct(m.adoption.active_accounts_growth_qoq)}</span></div>
            <div><span className="l">Fees paid QoQ</span><span className={'num ' + (m.adoption.fees_growth_qoq >= 0 ? 'up' : 'down')}>{pct(m.adoption.fees_growth_qoq)}</span></div>
            <div><span className="l">Staked supply</span><span className="num up">{pct(m.security.staked_ratio).replace('+','')}</span></div>
            <div><span className="l">Intents reach</span><span className="num up">{it.asset_count} / {it.chains_supported} chains</span></div>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi"><div className="l">NEAR price</div><div className="v num">${d2(price)}</div><div className="d flat num">{usd(s.market_cap)} mcap</div></div>
          <div className="kpi"><div className="l">Active accts / day</div><div className="v num">{compact(m.adoption.active_accounts_90d_avg)}</div><div className={'d num ' + (aaDown ? 'down' : 'up')}>{pct(m.adoption.active_accounts_growth_qoq)} QoQ</div></div>
          <div className="kpi"><div className="l">Txns / day</div><div className="v num">{compact(m.adoption.txns_90d_avg)}</div><div className={'d num ' + (txDown ? 'down' : 'up')}>{pct(m.adoption.txns_growth_qoq)} QoQ</div></div>
          <div className="kpi"><div className="l">Staked supply</div><div className="v num">{pct(m.security.staked_ratio).replace('+','')}</div><div className="d flat num">{st.num_validators} validators</div></div>
          <div className="kpi"><div className="l">Intents reach</div><div className="v num">{it.asset_count}</div><div className="d flat num">{it.chains_supported} chains</div></div>
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
          <Chart id="fee" title="Gas fees paid (NEAR)" now={compact(m.value_accrual.annual_gas_fees_near) + ' Ⓝ / yr annualized'} color={GREEN}
            take={<>Used in valuation instead of USD transfer volume, which is overstated.<span className="cap">Bullish. Fees {pct(m.adoption.fees_growth_qoq)} QoQ while accounts fell.</span></>}
            src="api.nearblocks.io/v1/charts → gas_fee · weekly avg" rows={fees} fmt={(v) => compact(v)} />
          <Chart full id="fpa" title="Fees paid per active account (NEAR / day)" now={P.fee_near_per_active_account_day.toFixed(4) + ' Ⓝ · ' + pct(P.fee_per_account_growth_qoq) + ' QoQ'} color={GREEN}
            take={<>Derived: weekly gas fees divided by weekly active accounts. This is the core of the thesis.<span className="cap">Bullish. Each remaining account pays more. Watch whether total accounts stabilize.</span></>}
            src="api.nearblocks.io/v1/charts → gas_fee ÷ active_accounts · weekly avg, since 2023" rows={fpaRows} fmt={(v) => v.toFixed(3)} />
        </div>

        <div className="sec" id="network"><h2>Capital &amp; network security</h2></div>
        <div className="grid">
          <Chart id="tvl" title="DeFi TVL (USD)" now={usd(m.defi.tvl_usd) + ' · Mcap/TVL ' + m.defi.mcap_to_tvl + '×'} color={SLATE}
            take={<>Capital that has stayed through several market cycles.<span className="cap">Neutral. At Mcap/TVL of {m.defi.mcap_to_tvl}×, price already reflects it.</span></>}
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
            <h3>NEAR Intents reach</h3>
            <div className="metnow num">{it.asset_count} assets · {it.chains_supported} chains routable · {apc.near || 0} on NEAR, {it.asset_count - (apc.near || 0)} elsewhere</div>
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={chainBars} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="chain" {...axis} interval={0} angle={-45} textAnchor="end" height={48} fontSize={9} />
                <YAxis {...axis} width={28} allowDecimals={false} />
                <Tooltip {...tt} formatter={(v) => [v + ' assets', 'Routable']} />
                <Bar isAnimationActive={false} dataKey="v" fill={SLATE2} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="foot"><div className="take">NEAR settles swaps across chains, so usage can grow when the end asset isn't NEAR.<span className="cap">Bullish but unproven. Volume routed is the next thing to check.</span></div><div className="src">1click.chaindefuser.com/v0/tokens → assets per chain, top 16 of {it.chains_supported}</div></div>
          </div>
        </div>

        <div className="sec" id="valuation"><h2>Valuation</h2></div>
        <div className="grid">
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
            <h3>Fair value: three lenses</h3>
            <div className="metnow num">{scnLabel} fair range ${d2(sLo)} to ${d2(sHi)} · current ${d2(price)} · {verdict}</div>
            <div className="valbar">
              <div className="valrange" style={{ left: leftPct(sLo) + '%', width: (leftPct(sHi) - leftPct(sLo)) + '%' }} />
              <div className="valnow" style={{ left: leftPct(price) + '%' }}><span>now ${d2(price)}</span></div>
            </div>
            <div className="scale num"><span>$0</span><span>fair ${d2(sLo)} to ${d2(sHi)}</span><span>${scaleMax.toFixed(0)}</span></div>
            <div className="tscroll"><table className="lens">
              <thead><tr><th>Lens</th><th>Basis (live)</th><th>Multiple <span className="asm">assumption</span> ({scnLabel.toLowerCase()})</th><th>Fair range</th></tr></thead>
              <tbody>
                <tr><td>Fee multiple</td><td className="num">{usd(m.value_accrual.annual_gas_fees_usd)}/yr fees · now P/F {nf(m.value_accrual.price_to_fees_ratio)}×</td><td className="num">P/F {nf(S.pf[0])}-{nf(S.pf[1])}×</td><td className="rng num">${d2(L.fee[0])} to ${d2(L.fee[1])}</td></tr>
                <tr><td>TVL multiple</td><td className="num">{usd(m.defi.tvl_usd)} TVL · now {m.defi.mcap_to_tvl}×</td><td className="num">Mcap/TVL {S.mt[0]}-{S.mt[1]}×</td><td className="rng num">${d2(L.tvl[0])} to ${d2(L.tvl[1])}</td></tr>
                <tr><td>Active-user</td><td className="num">{compact(m.adoption.active_accounts_90d_avg)} active/day</td><td className="num">${compact(S.per_user[0])}-{compact(S.per_user[1])} / acct</td><td className="rng num">${d2(L.usr[0])} to ${d2(L.usr[1])}</td></tr>
              </tbody>
            </table></div>
            <div className="assume">
              <div className="assume-h">Assumptions, not data. Drag or type a multiple; band, implied price and verdict update instantly.</div>
              {[
                ['pf', 'Price-to-fees multiple', 100, 20000, 100, (v) => nf(v) + '×'],
                ['mt', 'Market-cap / TVL multiple', 1, 150, 1, (v) => v + '×'],
                ['per_user', 'Value per active user ($)', 1000, 400000, 1000, (v) => '$' + compact(v)],
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
            <div className="scnnote">Base = model defaults (blended ${d2(lo)} to ${d2(hi)}). Bear and Bull load preset multiples. All multiples are our assumptions, set from peer L1 ranges; the metrics they multiply are live data. A manual edit switches to Custom. Band, implied price and verdict recompute in the browser.</div>
            <div className="risks">
              <b>What would change our mind</b>
              <ul>
                <li><b>Fees roll over.</b> QoQ fee growth turns negative. The paid-usage claim fails.</li>
                <li><b>Security erodes.</b> Staked ratio falls below 40% (now {pct(m.security.staked_ratio).replace('+','')}) or the validator set shrinks materially.</li>
                <li><b>Intents stalls.</b> Supported assets/chains (now {it.asset_count}/{it.chains_supported}) stop growing for two quarters.</li>
                <li><b>Capital leaves.</b> DeFi TVL falls over 30% while price holds, pushing Mcap/TVL above the Bull multiple.</li>
              </ul>
            </div>
            <div className="caveat"><b>Method &amp; caveat.</b> The band is the median of three peer-multiple lenses applied to live metrics. It is a range, not a forecast (edit the multiples in <code>model/thesis_model.py</code> and re-run). NVT is excluded: NEARBlocks <code>txn_volume_usd</code> over-counts system and staking transfers (implying an unreliable NVT of {m.nvt_caveat.current_nvt}). The main bear case is thin fee capture. Fee yield is {(m.value_accrual.fee_yield_vs_mcap*100).toFixed(2)}% of market cap.</div>
          </div>
        </div>

        <div className="pageft">
          Model generated {m.generated_at}. QoQ = last 90 days ({m.adoption.window.last90[0]} to {m.adoption.window.last90[1]}) vs the 90 days before. Sources, fetched {charts.fetched_at.slice(0, 16).replace('T', ' ')} UTC: NEARBlocks, DefiLlama, NEAR RPC, NEAR Intents (1Click). All free and keyless. Rebuild with <code>npm run build</code>. NEAR HACKATHON, Investment Thesis track. Not financial advice.
        </div>
      </div>
    </>
  );
}
