import re
import joblib
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix, classification_report

# Import shared NLP preprocessing
from preprocessing import preprocess_text

# 2. Dataset Definition
training_data = [
    # --- FAVOURABLE ---
    {"text": "The food here was delicious and clean.", "sentiment": "Favourable"},
    {"text": "Excellent service and amazing staff!", "sentiment": "Favourable"},
    {"text": "Very fast delivery, satisfied with the portion.", "sentiment": "Favourable"},
    {"text": "Friendly waiters, nice atmosphere, delicious burger.", "sentiment": "Favourable"},
    {"text": "It was clean, fast, and friendly.", "sentiment": "Favourable"},
    {"text": "I love this place, it is awesome and fantastic.", "sentiment": "Favourable"},
    {"text": "Great value for money, highly recommend this outlet.", "sentiment": "Favourable"},
    {"text": "The employees are very friendly and polite.", "sentiment": "Favourable"},
    {"text": "Clean tables, helpful manager, and pleasant experience.", "sentiment": "Favourable"},
    {"text": "Perfect pizza and fresh hot ingredients.", "sentiment": "Favourable"},
    {"text": "not bad food", "sentiment": "Favourable"},
    {"text": "not rude employee", "sentiment": "Favourable"},
    {"text": "not dirty table", "sentiment": "Favourable"},
    {"text": "never slow service", "sentiment": "Favourable"},
    {"text": "no delay delivery", "sentiment": "Favourable"},
    {"text": "not terrible wait", "sentiment": "Favourable"},
    {"text": "extremely clean washroom", "sentiment": "Favourable"},
    {"text": "very professional cashier", "sentiment": "Favourable"},
    {"text": "really tasty chicken", "sentiment": "Favourable"},
    {"text": "super friendly waiters", "sentiment": "Favourable"},
    {"text": "happy with the cost, very affordable", "sentiment": "Favourable"},
    {"text": "delicious food and fast serve", "sentiment": "Favourable"},
    {"text": "wonderful staff behavior, so polite", "sentiment": "Favourable"},
    {"text": "clean tables and spotless floor", "sentiment": "Favourable"},
    {"text": "no rude waiters, very pleasant", "sentiment": "Favourable"},
    {"text": "the services are excellent", "sentiment": "Favourable"},
    {"text": "amazing taste and great cleanliness", "sentiment": "Favourable"},
    {"text": "the price is very cheap and value is awesome", "sentiment": "Favourable"},
    {"text": "they were not slow, fast delivery", "sentiment": "Favourable"},
    {"text": "never disappointed here, amazing food", "sentiment": "Favourable"},
    {"text": "perfect portions and friendly server", "sentiment": "Favourable"},
    {"text": "tasty appetizer, fresh salad, fast checkout", "sentiment": "Favourable"},
    {"text": "clean washroom and nice staff behavior", "sentiment": "Favourable"},
    {"text": "super clean table, fast order, delicious dessert", "sentiment": "Favourable"},
    {"text": "satisfied customer, highly recommend", "sentiment": "Favourable"},
    {"text": "delicious menu options and nice cost", "sentiment": "Favourable"},
    {"text": "not terrible service, actually quite pleasant", "sentiment": "Favourable"},
    {"text": "not expensive pricing, very cheap", "sentiment": "Favourable"},
    {"text": "happy dining experience", "sentiment": "Favourable"},
    {"text": "polite cashier and fast service quality", "sentiment": "Favourable"},
    {"text": "not dirty, very clean floor", "sentiment": "Favourable"},
    {"text": "never unfriendly, extremely welcoming", "sentiment": "Favourable"},
    {"text": "the manager is super helpful", "sentiment": "Favourable"},
    {"text": "delicious fresh hot pasta", "sentiment": "Favourable"},
    {"text": "highly satisfied with cleanliness and behavior", "sentiment": "Favourable"},
    {"text": "excellent behavior, delicious burger", "sentiment": "Favourable"},
    {"text": "fastest delivery and cheap bill", "sentiment": "Favourable"},
    {"text": "tasty dishes and welcoming staff", "sentiment": "Favourable"},
    {"text": "cleanliness was excellent and prices cost friendly", "sentiment": "Favourable"},
    {"text": "very happy with service quality and friendly behavior", "sentiment": "Favourable"},
    {"text": "The service here is fast and very polite.", "sentiment": "Favourable"},
    {"text": "Delicious fresh hot pizza, spotless cleanliness.", "sentiment": "Favourable"},
    {"text": "Friendly cashier, cheap prices, pleasant experience.", "sentiment": "Favourable"},
    {"text": "They have amazing taste and very professional cashiers.", "sentiment": "Favourable"},
    {"text": "Spotless tables and super friendly waiters.", "sentiment": "Favourable"},
    {"text": "Cost was very cheap and food portion satisfied.", "sentiment": "Favourable"},
    {"text": "not bad service quality", "sentiment": "Favourable"},
    {"text": "not dirty environment, highly recommend", "sentiment": "Favourable"},
    {"text": "never slow response, awesome server", "sentiment": "Favourable"},
    {"text": "delicious salad and great value for money", "sentiment": "Favourable"},
    {"text": "highly pleasant staff behavior and clean tables", "sentiment": "Favourable"},
    {"text": "best chicken portion and affordable billing", "sentiment": "Favourable"},
    {"text": "perfect fast delivery and fresh hot meal", "sentiment": "Favourable"},
    {"text": "friendly manager, spotless bathroom, awesome burger", "sentiment": "Favourable"},
    {"text": "excellent order accuracy, fast serves", "sentiment": "Favourable"},
    {"text": "super tasty appetizer, satisfied dining", "sentiment": "Favourable"},
    {"text": "very professional cashier, highly recommend", "sentiment": "Favourable"},
    {"text": "it was not slow at all, fast delivery", "sentiment": "Favourable"},
    {"text": "no mistakes on the order, delicious drink", "sentiment": "Favourable"},
    {"text": "very welcoming hosts, amazing pizza", "sentiment": "Favourable"},

    # --- UNFAVOURABLE ---
    {"text": "The service was slow and expensive.", "sentiment": "Unfavourable"},
    {"text": "Rude staff, dirty floor, terrible taste.", "sentiment": "Unfavourable"},
    {"text": "Disappointing experience, slow delivery, poor quality.", "sentiment": "Unfavourable"},
    {"text": "Horrible waiting time and dirty washrooms.", "sentiment": "Unfavourable"},
    {"text": "The bill was costly and food was cold.", "sentiment": "Unfavourable"},
    {"text": "not good service", "sentiment": "Unfavourable"},
    {"text": "not clean table", "sentiment": "Unfavourable"},
    {"text": "not helpful staff", "sentiment": "Unfavourable"},
    {"text": "never friendly server", "sentiment": "Unfavourable"},
    {"text": "no fresh ingredients", "sentiment": "Unfavourable"},
    {"text": "not delicious pizza", "sentiment": "Unfavourable"},
    {"text": "not happy with staff", "sentiment": "Unfavourable"},
    {"text": "bad experience slow wait", "sentiment": "Unfavourable"},
    {"text": "disaster dinner burnt meat", "sentiment": "Unfavourable"},
    {"text": "hate the food arrogant server", "sentiment": "Unfavourable"},
    {"text": "terrible taste and dirty plate", "sentiment": "Unfavourable"},
    {"text": "unprofessional cashier and late delivery", "sentiment": "Unfavourable"},
    {"text": "disappointing portion and wrong order", "sentiment": "Unfavourable"},
    {"text": "unfriendly behavior and messy floor", "sentiment": "Unfavourable"},
    {"text": "extremely rude manager and long queue", "sentiment": "Unfavourable"},
    {"text": "too expensive, not worth the money", "sentiment": "Unfavourable"},
    {"text": "horrible wait time, slow response", "sentiment": "Unfavourable"},
    {"text": "tasteless chicken, cold soup", "sentiment": "Unfavourable"},
    {"text": "dirty washroom, smelly table", "sentiment": "Unfavourable"},
    {"text": "never friendly, rude attitude", "sentiment": "Unfavourable"},
    {"text": "no clean forks, dirty environment", "sentiment": "Unfavourable"},
    {"text": "poor service quality and long delay", "sentiment": "Unfavourable"},
    {"text": "expensive cost, poor taste", "sentiment": "Unfavourable"},
    {"text": "worst dining experience ever", "sentiment": "Unfavourable"},
    {"text": "slowest waiters, terrible delay", "sentiment": "Unfavourable"},
    {"text": "not polite, very arrogant employees", "sentiment": "Unfavourable"},
    {"text": "not clean restroom, dirty trash", "sentiment": "Unfavourable"},
    {"text": "unhappy with expensive bill and slow delivery", "sentiment": "Unfavourable"},
    {"text": "they forgot my drink and wrong burger", "sentiment": "Unfavourable"},
    {"text": "messy order, incorrect receipt", "sentiment": "Unfavourable"},
    {"text": "unhygienic table, flies everywhere", "sentiment": "Unfavourable"},
    {"text": "disappointed with slow serving time", "sentiment": "Unfavourable"},
    {"text": "terrible slow service, rude waiter", "sentiment": "Unfavourable"},
    {"text": "costly menu, tasteless dessert", "sentiment": "Unfavourable"},
    {"text": "no response from staff, waiting forever", "sentiment": "Unfavourable"},
    {"text": "never helpful, very unprofessional", "sentiment": "Unfavourable"},
    {"text": "bad billing mistake, overcharged me", "sentiment": "Unfavourable"},
    {"text": "cold food, poor service behavior", "sentiment": "Unfavourable"},
    {"text": "dirty floor and arrogant staff member", "sentiment": "Unfavourable"},
    {"text": "terrible delay and poor food portion", "sentiment": "Unfavourable"},
    {"text": "expensive and slow delivery mistakes", "sentiment": "Unfavourable"},
    {"text": "unhygienic bathroom and dirty tables", "sentiment": "Unfavourable"},
    {"text": "horrible taste, disappointed in quality", "sentiment": "Unfavourable"},
    {"text": "not fresh food, very bad taste", "sentiment": "Unfavourable"},
    {"text": "unfriendly behavior, terrible waiting", "sentiment": "Unfavourable"},
    {"text": "Rude behavior, dirty washrooms, terribly late.", "sentiment": "Unfavourable"},
    {"text": "Poor portion sizes and costly bill.", "sentiment": "Unfavourable"},
    {"text": "Messy tables, flies everywhere, arrogant servers.", "sentiment": "Unfavourable"},
    {"text": "Disappointing slow delivery and cold cold food.", "sentiment": "Unfavourable"},
    {"text": "not good staff behavior", "sentiment": "Unfavourable"},
    {"text": "not fresh fish, very terrible wait", "sentiment": "Unfavourable"},
    {"text": "never polite cashier, very unprofessional", "sentiment": "Unfavourable"},
    {"text": "no clean plates, dirty floor", "sentiment": "Unfavourable"},
    {"text": "bad taste, overpriced Cost, slow wait", "sentiment": "Unfavourable"},
    {"text": "expensive pricing and poor taste quality", "sentiment": "Unfavourable"},
    {"text": "terrible customer care and late delay", "sentiment": "Unfavourable"},
    {"text": "horrible waiting time, rude server attitude", "sentiment": "Unfavourable"},
    {"text": "wrong order details, messy packaging", "sentiment": "Unfavourable"},
    {"text": "arrogant staff, costly billing errors", "sentiment": "Unfavourable"},
    {"text": "disappointed with the slow service and dirty restroom", "sentiment": "Unfavourable"},
    {"text": "tasteless food, expensive receipt", "sentiment": "Unfavourable"},
    {"text": "it was slow, overpriced, and poor portion", "sentiment": "Unfavourable"},
    {"text": "no helpful employee, horrible wait", "sentiment": "Unfavourable"},
    {"text": "never friendly waiters, terrible hygiene", "sentiment": "Unfavourable"},

    # --- NEUTRAL ---
    {"text": "food delicious but slow service", "sentiment": "Neutral"},
    {"text": "clean table but rude waiter", "sentiment": "Neutral"},
    {"text": "expensive but excellent taste", "sentiment": "Neutral"},
    {"text": "friendly staff but cold food", "sentiment": "Neutral"},
    {"text": "average quality normal pricing", "sentiment": "Neutral"},
    {"text": "nothing special just okay", "sentiment": "Neutral"},
    {"text": "food was alright waiting was normal", "sentiment": "Neutral"},
    {"text": "it was okay, not bad but not great either", "sentiment": "Neutral"},
    {"text": "tolerable service nothing to complain", "sentiment": "Neutral"},
    {"text": "table clean but wait time long", "sentiment": "Neutral"},
    {"text": "cheap pricing but taste average", "sentiment": "Neutral"},
    {"text": "average food, friendly employees", "sentiment": "Neutral"},
    {"text": "the place is okay, service is decent", "sentiment": "Neutral"},
    {"text": "normal wait time, standard taste", "sentiment": "Neutral"},
    {"text": "ambience good but cost is high", "sentiment": "Neutral"},
    {"text": "rude staff but delicious pizza", "sentiment": "Neutral"},
    {"text": "clean room but slow checkout", "sentiment": "Neutral"},
    {"text": "tasty food but long waiting queue", "sentiment": "Neutral"},
    {"text": "cheap bill but food was cold", "sentiment": "Neutral"},
    {"text": "not bad but not excellent", "sentiment": "Neutral"},
    {"text": "it was fine, nothing special", "sentiment": "Neutral"},
    {"text": "average behavior from cashiers", "sentiment": "Neutral"},
    {"text": "service was decent, taste average", "sentiment": "Neutral"},
    {"text": "table was clean but restroom was messy", "sentiment": "Neutral"},
    {"text": "portions were normal, cost okay", "sentiment": "Neutral"},
    {"text": "decent experience, average price", "sentiment": "Neutral"},
    {"text": "not slow but not fast either", "sentiment": "Neutral"},
    {"text": "tasty burger but wait was 20 minutes", "sentiment": "Neutral"},
    {"text": "service was okay, food alright", "sentiment": "Neutral"},
    {"text": "cleanliness was fine, pricing was average", "sentiment": "Neutral"},
    {"text": "neither good nor bad, just normal", "sentiment": "Neutral"},
    {"text": "friendly cashier but they forgot my receipt", "sentiment": "Neutral"},
    {"text": "standard service quality and normal portions", "sentiment": "Neutral"},
    {"text": "the order was correct but took some time", "sentiment": "Neutral"},
    {"text": "not clean but not super dirty", "sentiment": "Neutral"},
    {"text": "not terrible food but not delicious", "sentiment": "Neutral"},
    {"text": "pricing was affordable but wait was long", "sentiment": "Neutral"},
    {"text": "friendly staff but table was sticky", "sentiment": "Neutral"},
    {"text": "okay food, cost was fine", "sentiment": "Neutral"},
    {"text": "decent behavior and average cleanliness", "sentiment": "Neutral"},
    {"text": "nothing to write home about, just ok", "sentiment": "Neutral"},
    {"text": "the bill was cheap but service slow", "sentiment": "Neutral"},
    {"text": "decent food, okay wait time", "sentiment": "Neutral"},
    {"text": "average dining service and normal bill", "sentiment": "Neutral"},
    {"text": "cleanliness ok, taste fine", "sentiment": "Neutral"},
    {"text": "satisfactory but could be improved", "sentiment": "Neutral"},
    {"text": "not slow service, but cold fries", "sentiment": "Neutral"},
    {"text": "average pricing, decent portions", "sentiment": "Neutral"},
    {"text": "not rude, but not particularly friendly", "sentiment": "Neutral"},
    {"text": "wait time was average, taste okay", "sentiment": "Neutral"},
    {"text": "food okay but expensive", "sentiment": "Neutral"},
    {"text": "good food but slow wait", "sentiment": "Neutral"},
    {"text": "clean place but expensive bill", "sentiment": "Neutral"},
    {"text": "waiter rude but dessert delicious", "sentiment": "Neutral"},
    {"text": "service average but cheap prices", "sentiment": "Neutral"},
    {"text": "the food was alright but the service was terrible", "sentiment": "Neutral"},
    {"text": "not bad service but cold pizza", "sentiment": "Neutral"},
    {"text": "portions normal but price pricey", "sentiment": "Neutral"},
    {"text": "staff friendly but slow to bring bill", "sentiment": "Neutral"},
    {"text": "clean washroom but long wait for table", "sentiment": "Neutral"},
    {"text": "decent experience but pricing is costly", "sentiment": "Neutral"},
    {"text": "tasty burger but delay in delivery", "sentiment": "Neutral"},
    {"text": "cleanliness is fine but waiter was rude", "sentiment": "Neutral"},
    {"text": "cheap cost but food cold", "sentiment": "Neutral"},
    {"text": "polite employee but wrong drink", "sentiment": "Neutral"},
    {"text": "ambience was amazing but wait time long", "sentiment": "Neutral"},
    {"text": "delicous food but unclean floor", "sentiment": "Neutral"},
    {"text": "value for money was average, nothing special", "sentiment": "Neutral"},
    {"text": "the soup was hot but tasteless", "sentiment": "Neutral"},
    {"text": "satisfactory service quality but expensive billing", "sentiment": "Neutral"},
    {"text": "not slow but food average", "sentiment": "Neutral"},
    {"text": "average staff behavior but tasty dishes", "sentiment": "Neutral"},
    {"text": "food okay but waiting time terrible", "sentiment": "Neutral"},
    {"text": "nice table but delayed billing", "sentiment": "Neutral"},
    {"text": "pricing affordable but staff unprofessional", "sentiment": "Neutral"}
]

