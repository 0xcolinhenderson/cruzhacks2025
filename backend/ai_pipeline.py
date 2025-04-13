from google import genai
import os
from googlesearch import search
import wikipedia
from urllib.parse import urlparse, unquote
from langchain_ollama.llms import OllamaLLM
from langchain.chains import RetrievalQA
from langchain_core.prompts import ChatPromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import csv
from vector import retriever
import shutil
import time

import json
import re
from typing import Optional

def parse_fact_check_output(output: str) -> str:
    # Extract the verdict
    verdict_match = re.search(r"Verdict:\s*(True|False|Unverifiable)", output, re.IGNORECASE)
    verdict_str = verdict_match.group(1).strip().lower() if verdict_match else None
    if verdict_str == "true":
        verdict: Optional[bool] = True
    elif verdict_str == "false":
        verdict = False
    else:
        verdict = None

    # Extract the reasoning
    reasoning_match = re.search(r"Reasoning:\s*(.*?)(?:\n\s*Sources:|\Z)", output, re.DOTALL | re.IGNORECASE)
    reasoning = reasoning_match.group(1).strip() if reasoning_match else ""

    # Extract the sources
    sources_match = re.search(r"Sources:\s*(.*)", output, re.DOTALL | re.IGNORECASE)
    sources = sources_match.group(1).strip() if sources_match else ""

    result = {
        "verdict": verdict,
        "reasoning": reasoning,
        "sources": sources
    }

    return json.dumps(result, indent=4)


GEMINI_API_KEY = "AIzaSyD1z08FY3VRI9Sp3xpicZWrjsOOsqmjwyQ"
GOOGLESEARCH_API_KEY = "AIzaSyDGHwkC1EhnbNz_9niOg2UZWyWslkz6I3A"

client = genai.Client(api_key=GEMINI_API_KEY)

wikipedia.set_lang("en")


def is_verifiable_claim_gemini(client, claim):
    prompt = f"""
    **Task:** Classify the input claim.
    **Output:** Respond with ONLY one word: "Factual", "Opinion", or "Statement". Should the output be "Factual", provide 1-3 relavant google searches that could be used to verify the claim. Searches should start with "[" and end with "]".

    **Definitions & Rules:**
    *   **Factual:** Can be proven true or false with objective evidence (facts, sources).
        *   *Important:* Your job is NOT to check if it's *true*, only if it *can* be checked. Even a false claim like "Blue is not a color" is **Factual**.
    *   **Opinion:** Expresses personal belief, feeling, judgment, or preference. Cannot be objectively proven true or false.
    *   **Statement:** Makes no clear claim to be verified or judged (often incomplete or just descriptive).

    **Instructions:**
    1.  Use simple, standard English understanding.
    2.  Do not overthink.
    3.  Output *only* the classification word followed by a newline, and searches wrapped in square braces also separated by newlines. No explanation.

    **Claim to Classify:**
    "{claim}"
    """

    model="gemini-2.0-flash"

    response = client.models.generate_content(
    model=model, contents=prompt
    )

    return response.text


def extract_data(response):
    lines = response.strip().split("\n")
    classification = lines[0].strip()

    searches = []
    for line in lines[1:]:
        if line.startswith("[") and line.endswith("]"):
            search = line[1:-1] + " wikipedia"
            searches.append(search)

    return classification, searches


def search_google(searches):
    if not searches:
        print("No searches to perform.")
        return []
    print("Searching Google for the following queries:")
    for query in searches:
        print(query)
    search_results = []
    for query in searches:
        results = search(query, num_results=3)
        for result in results:
            if result not in search_results:
                search_results.append(result)

    search_results = [res for res in search_results if "en.wikipedia.org" in res]

    return search_results

def get_title_from_url(url):
    path = urlparse(url).path
    print("Path:", path)
    if "/wiki/" in path:
        title = unquote(path.split("/wiki/")[-1])
    else:
        raise ValueError(f"Invalid Wikipedia URL: {url}")
    print("Title:", title)
    return title.replace("_", " ").strip()


