import re

# 1. Constants matching the TypeScript implementation
CONTRACTIONS = {
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "won't": "will not",
    "can't": "can not",
    "cannot": "can not",
    "shouldn't": "should not",
    "wouldn't": "would not",
    "couldn't": "could not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "i'm": "i am",
    "you're": "you are",
    "he's": "he is",
    "she's": "she is",
    "we're": "we are",
    "they're": "they are",
    "i've": "i have",
    "you've": "you have",
    "we've": "we have",
    "they've": "they have",
    "i'd": "i would",
    "you'd": "you would",
    "he'd": "he would",
    "she'd": "she would",
    "we'd": "we would",
    "they'd": "they would",
    "i'll": "i will",
    "you'll": "you will",
    "he'll": "he will",
    "she'll": "she will",
    "we'll": "we will",
    "they'll": "they will"
}

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "by",
    "can", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further",
    "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
    "i", "if", "in", "into", "is", "it", "its", "itself", "me", "more", "most", "my", "myself",
    "of", "off", "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own",
    "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
    "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
    "why", "with", "you", "your", "yours", "yourself", "yourselves"
}

PRESERVED_WORDS = {"not", "never", "no", "very", "too", "but", "however", "extremely", "really", "bad", "good"}
NEGATIONS = {"not", "never", "no"}

SENTIMENT_WORDS = {
    # Positive indicators
    "good", "excellent", "amazing", "amaz", "nice", "delicious", "clean", "fast", "friendly",
    "helpful", "great", "satisfied", "satisfy", "tasty", "fresh", "love", "like", "awesome",
    "fantastic", "pleasant", "perfect", "polite", "happy", "recommend", "enjoy", "welcoming",
    "professional",
    # Negative indicators
    "bad", "rude", "dirty", "terrible", "slow", "expensive", "poor", "disappointing", "disappoint",
    "horrible", "waiting", "wait", "delay", "tasteless", "cold", "unfriendly", "arrogant",
    "unprofessional", "wrong", "mistake", "forgot", "mess", "disaster", "late", "disappointed",
    "hate", "worst", "pricey", "costly", "unhygienic"
}

def lemmatize_token(token):
    if token == "services": return "service"
    if token == "employees": return "employee"
    if token == "delayed": return "delay"
    if token == "waiting": return "wait"
    
    if token.endswith("ies"):
        return token[:-3] + "y"
    if token.endswith("sses") or token.endswith("shes") or token.endswith("ches") or token.endswith("xes"):
        return token[:-2]
    if token.endswith("s") and not token.endswith("ss") and not token.endswith("us") and not token.endswith("as") and not token.endswith("is"):
        return token[:-1]
    if token.endswith("ing"):
        base = token[:-3]
        if len(base) > 2:
            if base[-1] == base[-2]:
                return base[:-1]
            return base
    if token.endswith("ed"):
        base = token[:-2]
        if len(base) > 2:
            if base[-1] == base[-2]:
                return base[:-1]
            return base
    return token

def preprocess_text(text):
    if not text or not isinstance(text, str):
        return ""
    # 1. Lowercase
    processed = text.lower()
    # 2. Contraction normalization
    for contraction, expansion in CONTRACTIONS.items():
        pattern = r"\b" + contraction.replace("'", "'?") + r"\b"
        processed = re.sub(pattern, expansion, processed)
    # 3. Punctuation removal
    processed = re.sub(r'[^\w\s]', ' ', processed)
    # 4. Tokenization
    raw_tokens = processed.split()
    # 5. Stopword filtering (preserving PRESERVED_WORDS)
    filtered_tokens = [t for t in raw_tokens if t not in STOPWORDS or t in PRESERVED_WORDS]
    # 6. Lemmatization
    lemmatized = [lemmatize_token(t) for t in filtered_tokens]
    
    # 7. Negation handling (combining negation + sentiment word into a single token)
    final_tokens = []
    i = 0
    while i < len(lemmatized):
        token = lemmatized[i]
        if token in NEGATIONS:
            combined = False
            for offset in [1, 2]:
                if i + offset < len(lemmatized):
                    next_tok = lemmatized[i + offset]
                    if next_tok in SENTIMENT_WORDS:
                        final_tokens.append(f"{token}_{next_tok}")
                        i = i + offset + 1
                        combined = True
                        break
                    elif next_tok in NEGATIONS or next_tok in {"but", "however", "yet"}:
                        break
            if not combined:
                final_tokens.append(token)
                i += 1
        else:
            final_tokens.append(token)
            i += 1
            
    return " ".join(final_tokens)
