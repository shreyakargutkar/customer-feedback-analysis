const fs = require('fs');
const path = require('path');

const testCases = [
  {
    name: "Tied Indicators -> Neutral fallback",
    payload: {
      guest_name: "Test User NLP Tied",
      outlet_id: "7df7830b-9dfd-4950-8b17-a068a6fcf7c4",
      rating: 3,
      comment_text: "The food here was delicious, but we had to wait.", // delicious (+) vs wait (-) -> Tied (Neutral)
      phone: "1111111111",
      email: "tied@example.com"
    },
    expectedSentiment: "Neutral"
  },
  {
    name: "Positive > Negative -> Favourable fallback",
    payload: {
      guest_name: "Test User NLP Positive",
      outlet_id: "7df7830b-9dfd-4950-8b17-a068a6fcf7c4",
      rating: 5,
      comment_text: "Clean table, excellent food, and very friendly server!", // clean (+), excellent (+), friendly (+) -> Favourable
      phone: "2222222222",
      email: "positive@example.com"
    },
    expectedSentiment: "Favourable"
  },
  {
    name: "Negative > Positive -> Unfavourable fallback",
    payload: {
      guest_name: "Test User NLP Negative",
      outlet_id: "7df7830b-9dfd-4950-8b17-a068a6fcf7c4",
      rating: 1,
      comment_text: "Terrible service, dirty table, and extremely rude staff.", // terrible (-), dirty (-), rude (-) -> Unfavourable
      phone: "3333333333",
      email: "negative@example.com"
    },
    expectedSentiment: "Unfavourable"
  }
];

async function runApiTests() {
  console.log("=== RUNNING API FALLBACK INTEGRATION TESTS ===");

  for (const tc of testCases) {
    console.log(`\nTesting Case: "${tc.name}"`);
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
        console.error("❌ API Request failed:", JSON.stringify(json, null, 2));
        continue;
      }

      const comment = json.data;
      console.log(`Resolved Sentiment:  "${comment.sentiment}" (Expected: "${tc.expectedSentiment}")`);
      console.log(`Sentiment Confidence: ${comment.sentiment_confidence}`);
      console.log(`Sentiment Reason:     "${comment.sentiment_reason}"`);
      console.log(`Aspect Category:      "${comment.category}"`);

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

runApiTests();
