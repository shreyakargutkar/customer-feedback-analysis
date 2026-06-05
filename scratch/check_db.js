const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
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

if (!url || !serviceKey) {
  console.error("Missing keys!");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function check() {
  const { data, error } = await supabase.from('comments').select('*').limit(1);
  if (error) {
    console.error("Error fetching comments:", error);
  } else {
    console.log("Success! Columns in comment:", Object.keys(data[0] || {}));
  }
}

check();
