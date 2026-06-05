import urllib.request
import json

test_cases = [
    "food terrible but ambience good",
    "not good service",
    "not bad food",
    "never friendly employee",
    "very clean tables and amazing delicious hot food"
]

def run_tests():
    print("=== Testing Flask Sentiment API (POST /predict on Port 5001) ===")
    url = "http://localhost:5001/predict"
    
    for case in test_cases:
        print(f"\nInput Text: '{case}'")
        data = json.dumps({"text": case}).encode('utf-8')
        req = urllib.request.Request(
            url, 
            data=data, 
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                res_body = response.read().decode('utf-8')
                result = json.loads(res_body)
                print(f"Sentiment:       {result.get('sentiment')}")
                print(f"Confidence:      {result.get('confidence')}")
                print(f"Reason:          {result.get('reason')}")
                print(f"Important Words: {result.get('important_words')}")
        except Exception as e:
            print(f"❌ Request failed: {e}")

if __name__ == '__main__':
    run_tests()
