import spacy
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

#%pip install -qU langchain_community wikipedia
from langchain_community.retrievers import WikipediaRetriever


MAX_CONTEXT_LENGTH = 20
OLLAMA_MODEL = "llama3.2"
DEBUG=True

model = OllamaLLM(model=OLLAMA_MODEL)
retriever = WikipediaRetriever()

nlp = spacy.load("en_core_web_sm")

classification_template = ChatPromptTemplate.from_template("""
You are an expert in evaluating whether a claim is "Factual" or "Opinion".

Context: {context}
Claim: "{claim}"

Classification Rules:
- "Factual" means the claim can be **objectively proven true or false** using well-established knowledge, authoritative sources (e.g., dictionaries, science, encyclopedias), or common facts.
- "Opinion" means the claim **cannot be definitively proven or disproven**, and reflects personal judgment, belief, value, or emotion.
- "Statement" if it makes no claim whatsoever (does not fall into above categories).

**Important Clarifications:**
- Do NOT overanalyze simple claims.
- If something is **clearly wrong but verifiable** (like "Blue is not a color"), classify it as **"Factual"** — because the statement **can be disproven** using widely accepted sources.
- Ignore philosophical relativism, cultural edge cases, or linguistic ambiguity. Assume normal, modern English usage.

Your job is not to evaluate **truth**, only whether something is **verifiable** or **subjective**.

Respond with ONLY: "Factual", "Opinion", or "Statement" (no explanation, no quotes).
""")

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

chain = classification_template | model
chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | classification_template
    | model
    | StrOutputParser()
)

context = []

def debug(text):
    if DEBUG:
        print(text)

def classify_claim_as_factual_or_opinion(claim):
    classification_template = ChatPromptTemplate.from_template("""
    You are an expert in evaluating whether a claim is "Factual" or "Opinion".

    Context: {context}
    Claim: "{claim}"

    Classification Rules:
    - "Factual" means the claim can be **objectively proven true or false** using well-established knowledge, authoritative sources (e.g., dictionaries, science, encyclopedias), or common facts.
    - "Opinion" means the claim **cannot be definitively proven or disproven**, and reflects personal judgment, belief, value, or emotion.
    - "Statement" if it makes no claim whatsoever (does not fall into above categories).

    **Important Clarifications:**
    - Do NOT overanalyze simple claims.
    - If something is **clearly wrong but verifiable** (like "Blue is not a color"), classify it as **"Factual"** — because the statement **can be disproven** using widely accepted sources.
    - Ignore philosophical relativism, cultural edge cases, or linguistic ambiguity. Assume normal, modern English usage.

    Your job is not to evaluate **truth**, only whether something is **verifiable** or **subjective**.

    Respond with ONLY: "Factual", "Opinion", or "Statement" (no explanation, no quotes).
    """)
    chain = classification_template | model
    result = chain.invoke({"claim": claim}).strip()
    return result

def is_potential_claim(sentence):
    doc = nlp(sentence)

    debug(f"\nDEBUGGING CLAIM: '{sentence}'")
    tokens="Tokens & POS:", [(t.text, t.pos_, t.dep_) for t in doc]
    debug(tokens)
    entities="Entities:", [(e.text, e.label_) for e in doc.ents]
    debug(entities)

    has_subject = any(tok.dep_ in {"nsubj", "nsubjpass"} for tok in doc)

    if any(tok.text.lower() == "there" for tok in doc) and any(tok.dep_ == "expl" for tok in doc):
        has_subject = True

    has_verb = any(tok.dep_ in {"ROOT", "aux", "auxpass"} or tok.pos_ in {"VERB", "AUX"} for tok in doc)

    if not (has_subject and has_verb):
        if not has_subject:
            debug("No subject!")
        if not has_verb:
            debug("No verb!")
        return False

    subjective_phrases = [
    "i feel", "feels like", "honestly", "kind of", "maybe", "probably",
    "possibly", "seems", "in my opinion", "to me", "is like", "i believe", "i bet", "looks like",
    "appears", "not gonna lie", "if you ask me", "i guess", "i assume", "from my point of view"
    ]

    if any(phrase in sentence.lower() for phrase in subjective_phrases):
        debug("Subjective or hedging language detected!")
        return False

    #TODO this needs to be different orsmth...
    personal_pronouns = {"i", "me", "my", "we", "our", "you", "your"}
    if any(tok.text.lower() in personal_pronouns for tok in doc):
        debug("Personal Pronoun!")
        return False


    return True


def handle_text(text, context):
    context.append(text)
    if len(context) > MAX_CONTEXT_LENGTH:
        context.pop(0)
    context_string = " ".join(context)
    debug(f"Current context: {context_string}")

    if is_potential_claim(text):
        debug(f"Found claim in [ {text} ]")
        debug("")

        classification = chain.invoke(text)
        debug(classification)
        debug("-----------------------------------------------------------")

        classification = classification.lower().replace(".", "")
        if classification == "factual":
            print(f"claim detected '{text}'")
        elif classification == "opinion":
            print(f"opinion detected: '{text}'")
        elif classification == "statement":
            print(f"statement detected: '{text}'")
        else:
            print(f"error classification: {classification}")
        context = []
    else:
        print(f"statement detected: '{text}'")
        debug(f"No claim found in [ {text} ], adding to context")

if __name__ == '__main__':
    test = "Dog is cow"
    print(is_potential_claim(test))
