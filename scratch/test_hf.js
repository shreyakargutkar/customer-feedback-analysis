const fs = require('fs');
const path = require('path');

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

async function testHF() {
  console.log("Testing Hugging Face connection...");
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: "The food here was very delicious, but we had to wait for 20 minutes." }),
    });
    const json = await res.json();
    console.log("Status:", res.status);
    console.log("JSON:", json);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testHF();
