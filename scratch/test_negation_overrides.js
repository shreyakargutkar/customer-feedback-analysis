const testCases = [
  {
    name: "not good service",
    payload: {
      guest_name: "Test Negation 1",
      outlet_id: "7df7830b-9dfd-4950-8b17-a068a6fcf7c4",
      rating: 2,
      comment_text: "not good service",
      phone: "9999999901",
      email: "negation1@example.com"
    },
    expectedSentiment: "Unfavourable"
  },
  {
    name: "not bad food",
    payload: {
      guest_name: "Test Negation 2",
      outlet_id: "7df7830b-9dfd-4950-8b17-a068a6fcf7c4",
      rating: 4,
      comment_text: "not bad food",
      phone: "9999999902",
      email: "negation2@example.com"
    },
    expectedSentiment: "Favourable"
  },
  {
    name: "never friendly employee",
    payload: {
      guest_name: "Test Negation 3",
      outlet_id: "7df7830b-9dfd-4950-8b17-a068a6fcf7c4",
      rating: 1,
      comment_text: "never friendly employee",
      phone: "9999999903",
      email: "negation3@example.com"
    },
    expectedSentiment: "Unfavourable"
  }
];

async function runTests() {
  console.log("=== RUNNING NEGATION-AWARE KEYWORD OVERRIDE INTEGRATION TESTS ===");
  
  for (const tc of testCases) {
    console.log(`\nTesting: "${tc.payload.comment_text}"`);
    try {
      const res = await fetch("http://localhost:3001/api/add-comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(tc.payload)
      });
      
      const json = await res.json();
      if (!res.ok || !json.ok) {
        console.error("❌ Request failed:", JSON.stringify(json, null, 2));
        continue;
      }
      
      const comment = json.data;
      console.log(`Resolved Sentiment:  "${comment.sentiment}" (Expected: "${tc.expectedSentiment}")`);
      console.log(`Sentiment Confidence: ${comment.sentiment_confidence}`);
      console.log(`Sentiment Reason:     "${comment.sentiment_reason}"`);
      console.log(`Log Positive Matches: ${JSON.stringify(comment.ai_reasoning.keyword_validation.positive_matches)}`);
      console.log(`Log Negative Matches: ${JSON.stringify(comment.ai_reasoning.keyword_validation.negative_matches)}`);
      
      if (comment.sentiment === tc.expectedSentiment) {
        console.log("✅ Passed");
      } else {
        console.error(`❌ Failed: Expected ${tc.expectedSentiment}, got ${comment.sentiment}`);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
    }
  }
}

runTests();
