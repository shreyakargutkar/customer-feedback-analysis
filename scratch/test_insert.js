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

async function testInsert() {
  const { data, error } = await supabase.from('comments').insert({
    guest_name: "Test NLP",
    outlet_id: "7df7830b-9dfd-4950-8b17-a068a6fcf7c4", // Let's check a valid outlet id or use null
    rating: "5",
    comment_text: "Clean table and good food",
    phone: "1234567890",
    email: "test@nlp.com",
    processed_text: "clean table good food",
    category: "cleanliness"
  }).select();

  console.log("Error:", error);
  console.log("Data:", data);
}

testInsert();
