from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
import os
import shutil

def retriever(query, documents):
    """
    Embed and store documents in a Chroma vector store, then retrieve relevant chunks.
    """
    
    embeddings = OllamaEmbeddings(model="nomic-embed-text")

    vector_store = Chroma(
        collection_name="wikipedia_articles",
        persist_directory=None,
        embedding_function=embeddings
    )

    vector_store.add_documents(documents=documents)

    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    retrieved_docs = retriever.invoke(query)


    source_titles = set()
    for doc in retrieved_docs:
        url = doc.metadata.get("source", "Unknown")
        source_titles.add(url)

    context = "\n".join([doc.page_content for doc in retrieved_docs])
    return context, list(source_titles)