def get_wikipedia_articles(urls):
    docs = []
    for url in urls:
        print("Grabbing URL:", url)
        title = get_title_from_url(url)
        print(title)
        page = wikipedia.page(title, auto_suggest=False)
        print("Title:", page.title)

        chunks = split_into_chunks(page.content)

        for chunk in chunks:
            docs.append(Document(
                page_content=chunk,
                metadata={"source": url, "title": page.title}
            ))
    return docs

def save_wikipedia_to_csv(wikidata, filename="wiki_results.csv"):
    with open(filename, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Title", "Summary"])

    with open(filename, mode="a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Title", "Content"])
        for title, content in wikidata:
            writer.writerow([title, content])
    print(f"Saved Wikipedia data to {filename}")

def verify_claim_with_wikipedia(model, prompt, claim, retriever):
    qa_chain = RetrievalQA.from_chain_type(
        llm=model,
        retriever=retriever,
        chain_type="stuff",
        chain_type_kwargs={"prompt": prompt}
    )

    retrieved_docs = retriever.get_relevant_documents(claim)
    context = "\n".join([doc.page_content for doc in retrieved_docs])

    response = qa_chain.invoke({"query": claim, "context": context})
    return response

def split_into_chunks(content, chunk_size=500, chunk_overlap=50):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " "]
    )
    return text_splitter.split_text(content)

def parse_final_output(output: str, sources) -> str:
    # verdict
    verdict_match = re.search(r"Verdict:\s*(True|False|Unverifiable)", output, re.IGNORECASE)
    verdict_str = verdict_match.group(1).strip().lower() if verdict_match else None
    if verdict_str == "true":
        verdict: Optional[bool] = True
    elif verdict_str == "false":
        verdict = False
    else:
        verdict = None

    # reasoning
    reasoning_match = re.search(r"Reasoning:\s*(.*?)(?:\n\s*Sources:|\Z)", output, re.DOTALL | re.IGNORECASE)
    reasoning = reasoning_match.group(1).strip() if reasoning_match else ""

    result = {
        "verdict": verdict,
        "reasoning": reasoning,
        "sources": sources
    }

    return json.dumps(result)

def verify_claim(my_claim):
    if os.path.exists("./wiki_langchain_db"):
        shutil.rmtree("./wiki_langchain_db")
        print("Removing old database...")
        # time.sleep(3)
    else:
        print("No old database found.")
        # time.sleep(3)

    res = is_verifiable_claim_gemini(client=client, claim=my_claim)
    classification, searches = extract_data(res)
    if classification == "Factual":
        print("Classification:", classification)
        print("Searches:", searches)
        print(res)
    else:
        print("Classification:", classification)
        return

    search_urls = search_google(searches)
    print("Search URLs:")
    for url in search_urls:
        print(url)

    wikidata = get_wikipedia_articles(search_urls)

    # save_wikipedia_to_csv([(doc.metadata["title"], doc.page_content) for doc in wikidata])

    context, sources = retriever(my_claim, documents=wikidata)
    print("context      context")
    print(context)
    print("endcontext      context")

    model = OllamaLLM(model="llama3.2")
    template = """
    You are a fact-checking assistant.

    Use ONLY the following Wikipedia sources to verify the claim.
    Respond with:
    - Verdict: [True / False / Unverifiable]
    - Reasoning: [Why the claim is or is not supported. Include a relevant quote from the sources. 1-2 sentences max.]

    If the context does not contain enough information to verify the claim, respond with "Unverifiable".

    Claim:
    {claim}

    Sources:
    {context}
    """
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | model
    claim_verification = chain.invoke({"context": context, "claim": my_claim})
    print("\nClaim Verification Result:")
    output = parse_final_output(claim_verification, sources)

    print(output)
    return output

    # todo: json
    # json claim:string, verdict:bool, reasoning:string (preferably with quote, cited from sources), sources:[string of wiki articles]

if __name__ == "__main__":
    verify_claim("joe biden is a woman")
