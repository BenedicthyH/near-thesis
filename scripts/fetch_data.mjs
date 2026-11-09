#!/usr/bin/env node
// Data-fetch layer for the NEAR Investment Thesis dashboard.
// Pulls ONLY from free, keyless public endpoints. Never invents numbers.
// One command rebuilds every dataset: `node scripts/fetch_data.mjs`
import { writeFile, mkdir } from 'node:fs/promises';

const OUT = new URL('../data/', import.meta.url);
const now = new Date().toISOString();

async function getJSON(url, opts = {}) {
  const res = await fetch(url, { headers: { 'accept': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function rpc(method, params) {
  return getJSON('https://rpc.mainnet.near.org', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
}

const sources = {};

// 1. NEARBlocks daily charts: full history of txns, active accounts, fees, supply, price.
async function nearblocksCharts() {
  const { charts } = await getJSON('https://api.nearblocks.io/v1/charts');
  const rows = charts.map(c => ({
    date: c.date.slice(0, 10),
    txns: Number(c.txns),
    active_accounts: Number(c.active_accounts),
    new_accounts: Number(c.new_accounts),
    active_contracts: Number(c.active_contracts),
    gas_fee_near: Number(c.gas_fee) / 1e24,
    txn_volume_usd: Number(c.txn_volume_usd),
    near_price: Number(c.near_price),
    market_cap: Number(c.market_cap),
    total_supply: Number(c.total_supply) / 1e24,
    circulating_supply: Number(c.circulating_supply) / 1e24,
  })).filter(r => r.date >= '2021-01-01');
  return { source: 'NEARBlocks /v1/charts', url: 'https://api.nearblocks.io/v1/charts', fetched_at: now, rows };
}

// 2. NEARBlocks network snapshot stats.
async function nearblocksStats() {
  const { stats } = await getJSON('https://api.nearblocks.io/v1/stats');
  return { source: 'NEARBlocks /v1/stats', url: 'https://api.nearblocks.io/v1/stats', fetched_at: now, data: stats[0] };
}

// 3. DefiLlama NEAR TVL history (keyless).
async function defillamaTVL() {
  const rows = await getJSON('https://api.llama.fi/v2/historicalChainTvl/Near');
  return {
    source: 'DefiLlama historicalChainTvl/Near',
    url: 'https://api.llama.fi/v2/historicalChainTvl/Near',
    fetched_at: now,
    rows: rows.map(r => ({ date: new Date(r.date * 1000).toISOString().slice(0, 10), tvl_usd: r.tvl })),
  };
}

// 4. Staking: total staked NEAR from validators RPC.
async function staking() {
  const { result } = await rpc('validators', [null]);
  const totalStaked = result.current_validators.reduce((a, v) => a + BigInt(v.stake), 0n);
  return {
    source: 'NEAR RPC validators',
    url: 'https://rpc.mainnet.near.org',
    fetched_at: now,
    data: {
      num_validators: result.current_validators.length,
      total_staked_near: Number(totalStaked / 10n ** 18n) / 1e6,
      epoch_height: result.epoch_height,
    },
  };
}

// 5. NEAR Intents supported assets (1Click public API, keyless).
async function intentsAssets() {
  const tokens = await getJSON('https://1click.chaindefuser.com/v0/tokens');
  const chains = [...new Set(tokens.map(t => t.blockchain))];
  const per_chain = {};
  for (const t of tokens) per_chain[t.blockchain] = (per_chain[t.blockchain] || 0) + 1;
  return {
    source: 'NEAR Intents 1Click /v0/tokens',
    url: 'https://1click.chaindefuser.com/v0/tokens',
    fetched_at: now,
    data: { asset_count: tokens.length, chains_supported: chains.length, chains, assets_per_chain: per_chain },
  };
}

const tasks = {
  'nearblocks_charts.json': nearblocksCharts,
  'nearblocks_stats.json': nearblocksStats,
  'defillama_tvl.json': defillamaTVL,
  'staking.json': staking,
  'intents_assets.json': intentsAssets,
};

await mkdir(OUT, { recursive: true });
for (const [file, fn] of Object.entries(tasks)) {
  try {
    const out = await fn();
    await writeFile(new URL(file, OUT), JSON.stringify(out, null, 2));
    const n = out.rows ? `${out.rows.length} rows` : 'snapshot';
    console.log(`OK  ${file.padEnd(24)} ${n}`);
  } catch (e) {
    console.error(`ERR ${file.padEnd(24)} ${e.message}`);
    process.exitCode = 1;
  }
}
console.log('Done. Datasets written to data/.');
