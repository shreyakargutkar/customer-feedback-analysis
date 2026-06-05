import { preprocessText, classifyAspect } from "../webapp/lib/nlp";

interface Test {
  input: string;
  expectedClean: string;
  expectedAspect: string;
  mustContain?: string[]; // Words that should be preserved/normalized
}

const tests: Test[] = [
  {
    input: "The services were very delayed and I had a long wait.",
    expectedClean: "service very delay long wait",
    expectedAspect: "waiting time",
    mustContain: ["very", "delay", "service", "wait"]
  },
  {
    input: "The food was amazing but the staff was rude!",
    expectedClean: "food amaz but staff rude",
    expectedAspect: "staff behaviour",
    mustContain: ["but", "food", "staff", "rude"]
  },
  {
    input: "I don't like the pricing. Too expensive!",
    expectedClean: "not like pric too expensive",
    expectedAspect: "pricing",
    mustContain: ["not", "pric", "too", "expensive"]
  },
  {
    input: "The table was extremely dirty and washrooms were messy.",
    expectedClean: "table extremely dirty washroom messy",
    expectedAspect: "cleanliness",
    mustContain: ["extremely", "dirty", "washroom", "messy"]
  },
  {
    input: "Clean tables and excellent employee attitude.",
    expectedClean: "clean table excellent employee attitude",
    expectedAspect: "staff behaviour",
    mustContain: ["clean", "table", "excellent", "employee", "attitude"]
  }
];

function runTests() {
  console.log("=== RUNNING NLP PIPELINE TESTS ===");
  let passed = 0;

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    console.log(`\nTest #${i + 1}: "${t.input}"`);
    
    const { cleanedText, tokens } = preprocessText(t.input);
    const aspect = classifyAspect(tokens, t.input);

    console.log(`Cleaned Text:  "${cleanedText}"`);
    console.log(`Tokens:        `, tokens);
    console.log(`Mapped Aspect: "${aspect}" (Expected: "${t.expectedAspect}")`);

    // Dynamic assertions based on test case requirements
    let casePassed = true;
    
    if (t.mustContain) {
      for (const word of t.mustContain) {
        if (!tokens.includes(word)) {
          console.log(`❌ Missing expected word in tokens: "${word}"`);
          casePassed = false;
        }
      }
    }

    if (aspect !== t.expectedAspect) {
      console.log(`❌ Aspect mismatch: got "${aspect}", expected "${t.expectedAspect}"`);
      casePassed = false;
    }

    if (casePassed) {
      console.log("✅ Passed");
      passed++;
    }
  }

  console.log(`\n=== RESULTS: ${passed}/${tests.length} tests passed ===`);
  if (passed !== tests.length) {
    process.exit(1);
  }
}

runTests();
