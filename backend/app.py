import re
import joblib
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load model assets
model = None
vectorizer = None
feature_names = None
try:
    model = joblib.load('backend/sentiment_model.pkl')
    vectorizer = joblib.load('backend/tfidf_vectorizer.pkl')
    feature_names = vectorizer.get_feature_names_out()
    print("Successfully loaded sentiment model and TF-IDF vectorizer.")
except Exception as e:
    print(f"Warning: Could not load pickles (expected if training has not run yet): {e}")

# Import shared NLP preprocessing
from preprocessing import preprocess_text

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' key in JSON payload"}), 400
        
        text = data['text']
        preprocessed = preprocess_text(text)
        
        # If text is empty after preprocessing, fallback gracefully to Neutral
        if not preprocessed.strip():
            return jsonify({
                "sentiment": "Neutral",
                "confidence": 0.5,
                "reason": "Inconclusive feedback or empty text input.",
                "important_words": []
            })
            
        # Transform and predict
        X_tfidf = vectorizer.transform([preprocessed])
        probs = model.predict_proba(X_tfidf)[0]
        
        pred_class_idx = np.argmax(probs)
        pred_class = model.classes_[pred_class_idx]
        confidence = float(probs[pred_class_idx])
        
        # Explainability: Calculate word feature contribution
        current_features = feature_names if feature_names is not None else vectorizer.get_feature_names_out()
        coef_c = model.coef_[pred_class_idx]
        
        contributions = []
        rows, cols = X_tfidf.nonzero()
        for col in cols:
            word = current_features[col]
            tfidf_val = X_tfidf[0, col]
            # Contribution is coefficient * tf-idf value
            val = float(coef_c[col] * tfidf_val)
            # Replace underscore for combined negation terms so they look clean to user
            display_word = word.replace('_', ' ')
            contributions.append((display_word, val))
            
        # Sort contributors by absolute magnitude of contribution
        contributions.sort(key=lambda x: abs(x[1]), reverse=True)
        important_words = [item[0] for item in contributions[:3]]
        
        # Generate structured reason based on contribution direction
        if pred_class == "Favourable":
            pos_indicators = [item[0] for item in contributions if item[1] > 0][:2]
            if pos_indicators:
                reason = f"Positive indicators detected: {', '.join(pos_indicators)}"
            else:
                reason = "Overall text structure aligns with Favourable sentiment."
        elif pred_class == "Unfavourable":
            neg_indicators = [item[0] for item in contributions if item[1] < 0][:2]
            if neg_indicators:
                reason = f"Negative indicators detected: {', '.join(neg_indicators)}"
            else:
                reason = "Overall text structure aligns with Unfavourable sentiment."
        else:
            reason = "Classified as Neutral due to mixed or balanced sentiment markers."
            
        return jsonify({
            "sentiment": pred_class,
            "confidence": round(confidence, 4),
            "reason": reason,
            "important_words": important_words
        })
        
    except Exception as e:
        return jsonify({"error": f"Inference failed: {str(e)}"}), 500

if __name__ == '__main__':
    # Start the server locally on port 5000
    app.run(host='0.0.0.0', port=5001, debug=True)
