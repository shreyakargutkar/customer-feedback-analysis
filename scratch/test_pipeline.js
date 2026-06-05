// scratch/test_pipeline.js
// This test script registers ts-node to read the TypeScript nlp.ts utility directly.

try {
  require('ts-node').register({
    compilerOptions: {
      module: "CommonJS",
      target: "ES2022"
    }
  });
} catch (e) {
  console.log("ts-node not found locally, executing via npx...");
}

const { preprocessText, classifyAspect, fallbackSentiment, analyzeAspects, getMainAspect } = require('../webapp/lib/nlp.ts');

const preprocessingTests = [
  {
    input: "The services weren't expensive and employees are very friendly.",
    expectedClean: "service were not expensive employee very friendly",
    mustContain: ["not", "expensive", "employee", "very", "friendly"]
  },
  {
    input: "Never rude waiter but slow service.",
    expectedClean: "never rude waiter but slow service",
    mustContain: ["never", "rude", "waiter", "but", "slow", "service"]
  }
];

const sentimentNegationTests = [
  {
    input: "not good service",
    expectedSentiment: "Unfavourable"
  },
  {
    input: "not helpful staff",
    expectedSentiment: "Unfavourable"
  },
  {
    input: "never friendly employee",
    expectedSentiment: "Unfavourable"
  },
  {
    input: "not bad food",
    expectedSentiment: "Favourable"
  },
  {
    input: "not rude employee",
    expectedSentiment: "Favourable"
  }
];

const aspectDetectionTests = [
  {
    input: "food amazing but staff rude",
    expectedAspects: [
      { aspect: "food", sentiment: "Favourable" },
      { aspect: "staff behaviour", sentiment: "Unfavourable" }
    ],
    expectedMainAspect: "food"
  },
  {
    input: "waiting time was terrible and table was clean",
    expectedAspects: [
      { aspect: "waiting time", sentiment: "Unfavourable" },
      { aspect: "cleanliness", sentiment: "Favourable" }
    ],
    expectedMainAspect: "waiting time"
  }
];

function runTests() {
  console.log("=== RUNNING PREPROCESSING & CONTRACTION TESTS ===");
  let passed = 0;
  let total = 0;

  for (const t of preprocessingTests) {
    total++;
    console.log(`\nInput: "${t.input}"`);
    const { cleanedText, tokens } = preprocessText(t.input);
    console.log(`Cleaned: "${cleanedText}"`);
    let subPassed = true;
    for (const w of t.mustContain) {
      if (!tokens.includes(w)) {
        console.log(`❌ Missing expected token: "${w}"`);
        subPassed = false;
      }
    }
    if (subPassed) {
      console.log("✅ Passed");
      passed++;
    }
  }

  console.log("\n=== RUNNING NEGATION & SENTIMENT TESTS ===");
  for (const t of sentimentNegationTests) {
    total++;
    console.log(`\nInput: "${t.input}"`);
    const { tokens } = preprocessText(t.input);
    const res = fallbackSentiment(tokens);
    console.log(`Result: ${res.sentiment} (confidence: ${res.confidence})`);
    if (res.sentiment === t.expectedSentiment) {
      console.log("✅ Passed");
      passed++;
    } else {
      console.log(`❌ Failed: Expected ${t.expectedSentiment}, got ${res.sentiment}`);
    }
  }

  console.log("\n=== RUNNING ABSA MULTI-ASPECT DETECTION TESTS ===");
  for (const t of aspectDetectionTests) {
    total++;
    console.log(`\nInput: "${t.input}"`);
    const aspects = analyzeAspects(t.input);
    const mainAspect = getMainAspect(aspects);
    console.log("Extracted Aspects:", JSON.stringify(aspects, null, 2));
    console.log(`Main Aspect: "${mainAspect}" (Expected: "${t.expectedMainAspect}")`);

    let matchPassed = true;
    for (const exp of t.expectedAspects) {
      const match = aspects.find(a => a.aspect === exp.aspect);
      if (!match || match.sentiment !== exp.sentiment) {
        console.log(`❌ Expected aspect "${exp.aspect}" with sentiment "${exp.sentiment}" not matched correctly.`);
        matchPassed = false;
      }
    }

    if (mainAspect !== t.expectedMainAspect) {
      console.log(`❌ Main aspect mismatch: got "${mainAspect}", expected "${t.expectedMainAspect}"`);
      matchPassed = false;
    }

    if (matchPassed) {
      console.log("✅ Passed");
      passed++;
    }
  }

  console.log(`\n=== RESULTS: ${passed}/${total} tests passed ===`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
