import spacy
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

#%pip install -qU langchain_community wikipedia
from langchain_community.retrievers import WikipediaRetriever


MAX_CONTEXT_LENGTH = 20
OLLAMA_MODEL = "llama3.2"
DEBUG=True

model = OllamaLLM(model=OLLAMA_MODEL)
retriever = WikipediaRetriever()

nlp = spacy.load("en_core_web_sm")

classification_template = ChatPromptTemplate.from_template("""
**Task:** Classify the input claim.
**Output:** Respond with ONLY one word: "Factual", "Opinion", or "Statement".

**Definitions & Rules:**
*   **Factual:** Can be proven true or false with objective evidence (facts, sources).
    *   *Important:* Your job is NOT to check if it's *true*, only if it *can* be checked. Even a false claim like "Blue is not a color" is **Factual**.
*   **Opinion:** Expresses personal belief, feeling, judgment, or preference. Cannot be objectively proven true or false.
*   **Statement:** Makes no clear claim to be verified or judged (often incomplete or just descriptive).

**Instructions:**
1.  Use simple, standard English understanding.
2.  Do not overthink.
3.  Output *only* the classification word. No explanation.

**Examples:**
Claim: "Apples are nice" -> Opinion
Claim: "Red is a color" -> Factual
Claim: "Dog bark" -> Statement

**Claim to Classify:**
"{claim}"
""")

wikipedia_template = ChatPromptTemplate.from_template("""
**Task:** Evaluate the Claim based *only* on the Evidence.
**Output:** Respond with *exactly* one word: "True", "False", or "Unsure".

**Definitions:**
*   **True:** Evidence clearly supports the Claim.
*   **False:** Evidence clearly contradicts the Claim.
*   **Unsure:** Evidence doesn't clearly support or contradict.

**Instructions:**
*   Use *only* the Evidence below.
*   Do not overanalyze.
*   No explanation, no quotes in the output.

**Evidence:**
--- BEGIN EVIDENCE ---
{context}
--- END EVIDENCE ---

**Claim:** "{claim}"

**Output (ONLY one word):**
""")

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

initial_chain = (
    {"claim": RunnablePassthrough()}
    | classification_template
    | model
    | StrOutputParser()
)

rag_chain = (
    {"context": retriever | format_docs, "claim": RunnablePassthrough()}
    | wikipedia_template
    | model
    | StrOutputParser()
)


context = []

def debug(text):
    if DEBUG:
        print(text)

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

        classification = initial_chain.invoke(text)
        debug(classification)
        debug("-----------------------------------------------------------")

        classification = classification.lower().replace(".", "")
        if classification == "factual":
            print(f"claim detected '{text}'")

            print(rag_chain.invoke(text))
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
    test = input("type somethin in: ")
    print(is_potential_claim(test))

    handle_text(test,[])
