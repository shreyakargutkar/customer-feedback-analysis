const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../webapp/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function testAlter() {
  console.log("Trying common RPC names to execute SQL...");
  const rpcs = ['exec_sql', 'run_sql', 'sql', 'execute_sql'];
  for (const rpc of rpcs) {
    const { data, error } = await supabase.rpc(rpc, { sql: 'ALTER TABLE comments ADD COLUMN IF NOT EXISTS processed_text text;' });
    if (error) {
      console.log(`RPC ${rpc} failed:`, error.message);
    } else {
      console.log(`RPC ${rpc} succeeded!`, data);
      return;
    }
  }
}

testAlter();