def train_and_save():
    print("--- Starting Local NLP Sentiment Model Training ---")
    df = pd.DataFrame(training_data)
    
    # Apply preprocessing to text column
    print("Preprocessing review texts...")
    df['preprocessed_text'] = df['text'].apply(preprocess_text)
    
    # Train-test split (80% train, 20% test)
    print("Performing train-test split (80/20)...")
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['sentiment'])
    
    # Initialize TF-IDF Vectorizer
    # Using unigrams and bigrams to capture negation and mixed indicator patterns
    vectorizer = TfidfVectorizer(token_pattern=r'\b\w+\b', norm='l2', smooth_idf=True, ngram_range=(1, 2))
    
    # Fit vectorizer on train set, transform train & test
    X_train = vectorizer.fit_transform(train_df['preprocessed_text'])
    y_train = train_df['sentiment']
    X_test = vectorizer.transform(test_df['preprocessed_text'])
    y_test = test_df['sentiment']
    
    # Train Logistic Regression on train split
    print("Training Logistic Regression on train split...")
    model = LogisticRegression(class_weight='balanced', solver='lbfgs', C=1.5, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate model accuracy on test split
    test_preds = model.predict(X_test)
    accuracy = accuracy_score(y_test, test_preds)
    precision = precision_score(y_test, test_preds, average='macro')
    recall = recall_score(y_test, test_preds, average='macro')
    cm = confusion_matrix(y_test, test_preds, labels=model.classes_)
    
    print("\n=== EVALUATION METRICS ON TEST SPLIT ===")
    print(f"Accuracy:          {accuracy * 100:.2f}%")
    print(f"Precision (macro): {precision * 100:.2f}%")
    print(f"Recall (macro):    {recall * 100:.2f}%")
    
    print("\nConfusion Matrix:")
    print("Labels ordered as:", model.classes_)
    # Pretty print confusion matrix
    cm_df = pd.DataFrame(cm, index=[f"True {c}" for c in model.classes_], columns=[f"Pred {c}" for c in model.classes_])
    print(cm_df)
    
    print("\nClassification Report:")
    print(classification_report(y_test, test_preds))
    
    # Print sample predictions
    samples = [
        "food okay but expensive",
        "good food but slow wait",
        "not bad service",
        "terrible rude waiters, dirty tables",
        "clean tables, fast service and delicious burger"
    ]
    print("\n=== SAMPLE PREDICTIONS ===")
    for text in samples:
        prep = preprocess_text(text)
        tfidf_vec = vectorizer.transform([prep])
        pred_label = model.predict(tfidf_vec)[0]
        probs = model.predict_proba(tfidf_vec)[0]
        conf = probs[list(model.classes_).index(pred_label)]
        print(f"Input: '{text}' -> Preprocessed: '{prep}'")
        print(f"       Prediction: {pred_label} (Confidence: {conf:.4f})")
    
    # Re-train vectorizer and model on the entire dataset to maximize data utilization for runtime
    print("\nRe-training on FULL combined dataset for production release...")
    X_full = vectorizer.fit_transform(df['preprocessed_text'])
    y_full = df['sentiment']
    
    final_model = LogisticRegression(class_weight='balanced', solver='lbfgs', C=1.5, random_state=42)
    final_model.fit(X_full, y_full)
    
    # Save assets
    joblib.dump(final_model, 'backend/sentiment_model.pkl')
    joblib.dump(vectorizer, 'backend/tfidf_vectorizer.pkl')
    print("Saved 'sentiment_model.pkl' and 'tfidf_vectorizer.pkl' in backend/")
    
    # Print feature coefficients check
    feature_names = vectorizer.get_feature_names_out()
    classes = final_model.classes_
    print(f"\nModel Classes: {classes}")
    
    negation_examples = ['not good', 'not bad', 'never friendly', 'rude', 'good', 'delicious', 'okay but', 'but expensive', 'but slow']
    for feat in negation_examples:
        if feat in feature_names:
            idx = list(feature_names).index(feat)
            weights = {classes[i]: final_model.coef_[i, idx] for i in range(len(classes))}
            formatted_weights = ", ".join([f"{cls}: {w:.3f}" for cls, w in weights.items()])
            print(f"Feature '{feat}' weights -> {formatted_weights}")
            
if __name__ == '__main__':
    train_and_save()
