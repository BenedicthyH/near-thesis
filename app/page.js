import fs from 'node:fs';
import path from 'node:path';
import Dashboard from './Dashboard';

function read(p) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), p), 'utf8'));
}

export default function Page() {
  const data = {
    charts: read('data/nearblocks_charts.json'),
    stats: read('data/nearblocks_stats.json'),
    tvl: read('data/defillama_tvl.json'),
    staking: read('data/staking.json'),
    intents: read('data/intents_assets.json'),
    ivol: read('data/intents_volume.json'),
    model: read('model/model_output.json'),
  };
  return <Dashboard data={data} />;
}
